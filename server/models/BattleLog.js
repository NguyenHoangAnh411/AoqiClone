const mongoose = require('mongoose');

/**
 * BattleLog Model - Lưu log chi tiết từng turn trong battle
 * Ghi lại tất cả actions, damage, healing, status effects
 */
const battleLogSchema = new mongoose.Schema({
  // Reference đến battle
  battle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Battle',
    required: true
  },
  
  // Turn information
  turn: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Action type
  actionType: {
    type: String,
    enum: ['attack', 'skill', 'heal', 'buff', 'debuff', 'status_effect', 'turn_start', 'turn_end', 'battle_start', 'battle_end'],
    required: true
  },
  
  // Actor (pet thực hiện action)
  actor: {
    userPet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserPet'
    },
    position: {
      type: Number,
      min: 1,
      max: 5
    },
    isPlayer: {
      type: Boolean,
      default: true
    }
  },
  
  // Target (pet bị tác động)
  target: {
    userPet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserPet'
    },
    position: {
      type: Number,
      min: 1,
      max: 5
    },
    isPlayer: {
      type: Boolean,
      default: true
    }
  },
  
  // Skill used (nếu có)
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  },
  
  // Action details
  details: {
    // Damage information
    damage: {
      type: Number,
      default: 0
    },
    damageType: {
      type: String,
      enum: ['physical', 'magical', 'true'],
      default: 'physical'
    },
    isCritical: {
      type: Boolean,
      default: false
    },
    isDodged: {
      type: Boolean,
      default: false
    },
    
    // Healing information
    healing: {
      type: Number,
      default: 0
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
      value: {
        type: Number,
        default: 0
      }
    }],
    
    // Buff/Debuff information
    statChanges: {
      attack: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      evasion: { type: Number, default: 0 }
    },
    
    // Element effectiveness
    elementEffectiveness: {
      type: String,
      enum: ['strong', 'weak', 'normal'],
      default: 'normal'
    },
    effectivenessMultiplier: {
      type: Number,
      default: 1.0
    }
  },
  
  // HP changes
  hpChanges: {
    before: {
      type: Number,
      default: 0
    },
    after: {
      type: Number,
      default: 0
    },
    change: {
      type: Number,
      default: 0
    }
  },
  
  // Energy changes
  energyChanges: {
    before: {
      type: Number,
      default: 0
    },
    after: {
      type: Number,
      default: 0
    },
    change: {
      type: Number,
      default: 0
    }
  },
  
  // Action result
  result: {
    type: String,
    enum: ['success', 'failed', 'missed', 'blocked', 'dodged', 'critical'],
    default: 'success'
  },
  
  // Additional information
  message: {
    type: String,
    default: ''
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// ==================== INDEXES ====================
battleLogSchema.index({ battle: 1, turn: 1 });
battleLogSchema.index({ battle: 1, timestamp: 1 });
battleLogSchema.index({ 'actor.userPet': 1 });
battleLogSchema.index({ 'target.userPet': 1 });

// ==================== METHODS ====================

/**
 * Tạo attack log
 */
battleLogSchema.statics.createAttackLog = async function(battleId, turn, actor, target, damage, details = {}) {
  const log = new this({
    battle: battleId,
    turn: turn,
    actionType: 'attack',
    actor: actor,
    target: target,
    details: {
      damage: damage,
      damageType: details.damageType || 'physical',
      isCritical: details.isCritical || false,
      isDodged: details.isDodged || false,
      elementEffectiveness: details.elementEffectiveness || 'normal',
      effectivenessMultiplier: details.effectivenessMultiplier || 1.0
    },
    hpChanges: {
      before: details.hpBefore || 0,
      after: details.hpAfter || 0,
      change: damage
    },
    result: details.isDodged ? 'dodged' : (details.isCritical ? 'critical' : 'success'),
    message: details.message || ''
  });
  
  await log.save();
  return log;
};

/**
 * Tạo skill log
 */
battleLogSchema.statics.createSkillLog = async function(battleId, turn, actor, target, skillId, details = {}) {
  const log = new this({
    battle: battleId,
    turn: turn,
    actionType: 'skill',
    actor: actor,
    target: target,
    skill: skillId,
    details: {
      damage: details.damage || 0,
      healing: details.healing || 0,
      damageType: details.damageType || 'magical',
      isCritical: details.isCritical || false,
      statusEffects: details.statusEffects || [],
      statChanges: details.statChanges || {},
      elementEffectiveness: details.elementEffectiveness || 'normal',
      effectivenessMultiplier: details.effectivenessMultiplier || 1.0
    },
    hpChanges: {
      before: details.hpBefore || 0,
      after: details.hpAfter || 0,
      change: (details.damage || 0) - (details.healing || 0)
    },
    energyChanges: {
      before: details.energyBefore || 0,
      after: details.energyAfter || 0,
      change: details.energyCost || 0
    },
    result: details.result || 'success',
    message: details.message || ''
  });
  
  await log.save();
  return log;
};

/**
 * Tạo heal log
 */
battleLogSchema.statics.createHealLog = async function(battleId, turn, actor, target, healing, details = {}) {
  const log = new this({
    battle: battleId,
    turn: turn,
    actionType: 'heal',
    actor: actor,
    target: target,
    details: {
      healing: healing
    },
    hpChanges: {
      before: details.hpBefore || 0,
      after: details.hpAfter || 0,
      change: healing
    },
    result: 'success',
    message: details.message || ''
  });
  
  await log.save();
  return log;
};

/**
 * Tạo status effect log
 */
battleLogSchema.statics.createStatusEffectLog = async function(battleId, turn, target, effectId, details = {}) {
  const log = new this({
    battle: battleId,
    turn: turn,
    actionType: 'status_effect',
    target: target,
    details: {
      statusEffects: [{
        effect: effectId,
        duration: details.duration || 0,
        value: details.value || 0
      }]
    },
    result: details.result || 'success',
    message: details.message || ''
  });
  
  await log.save();
  return log;
};

/**
 * Tạo turn start/end log
 */
battleLogSchema.statics.createTurnLog = async function(battleId, turn, actionType, details = {}) {
  const log = new this({
    battle: battleId,
    turn: turn,
    actionType: actionType,
    details: details,
    message: details.message || ''
  });
  
  await log.save();
  return log;
};

/**
 * Lấy battle logs theo turn
 */
battleLogSchema.statics.getBattleLogsByTurn = async function(battleId, turn) {
  return await this.find({
    battle: battleId,
    turn: turn
  })
  .populate('actor.userPet target.userPet skill details.statusEffects.effect')
  .sort({ timestamp: 1 });
};

/**
 * Lấy tất cả logs của battle
 */
battleLogSchema.statics.getBattleLogs = async function(battleId) {
  return await this.find({
    battle: battleId
  })
  .populate('actor.userPet target.userPet skill details.statusEffects.effect')
  .sort({ turn: 1, timestamp: 1 });
};

/**
 * Lấy battle summary từ logs
 */
battleLogSchema.statics.getBattleSummary = async function(battleId) {
  const logs = await this.find({ battle: battleId });
  
  const summary = {
    totalTurns: 0,
    totalDamage: 0,
    totalHealing: 0,
    criticalHits: 0,
    dodges: 0,
    skillsUsed: 0,
    statusEffects: 0
  };
  
  logs.forEach(log => {
    if (log.actionType === 'turn_end') {
      summary.totalTurns = Math.max(summary.totalTurns, log.turn);
    }
    
    if (log.details.damage) {
      summary.totalDamage += log.details.damage;
    }
    
    if (log.details.healing) {
      summary.totalHealing += log.details.healing;
    }
    
    if (log.details.isCritical) {
      summary.criticalHits++;
    }
    
    if (log.details.isDodged) {
      summary.dodges++;
    }
    
    if (log.actionType === 'skill') {
      summary.skillsUsed++;
    }
    
    if (log.actionType === 'status_effect') {
      summary.statusEffects++;
    }
  });
  
  return summary;
};

module.exports = mongoose.model('BattleLog', battleLogSchema); 