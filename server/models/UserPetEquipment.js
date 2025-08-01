const mongoose = require('mongoose');

const userPetEquipmentSchema = new mongoose.Schema({
  // UserPet sở hữu equipment
  userPet: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserPet', 
    required: true 
  },
  
  // Item equipment
  item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item', 
    required: true 
  },
  
  // Slot trang bị
  slot: { 
    type: String,
    enum: ['weapon', 'armor', 'accessory1', 'accessory2', 'accessory3'],
    required: true 
  },
  
  // Độ bền hiện tại
  durability: { 
    type: Number, 
    default: 100,
    min: 0,
    max: 100 
  },
  
  // Enhancement level
  enhancementLevel: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  
  // Thời gian trang bị
  equippedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Thông tin bổ sung
  metadata: {
    // Additional stats từ enhancement
    additionalStats: {
      hp: { type: Number, default: 0 },
      attack: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      evasion: { type: Number, default: 0 },
      criticalRate: { type: Number, default: 0 },
      criticalDamage: { type: Number, default: 0 }
    },
    // Source info
    source: { 
      type: String,
      enum: ['drop', 'craft', 'quest', 'purchase', 'gift', 'event'],
      default: 'drop'
    }
  },
  
  // Thời gian
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware để cập nhật updatedAt
userPetEquipmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
userPetEquipmentSchema.index({ userPet: 1, slot: 1 }, { unique: true });
userPetEquipmentSchema.index({ userPet: 1, item: 1 });
userPetEquipmentSchema.index({ durability: 1 });

// Virtual để lấy item info
userPetEquipmentSchema.virtual('itemInfo', {
  ref: 'Item',
  localField: 'item',
  foreignField: '_id',
  justOne: true
});

// ==================== METHODS ====================

/**
 * Kiểm tra xem equipment có thể trang bị không
 */
userPetEquipmentSchema.methods.canEquip = async function(userPetLevel = 0) {
  await this.populate('itemInfo');
  if (!this.itemInfo) return { canEquip: false, reason: 'Item không tồn tại' };
  
  // Kiểm tra độ bền
  if (this.durability <= 0) {
    return { canEquip: false, reason: 'Equipment đã hết độ bền' };
  }
  
  // Sử dụng method từ Item model
  return this.itemInfo.canEquip(userPetLevel);
};

/**
 * Trang bị equipment
 */
userPetEquipmentSchema.methods.equip = async function(userPetLevel = 0) {
  const canEquipResult = await this.canEquip(userPetLevel);
  if (!canEquipResult.canEquip) {
    throw new Error(canEquipResult.reason);
  }
  
  this.equippedAt = new Date();
  await this.save();
  
  return { equipped: true, slot: this.slot };
};

/**
 * Tháo trang bị
 */
userPetEquipmentSchema.methods.unequip = async function() {
  await this.deleteOne();
  return { unequipped: true, slot: this.slot };
};

/**
 * Repair equipment
 */
userPetEquipmentSchema.methods.repair = async function(repairAmount = 100) {
  await this.populate('itemInfo');
  if (!this.itemInfo.isEquipment()) {
    throw new Error('Chỉ có thể repair equipment');
  }
  
  this.durability = Math.min(this.itemInfo.maxDurability || 100, this.durability + repairAmount);
  await this.save();
  
  return { durability: this.durability };
};

/**
 * Enhance equipment
 */
userPetEquipmentSchema.methods.enhance = async function() {
  await this.populate('itemInfo');
  if (!this.itemInfo.isEquipment()) {
    throw new Error('Chỉ có thể enhance equipment');
  }
  
  const canEnhanceResult = this.itemInfo.canEnhance();
  if (!canEnhanceResult.canEnhance) {
    throw new Error(canEnhanceResult.reason);
  }
  
  this.enhancementLevel += 1;
  
  // Cập nhật additional stats từ enhancement
  this.updateEnhancementStats();
  
  await this.save();
  
  return { enhancementLevel: this.enhancementLevel };
};

/**
 * Cập nhật stats từ enhancement
 */
userPetEquipmentSchema.methods.updateEnhancementStats = function() {
  if (!this.itemInfo || !this.itemInfo.properties.equipment) return;
  
  const baseStats = this.itemInfo.properties.equipment.stats;
  const enhancementMultiplier = 1 + (this.enhancementLevel * 0.1); // +10% mỗi level
  
  this.metadata.additionalStats = {
    hp: Math.floor(baseStats.hp * enhancementMultiplier),
    attack: Math.floor(baseStats.attack * enhancementMultiplier),
    defense: Math.floor(baseStats.defense * enhancementMultiplier),
    speed: Math.floor(baseStats.speed * enhancementMultiplier),
    accuracy: Math.floor(baseStats.accuracy * enhancementMultiplier),
    evasion: Math.floor(baseStats.evasion * enhancementMultiplier),
    criticalRate: Math.floor(baseStats.criticalRate * enhancementMultiplier),
    criticalDamage: Math.floor(baseStats.criticalDamage * enhancementMultiplier)
  };
};

/**
 * Lấy tổng stats từ equipment
 */
userPetEquipmentSchema.methods.getTotalStats = async function() {
  await this.populate('itemInfo');
  if (!this.itemInfo || !this.itemInfo.properties.equipment) {
    return {
      hp: 0, attack: 0, defense: 0, speed: 0,
      accuracy: 0, evasion: 0, criticalRate: 0, criticalDamage: 0
    };
  }
  
  const baseStats = this.itemInfo.properties.equipment.stats;
  const additionalStats = this.metadata.additionalStats || {};
  
  return {
    hp: (baseStats.hp || 0) + (additionalStats.hp || 0),
    attack: (baseStats.attack || 0) + (additionalStats.attack || 0),
    defense: (baseStats.defense || 0) + (additionalStats.defense || 0),
    speed: (baseStats.speed || 0) + (additionalStats.speed || 0),
    accuracy: (baseStats.accuracy || 0) + (additionalStats.accuracy || 0),
    evasion: (baseStats.evasion || 0) + (additionalStats.evasion || 0),
    criticalRate: (baseStats.criticalRate || 0) + (additionalStats.criticalRate || 0),
    criticalDamage: (baseStats.criticalDamage || 0) + (additionalStats.criticalDamage || 0)
  };
};

/**
 * Lấy thông tin đầy đủ của equipment
 */
userPetEquipmentSchema.methods.getFullInfo = async function() {
  await this.populate('itemInfo');
  
  return {
    _id: this._id,
    userPet: this.userPet,
    item: this.itemInfo,
    slot: this.slot,
    durability: this.durability,
    enhancementLevel: this.enhancementLevel,
    equippedAt: this.equippedAt,
    metadata: this.metadata,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// ==================== STATIC METHODS ====================

/**
 * Lấy tất cả equipment của một pet
 */
userPetEquipmentSchema.statics.getPetEquipment = async function(userPetId) {
  return await this.find({ userPet: userPetId })
    .populate({
      path: 'itemInfo',
      populate: { path: 'rarityInfo' }
    })
    .sort({ slot: 1 });
};

/**
 * Lấy equipment theo slot
 */
userPetEquipmentSchema.statics.getEquipmentBySlot = async function(userPetId, slot) {
  return await this.findOne({ userPet: userPetId, slot: slot })
    .populate({
      path: 'itemInfo',
      populate: { path: 'rarityInfo' }
    });
};

/**
 * Trang bị equipment cho pet
 */
userPetEquipmentSchema.statics.equipItem = async function(userPetId, itemId, slot, userPetLevel = 0) {
  // Kiểm tra slot đã có equipment chưa
  const existingEquipment = await this.findOne({ userPet: userPetId, slot: slot });
  if (existingEquipment) {
    throw new Error(`Slot ${slot} đã có equipment`);
  }
  
  // Tạo equipment mới
  const equipment = new this({
    userPet: userPetId,
    item: itemId,
    slot: slot
  });
  
  await equipment.equip(userPetLevel);
  return equipment;
};

/**
 * Tháo equipment khỏi pet
 */
userPetEquipmentSchema.statics.unequipItem = async function(userPetId, slot) {
  const equipment = await this.findOne({ userPet: userPetId, slot: slot });
  if (!equipment) {
    throw new Error(`Không tìm thấy equipment ở slot ${slot}`);
  }
  
  return await equipment.unequip();
};

/**
 * Lấy tổng stats từ tất cả equipment của pet
 */
userPetEquipmentSchema.statics.getPetTotalEquipmentStats = async function(userPetId) {
  const equipments = await this.find({ userPet: userPetId });
  
  const totalStats = {
    hp: 0, attack: 0, defense: 0, speed: 0,
    accuracy: 0, evasion: 0, criticalRate: 0, criticalDamage: 0
  };
  
  for (const equipment of equipments) {
    const stats = await equipment.getTotalStats();
    totalStats.hp += stats.hp;
    totalStats.attack += stats.attack;
    totalStats.defense += stats.defense;
    totalStats.speed += stats.speed;
    totalStats.accuracy += stats.accuracy;
    totalStats.evasion += stats.evasion;
    totalStats.criticalRate += stats.criticalRate;
    totalStats.criticalDamage += stats.criticalDamage;
  }
  
  return totalStats;
};

// Set virtuals khi convert to JSON
userPetEquipmentSchema.set('toJSON', { virtuals: true });
userPetEquipmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserPetEquipment', userPetEquipmentSchema); 