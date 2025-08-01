const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  // Thông tin cơ bản
  name: { 
    type: String, 
    required: true,
    unique: true
  },
  displayName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  icon: { 
    type: String, 
    required: true 
  },
  
  // Phân loại item chính
  type: { 
    type: String, 
    enum: ['material', 'consumable', 'equipment', 'currency', 'quest', 'special'],
    required: true 
  },
  
  // Sub-type chi tiết cho từng loại
  subType: { 
    type: String,
    enum: [
      // Material sub-types
      'skill_material', 'evolution_material', 'crafting_material', 'enhancement_material',
      // Consumable sub-types  
      'exp_item', 'heal_item', 'buff_item', 'revive_item', 'energy_item',
      // Equipment sub-types
      'weapon', 'armor', 'accessory', 'artifact',
      // Currency sub-types
      'gold', 'diamond', 'fate', 'honor', 'guild_coin', 'arena_point',
      // Quest sub-types
      'quest_item', 'collection_item', 'key_item', 'evidence_item',
      // Special sub-types
      'event_item', 'title_item', 'cosmetic_item', 'teleport_item'
    ],
    required: true 
  },
  
  // Rarity của item
  rarity: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Rarity',
    required: true 
  },
  
  // Thuộc tính item theo từng loại
  properties: {
    // Cho skill materials
    skillMaterial: {
      materialType: {
        type: String,
        enum: ['fire', 'water', 'grass', 'thunder', 'ice', 'rock', 'wind', 'neutral', 'light', 'dark'],
        default: null
      },
      materialGrade: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
      },
      skillType: {
        type: String,
        enum: ['normal', 'ultimate', 'passive', 'all'],
        default: 'all'
      }
    },
    
    // Cho exp items
    expItem: {
      expValue: { type: Number, default: 0 }, // Số exp cung cấp
      expType: { 
        type: String, 
        enum: ['small', 'medium', 'large', 'huge', 'legendary'],
        default: 'small'
      },
      targetType: { 
        type: String, 
        enum: ['pet'], 
        default: 'pet' 
      }
    },
    
    // Cho heal items
    healItem: {
      healValue: { type: Number, default: 0 },
      healType: { 
        type: String, 
        enum: ['hp'], 
        default: 'hp' 
      },
      healPercentage: { type: Boolean, default: false }, // True = heal theo %, False = heal theo số
      targetType: { 
        type: String, 
        enum: ['single_pet', 'all_pets'], 
        default: 'single_pet' 
      }
    },
    
    // Cho buff items
    buffItem: {
      buffType: { 
        type: String, 
        enum: ['attack', 'defense', 'speed', 'accuracy', 'evasion', 'critical', 'all'],
        default: 'attack'
      },
      buffValue: { type: Number, default: 0 },
      buffDuration: { type: Number, default: 0 }, // Thời gian hiệu lực (phút)
      buffPercentage: { type: Boolean, default: false }
    },
    
    // Cho equipment
    equipment: {
      slot: { 
        type: String, 
        enum: ['weapon', 'armor', 'accessory1', 'accessory2', 'accessory3'],
        required: function() { return this.type === 'equipment'; }
      },
      stats: {
        hp: { type: Number, default: 0 },
        attack: { type: Number, default: 0 },
        defense: { type: Number, default: 0 },
        speed: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        evasion: { type: Number, default: 0 },
        criticalRate: { type: Number, default: 0 },
        criticalDamage: { type: Number, default: 0 }
      },
      elementBonus: {
        element: { 
          type: String, 
          enum: ['fire', 'water', 'grass', 'thunder', 'ice', 'rock', 'wind', 'neutral'],
          default: null
        },
        bonusValue: { type: Number, default: 0 }
      },
      setBonus: {
        setName: { type: String, default: null },
        setPieces: { type: Number, default: 0 },
        setBonus: { type: String, default: null }
      }
    },
    
    // Cho currency
    currency: {
      exchangeRate: { type: Number, default: 1 }, // Tỷ lệ đổi với gold
      isPremium: { type: Boolean, default: false }, // Có phải premium currency không
      canEarn: { type: Boolean, default: true }, // Có thể kiếm được không
      canPurchase: { type: Boolean, default: true } // Có thể mua không
    },
    
    // Cho quest items
    questItem: {
      questId: { type: String, default: null }, // ID của quest liên quan
      questType: { 
        type: String, 
        enum: ['main', 'side', 'daily', 'weekly', 'event'],
        default: 'side'
      },
      isKeyItem: { type: Boolean, default: false }, // Có phải key item không
      isConsumable: { type: Boolean, default: true } // Có tiêu hao khi sử dụng không
    },
    
    // Cho special items
    specialItem: {
      effectType: { 
        type: String, 
        enum: ['teleport', 'respawn', 'blessing', 'curse', 'transformation', 'summon'],
        default: null
      },
      effectValue: { type: Number, default: 0 },
      effectDuration: { type: Number, default: 0 },
      targetType: { 
        type: String, 
        enum: ['self', 'pet', 'team', 'all'], 
        default: 'self' 
      }
    }
  },
  
  // Giá trị
  basePrice: { type: Number, default: 0 }, // Giá bán cơ bản
  sellPrice: { type: Number, default: 0 }, // Giá bán lại
  buyPrice: { type: Number, default: 0 }, // Giá mua từ shop
  
  // Stacking và limits
  maxStack: { type: Number, default: 999 }, // Số lượng tối đa trong 1 stack
  isStackable: { type: Boolean, default: true },
  minStack: { type: Number, default: 1 }, // Số lượng tối thiểu
  
  // Trading và usage
  isTradeable: { type: Boolean, default: true }, // Có thể trade không
  isUsable: { type: Boolean, default: false }, // Có thể sử dụng không
  isEquippable: { type: Boolean, default: false }, // Có thể trang bị không
  isDroppable: { type: Boolean, default: true }, // Có thể drop không
  isDestroyable: { type: Boolean, default: true }, // Có thể destroy không
  isSellable: { type: Boolean, default: true }, // Có thể bán không
  
  // Requirements
  levelRequirement: { type: Number, default: 0 }, // Level yêu cầu để sử dụng
  classRequirement: { type: String, default: null }, // Class yêu cầu
  elementRequirement: { type: String, default: null }, // Element yêu cầu
  questRequirement: { type: String, default: null }, // Quest yêu cầu
  
  // Drop và crafting
  dropRate: { type: Number, default: 0 }, // Tỷ lệ rơi (0-100)
  dropSource: [{ // Nguồn drop
    type: String,
    enum: ['monster', 'boss', 'chest', 'quest', 'event', 'shop', 'craft', 'daily_reward']
  }],
  isCraftable: { type: Boolean, default: false }, // Có thể craft không
  craftingRecipe: [{ // Recipe để craft item này
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    quantity: { type: Number, required: true }
  }],
  craftingLevel: { type: Number, default: 0 }, // Level crafting yêu cầu
  
  // Enhancement system
  enhancementLevel: { type: Number, default: 0 }, // Level enhancement hiện tại
  maxEnhancementLevel: { type: Number, default: 0 }, // Level enhancement tối đa
  enhancementSuccessRate: { type: Number, default: 100 }, // Tỷ lệ thành công enhancement
  
  // Durability system (cho equipment)
  durability: { type: Number, default: 100 }, // Độ bền hiện tại
  maxDurability: { type: Number, default: 100 }, // Độ bền tối đa
  durabilityLoss: { type: Number, default: 0 }, // Độ bền mất mỗi lần sử dụng
  
  // Cooldown system
  cooldown: { type: Number, default: 0 }, // Cooldown sử dụng (giây)
  globalCooldown: { type: Number, default: 0 }, // Global cooldown (giây)
  
  // Trạng thái
  isActive: { type: Boolean, default: true },
  isStarter: { type: Boolean, default: false }, // Item khởi đầu
  isLimited: { type: Boolean, default: false }, // Item giới hạn
  isEvent: { type: Boolean, default: false }, // Item sự kiện
  isPremium: { type: Boolean, default: false }, // Item premium
  
  // Metadata
  tags: [{ type: String }], // Tags để phân loại
  category: { type: String, default: 'general' }, // Category chính
  
  // Thời gian
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null } // Thời gian hết hạn (cho event items)
});

// Middleware để cập nhật updatedAt
itemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
itemSchema.index({ type: 1, subType: 1 });
itemSchema.index({ rarity: 1 });
itemSchema.index({ isActive: 1 });
itemSchema.index({ 'properties.skillMaterial.materialType': 1 });
itemSchema.index({ 'properties.equipment.slot': 1 });
itemSchema.index({ 'properties.questItem.questId': 1 });
itemSchema.index({ tags: 1 });
itemSchema.index({ category: 1 });

// Virtual để lấy rarity info
itemSchema.virtual('rarityInfo', {
  ref: 'Rarity',
  localField: 'rarity',
  foreignField: '_id',
  justOne: true
});

// ==================== METHODS ====================

/**
 * Kiểm tra xem item có thể sử dụng không
 */
itemSchema.methods.canUse = function(userLevel = 0, userClass = null, userElement = null) {
  if (!this.isUsable) return { canUse: false, reason: 'Item không thể sử dụng' };
  
  // Equipment không thể sử dụng trực tiếp, chỉ có thể trang bị
  if (this.type === 'equipment') return { canUse: false, reason: 'Equipment không thể sử dụng trực tiếp, hãy trang bị cho pet' };
  
  if (userLevel < this.levelRequirement) return { canUse: false, reason: `Cần level ${this.levelRequirement}` };
  if (this.classRequirement && userClass !== this.classRequirement) return { canUse: false, reason: `Cần class ${this.classRequirement}` };
  if (this.elementRequirement && userElement !== this.elementRequirement) return { canUse: false, reason: `Cần element ${this.elementRequirement}` };
  return { canUse: true };
};

/**
 * Kiểm tra xem item có thể trang bị không (chỉ pet mới trang bị được)
 */
itemSchema.methods.canEquip = function(petLevel = 0, petClass = null) {
  if (!this.isEquippable) return { canEquip: false, reason: 'Item không thể trang bị' };
  if (this.type !== 'equipment') return { canEquip: false, reason: 'Chỉ equipment mới có thể trang bị' };
  if (petLevel < this.levelRequirement) return { canEquip: false, reason: `Pet cần level ${this.levelRequirement}` };
  if (this.classRequirement && petClass !== this.classRequirement) return { canEquip: false, reason: `Cần class ${this.classRequirement}` };
  return { canEquip: true };
};

/**
 * Lấy giá bán thực tế
 */
itemSchema.methods.getActualSellPrice = function() {
  return this.sellPrice || Math.floor(this.basePrice * 0.5);
};

/**
 * Kiểm tra xem item có thể enhance không
 */
itemSchema.methods.canEnhance = function() {
  if (this.maxEnhancementLevel <= 0) return { canEnhance: false, reason: 'Item không thể enhance' };
  if (this.enhancementLevel >= this.maxEnhancementLevel) return { canEnhance: false, reason: 'Đã đạt level enhance tối đa' };
  return { canEnhance: true };
};

/**
 * Kiểm tra xem item có thể repair không
 */
itemSchema.methods.canRepair = function() {
  if (this.type !== 'equipment') return { canRepair: false, reason: 'Chỉ equipment mới có thể repair' };
  if (this.durability >= this.maxDurability) return { canRepair: false, reason: 'Item không cần repair' };
  return { canRepair: true };
};

/**
 * Kiểm tra xem item có phải là skill material không
 */
itemSchema.methods.isSkillMaterial = function() {
  return this.type === 'material' && this.subType === 'skill_material';
};

/**
 * Kiểm tra xem item có phải là exp item không
 */
itemSchema.methods.isExpItem = function() {
  return this.type === 'consumable' && this.subType === 'exp_item';
};

/**
 * Kiểm tra xem item có phải là equipment không
 */
itemSchema.methods.isEquipment = function() {
  return this.type === 'equipment';
};

/**
 * Kiểm tra xem item có phải là currency không
 */
itemSchema.methods.isCurrency = function() {
  return this.type === 'currency';
};

/**
 * Kiểm tra xem item có phải là quest item không
 */
itemSchema.methods.isQuestItem = function() {
  return this.type === 'quest';
};

/**
 * Lấy thông tin enhancement
 */
itemSchema.methods.getEnhancementInfo = function() {
  if (this.maxEnhancementLevel <= 0) return null;
  
  return {
    currentLevel: this.enhancementLevel,
    maxLevel: this.maxEnhancementLevel,
    successRate: this.enhancementSuccessRate,
    canEnhance: this.enhancementLevel < this.maxEnhancementLevel
  };
};

/**
 * Lấy thông tin durability
 */
itemSchema.methods.getDurabilityInfo = function() {
  if (this.type !== 'equipment') return null;
  
  return {
    current: this.durability,
    max: this.maxDurability,
    percentage: Math.floor((this.durability / this.maxDurability) * 100),
    needsRepair: this.durability < this.maxDurability
  };
};

/**
 * Lấy thông tin đầy đủ của item
 */
itemSchema.methods.getFullInfo = function() {
  return {
    _id: this._id,
    name: this.name,
    displayName: this.displayName,
    description: this.description,
    icon: this.icon,
    type: this.type,
    subType: this.subType,
    rarity: this.rarity,
    properties: this.properties,
    basePrice: this.basePrice,
    sellPrice: this.sellPrice,
    buyPrice: this.buyPrice,
    maxStack: this.maxStack,
    isStackable: this.isStackable,
    isTradeable: this.isTradeable,
    isUsable: this.isUsable,
    isEquippable: this.isEquippable,
    levelRequirement: this.levelRequirement,
    dropRate: this.dropRate,
    isCraftable: this.isCraftable,
    enhancementLevel: this.enhancementLevel,
    maxEnhancementLevel: this.maxEnhancementLevel,
    durability: this.durability,
    maxDurability: this.maxDurability,
    cooldown: this.cooldown,
    isActive: this.isActive,
    tags: this.tags,
    category: this.category,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Lấy thông tin ngắn gọn cho inventory
 */
itemSchema.methods.getInventoryInfo = function() {
  return {
    _id: this._id,
    name: this.name,
    displayName: this.displayName,
    icon: this.icon,
    type: this.type,
    subType: this.subType,
    rarity: this.rarity,
    maxStack: this.maxStack,
    isStackable: this.isStackable,
    isUsable: this.isUsable,
    isEquippable: this.isEquippable,
    levelRequirement: this.levelRequirement,
    basePrice: this.basePrice,
    sellPrice: this.sellPrice
  };
};

// Set virtuals khi convert to JSON
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema); 