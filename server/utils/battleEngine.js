const Battle = require('../models/Battle');
const BattleLog = require('../models/BattleLog');
const BattleParticipant = require('../models/BattleParticipant');
const Formation = require('../models/Formation');
const Skill = require('../models/Skill'); // Added for passive skill activation
const fs = require('fs');
const path = require('path');
const UserPet = require('../models/UserPet');
const Pet = require('../models/Pet');
const User = require('../models/User');

/**
 * Battle Engine - Xử lý logic chiến đấu
 * Turn-based combat system với element effectiveness, status effects
 * Thứ tự đánh: So sánh tổng speed đội hình → Đội cao hơn đánh trước
 * Thứ tự trong đội: Theo ma trận 3x3 (1→2→3→4→5→6→7→8→9)
 */
class BattleEngine {
  constructor(battleId) {
    this.battleId = battleId;
    this.battle = null;
    this.participants = [];
    this.currentTurn = 1;
    this.maxTurns = 50; // Mặc định 50 turn, có thể truyền từ config nếu cần
    
    // Thứ tự đánh theo ma trận 3x3 (từ phải sang trái, từ trên xuống dưới)
    this.formationOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Thông tin về đội nào đánh trước
    this.firstTeam = null; // 'player' hoặc 'enemy'
    this.teamSpeedInfo = null;
  }

  /**
   * Khởi tạo battle engine
   */
  async initialize() {
    // Load battle
    this.battle = await Battle.findById(this.battleId);
    if (!this.battle) {
      throw new Error('Battle không tồn tại');
    }

    // Load participants
    this.participants = await BattleParticipant.getBattleParticipants(this.battleId);
    
    // Tính toán thứ tự đánh dựa trên tổng speed
    await this.calculateTeamOrder();
    
    // ====== Kích hoạt passive skill onBattleStart cho tất cả participant ======
    for (const participant of this.participants) {
      if (!participant.isAlive) continue;
      // Lấy skill passive của pet (nếu có)
      const pet = participant.userPet?.pet;
      if (!pet) continue;
      // Populate skills nếu chưa có
      await participant.populate({ path: 'userPet', populate: { path: 'pet' } });
      const passiveSkills = await Skill.find({ _id: { $in: [pet.passiveSkill, pet.normalSkill, pet.ultimateSkill].filter(Boolean) }, type: 'passive', passiveTrigger: 'onBattleStart' });
      for (const skill of passiveSkills) {
        // Áp dụng tất cả effect của skill lên participant (hoặc target phù hợp)
        if (Array.isArray(skill.effects)) {
          for (const effectObj of skill.effects) {
            // Populate effect nếu chưa có
            await skill.populate('effects.effect');
            const effectData = effectObj.effect;
            if (!effectData) continue;
            // Tính value, duration
            const value = effectObj.value !== undefined ? effectObj.value : (effectData.parameters?.value || 0);
            const duration = effectObj.duration !== undefined ? effectObj.duration : (effectData.parameters?.duration || 1);
            const percentage = effectData.parameters?.percentage || 0;
            participant.statusEffects = participant.statusEffects || [];
            participant.statusEffects.push({
              effect: effectData._id,
              name: effectData.name,
              type: effectData.type,
              category: effectData.category,
              value: value,
              percentage: percentage,
              duration: duration,
              remainingTurns: duration,
              chance: effectObj.chance || 100,
              appliedAt: this.currentTurn,
              source: participant.userPet._id,
              stacking: effectData.stacking || {},
              visualEffects: effectData.visualEffects || {},
              target: effectObj.target || 'self'
            });
            await participant.save();
          }
        }
      }
    }
    // ====== END passive onBattleStart ======

    // Create battle start log
    await BattleLog.createTurnLog(
      this.battleId,
      1,
      'battle_start',
      { 
        message: 'Battle bắt đầu!',
        teamOrder: this.teamSpeedInfo
      }
    );

    return this;
  }

  /**
   * Tính toán thứ tự đánh dựa trên tổng speed của 2 đội hình
   */
  async calculateTeamOrder() {
    const playerParticipants = this.participants.filter(p => p.isPlayer);
    const enemyParticipants = this.participants.filter(p => !p.isPlayer);
    
    // Tính tổng speed của player team
    const playerTotalSpeed = playerParticipants.reduce((total, p) => total + p.currentStats.speed, 0);
    
    // Tính tổng speed của enemy team
    const enemyTotalSpeed = enemyParticipants.reduce((total, p) => total + p.currentStats.speed, 0);
    
    // Xác định đội nào đánh trước
    if (playerTotalSpeed >= enemyTotalSpeed) {
      this.firstTeam = 'player';
    } else {
      this.firstTeam = 'enemy';
    }
    
    this.teamSpeedInfo = {
      playerTotalSpeed,
      enemyTotalSpeed,
      firstTeam: this.firstTeam,
      speedDifference: Math.abs(playerTotalSpeed - enemyTotalSpeed)
    };
    
    console.log(`🏁 Team Order: Player Speed=${playerTotalSpeed}, Enemy Speed=${enemyTotalSpeed}`);
    console.log(`🏁 ${this.firstTeam.toUpperCase()} team sẽ đánh trước!`);
  }

  /**
   * Lấy thứ tự đánh trong turn theo ma trận 3x3
   */
  getTurnOrder() {
    const aliveParticipants = this.participants.filter(p => p.isAlive);
    const playerParticipants = aliveParticipants.filter(p => p.isPlayer);
    const enemyParticipants = aliveParticipants.filter(p => !p.isPlayer);
    
    const turnOrder = [];
    
    // Xác định thứ tự đội đánh trước
    const firstTeamParticipants = this.firstTeam === 'player' ? playerParticipants : enemyParticipants;
    const secondTeamParticipants = this.firstTeam === 'player' ? enemyParticipants : playerParticipants;
    
    // Thêm participants theo thứ tự ma trận 3x3
    for (const position of this.formationOrder) {
      // Tìm participant của đội đánh trước ở vị trí này
      const firstTeamPet = firstTeamParticipants.find(p => p.position === position);
      if (firstTeamPet && firstTeamPet.isAlive) {
        turnOrder.push(firstTeamPet);
      }
      
      // Tìm participant của đội đánh sau ở vị trí này
      const secondTeamPet = secondTeamParticipants.find(p => p.position === position);
      if (secondTeamPet && secondTeamPet.isAlive) {
        turnOrder.push(secondTeamPet);
      }
    }
    
    return turnOrder;
  }

  /**
   * Tính toán element effectiveness
   */
  calculateElementEffectiveness(attackerElement, defenderElement) {
    // attackerElement, defenderElement là object hoặc string name
    if (!attackerElement || !defenderElement) {
      return { type: 'normal', multiplier: 1.0 };
    }
    // Lấy name
    const attackerName = typeof attackerElement === 'string' ? attackerElement : attackerElement.name;
    const defenderName = typeof defenderElement === 'string' ? defenderElement : defenderElement.name;
    if (!attackerName || !defenderName) return { type: 'normal', multiplier: 1.0 };
    // Load elements từ file JSON
    const elements = loadElements();
    const attackerElemObj = elements.find(e => e.name === attackerName);
    if (!attackerElemObj || !attackerElemObj.effectivenessMatrix) return { type: 'normal', multiplier: 1.0 };
    const multiplier = attackerElemObj.effectivenessMatrix[defenderName] || 1.0;
    let type = 'normal';
    if (multiplier > 1.1) type = 'strong';
    else if (multiplier < 0.95) type = 'weak';
    return { type, multiplier };
  }

  /**
   * Tính toán damage sử dụng logic từ model Skill
   */
  calculateDamage(attacker, defender, skill = null, isCritical = false) {
    let baseDamage = attacker.currentStats.attack;
    let damageType = 'physical';
    let damageBreakdown = null;

    // Use skill damage calculation if available
    if (skill) {
      try {
        // Sử dụng logic tính toán từ model Skill
        const skillDamageResult = skill.calculateDamageWithCrit(
          attacker.userPet.pet.element,
          defender.userPet.pet.element,
          attacker.userPet.pet, // attackerPet
          1, // skillLevel (có thể lấy từ UserPet skill level sau này)
          defender.userPet.pet  // targetPet
        );
        
        baseDamage = skillDamageResult.finalDamage;
        damageType = 'magical'; // Skills thường là magical
        damageBreakdown = skillDamageResult.breakdown;
        
        // Nếu skill có critical, sử dụng critical từ skill
        if (skillDamageResult.critical.isCritical) {
          isCritical = true;
        }
        
      } catch (error) {
        console.error('Error calculating skill damage:', error);
        // Fallback về basic attack nếu có lỗi
        baseDamage = attacker.currentStats.attack;
        damageType = 'physical';
      }
    } else {
      // Basic attack - sử dụng logic đơn giản
      // Apply critical hit
      if (isCritical) {
        baseDamage *= 1.5; // Mặc định 1.5x cho critical
      }

      // Apply element effectiveness
      let elementMultiplier = 1.0;
      if (attacker.userPet.pet.element && defender.userPet.pet.element) {
        const effectiveness = this.calculateElementEffectiveness(
          attacker.userPet.pet.element,
          defender.userPet.pet.element
        );
        elementMultiplier = effectiveness.multiplier;
      }

      // Apply defense reduction
      let finalDamage = baseDamage * elementMultiplier;
      if (damageType === 'physical') {
        const defenseReduction = defender.currentStats.defense * 0.1;
        finalDamage = Math.max(1, finalDamage - defenseReduction);
      }

      baseDamage = finalDamage;
    }

    // Apply random variance (±10%) cho tất cả damage
    const variance = 0.9 + Math.random() * 0.2;
    const finalDamage = Math.floor(baseDamage * variance);

    // Determine element effectiveness for display
    let elementEffectiveness = 'normal';
    let effectivenessMultiplier = 1.0;
    
    if (attacker.userPet.pet.element && defender.userPet.pet.element) {
      const effectiveness = this.calculateElementEffectiveness(
        attacker.userPet.pet.element,
        defender.userPet.pet.element
      );
      elementEffectiveness = effectiveness.type;
      effectivenessMultiplier = effectiveness.multiplier;
    }

    return {
      damage: finalDamage,
      damageType: damageType,
      isCritical: isCritical,
      elementEffectiveness: elementEffectiveness,
      effectivenessMultiplier: effectivenessMultiplier,
      damageBreakdown: damageBreakdown
    };
  }

  /**
   * Kiểm tra accuracy và evasion
   */
  checkAccuracy(attacker, defender) {
    const accuracy = attacker.currentStats.accuracy;
    const evasion = defender.currentStats.evasion;
    
    const hitChance = Math.max(0.1, Math.min(0.95, accuracy / (accuracy + evasion)));
    const random = Math.random();
    
    return random <= hitChance;
  }

  /**
   * Kiểm tra critical hit
   */
  checkCriticalHit(attacker) {
    const criticalRate = attacker.currentStats.criticalRate;
    const random = Math.random();
    
    return random <= (criticalRate / 100);
  }

  /**
   * Thực hiện attack với target pattern support
   */
  async performAttack(attackerId, targetId, skillId = null) {
    const attacker = this.participants.find(p => p._id.equals(attackerId));
    const primaryTarget = this.participants.find(p => p._id.equals(targetId));

    if (!attacker || !primaryTarget) {
      throw new Error('Attacker hoặc target không tồn tại');
    }

    if (!attacker.isAlive || !primaryTarget.isAlive) {
      throw new Error('Attacker hoặc target đã chết');
    }

    // Check if attacker is stunned
    if (attacker.isStunned) {
      await BattleLog.createAttackLog(
        this.battleId,
        this.currentTurn,
        { userPet: attacker.userPet._id, position: attacker.position, isPlayer: attacker.isPlayer },
        { userPet: primaryTarget.userPet._id, position: primaryTarget.position, isPlayer: primaryTarget.isPlayer },
        0,
        { message: `${attacker.userPet.pet.name} bị choáng và không thể tấn công!` }
      );
      return { success: false, message: 'Pet bị choáng' };
    }

    // Get skill if specified
    let skill = null;
    if (skillId) {
      skill = attacker.availableSkills.find(s => s.skill.equals(skillId));
      if (!skill) {
        throw new Error('Skill không có sẵn');
      }
      
      // Check energy cost
      if (skill.skill.energyCost > attacker.energy.current) {
        throw new Error('Không đủ energy để sử dụng skill');
      }
      
      // Use skill
      await attacker.useSkill(skillId, this.currentTurn);
      attacker.energy.current -= skill.skill.energyCost;
      await attacker.save();
    }

    // Xác định tất cả mục tiêu dựa trên target pattern
    const allTargets = this.getTargetsFromPattern(attacker, primaryTarget, skill?.skill);
    
    if (allTargets.length === 0) {
      throw new Error('Không có mục tiêu hợp lệ');
    }

    const attackResults = [];

    // Tấn công từng mục tiêu
    for (const target of allTargets) {
      // Check accuracy cho từng target
      if (!this.checkAccuracy(attacker, target)) {
        await BattleLog.createAttackLog(
          this.battleId,
          this.currentTurn,
          { userPet: attacker.userPet._id, position: attacker.position, isPlayer: attacker.isPlayer },
          { userPet: target.userPet._id, position: target.position, isPlayer: target.isPlayer },
          0,
          { isDodged: true, message: `${target.userPet.pet.name} né tránh được tấn công!` }
        );
        attackResults.push({ target: target, success: false, message: 'Tấn công bị né' });
        continue;
      }

      // ====== Kiểm tra hiệu ứng né tránh (evade) ======
      if (Array.isArray(target.statusEffects)) {
        const evadeEffect = target.statusEffects.find(e => e.category === 'evade');
        if (evadeEffect) {
          const evadeChance = evadeEffect.chance || evadeEffect.percentage || evadeEffect.value || 0;
          if (Math.random() * 100 < evadeChance) {
            await BattleLog.createAttackLog(
              this.battleId,
              this.currentTurn,
              { userPet: attacker.userPet._id, position: attacker.position, isPlayer: attacker.isPlayer },
              { userPet: target.userPet._id, position: target.position, isPlayer: target.isPlayer },
              0,
              { isEvaded: true, message: `${target.userPet.pet.name} né tránh thành công nhờ hiệu ứng!` }
            );
            attackResults.push({ target: target, success: false, message: 'Tấn công bị né (evade)' });
            continue;
          }
        }
      }

      // Check critical hit
      const isCritical = this.checkCriticalHit(attacker);

      // Calculate damage
      const damageResult = this.calculateDamage(attacker, target, skill?.skill, isCritical);

      // Apply damage
      const damageResult2 = await target.takeDamage(damageResult.damage, damageResult.damageType);

      // ====== Trigger passive skill onAttacked sau khi nhận damage ======
      if (target.userPet && target.userPet.pet) {
        const Skill = require('../models/Skill');
        // Lấy passive skill của pet (nếu có)
        const passiveSkills = await Skill.find({ _id: target.userPet.pet.passiveSkill, type: 'passive', passiveTrigger: 'onAttacked' });
        for (const skill of passiveSkills) {
          if (Array.isArray(skill.effects)) {
            for (const effectObj of skill.effects) {
              await skill.populate('effects.effect');
              const effectData = effectObj.effect;
              if (!effectData) continue;
              const value = effectObj.value !== undefined ? effectObj.value : (effectData.parameters?.value || 0);
              const duration = effectObj.duration !== undefined ? effectObj.duration : (effectData.parameters?.duration || 1);
              const percentage = effectData.parameters?.percentage || 0;
              // Nếu effect là buff/self thì áp lên target, nếu là debuff thì áp lên attacker
              let applyTo = (effectObj.target === 'self' || effectData.type === 'buff') ? target : attacker;
              applyTo.statusEffects = applyTo.statusEffects || [];
              applyTo.statusEffects.push({
                effect: effectData._id,
                name: effectData.name,
                type: effectData.type,
                category: effectData.category,
                value: value,
                percentage: percentage,
                duration: duration,
                remainingTurns: duration,
                chance: effectObj.chance || 100,
                appliedAt: this.currentTurn,
                source: target.userPet._id,
                stacking: effectData.stacking || {},
                visualEffects: effectData.visualEffects || {},
                target: effectObj.target || 'self'
              });
              await applyTo.save();
            }
          }
        }
      }
      // ====== END passive onAttacked ======

      // ====== Xử lý hiệu ứng reflect/counter sau khi nhận damage ======
      if (Array.isArray(target.statusEffects)) {
        // Reflect: attacker nhận lại % damage vừa gây ra
        const reflectEffect = target.statusEffects.find(e => e.category === 'reflect');
        if (reflectEffect) {
          const reflectPercent = reflectEffect.percentage || reflectEffect.value || 0;
          const reflectDmg = Math.floor(damageResult2.damage * (reflectPercent / 100));
          if (reflectDmg > 0 && attacker.isAlive) {
            await attacker.takeDamage(reflectDmg, 'reflect');
            await BattleLog.createAttackLog(
              this.battleId,
              this.currentTurn,
              { userPet: target.userPet._id, position: target.position, isPlayer: target.isPlayer },
              { userPet: attacker.userPet._id, position: attacker.position, isPlayer: attacker.isPlayer },
              reflectDmg,
              { isReflect: true, message: `${attacker.userPet.pet.name} bị phản sát thương (${reflectDmg})!` }
            );
          }
        }
        // Counter: attacker nhận lại damage cố định hoặc % damage
        const counterEffect = target.statusEffects.find(e => e.category === 'counter');
        if (counterEffect) {
          let counterDmg = counterEffect.value || 0;
          if (counterEffect.percentage) {
            counterDmg += Math.floor(damageResult2.damage * (counterEffect.percentage / 100));
          }
          if (counterDmg > 0 && attacker.isAlive) {
            await attacker.takeDamage(counterDmg, 'counter');
            await BattleLog.createAttackLog(
              this.battleId,
              this.currentTurn,
              { userPet: target.userPet._id, position: target.position, isPlayer: target.isPlayer },
              { userPet: attacker.userPet._id, position: attacker.position, isPlayer: attacker.isPlayer },
              counterDmg,
              { isCounter: true, message: `${attacker.userPet.pet.name} bị phản đòn (${counterDmg})!` }
            );
          }
        }
      }

      // ====== Áp dụng hiệu ứng phụ (Effect/Buff/Debuff) nếu skill có ======
      if (skill && skill.skill && Array.isArray(skill.skill.effects) && skill.skill.effects.length > 0) {
        // Populate effects.effect nếu chưa populate
        await skill.skill.populate('effects.effect');
        for (const effectObj of skill.skill.effects) {
          // Kiểm tra xác suất
          const chance = effectObj.chance !== undefined ? effectObj.chance : 100;
          if (Math.random() * 100 > chance) continue;
          const effectData = effectObj.effect;
          if (!effectData) continue;
          // Tính giá trị và duration thực tế
          const value = effectObj.value !== undefined ? effectObj.value : (effectData.parameters?.value || 0);
          const duration = effectObj.duration !== undefined ? effectObj.duration : (effectData.parameters?.duration || 1);
          const percentage = effectData.parameters?.percentage || 0;
          // Áp dụng lên target (BattleParticipant)
          target.statusEffects = target.statusEffects || [];
          target.statusEffects.push({
            effect: effectData._id,
            name: effectData.name,
            type: effectData.type,
            category: effectData.category,
            value: value,
            percentage: percentage,
            duration: duration,
            remainingTurns: duration,
            chance: chance,
            appliedAt: this.currentTurn,
            source: attacker.userPet._id,
            stacking: effectData.stacking || {},
            visualEffects: effectData.visualEffects || {},
            target: effectObj.target || 'target'
          });
          await target.save();
        }
      }

      // Create battle log
      await BattleLog.createAttackLog(
        this.battleId,
        this.currentTurn,
        { userPet: attacker.userPet._id, position: attacker.position, isPlayer: attacker.isPlayer },
        { userPet: target.userPet._id, position: target.position, isPlayer: target.isPlayer },
        damageResult2.damage,
        {
          damageType: damageResult.damageType,
          isCritical: isCritical,
          elementEffectiveness: damageResult.elementEffectiveness,
          effectivenessMultiplier: damageResult.effectivenessMultiplier,
          hpBefore: target.currentStats.hp + damageResult2.damage,
          hpAfter: target.currentStats.hp,
          message: this.generateAttackMessage(attacker, target, damageResult2.damage, isCritical, damageResult.elementEffectiveness)
        }
      );

      attackResults.push({
        target: target,
        success: true,
        damage: damageResult2.damage,
        isCritical: isCritical,
        isDead: damageResult2.isDead,
        elementEffectiveness: damageResult.elementEffectiveness
      });
    }

    // Tổng hợp kết quả
    const totalDamage = attackResults.reduce((sum, result) => sum + (result.damage || 0), 0);
    const deadTargets = attackResults.filter(result => result.isDead).length;
    const successfulHits = attackResults.filter(result => result.success).length;

    return {
      success: true,
      totalDamage: totalDamage,
      targetsHit: successfulHits,
      targetsKilled: deadTargets,
      totalTargets: allTargets.length,
      results: attackResults,
      message: `${attacker.userPet.pet.name} tấn công ${successfulHits}/${allTargets.length} mục tiêu, gây ${totalDamage} damage!`
    };
  }

  /**
   * Lấy danh sách mục tiêu dựa trên target pattern
   */
  getTargetsFromPattern(attacker, primaryTarget, skill) {
    if (!skill || !skill.targetPattern) {
      // Fallback về single target
      return [primaryTarget];
    }

    // Lấy tất cả vị trí có pet còn sống
    let candidates = this.participants.filter(p => p.isAlive);

    // Nếu có targetCondition, lọc/sắp xếp candidates trước khi lấy theo pattern
    if (skill.targetCondition) {
      switch (skill.targetCondition) {
        case 'lowestHp':
          candidates = candidates.sort((a, b) => (a.currentStats.hp || 0) - (b.currentStats.hp || 0));
          break;
        case 'highestHp':
          candidates = candidates.sort((a, b) => (b.currentStats.hp || 0) - (a.currentStats.hp || 0));
          break;
        case 'random':
          candidates = candidates.sort(() => Math.random() - 0.5);
          break;
        case 'hasEffect':
          if (skill.effectName) {
            candidates = candidates.filter(p => Array.isArray(p.statusEffects) && p.statusEffects.some(e => e.name === skill.effectName));
          }
          break;
        case 'noEffect':
          if (skill.effectName) {
            candidates = candidates.filter(p => !Array.isArray(p.statusEffects) || !p.statusEffects.some(e => e.name === skill.effectName));
          }
          break;
        case 'highestAttack':
          candidates = candidates.sort((a, b) => (b.currentStats.attack || 0) - (a.currentStats.attack || 0));
          break;
        case 'highestSpeed':
          candidates = candidates.sort((a, b) => (b.currentStats.speed || 0) - (a.currentStats.speed || 0));
          break;
        case 'mostEffects':
          candidates = candidates.sort((a, b) => ((b.statusEffects?.length || 0) - (a.statusEffects?.length || 0)));
          break;
        case 'leastEffects':
          candidates = candidates.sort((a, b) => ((a.statusEffects?.length || 0) - (b.statusEffects?.length || 0)));
          break;
        default:
          break;
      }
    }

    // Lấy target positions từ skill pattern
    const allAlivePositions = candidates.map(p => p.position);
    const targetPositions = skill.getTargetPositions(
      attacker.position,
      primaryTarget.position,
      allAlivePositions
    );

    // Chuyển đổi positions thành participants
    const targets = candidates.filter(p => 
      targetPositions.includes(p.position) && p.isAlive
    );

    return targets;
  }

  /**
   * Kiểm tra một participant có thỏa mãn targetCondition không
   * @param {BattleParticipant} target
   * @param {String} condition
   * @param {Object} skill (có thể truyền thêm effectName...)
   */
  isTargetMatchCondition(target, condition, skill = {}) {
    switch (condition) {
      case 'lowestHp':
        // Cần truyền vào danh sách candidates để so sánh, nên chỉ check nếu là nhỏ nhất
        // (Dùng cho test: so sánh với min của danh sách ngoài hàm này)
        return true; // Chỉ dùng để sort/filter ngoài hàm này
      case 'highestHp':
        return true;
      case 'random':
        return true;
      case 'hasEffect':
        if (skill.effectName) {
          return Array.isArray(target.statusEffects) && target.statusEffects.some(e => e.name === skill.effectName);
        }
        return false;
      case 'noEffect':
        if (skill.effectName) {
          return !Array.isArray(target.statusEffects) || !target.statusEffects.some(e => e.name === skill.effectName);
        }
        return false;
      case 'highestAttack':
        return true;
      case 'highestSpeed':
        return true;
      case 'mostEffects':
        return true;
      case 'leastEffects':
        return true;
      default:
        return false;
    }
  }

  /**
   * Tạo message cho attack
   */
  generateAttackMessage(attacker, target, damage, isCritical, elementEffectiveness) {
    let message = `${attacker.userPet.pet.name} tấn công ${target.userPet.pet.name}`;
    
    if (isCritical) {
      message += ' với đòn đánh chí mạng!';
    }
    
    if (elementEffectiveness === 'strong') {
      message += ' (Hiệu quả!)';
    } else if (elementEffectiveness === 'weak') {
      message += ' (Không hiệu quả)';
    }
    
    message += ` Gây ${damage} damage.`;
    
    if (target.currentStats.hp <= 0) {
      message += ` ${target.userPet.pet.name} đã bị đánh bại!`;
    }
    
    return message;
  }

  /**
   * Xử lý turn
   */
  async processTurn() {
    if (this.currentTurn > this.maxTurns) {
      return await this.endBattle('timeout');
    }

    // Create turn start log
    await BattleLog.createTurnLog(
      this.battleId,
      this.currentTurn,
      'turn_start',
      { 
        message: `Turn ${this.currentTurn} bắt đầu`,
        teamOrder: this.teamSpeedInfo
      }
    );

    // Tick effect cho tất cả participant trước khi hành động
    for (const participant of this.participants) {
      if (!participant.isAlive) continue;
      let effectsChanged = false;
      if (Array.isArray(participant.statusEffects)) {
        for (let i = participant.statusEffects.length - 1; i >= 0; i--) {
          const eff = participant.statusEffects[i];
          // Tick effect: poison, burn, v.v.
          if (eff.type === 'status' && (eff.category === 'poison' || eff.category === 'burn')) {
            const dmg = eff.value || 0;
            participant.currentStats.hp = Math.max(0, participant.currentStats.hp - dmg);
            await BattleLog.createAttackLog(
              this.battleId,
              this.currentTurn,
              { userPet: participant.userPet._id, position: participant.position, isPlayer: participant.isPlayer },
              { userPet: participant.userPet._id, position: participant.position, isPlayer: participant.isPlayer },
              dmg,
              { message: `${participant.userPet?.pet?.name || 'Pet'} chịu hiệu ứng ${eff.name} mất ${dmg} HP!` }
            );
            if (participant.currentStats.hp <= 0) participant.isAlive = false;
            effectsChanged = true;
          }
          // Tick effect: stun/freeze
          if (eff.type === 'status' && (eff.category === 'stun' || eff.category === 'freeze')) {
            participant.isStunned = true;
            effectsChanged = true;
          }
          // Tick effect: buff/debuff chỉ số (áp dụng 1 lần khi effect mới, revert khi hết hạn)
          if (eff.type === 'buff' || eff.type === 'debuff') {
            if (!eff._applied) {
              const stat = eff.category.replace('_buff', '').replace('_debuff', '');
              if (participant.currentStats[stat] !== undefined) {
                if (eff.type === 'buff') participant.currentStats[stat] += eff.value;
                if (eff.type === 'debuff') participant.currentStats[stat] -= eff.value;
                eff._applied = true;
                effectsChanged = true;
              }
            }
          }
          // Giảm lượt
          eff.remainingTurns--;
          if (eff.remainingTurns <= 0) {
            // Nếu là buff/debuff, revert lại chỉ số
            if ((eff.type === 'buff' || eff.type === 'debuff') && eff._applied) {
              const stat = eff.category.replace('_buff', '').replace('_debuff', '');
              if (participant.currentStats[stat] !== undefined) {
                if (eff.type === 'buff') participant.currentStats[stat] -= eff.value;
                if (eff.type === 'debuff') participant.currentStats[stat] += eff.value;
              }
            }
            participant.statusEffects.splice(i, 1);
            effectsChanged = true;
          }
        }
      }
      if (effectsChanged) await participant.save();
    }

    // Process status effects for all participants
    for (const participant of this.participants) {
      if (participant.isAlive) {
        await participant.processStatusEffects(this.currentTurn);
      }
    }

    // Get alive participants
    const aliveParticipants = this.participants.filter(p => p.isAlive);
    
    if (aliveParticipants.length <= 1) {
      return await this.endBattle('elimination');
    }

    // Lấy thứ tự đánh theo ma trận 3x3 và tổng speed
    const turnOrder = this.getTurnOrder();
    
    console.log(`🔄 Turn ${this.currentTurn} - Thứ tự đánh: ${turnOrder.map(p => `${p.isPlayer ? 'P' : 'E'}${p.position}`).join(' → ')}`);

    // Process actions for each participant theo thứ tự mới
    for (const participant of turnOrder) {
      if (!participant.isAlive) continue;

      // Simple AI for enemy participants
      if (!participant.isPlayer) {
        await this.processEnemyAction(participant);
      }
    }

    // Create turn end log
    await BattleLog.createTurnLog(
      this.battleId,
      this.currentTurn,
      'turn_end',
      { message: `Turn ${this.currentTurn} kết thúc` }
    );

    this.currentTurn++;
    this.battle.currentTurn = this.currentTurn;
    await this.battle.save();

    return { turn: this.currentTurn, participants: aliveParticipants.length };
  }

  /**
   * Xử lý action của enemy (AI)
   */
  async processEnemyAction(enemy) {
    // Find alive player targets
    const playerTargets = this.participants.filter(p => p.isPlayer && p.isAlive);
    if (playerTargets.length === 0) return;

    // Select random target
    const target = playerTargets[Math.floor(Math.random() * playerTargets.length)];

    // Check if can use skill
    const availableSkills = await enemy.getAvailableSkills(this.currentTurn);
    let skillId = null;

    if (availableSkills.length > 0 && enemy.energy.current >= 30) {
      // 50% chance to use skill
      if (Math.random() < 0.5) {
        skillId = availableSkills[0];
      }
    }

    // Perform attack
    try {
      await this.performAttack(enemy._id, target._id, skillId);
    } catch (error) {
      console.error('Enemy action error:', error.message);
    }
  }

  /**
   * Kết thúc battle
   */
  async endBattle(reason) {
    const aliveParticipants = this.participants.filter(p => p.isAlive);
    const playerParticipants = aliveParticipants.filter(p => p.isPlayer);
    const enemyParticipants = aliveParticipants.filter(p => !p.isPlayer);

    let winner = null;
    let loser = null;
    let battleResult = '';

    if (reason === 'timeout') {
      // Timeout - player loses
      winner = enemyParticipants[0]?.userPet.user;
      loser = playerParticipants[0]?.userPet.user;
      battleResult = 'timeout';
    } else if (reason === 'elimination') {
      if (playerParticipants.length > 0) {
        // Player wins
        winner = playerParticipants[0].userPet.user;
        loser = enemyParticipants[0]?.userPet.user;
        battleResult = 'player_win';
      } else {
        // Player loses
        winner = enemyParticipants[0]?.userPet.user;
        loser = playerParticipants[0]?.userPet.user;
        battleResult = 'player_lose';
      }
    }

    // Calculate rewards
    const rewards = this.calculateRewards(battleResult);

    // End battle
    await this.battle.endBattle(winner, loser, rewards);

    // Create battle end log
    await BattleLog.createTurnLog(
      this.battleId,
      this.currentTurn,
      'battle_end',
      { 
        message: `Battle kết thúc! ${winner ? 'Người chơi thắng!' : 'Người chơi thua!'}`,
        result: battleResult,
        rewards: rewards
      }
    );

    return {
      winner: winner,
      loser: loser,
      result: battleResult,
      rewards: rewards
    };
  }

  /**
   * Tính toán rewards
   */
  calculateRewards(battleResult) {
    if (battleResult !== 'player_win') {
      return { exp: 0, gold: 0, items: [] };
    }

    // Base rewards
    let exp = 100;
    let gold = 50;

    // Add rewards based on battle type
    if (this.battle.battleType === 'pve') {
      exp += 50;
      gold += 25;
    } else if (this.battle.battleType === 'boss') {
      exp += 200;
      gold += 100;
    }

    // Add rewards based on battle duration
    const durationBonus = Math.max(1, Math.floor(this.currentTurn / 10));
    exp += durationBonus * 10;
    gold += durationBonus * 5;

    return { exp, gold, items: [] };
  }

  /**
   * Lấy battle state
   */
  async getBattleState() {
    const aliveParticipants = this.participants.filter(p => p.isAlive);
    const playerParticipants = aliveParticipants.filter(p => p.isPlayer);
    const enemyParticipants = aliveParticipants.filter(p => !p.isPlayer);

    // Populate userPet.pet để lấy tên pet
    const populatedParticipants = await BattleParticipant.find({ 
      _id: { $in: this.participants.map(p => p._id) } 
    }).populate('userPet.pet');

    const getPetName = (participantId) => {
      const populated = populatedParticipants.find(p => p._id.equals(participantId));
      return populated?.userPet?.pet?.name || 'Unknown Pet';
    };

    return {
      battleId: this.battleId,
      currentTurn: this.currentTurn,
      maxTurns: this.maxTurns,
      teamOrder: this.teamSpeedInfo,
      currentTurnOrder: this.getTurnOrder().map(p => ({
        id: p._id,
        isPlayer: p.isPlayer,
        position: p.position,
        petName: getPetName(p._id)
      })),
      playerParticipants: playerParticipants.map(p => ({
        id: p._id,
        userPet: p.userPet,
        position: p.position,
        currentStats: p.currentStats,
        energy: p.energy,
        statusEffects: p.statusEffects,
        isAlive: p.isAlive
      })),
      enemyParticipants: enemyParticipants.map(p => ({
        id: p._id,
        userPet: p.userPet,
        position: p.position,
        currentStats: p.currentStats,
        energy: p.energy,
        statusEffects: p.statusEffects,
        isAlive: p.isAlive
      })),
      battleStatus: this.battle.status
    };
  }
}

/**
 * Tạo formation quái/boss từ database
 * @param {String} mapId
 * @param {String} stageId
 * @param {String} battleId (optional, để chỉ định battle cụ thể)
 * @returns {Promise<{formation: Formation, userPets: UserPet[], aiUser: User}>}
 */
BattleEngine.createEnemyFormationFromConfig = async function(mapId, stageId, battleId = null) {
  // Import models cần thiết
  const PvEBattle = require('../models/PvEBattle');
  const Map = require('../models/Map');
  const Stage = require('../models/Stage');
  
  // Kiểm tra map tồn tại
  const map = await Map.findOne({ mapId, isActive: true });
  if (!map) throw new Error(`Không tìm thấy map: ${mapId}`);
  
  // Kiểm tra stage tồn tại
  const stage = await Stage.findOne({ stageId, mapId, isActive: true });
  if (!stage) throw new Error(`Không tìm thấy stage: ${stageId} trong map ${mapId}`);
  
  // Lấy battle (nếu không chỉ định battleId, lấy battle đầu tiên)
  let battleConfig;
  if (battleId) {
    battleConfig = await PvEBattle.findOne({ battleId, stageId, isActive: true });
  } else {
    battleConfig = await PvEBattle.findOne({ stageId, isActive: true }).sort({ order: 1 });
  }
  
  if (!battleConfig) throw new Error(`Không tìm thấy battle trong stage: ${stageId}`);

  // Tạo user giả cho enemy
  const aiUser = new User({ 
    username: `ai_${Date.now()}`, 
    email: `ai_${Date.now()}@example.com`, 
    password: 'ai123456',
    displayName: `AI ${battleConfig.name}`
  });
  await aiUser.save();

  // Tạo UserPet cho từng enemy
  const userPets = [];
  for (const enemy of battleConfig.enemies) {
    const pet = await Pet.findOne({ name: enemy.petId });
    if (!pet) throw new Error(`Không tìm thấy pet cho enemy: ${enemy.petId}`);
    
    const userPet = new UserPet({
      user: aiUser._id,
      pet: pet._id,
      level: enemy.level,
      exp: 0,
      location: 'formation',
      // Có thể gán skill, chỉ số đặc biệt từ enemy config
      skills: enemy.skills || [],
      equipment: enemy.equipment || []
    });
    await userPet.save();
    userPets.push(userPet);
  }

  // Tạo formation cho enemy
  const formation = new Formation({
    user: aiUser._id,
    isActive: false,
    isDefault: false,
    slots: userPets.map((up, i) => ({ position: i + 1, userPet: up._id })),
    totalCombatPower: 0,
    totalPets: userPets.length,
    formationType: 'pve',
    description: `Enemy formation for ${mapId} - ${stageId} - ${battleConfig.name}`
  });
  await formation.save();

  return { formation, userPets, aiUser, battleConfig };
};

const ELEMENTS_PATH = path.join(__dirname, '../Data_database/Element.elements.json');
let ELEMENTS_CACHE = null;
function loadElements() {
  if (!ELEMENTS_CACHE) {
    ELEMENTS_CACHE = JSON.parse(fs.readFileSync(ELEMENTS_PATH, 'utf8'));
  }
  return ELEMENTS_CACHE;
}

module.exports = BattleEngine; 