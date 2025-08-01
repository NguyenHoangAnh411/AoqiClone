const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  rewardId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  battleId: {
    type: String,
    required: true,
    ref: 'PvEBattle'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Base rewards
  baseGold: {
    type: Number,
    default: 0,
    min: 0
  },
  baseExp: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Item rewards
  items: [{
    itemId: {
      type: String,
      required: true,
      ref: 'Item'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    chance: {
      type: Number,
      default: 1.0, // 100% chance
      min: 0,
      max: 1
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    maxQuantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  
  // Pet fragment rewards
  petFragments: [{
    petId: {
      type: String,
      required: true,
      ref: 'Pet'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    chance: {
      type: Number,
      default: 0.1, // 10% chance
      min: 0,
      max: 1
    }
  }],
  
  // Achievement bonuses
  bonuses: {
    flawless: {
      gold: { type: Number, default: 0 },
      exp: { type: Number, default: 0 },
      items: [{
        itemId: { type: String, ref: 'Item' },
        quantity: { type: Number, default: 1 }
      }]
    },
    speedRun: {
      gold: { type: Number, default: 0 },
      exp: { type: Number, default: 0 },
      items: [{
        itemId: { type: String, ref: 'Item' },
        quantity: { type: Number, default: 1 }
      }]
    },
    firstTime: {
      gold: { type: Number, default: 0 },
      exp: { type: Number, default: 0 },
      items: [{
        itemId: { type: String, ref: 'Item' },
        quantity: { type: Number, default: 1 }
      }]
    }
  },
  
  // Level scaling
  levelScaling: {
    enabled: {
      type: Boolean,
      default: false
    },
    goldMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.1
    },
    expMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.1
    }
  },
  
  // Event rewards
  isEventReward: {
    type: Boolean,
    default: false
  },
  eventStartDate: {
    type: Date,
    default: null
  },
  eventEndDate: {
    type: Date,
    default: null
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
rewardSchema.index({ rewardId: 1 });
rewardSchema.index({ battleId: 1 });
rewardSchema.index({ isActive: 1, isEventReward: 1 });

// ==================== METHODS ====================

/**
 * Tính toán reward dựa trên level và achievement
 */
rewardSchema.methods.calculateReward = function(playerLevel = 1, achievements = {}) {
  const reward = {
    gold: this.baseGold,
    exp: this.baseExp,
    items: [],
    petFragments: [],
    bonuses: {}
  };
  
  // Level scaling
  if (this.levelScaling.enabled) {
    reward.gold = Math.floor(reward.gold * this.levelScaling.goldMultiplier * playerLevel);
    reward.exp = Math.floor(reward.exp * this.levelScaling.expMultiplier * playerLevel);
  }
  
  // Item drops
  for (const itemReward of this.items) {
    if (Math.random() < itemReward.chance) {
      const quantity = Math.floor(Math.random() * (itemReward.maxQuantity - itemReward.minQuantity + 1)) + itemReward.minQuantity;
      reward.items.push({
        itemId: itemReward.itemId,
        quantity: quantity
      });
    }
  }
  
  // Pet fragment drops
  for (const fragmentReward of this.petFragments) {
    if (Math.random() < fragmentReward.chance) {
      reward.petFragments.push({
        petId: fragmentReward.petId,
        quantity: fragmentReward.quantity
      });
    }
  }
  
  // Achievement bonuses
  if (achievements.flawless && this.bonuses.flawless) {
    reward.bonuses.flawless = {
      gold: this.bonuses.flawless.gold,
      exp: this.bonuses.flawless.exp,
      items: [...this.bonuses.flawless.items]
    };
    reward.gold += this.bonuses.flawless.gold;
    reward.exp += this.bonuses.flawless.exp;
  }
  
  if (achievements.speedRun && this.bonuses.speedRun) {
    reward.bonuses.speedRun = {
      gold: this.bonuses.speedRun.gold,
      exp: this.bonuses.speedRun.exp,
      items: [...this.bonuses.speedRun.items]
    };
    reward.gold += this.bonuses.speedRun.gold;
    reward.exp += this.bonuses.speedRun.exp;
  }
  
  if (achievements.firstTime && this.bonuses.firstTime) {
    reward.bonuses.firstTime = {
      gold: this.bonuses.firstTime.gold,
      exp: this.bonuses.firstTime.exp,
      items: [...this.bonuses.firstTime.items]
    };
    reward.gold += this.bonuses.firstTime.gold;
    reward.exp += this.bonuses.firstTime.exp;
  }
  
  return reward;
};

// ==================== STATIC METHODS ====================

/**
 * Lấy reward cho battle
 */
rewardSchema.statics.getRewardForBattle = async function(battleId) {
  return await this.findOne({ battleId, isActive: true });
};

/**
 * Lấy tất cả rewards cho stage
 */
rewardSchema.statics.getRewardsForStage = async function(stageId) {
  const PvEBattle = require('./PvEBattle');
  const battles = await PvEBattle.find({ stageId, isActive: true });
  const battleIds = battles.map(b => b.battleId);
  
  return await this.find({ 
    battleId: { $in: battleIds }, 
    isActive: true 
  });
};

module.exports = mongoose.model('Reward', rewardSchema); 