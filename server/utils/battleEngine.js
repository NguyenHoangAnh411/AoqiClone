/**
 * Battle Engine - Turn-based Combat System giống Aoqi Legend
 */

const { calculateStats, getElementalEffectiveness } = require('./petUtils');
const { formatSkillEffects } = require('./skillEffects');

// Battle States
const BATTLE_STATES = {
  INITIALIZING: 'initializing',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished',
  CANCELLED: 'cancelled'
};

// Turn States
const TURN_STATES = {
  SELECTING_ACTION: 'selecting_action',
  EXECUTING_ACTION: 'executing_action',
  APPLYING_EFFECTS: 'applying_effects',
  COMPLETED: 'completed'
};

// Action Types
const ACTION_TYPES = {
  NORMAL_SKILL: 'normal_skill',
  ULTIMATE_SKILL: 'ultimate_skill',
  PASSIVE_SKILL: 'passive_skill',
  DEFEND: 'defend',
  ITEM: 'item',
  FLEE: 'flee'
};

// Status Effect Types
const STATUS_EFFECTS = {
  STUN: 'stun',
  POISON: 'poison',
  BURN: 'burn',
  FREEZE: 'freeze',
  PARALYZE: 'paralyze',
  SLEEP: 'sleep',
  CONFUSION: 'confusion'
};

// Battle Participant Class
class BattleParticipant {
  constructor(pet, userPet, skills) {
    this.pet = pet;
    this.userPet = userPet;
    this.skills = skills;
    this.stats = this.calculateBattleStats();
    this.currentHp = this.stats.hp;
    this.maxHp = this.stats.hp;
    this.energy = 100; // Max energy
    this.maxEnergy = 100;
    
    // Status Effects
    this.statusEffects = {};
    this.buffs = {};
    this.debuffs = {};
    
    // Battle State
    this.isDefending = false;
    this.isStunned = false;
    this.isAsleep = false;
    this.isConfused = false;
    this.canAct = true;
    
    // Turn Info
    this.actionSelected = null;
    this.target = null;
  }

  calculateBattleStats() {
    const baseStats = {
      baseHp: this.pet.baseHp,
      baseAttack: this.pet.baseAttack,
      baseDefense: this.pet.baseDefense,
      baseSpeed: this.pet.baseSpeed,
      baseAccuracy: this.pet.baseAccuracy || 100,
      baseEvasion: this.pet.baseEvasion || 10,
      baseCriticalRate: this.pet.baseCriticalRate || 5
    };

    return calculateStats(baseStats, this.userPet.level, this.pet.rarity, this.pet.element);
  }

  // Apply damage
  takeDamage(damage, isCritical = false) {
    let finalDamage = damage;
    
    // Defense reduces damage
    if (this.isDefending) {
      finalDamage = Math.floor(finalDamage * 0.5);
      this.isDefending = false;
    }
    
    // Apply defense stat
    finalDamage = Math.max(1, Math.floor(finalDamage * (100 / (100 + this.stats.defense))));
    
    this.currentHp = Math.max(0, this.currentHp - finalDamage);
    
    return {
      damage: finalDamage,
      isCritical,
      remainingHp: this.currentHp,
      isDead: this.currentHp <= 0
    };
  }

  // Heal HP
  heal(healAmount) {
    const oldHp = this.currentHp;
    this.currentHp = Math.min(this.maxHp, this.currentHp + healAmount);
    return this.currentHp - oldHp;
  }

  // Use energy
  useEnergy(amount) {
    if (this.energy >= amount) {
      this.energy -= amount;
      return true;
    }
    return false;
  }

  // Restore energy
  restoreEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  // Apply status effect
  applyStatusEffect(effect, duration) {
    this.statusEffects[effect] = {
      active: true,
      duration: duration,
      remainingTurns: duration
    };
    
    // Apply immediate effects
    switch(effect) {
      case STATUS_EFFECTS.STUN:
        this.isStunned = true;
        this.canAct = false;
        break;
      case STATUS_EFFECTS.SLEEP:
        this.isAsleep = true;
        this.canAct = false;
        break;
      case STATUS_EFFECTS.CONFUSION:
        this.isConfused = true;
        break;
    }
  }

  // Remove status effect
  removeStatusEffect(effect) {
    delete this.statusEffects[effect];
    
    switch(effect) {
      case STATUS_EFFECTS.STUN:
        this.isStunned = false;
        this.canAct = true;
        break;
      case STATUS_EFFECTS.SLEEP:
        this.isAsleep = false;
        this.canAct = true;
        break;
      case STATUS_EFFECTS.CONFUSION:
        this.isConfused = false;
        break;
    }
  }

  // Apply buff/debuff
  applyStatModifier(stat, level, isBuff = true) {
    const modifier = isBuff ? this.buffs : this.debuffs;
    modifier[stat] = level;
  }

  // Get modified stat
  getModifiedStat(stat) {
    const buffLevel = this.buffs[stat] || 0;
    const debuffLevel = this.debuffs[stat] || 0;
    const netModifier = buffLevel - debuffLevel;
    
    // Each level = 25% increase/decrease
    const multiplier = 1 + (netModifier * 0.25);
    return Math.floor(this.stats[stat] * multiplier);
  }

  // Process turn start
  processTurnStart() {
    // Process status effects
    Object.keys(this.statusEffects).forEach(effect => {
      const status = this.statusEffects[effect];
      status.remainingTurns--;
      
      // Apply damage over time
      switch(effect) {
        case STATUS_EFFECTS.POISON:
          const poisonDamage = Math.floor(this.maxHp * 0.1);
          this.takeDamage(poisonDamage);
          break;
        case STATUS_EFFECTS.BURN:
          const burnDamage = Math.floor(this.maxHp * 0.08);
          this.takeDamage(burnDamage);
          break;
      }
      
      // Remove expired effects
      if (status.remainingTurns <= 0) {
        this.removeStatusEffect(effect);
      }
    });
    
    // Natural energy recovery
    this.restoreEnergy(10);
  }

  // Check if can use skill
  canUseSkill(skill) {
    if (!this.canAct) return false;
    if (this.energy < skill.energyCost) return false;
    return true;
  }

  // Calculate skill accuracy
  calculateSkillAccuracy(skill, target) {
    const baseAccuracy = skill.accuracy || 100;
    const attackerAccuracy = this.getModifiedStat('accuracy');
    const targetEvasion = target.getModifiedStat('evasion');
    
    // Accuracy formula: baseAccuracy * (attackerAccuracy / 100) * (1 - targetEvasion / 100)
    const finalAccuracy = Math.max(0, Math.min(100, 
      baseAccuracy * (attackerAccuracy / 100) * (1 - targetEvasion / 100)
    ));
    
    return finalAccuracy;
  }

  // Check if skill hits
  doesSkillHit(skill, target) {
    const accuracy = this.calculateSkillAccuracy(skill, target);
    const random = Math.random() * 100;
    return random <= accuracy;
  }

  // Check if critical hit
  isCriticalHit(skill) {
    const criticalRate = skill.criticalRate || 0;
    const attackerCritRate = this.getModifiedStat('criticalRate');
    const totalCritRate = criticalRate + attackerCritRate;
    
    const random = Math.random() * 100;
    return random <= totalCritRate;
  }
}

// Battle Class
class Battle {
  constructor(playerPets, enemyPets, battleType = 'pvp') {
    this.battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.battleType = battleType;
    this.state = BATTLE_STATES.INITIALIZING;
    
    // Participants
    this.playerPets = playerPets.map(pet => new BattleParticipant(pet.pet, pet.userPet, pet.skills));
    this.enemyPets = enemyPets.map(pet => new BattleParticipant(pet.pet, pet.userPet, pet.skills));
    
    // Battle state
    this.currentTurn = 1;
    this.turnState = TURN_STATES.SELECTING_ACTION;
    this.currentParticipantIndex = 0;
    this.allParticipants = [...this.playerPets, ...this.enemyPets];
    
    // Sort by speed for turn order
    this.turnOrder = this.calculateTurnOrder();
    
    // Battle log
    this.battleLog = [];
    this.currentTurnLog = [];
    
    // Results
    this.winner = null;
    this.battleDuration = 0;
    this.startTime = Date.now();
  }

  // Calculate turn order based on speed
  calculateTurnOrder() {
    return this.allParticipants
      .map((participant, index) => ({ participant, index }))
      .sort((a, b) => b.participant.getModifiedStat('speed') - a.participant.getModifiedStat('speed'))
      .map(item => item.index);
  }

  // Initialize battle
  initialize() {
    this.state = BATTLE_STATES.IN_PROGRESS;
    this.log('Battle started!');
    
    // Process turn start for all participants
    this.allParticipants.forEach(participant => {
      participant.processTurnStart();
    });
    
    return this.getBattleState();
  }

  // Get current battle state
  getBattleState() {
    return {
      battleId: this.battleId,
      state: this.state,
      turn: this.currentTurn,
      turnState: this.turnState,
      currentParticipant: this.getCurrentParticipant(),
      participants: {
        player: this.playerPets.map(p => this.getParticipantState(p)),
        enemy: this.enemyPets.map(p => this.getParticipantState(p))
      },
      turnOrder: this.turnOrder,
      battleLog: this.battleLog,
      currentTurnLog: this.currentTurnLog,
      winner: this.winner
    };
  }

  // Get participant state for frontend
  getParticipantState(participant) {
    return {
      petId: participant.pet._id,
      name: participant.pet.name,
      element: participant.pet.element,
      currentHp: participant.currentHp,
      maxHp: participant.maxHp,
      energy: participant.energy,
      maxEnergy: participant.maxEnergy,
      stats: participant.stats,
      statusEffects: participant.statusEffects,
      buffs: participant.buffs,
      debuffs: participant.debuffs,
      isDefending: participant.isDefending,
      canAct: participant.canAct,
      skills: participant.skills
    };
  }

  // Get current participant
  getCurrentParticipant() {
    if (this.turnOrder.length === 0) return null;
    const currentIndex = this.turnOrder[this.currentParticipantIndex];
    return this.allParticipants[currentIndex];
  }

  // Select action for current participant
  selectAction(actionType, skillId = null, targetIndex = null) {
    const participant = this.getCurrentParticipant();
    if (!participant || !participant.canAct) {
      return { success: false, message: 'Participant cannot act' };
    }

    participant.actionSelected = {
      type: actionType,
      skillId: skillId,
      targetIndex: targetIndex
    };

    this.turnState = TURN_STATES.EXECUTING_ACTION;
    return { success: true };
  }

  // Execute current action
  executeAction() {
    const participant = this.getCurrentParticipant();
    if (!participant || !participant.actionSelected) {
      return { success: false, message: 'No action selected' };
    }

    const action = participant.actionSelected;
    let result = { success: false, message: 'Invalid action' };

    switch (action.type) {
      case ACTION_TYPES.NORMAL_SKILL:
      case ACTION_TYPES.ULTIMATE_SKILL:
        result = this.executeSkill(participant, action.skillId, action.targetIndex);
        break;
      case ACTION_TYPES.DEFEND:
        result = this.executeDefend(participant);
        break;
      case ACTION_TYPES.FLEE:
        result = this.executeFlee(participant);
        break;
    }

    this.currentTurnLog.push({
      participant: participant.pet.name,
      action: action.type,
      result: result
    });

    return result;
  }

  // Execute skill
  executeSkill(attacker, skillId, targetIndex) {
    const skill = attacker.skills.find(s => s._id === skillId);
    if (!skill) {
      return { success: false, message: 'Skill not found' };
    }

    if (!attacker.canUseSkill(skill)) {
      return { success: false, message: 'Cannot use skill' };
    }

    const target = this.allParticipants[targetIndex];
    if (!target) {
      return { success: false, message: 'Target not found' };
    }

    // Check if skill hits
    if (!attacker.doesSkillHit(skill, target)) {
      attacker.useEnergy(skill.energyCost);
      this.log(`${attacker.pet.name}'s ${skill.name} missed!`);
      return { success: true, message: 'Skill missed' };
    }

    // Calculate damage
    const isCritical = attacker.isCriticalHit(skill);
    const baseDamage = skill.power || 0;
    const attackerAttack = attacker.getModifiedStat('attack');
    const targetDefense = target.getModifiedStat('defense');
    
    let damage = Math.floor(baseDamage + (attackerAttack * 0.5) - (targetDefense * 0.3));
    damage = Math.max(1, damage);

    // Apply elemental effectiveness
    const effectiveness = getElementalEffectiveness(attacker.pet.element, target.pet.element);
    damage = Math.floor(damage * effectiveness);

    // Apply critical hit
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }

    // Apply damage
    const damageResult = target.takeDamage(damage, isCritical);
    
    // Use energy
    attacker.useEnergy(skill.energyCost);

    // Apply skill effects
    this.applySkillEffects(attacker, target, skill);

    // Log the action
    const effectivenessText = effectiveness > 1 ? ' (Super effective!)' : effectiveness < 1 ? ' (Not very effective)' : '';
    const criticalText = isCritical ? ' Critical hit!' : '';
    this.log(`${attacker.pet.name} used ${skill.name}${effectivenessText}${criticalText} - ${damageResult.damage} damage!`);

    return {
      success: true,
      damage: damageResult.damage,
      isCritical,
      effectiveness,
      targetDead: damageResult.isDead
    };
  }

  // Apply skill effects
  applySkillEffects(attacker, target, skill) {
    if (!skill.effects) return;

    // Status effects
    if (skill.effects.status) {
      Object.entries(skill.effects.status).forEach(([effect, active]) => {
        if (active && skill.effects.duration?.status) {
          target.applyStatusEffect(effect, skill.effects.duration.status);
        }
      });
    }

    // Buff effects (on attacker)
    if (skill.effects.buff) {
      Object.entries(skill.effects.buff).forEach(([stat, level]) => {
        if (level > 0 && skill.effects.duration?.buff) {
          attacker.applyStatModifier(stat, level, true);
        }
      });
    }

    // Debuff effects (on target)
    if (skill.effects.debuff) {
      Object.entries(skill.effects.debuff).forEach(([stat, level]) => {
        if (level > 0 && skill.effects.duration?.debuff) {
          target.applyStatModifier(stat, level, false);
        }
      });
    }

    // Special effects
    if (skill.effects.special) {
      const special = skill.effects.special;
      
      if (special.heal && special.heal > 0) {
        const healAmount = Math.floor(attacker.maxHp * (special.heal / 100));
        attacker.heal(healAmount);
        this.log(`${attacker.pet.name} healed ${healAmount} HP!`);
      }
    }
  }

  // Execute defend action
  executeDefend(participant) {
    participant.isDefending = true;
    this.log(`${participant.pet.name} is defending!`);
    return { success: true, message: 'Defending' };
  }

  // Execute flee action
  executeFlee(participant) {
    // Simple flee logic - 50% chance to succeed
    const fleeSuccess = Math.random() > 0.5;
    if (fleeSuccess) {
      this.log(`${participant.pet.name} fled from battle!`);
      return { success: true, message: 'Fled successfully' };
    } else {
      this.log(`${participant.pet.name} failed to flee!`);
      return { success: false, message: 'Failed to flee' };
    }
  }

  // Move to next participant
  nextParticipant() {
    this.currentParticipantIndex++;
    
    // Check if turn is complete
    if (this.currentParticipantIndex >= this.turnOrder.length) {
      this.endTurn();
    } else {
      // Process turn start for next participant
      const nextParticipant = this.getCurrentParticipant();
      if (nextParticipant) {
        nextParticipant.processTurnStart();
      }
    }
  }

  // End current turn
  endTurn() {
    this.currentTurn++;
    this.currentParticipantIndex = 0;
    this.turnState = TURN_STATES.SELECTING_ACTION;
    
    // Clear turn log
    this.battleLog.push(...this.currentTurnLog);
    this.currentTurnLog = [];
    
    // Check battle end conditions
    this.checkBattleEnd();
  }

  // Check if battle should end
  checkBattleEnd() {
    const playerAlive = this.playerPets.some(p => p.currentHp > 0);
    const enemyAlive = this.enemyPets.some(p => p.currentHp > 0);
    
    if (!playerAlive) {
      this.endBattle('enemy');
    } else if (!enemyAlive) {
      this.endBattle('player');
    }
  }

  // End battle
  endBattle(winner) {
    this.state = BATTLE_STATES.FINISHED;
    this.winner = winner;
    this.battleDuration = Date.now() - this.startTime;
    
    this.log(`Battle ended! ${winner === 'player' ? 'Player' : 'Enemy'} wins!`);
    
    return this.getBattleState();
  }

  // Add log entry
  log(message) {
    const logEntry = {
      turn: this.currentTurn,
      message: message,
      timestamp: Date.now()
    };
    
    this.currentTurnLog.push(logEntry);
  }
}

module.exports = {
  Battle,
  BattleParticipant,
  BATTLE_STATES,
  TURN_STATES,
  ACTION_TYPES,
  STATUS_EFFECTS
}; 