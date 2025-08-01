const mongoose = require('mongoose');

/**
 * Battle Model - Quản lý trận đấu
 * Hỗ trợ PvP, PvE, Boss battles
 * Tích hợp với Formation System
 */
const battleSchema = new mongoose.Schema({
  // Thông tin battle
  battleType: {
    type: String,
    enum: ['pvp', 'pve', 'boss', 'arena'],
    required: true
  },
  
  // Trạng thái battle
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Participants
  player1: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    formation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Formation',
      required: true
    },
    isWinner: {
      type: Boolean,
      default: false
    }
  },
  
  player2: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    formation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Formation'
    },
    isWinner: {
      type: Boolean,
      default: false
    }
  },
  
  // PvE/Boss battle info
  enemyFormation: {
    pets: [{
      pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
      },
      level: {
        type: Number,
        default: 1
      },
      position: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      currentHp: {
        type: Number,
        default: 0
      },
      maxHp: {
        type: Number,
        default: 0
      }
    }],
    totalCombatPower: {
      type: Number,
      default: 0
    }
  },
  
  // Battle progress
  currentTurn: {
    type: Number,
    default: 1
  },
  maxTurns: {
    type: Number,
    default: 50
  },
  
  // Battle results
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  loser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Rewards
  rewards: {
    exp: {
      type: Number,
      default: 0
    },
    gold: {
      type: Number,
      default: 0
    },
    items: [{
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
      },
      quantity: {
        type: Number,
        default: 1
      }
    }]
  },
  
  // Battle metadata
  battleDuration: {
    type: Number, // seconds
    default: 0
  },
  
  // Timestamps
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
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
battleSchema.index({ 'player1.user': 1, status: 1 });
battleSchema.index({ 'player2.user': 1, status: 1 });
battleSchema.index({ battleType: 1, status: 1 });
battleSchema.index({ createdAt: -1 });

// ==================== VALIDATION ====================
battleSchema.pre('save', async function(next) {
  // Validate battle type requirements
  if (this.battleType === 'pvp') {
    if (!this.player2.user || !this.player2.formation) {
      return next(new Error('PvP battle cần 2 players'));
    }
  }
  
  if (this.battleType === 'pve' || this.battleType === 'boss') {
    if (!this.enemyFormation || this.enemyFormation.pets.length === 0) {
      return next(new Error('PvE/Boss battle cần enemy formation'));
    }
  }
  
  // Update timestamps
  this.updatedAt = new Date();
  
  // Set start time when battle becomes active
  if (this.status === 'active' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  // Set end time when battle completes
  if (this.status === 'completed' && !this.endedAt) {
    this.endedAt = new Date();
    if (this.startedAt) {
      this.battleDuration = Math.floor((this.endedAt - this.startedAt) / 1000);
    }
  }
  
  next();
});

// ==================== METHODS ====================

/**
 * Bắt đầu battle
 */
battleSchema.methods.startBattle = async function() {
  if (this.status !== 'pending') {
    throw new Error('Chỉ có thể bắt đầu battle ở trạng thái pending');
  }
  
  this.status = 'active';
  this.startedAt = new Date();
  
  await this.save();
  return this;
};

/**
 * Kết thúc battle
 */
battleSchema.methods.endBattle = async function(winnerId, loserId, rewards = {}) {
  if (this.status !== 'active') {
    throw new Error('Chỉ có thể kết thúc battle ở trạng thái active');
  }
  
  this.status = 'completed';
  this.endedAt = new Date();
  this.winner = winnerId;
  this.loser = loserId;
  
  // Set winner/loser flags
  if (this.player1.user.equals(winnerId)) {
    this.player1.isWinner = true;
    this.player2.isWinner = false;
  } else {
    this.player1.isWinner = false;
    this.player2.isWinner = true;
  }
  
  // Set rewards
  if (rewards.exp) this.rewards.exp = rewards.exp;
  if (rewards.gold) this.rewards.gold = rewards.gold;
  if (rewards.items) this.rewards.items = rewards.items;
  
  // Calculate battle duration
  if (this.startedAt) {
    this.battleDuration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  
  await this.save();
  return this;
};

/**
 * Hủy battle
 */
battleSchema.methods.cancelBattle = async function() {
  if (this.status === 'completed') {
    throw new Error('Không thể hủy battle đã hoàn thành');
  }
  
  this.status = 'cancelled';
  this.endedAt = new Date();
  
  await this.save();
  return this;
};

/**
 * Lấy thông tin battle summary
 */
battleSchema.methods.getBattleSummary = async function() {
  await this.populate('player1.user player1.formation player2.user player2.formation winner loser');
  
  return {
    _id: this._id,
    battleType: this.battleType,
    status: this.status,
    currentTurn: this.currentTurn,
    maxTurns: this.maxTurns,
    player1: {
      user: this.player1.user,
      formation: this.player1.formation,
      isWinner: this.player1.isWinner
    },
    player2: this.player2.user ? {
      user: this.player2.user,
      formation: this.player2.formation,
      isWinner: this.player2.isWinner
    } : null,
    winner: this.winner,
    loser: this.loser,
    rewards: this.rewards,
    battleDuration: this.battleDuration,
    startedAt: this.startedAt,
    endedAt: this.endedAt,
    createdAt: this.createdAt
  };
};

// ==================== STATIC METHODS ====================

/**
 * Tạo PvP battle
 */
battleSchema.statics.createPvPBattle = async function(player1Id, player1FormationId, player2Id, player2FormationId) {
  const battle = new this({
    battleType: 'pvp',
    status: 'pending',
    player1: {
      user: player1Id,
      formation: player1FormationId
    },
    player2: {
      user: player2Id,
      formation: player2FormationId
    }
  });
  
  await battle.save();
  return battle;
};

/**
 * Tạo PvE battle
 */
battleSchema.statics.createPvEBattle = async function(playerId, playerFormationId, enemyPets) {
  const battle = new this({
    battleType: 'pve',
    status: 'pending',
    player1: {
      user: playerId,
      formation: playerFormationId
    },
    enemyFormation: {
      pets: enemyPets,
      totalCombatPower: 0 // Sẽ được tính sau
    }
  });
  
  await battle.save();
  return battle;
};

/**
 * Lấy active battles của user
 */
battleSchema.statics.getActiveBattles = async function(userId) {
  return await this.find({
    $or: [
      { 'player1.user': userId },
      { 'player2.user': userId }
    ],
    status: 'active'
  }).populate('player1.user player1.formation player2.user player2.formation');
};

/**
 * Lấy battle history của user
 */
battleSchema.statics.getBattleHistory = async function(userId, limit = 20) {
  return await this.find({
    $or: [
      { 'player1.user': userId },
      { 'player2.user': userId }
    ],
    status: 'completed'
  })
  .populate('player1.user player1.formation player2.user player2.formation winner loser')
  .sort({ endedAt: -1 })
  .limit(limit);
};

/**
 * Lấy pending battles của user
 */
battleSchema.statics.getPendingBattles = async function(userId) {
  return await this.find({
    $or: [
      { 'player1.user': userId },
      { 'player2.user': userId }
    ],
    status: 'pending'
  }).populate('player1.user player1.formation player2.user player2.formation');
};

module.exports = mongoose.model('Battle', battleSchema); 