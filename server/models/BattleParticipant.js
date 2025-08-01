const mongoose = require('mongoose');

/**
 * BattleParticipant Model - Quản lý thông tin pet trong battle
 * Lưu trữ stats hiện tại, HP, energy, status effects trong battle
 */
const battleParticipantSchema = new mongoose.Schema({
  // Reference đến battle
  battle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Battle',
    required: true
  },
  
  // Pet information
  userPet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPet',
    required: true
  },
  
  // Position trong formation
  position: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Player info
  isPlayer: {
    type: Boolean,
    default: true
  },
  
  // Current stats trong battle
  currentStats: {
    hp: {
      type: Number,
      default: 0
    },
    maxHp: {
      type: Number,
      default: 0
    },
    attack: {
      type: Number,
      default: 0
    },
    defense: {
      type: Number,
      default: 0
    },
    speed: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      default: 0
    },
    evasion: {
      type: Number,
      default: 0
    },
    criticalRate: {
      type: Number,
      default: 0
    }
  },
  
  // Energy system
  energy: {
    current: {
      type: Number,
      default: 100
    },
    max: {
      type: Number,
      default: 100
    },
    regenPerTurn: {
      type: Number,
      default: 10
    }
  },
  
  // Status effects
  statusEffects: [{
    effect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Effect'
    },
    duration: {
      type: Number,
      default: 0
    },
    remainingTurns: {
      type: Number,
      default: 0
    },
    value: {
      type: Number,
      default: 0
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Buff/Debuff stacks
  buffs: {
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    evasion: { type: Number, default: 0 },
    criticalRate: { type: Number, default: 0 }
  },
  
  // Battle state
  isAlive: {
    type: Boolean,
    default: true
  },
  isStunned: {
    type: Boolean,
    default: false
  },
  isSilenced: {
    type: Boolean,
    default: false
  },
  
  // Turn information
  lastActionTurn: {
    type: Number,
    default: 0
  },
  nextActionTurn: {
    type: Number,
    default: 1
  },
  
  // Skills available
  availableSkills: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    cooldown: {
      type: Number,
      default: 0
    },
    lastUsedTurn: {
      type: Number,
      default: 0
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ==================== INDEXES ====================
battleParticipantSchema.index({ battle: 1, position: 1 });
battleParticipantSchema.index({ battle: 1, isPlayer: 1 });
battleParticipantSchema.index({ userPet: 1 });

// ==================== VALIDATION ====================
battleParticipantSchema.pre('save', async function(next) {
  // Ensure HP doesn't exceed max HP
  if (this.currentStats.hp > this.currentStats.maxHp) {
    this.currentStats.hp = this.currentStats.maxHp;
  }
  
  // Ensure HP doesn't go below 0
  if (this.currentStats.hp < 0) {
    this.currentStats.hp = 0;
  }
  
  // Update alive status
  this.isAlive = this.currentStats.hp > 0;
  
  // Ensure energy doesn't exceed max
  if (this.energy.current > this.energy.max) {
    this.energy.current = this.energy.max;
  }
  
  // Ensure energy doesn't go below 0
  if (this.energy.current < 0) {
    this.energy.current = 0;
  }
  
  this.updatedAt = new Date();
  next();
});

// ==================== METHODS ====================

/**
 * Khởi tạo participant từ UserPet
 */
battleParticipantSchema.methods.initializeFromUserPet = async function(allParticipants = []) {
  await this.populate({ path: 'userPet', populate: { path: 'pet' } });

  if (!this.userPet || !this.userPet.pet) {
    throw new Error('UserPet hoặc Pet không tồn tại');
  }

  // Lấy stats hiện tại của UserPet
  const stats = await this.userPet.calculateActualStats();

  // Set current stats
  this.currentStats = {
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    accuracy: stats.accuracy,
    evasion: stats.evasion,
    criticalRate: stats.criticalRate
  };

  // ====== Áp dụng teamBuff nếu có ======
  const pet = this.userPet.pet;
  if (pet.teamBuff && pet.teamBuff.stat && pet.teamBuff.requirement) {
    // Lấy danh sách userPet trong cùng team (allParticipants truyền vào)
    // Nếu allParticipants chưa truyền vào, chỉ xét 1 mình
    let teammates = allParticipants && allParticipants.length > 0
      ? allParticipants.filter(p => p.isPlayer === this.isPlayer)
      : [this];
    // Lấy danh sách pet của teammates
    const teammatePets = await Promise.all(teammates.map(async p => {
      await p.populate({ path: 'userPet', populate: { path: 'pet' } });
      return p.userPet && p.userPet.pet ? p.userPet.pet : null;
    }));
    // Đếm số lượng pet cùng element/species
    let count = 0;
    if (pet.teamBuff.requirement.type === 'element') {
      count = teammatePets.filter(pet2 => pet2 && String(pet2.element) === String(pet.element)).length;
    } else if (pet.teamBuff.requirement.type === 'species') {
      count = teammatePets.filter(pet2 => pet2 && pet2.name === pet.name).length;
    }
    // Nếu đủ điều kiện thì buff
    if (count >= pet.teamBuff.requirement.count) {
      // Chỉ buff cho pet đáp ứng điều kiện
      let applyBuff = false;
      if (pet.teamBuff.requirement.type === 'element' && String(pet.element) === String(pet.teamBuff.requirement.value)) {
        applyBuff = true;
      } else if (pet.teamBuff.requirement.type === 'species' && pet.name === pet.teamBuff.requirement.value) {
        applyBuff = true;
      }
      if (applyBuff) {
        // Áp dụng buff vào chỉ số
        const stat = pet.teamBuff.stat;
        const value = pet.teamBuff.value;
        const type = pet.teamBuff.type || 'percent';
        if (stat && value) {
          if (type === 'percent') {
            this.currentStats[stat] = Math.floor(this.currentStats[stat] * (1 + value / 100));
          } else {
            this.currentStats[stat] += value;
          }
        }
        this._teamBuffApplied = true;
      }
    }
  }

  // Set energy
  this.energy = {
    current: 100,
    max: 100,
    regenPerTurn: 10
  };

  // Set available skills từ UserPet
  this.availableSkills = [];
  try {
    const skillsWithLevels = await this.userPet.getSkillsWithLevels();
    for (const skillData of skillsWithLevels) {
      this.availableSkills.push({
        skill: skillData.skillTemplate._id, // Lấy skill ID từ skill template
        cooldown: 0,
        lastUsedTurn: 0
      });
    }
  } catch (error) {
    console.error('Error loading skills for participant:', error.message);
  }

  await this.save();
  return this;
};

/**
 * Nhận damage
 */
battleParticipantSchema.methods.takeDamage = async function(damage, damageType = 'physical') {
  if (!this.isAlive) {
    return { damage: 0, isDead: false };
  }
  
  let actualDamage = damage;
  
  // Apply defense reduction for physical damage
  if (damageType === 'physical') {
    const defenseReduction = this.currentStats.defense * 0.1; // 10% defense reduction
    actualDamage = Math.max(1, damage - defenseReduction);
  }
  
  // Apply damage
  this.currentStats.hp = Math.max(0, this.currentStats.hp - actualDamage);
  
  // Check if dead
  const isDead = this.currentStats.hp <= 0;
  if (isDead) {
    this.isAlive = false;
  }
  
  await this.save();
  
  return {
    damage: actualDamage,
    isDead: isDead,
    remainingHp: this.currentStats.hp
  };
};

/**
 * Nhận healing
 */
battleParticipantSchema.methods.receiveHealing = async function(healing) {
  if (!this.isAlive) {
    return { healing: 0 };
  }
  
  const oldHp = this.currentStats.hp;
  this.currentStats.hp = Math.min(this.currentStats.maxHp, this.currentStats.hp + healing);
  
  const actualHealing = this.currentStats.hp - oldHp;
  
  await this.save();
  
  return {
    healing: actualHealing,
    currentHp: this.currentStats.hp
  };
};

/**
 * Thêm status effect
 */
battleParticipantSchema.methods.addStatusEffect = async function(effectId, duration, value) {
  // Check if effect already exists
  const existingEffect = this.statusEffects.find(se => se.effect.equals(effectId));
  
  if (existingEffect) {
    // Refresh duration
    existingEffect.duration = duration;
    existingEffect.remainingTurns = duration;
    existingEffect.value = value;
    existingEffect.appliedAt = new Date();
  } else {
    // Add new effect
    this.statusEffects.push({
      effect: effectId,
      duration: duration,
      remainingTurns: duration,
      value: value,
      appliedAt: new Date()
    });
  }
  
  await this.save();
  return this;
};

/**
 * Xử lý status effects vào đầu turn
 */
battleParticipantSchema.methods.processStatusEffects = async function(turn) {
  const effectsToRemove = [];
  const processedEffects = [];
  
  for (let i = 0; i < this.statusEffects.length; i++) {
    const effect = this.statusEffects[i];
    
    // Decrease remaining turns
    effect.remainingTurns--;
    
    // Process effect
    if (effect.remainingTurns > 0) {
      processedEffects.push({
        effect: effect.effect,
        value: effect.value,
        remainingTurns: effect.remainingTurns
      });
    } else {
      effectsToRemove.push(i);
    }
  }
  
  // Remove expired effects
  for (let i = effectsToRemove.length - 1; i >= 0; i--) {
    this.statusEffects.splice(effectsToRemove[i], 1);
  }
  
  // Regenerate energy
  this.energy.current = Math.min(this.energy.max, this.energy.current + this.energy.regenPerTurn);
  
  await this.save();
  
  return {
    processedEffects: processedEffects,
    removedEffects: effectsToRemove.length,
    energyRegenerated: this.energy.regenPerTurn
  };
};

/**
 * Sử dụng skill
 */
battleParticipantSchema.methods.useSkill = async function(skillId, turn) {
  const skillIndex = this.availableSkills.findIndex(s => s.skill.equals(skillId));
  
  if (skillIndex === -1) {
    throw new Error('Skill không có sẵn');
  }
  
  const skill = this.availableSkills[skillIndex];
  
  // Check cooldown
  if (turn - skill.lastUsedTurn < skill.cooldown) {
    throw new Error('Skill đang trong cooldown');
  }
  
  // Update skill usage
  skill.lastUsedTurn = turn;
  
  await this.save();
  
  return skill;
};

/**
 * Lấy skill có thể sử dụng
 */
battleParticipantSchema.methods.getAvailableSkills = async function(turn) {
  const available = [];
  
  for (const skillData of this.availableSkills) {
    if (turn - skillData.lastUsedTurn >= skillData.cooldown) {
      available.push(skillData.skill);
    }
  }
  
  return available;
};

/**
 * Lấy thông tin participant summary
 */
battleParticipantSchema.methods.getSummary = async function() {
  await this.populate('userPet statusEffects.effect availableSkills.skill');
  
  return {
    _id: this._id,
    userPet: this.userPet,
    position: this.position,
    isPlayer: this.isPlayer,
    currentStats: this.currentStats,
    energy: this.energy,
    statusEffects: this.statusEffects,
    buffs: this.buffs,
    isAlive: this.isAlive,
    isStunned: this.isStunned,
    isSilenced: this.isSilenced,
    availableSkills: this.availableSkills
  };
};

// ==================== STATIC METHODS ====================

/**
 * Tạo participant từ UserPet
 */
battleParticipantSchema.statics.createFromUserPet = async function(battleId, userPetId, position, isPlayer = true) {
  const participant = new this({
    battle: battleId,
    userPet: userPetId,
    position: position,
    isPlayer: isPlayer
  });
  
  await participant.initializeFromUserPet();
  return participant;
};

/**
 * Lấy tất cả participants của battle
 */
battleParticipantSchema.statics.getBattleParticipants = async function(battleId) {
  return await this.find({ battle: battleId })
    .populate('userPet statusEffects.effect availableSkills.skill')
    .sort({ isPlayer: -1, position: 1 });
};

/**
 * Lấy alive participants của battle
 */
battleParticipantSchema.statics.getAliveParticipants = async function(battleId) {
  return await this.find({ 
    battle: battleId,
    isAlive: true
  })
  .populate('userPet statusEffects.effect availableSkills.skill')
  .sort({ isPlayer: -1, position: 1 });
};

module.exports = mongoose.model('BattleParticipant', battleParticipantSchema); 