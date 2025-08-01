const mongoose = require('mongoose');

/**
 * Quest Model - Hệ thống nhiệm vụ
 * Hỗ trợ nhiều loại nhiệm vụ: daily, weekly, achievement, story, event
 * Tích hợp với tất cả hệ thống game hiện có
 */
const questSchema = new mongoose.Schema({
  // Thông tin cơ bản
  questId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  icon: { 
    type: String, 
    default: '/assets/quest-icons/default.png' 
  },
  
  // Phân loại nhiệm vụ
  type: { 
    type: String, 
    enum: ['daily', 'weekly', 'achievement', 'story', 'event', 'tutorial'],
    required: true 
  },
  
  // Loại nhiệm vụ chi tiết
  category: { 
    type: String, 
    enum: [
      // Battle related
      'battle_win', 'battle_participate', 'pvp_win', 'pve_win', 'boss_win',
      // Pet related  
      'pet_catch', 'pet_evolve', 'pet_level_up', 'pet_skill_upgrade',
      // Collection related
      'item_collect', 'pet_collect', 'element_collect',
      // Progress related
      'level_up', 'formation_create', 'map_complete', 'stage_complete',
      // Social related
      'friend_add', 'guild_join', 'chat_participate',
      // Economy related
      'gold_earn', 'diamond_earn', 'item_use', 'shop_purchase'
    ],
    required: true 
  },
  
  // Điều kiện hoàn thành
  requirements: {
    // Số lượng cần đạt được
    target: { 
      type: Number, 
      default: 1 
    },
    
    // Điều kiện cụ thể theo loại nhiệm vụ
    conditions: {
      // Battle conditions
      battleType: { 
        type: String, 
        enum: ['pvp', 'pve', 'boss', 'arena'] 
      },
      minLevel: { 
        type: Number, 
        default: 1 
      },
      maxLevel: { 
        type: Number, 
        default: 999 
      },
      
      // Pet conditions
      petElement: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Element' 
      },
      petRarity: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Rarity' 
      },
      petLevel: { 
        type: Number, 
        default: 1 
      },
      
      // Item conditions
      itemType: { 
        type: String, 
        enum: ['material', 'consumable', 'equipment', 'currency'] 
      },
      itemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Item' 
      },
      
      // Map/Stage conditions
      mapId: { 
        type: String 
      },
      stageId: { 
        type: String 
      },
      
      // Time conditions
      timeLimit: { 
        type: Number, 
        default: 0 // 0 = không giới hạn thời gian
      },
      
      // Special conditions
      flawless: { 
        type: Boolean, 
        default: false 
      },
      firstTime: { 
        type: Boolean, 
        default: false 
      },
      consecutive: { 
        type: Boolean, 
        default: false 
      }
    }
  },
  
  // Phần thưởng
  rewards: {
    // Currency rewards
    gold: { 
      type: Number, 
      default: 0 
    },
    diamonds: { 
      type: Number, 
      default: 0 
    },
    standardFate: { 
      type: Number, 
      default: 0 
    },
    specialFate: { 
      type: Number, 
      default: 0 
    },
    
    // Experience rewards
    exp: { 
      type: Number, 
      default: 0 
    },
    
    // Item rewards
    items: [{
      itemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Item',
        required: true 
      },
      quantity: { 
        type: Number, 
        default: 1 
      },
      chance: { 
        type: Number, 
        default: 100 
      } // Tỷ lệ nhận được (%)
    }],
    
    // Pet rewards
    pets: [{
      petId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Pet',
        required: true 
      },
      level: { 
        type: Number, 
        default: 1 
      },
      chance: { 
        type: Number, 
        default: 100 
      }
    }],
    
    // Special rewards
    title: { 
      type: String 
    },
    avatar: { 
      type: String 
    },
    achievement: { 
      type: String 
    }
  },
  
  // Prerequisites (nhiệm vụ cần hoàn thành trước)
  prerequisites: [{
    questId: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      enum: ['completed', 'active'], 
      default: 'completed' 
    }
  }],
  
  // Thời gian và trạng thái
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isRepeatable: { 
    type: Boolean, 
    default: false 
  },
  repeatCooldown: { 
    type: Number, 
    default: 0 // Thời gian chờ trước khi có thể lặp lại (giây)
  },
  
  // Event specific
  eventId: { 
    type: String 
  },
  startDate: { 
    type: Date 
  },
  endDate: { 
    type: Date 
  },
  
  // Metadata
  order: { 
    type: Number, 
    default: 0 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'normal', 'hard', 'expert', 'legendary'],
    default: 'normal' 
  },
  
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

questSchema.index({ type: 1, isActive: 1 });
questSchema.index({ category: 1, isActive: 1 });
questSchema.index({ eventId: 1 });
questSchema.index({ 'requirements.conditions.petElement': 1 });
questSchema.index({ 'requirements.conditions.petRarity': 1 });
questSchema.index({ order: 1 });

// ==================== METHODS ====================

/**
 * Kiểm tra xem nhiệm vụ có thể được kích hoạt không
 */
questSchema.methods.canActivate = function(userLevel, userProgress) {
  // Kiểm tra level requirement
  if (userLevel < this.requirements.conditions.minLevel) {
    return { canActivate: false, reason: 'level_too_low' };
  }
  
  // Kiểm tra thời gian
  if (this.startDate && new Date() < this.startDate) {
    return { canActivate: false, reason: 'not_started' };
  }
  
  if (this.endDate && new Date() > this.endDate) {
    return { canActivate: false, reason: 'expired' };
  }
  
  return { canActivate: true };
};

/**
 * Kiểm tra điều kiện hoàn thành nhiệm vụ
 */
questSchema.methods.checkCompletion = function(userProgress, actionData) {
  const { category, requirements } = this;
  
  switch (category) {
    case 'battle_win':
      return this.checkBattleWin(userProgress, actionData);
    case 'pet_catch':
      return this.checkPetCatch(userProgress, actionData);
    case 'pet_evolve':
      return this.checkPetEvolve(userProgress, actionData);
    case 'item_collect':
      return this.checkItemCollect(userProgress, actionData);
    case 'level_up':
      return this.checkLevelUp(userProgress, actionData);
    default:
      return { completed: false, progress: 0 };
  }
};

/**
 * Kiểm tra điều kiện thắng trận
 */
questSchema.methods.checkBattleWin = function(userProgress, actionData) {
  const { battleType, flawless } = this.requirements.conditions;
  const { battleType: actualBattleType, isWinner, isFlawless } = actionData;
  
  if (!isWinner) return { completed: false, progress: userProgress };
  
  if (battleType && battleType !== actualBattleType) {
    return { completed: false, progress: userProgress };
  }
  
  if (flawless && !isFlawless) {
    return { completed: false, progress: userProgress };
  }
  
  const newProgress = userProgress + 1;
  return { 
    completed: newProgress >= this.requirements.target, 
    progress: newProgress 
  };
};

/**
 * Kiểm tra điều kiện bắt pet
 */
questSchema.methods.checkPetCatch = function(userProgress, actionData) {
  const { petElement, petRarity, petLevel } = this.requirements.conditions;
  const { pet } = actionData;
  
  if (petElement && pet.element.toString() !== petElement.toString()) {
    return { completed: false, progress: userProgress };
  }
  
  if (petRarity && pet.rarity.toString() !== petRarity.toString()) {
    return { completed: false, progress: userProgress };
  }
  
  if (petLevel && actionData.level < petLevel) {
    return { completed: false, progress: userProgress };
  }
  
  const newProgress = userProgress + 1;
  return { 
    completed: newProgress >= this.requirements.target, 
    progress: newProgress 
  };
};

/**
 * Kiểm tra điều kiện tiến hóa pet
 */
questSchema.methods.checkPetEvolve = function(userProgress, actionData) {
  const { petElement, petRarity } = this.requirements.conditions;
  const { pet, evolutionStage } = actionData;
  
  if (petElement && pet.element.toString() !== petElement.toString()) {
    return { completed: false, progress: userProgress };
  }
  
  if (petRarity && pet.rarity.toString() !== petRarity.toString()) {
    return { completed: false, progress: userProgress };
  }
  
  const newProgress = userProgress + 1;
  return { 
    completed: newProgress >= this.requirements.target, 
    progress: newProgress 
  };
};

/**
 * Kiểm tra điều kiện thu thập item
 */
questSchema.methods.checkItemCollect = function(userProgress, actionData) {
  const { itemType, itemId } = this.requirements.conditions;
  const { item, quantity } = actionData;
  
  if (itemType && item.type !== itemType) {
    return { completed: false, progress: userProgress };
  }
  
  if (itemId && item._id.toString() !== itemId.toString()) {
    return { completed: false, progress: userProgress };
  }
  
  const newProgress = userProgress + quantity;
  return { 
    completed: newProgress >= this.requirements.target, 
    progress: newProgress 
  };
};

/**
 * Kiểm tra điều kiện lên level
 */
questSchema.methods.checkLevelUp = function(userProgress, actionData) {
  const { minLevel } = this.requirements.conditions;
  const { newLevel } = actionData;
  
  if (minLevel && newLevel < minLevel) {
    return { completed: false, progress: userProgress };
  }
  
  const newProgress = userProgress + 1;
  return { 
    completed: newProgress >= this.requirements.target, 
    progress: newProgress 
  };
};

// ==================== MIDDLEWARE ====================

questSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ==================== STATIC METHODS ====================

/**
 * Lấy danh sách nhiệm vụ theo type
 */
questSchema.statics.getQuestsByType = function(type, userId = null) {
  const query = { type, isActive: true };
  
  if (userId) {
    // Có thể thêm logic filter theo user progress
  }
  
  return this.find(query).sort({ order: 1 });
};

/**
 * Lấy nhiệm vụ daily/weekly có thể làm
 */
questSchema.statics.getAvailableQuests = function(userId, userLevel) {
  const now = new Date();
  
  return this.find({
    isActive: true,
    $or: [
      { startDate: { $lte: now } },
      { startDate: { $exists: false } }
    ],
    $or: [
      { endDate: { $gte: now } },
      { endDate: { $exists: false } }
    ]
  }).sort({ order: 1 });
};

module.exports = mongoose.model('Quest', questSchema); 