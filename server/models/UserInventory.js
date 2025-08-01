const mongoose = require('mongoose');

const userInventorySchema = new mongoose.Schema({
  // User sở hữu inventory
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Item trong inventory
  item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item', 
    required: true 
  },
  
  // Số lượng item
  quantity: { 
    type: Number, 
    default: 1, 
    min: 1 
  },
  
  // Thời gian hết hạn (cho special items)
  expiresAt: { 
    type: Date, 
    default: null 
  },
  
  // Thời gian sử dụng lần cuối
  lastUsed: { 
    type: Date, 
    default: null 
  },
  
  // Thông tin bổ sung
  metadata: {
    // Cho materials - source info
    source: { 
      type: String,
      enum: ['drop', 'craft', 'quest', 'purchase', 'gift', 'event'],
      default: 'drop'
    },
    // Cho consumables - custom effects
    customEffects: [{ 
      effect: String,
      value: Number,
      duration: Number
    }],
    // Cho quest items
    questProgress: {
      questId: String,
      progress: Number,
      completed: Boolean
    }
  },
  
  // Thời gian
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware để cập nhật updatedAt
userInventorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
userInventorySchema.index({ user: 1, item: 1 }, { unique: true });
userInventorySchema.index({ expiresAt: 1 });
userInventorySchema.index({ 'metadata.source': 1 });

// Virtual để lấy item info
userInventorySchema.virtual('itemInfo', {
  ref: 'Item',
  localField: 'item',
  foreignField: '_id',
  justOne: true
});

// ==================== METHODS ====================

/**
 * Kiểm tra xem item có thể sử dụng không
 */
userInventorySchema.methods.canUse = async function(userLevel = 0) {
  await this.populate('itemInfo');
  if (!this.itemInfo) return { canUse: false, reason: 'Item không tồn tại' };
  
  // Kiểm tra hết hạn
  if (this.expiresAt && new Date() > this.expiresAt) {
    return { canUse: false, reason: 'Item đã hết hạn' };
  }
  
  // Sử dụng method từ Item model
  return this.itemInfo.canUse(userLevel);
};

/**
 * Sử dụng item
 */
userInventorySchema.methods.use = async function(userLevel = 0) {
  const canUseResult = await this.canUse(userLevel);
  if (!canUseResult.canUse) {
    throw new Error(canUseResult.reason);
  }
  
  // Xử lý theo loại item
  if (this.itemInfo.isExpItem()) {
    return await this.useExpItem();
  } else if (this.itemInfo.subType === 'heal_item') {
    return await this.useHealItem();
  } else if (this.itemInfo.subType === 'buff_item') {
    return await this.useBuffItem();
  } else if (this.itemInfo.subType === 'teleport_item') {
    return await this.useTeleportItem();
  }
  
  // Giảm số lượng nếu item không phải equipment
  if (!this.itemInfo.isEquippable) {
    this.quantity -= 1;
    if (this.quantity <= 0) {
      await this.deleteOne();
      return { consumed: true, effect: 'Item đã được sử dụng' };
    }
  }
  
  this.lastUsed = new Date();
  await this.save();
  
  return { 
    consumed: this.quantity <= 0,
    remainingQuantity: this.quantity,
    effect: 'Item đã được sử dụng'
  };
};

/**
 * Sử dụng EXP item
 */
userInventorySchema.methods.useExpItem = async function() {
  const expValue = this.itemInfo.properties.expItem.expValue;
  this.quantity -= 1;
  
  if (this.quantity <= 0) {
    await this.deleteOne();
  } else {
    await this.save();
  }
  
  return {
    consumed: true,
    effect: `Tăng ${expValue} EXP`,
    expValue: expValue
  };
};

/**
 * Sử dụng heal item
 */
userInventorySchema.methods.useHealItem = async function() {
  const healProps = this.itemInfo.properties.healItem;
  this.quantity -= 1;
  
  if (this.quantity <= 0) {
    await this.deleteOne();
  } else {
    await this.save();
  }
  
  return {
    consumed: true,
    effect: `Hồi ${healProps.healValue}${healProps.healPercentage ? '%' : ''} HP`,
    healValue: healProps.healValue,
    healPercentage: healProps.healPercentage,
    targetType: healProps.targetType
  };
};

/**
 * Sử dụng buff item
 */
userInventorySchema.methods.useBuffItem = async function() {
  const buffProps = this.itemInfo.properties.buffItem;
  this.quantity -= 1;
  
  if (this.quantity <= 0) {
    await this.deleteOne();
  } else {
    await this.save();
  }
  
  return {
    consumed: true,
    effect: `Tăng ${buffProps.buffValue}${buffProps.buffPercentage ? '%' : ''} ${buffProps.buffType} trong ${buffProps.buffDuration} phút`,
    buffType: buffProps.buffType,
    buffValue: buffProps.buffValue,
    buffDuration: buffProps.buffDuration
  };
};

/**
 * Sử dụng teleport item
 */
userInventorySchema.methods.useTeleportItem = async function() {
  this.quantity -= 1;
  
  if (this.quantity <= 0) {
    await this.deleteOne();
  } else {
    await this.save();
  }
  
  return {
    consumed: true,
    effect: 'Dịch chuyển thành công',
    teleportType: this.itemInfo.properties.specialItem.effectType
  };
};

/**
 * Kiểm tra xem item có phải là skill material không
 */
userInventorySchema.methods.isSkillMaterial = async function() {
  await this.populate('itemInfo');
  return this.itemInfo ? this.itemInfo.isSkillMaterial() : false;
};

/**
 * Kiểm tra xem item có phải là exp item không
 */
userInventorySchema.methods.isExpItem = async function() {
  await this.populate('itemInfo');
  return this.itemInfo ? this.itemInfo.isExpItem() : false;
};

/**
 * Lấy thông tin đầy đủ của inventory item
 */
userInventorySchema.methods.getFullInfo = async function() {
  await this.populate('itemInfo');
  
  return {
    _id: this._id,
    user: this.user,
    item: this.itemInfo,
    quantity: this.quantity,
    expiresAt: this.expiresAt,
    lastUsed: this.lastUsed,
    metadata: this.metadata,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// ==================== STATIC METHODS ====================

/**
 * Lấy inventory của user
 */
userInventorySchema.statics.getUserInventory = async function(userId, options = {}) {
  const query = { user: userId };
  
  // Filter theo type
  if (options.type) {
    query['itemInfo.type'] = options.type;
  }
  
  // Filter theo subType
  if (options.subType) {
    query['itemInfo.subType'] = options.subType;
  }
  
  return await this.find(query)
    .populate({
      path: 'itemInfo',
      populate: { path: 'rarityInfo' }
    })
    .sort({ createdAt: -1 });
};

/**
 * Thêm item vào inventory
 */
userInventorySchema.statics.addItem = async function(userId, itemId, quantity = 1, metadata = {}) {
  // Kiểm tra xem user đã có item này chưa
  let userItem = await this.findOne({ user: userId, item: itemId });
  
  if (userItem) {
    // Nếu đã có, tăng số lượng
    userItem.quantity += quantity;
    userItem.metadata = { ...userItem.metadata, ...metadata };
    await userItem.save();
    return userItem;
  } else {
    // Nếu chưa có, tạo mới
    userItem = new this({
      user: userId,
      item: itemId,
      quantity: quantity,
      metadata: metadata
    });
    await userItem.save();
    return userItem;
  }
};

/**
 * Remove item khỏi inventory
 */
userInventorySchema.statics.removeItem = async function(userId, itemId, quantity = 1) {
  const userItem = await this.findOne({ user: userId, item: itemId });
  
  if (!userItem) {
    throw new Error('Item không tồn tại trong inventory');
  }
  
  if (userItem.quantity < quantity) {
    throw new Error('Số lượng item không đủ');
  }
  
  userItem.quantity -= quantity;
  
  if (userItem.quantity <= 0) {
    await userItem.deleteOne();
    return { removed: true, remainingQuantity: 0 };
  }
  
  await userItem.save();
  return { removed: true, remainingQuantity: userItem.quantity };
};

/**
 * Lấy skill materials của user
 */
userInventorySchema.statics.getSkillMaterials = async function(userId) {
  return await this.find({ user: userId })
    .populate({
      path: 'itemInfo',
      match: { type: 'material', subType: 'skill_material' }
    })
    .then(items => items.filter(item => item.itemInfo));
};

/**
 * Lấy exp items của user
 */
userInventorySchema.statics.getExpItems = async function(userId) {
  return await this.find({ user: userId })
    .populate({
      path: 'itemInfo',
      match: { type: 'consumable', subType: 'exp_item' }
    })
    .then(items => items.filter(item => item.itemInfo));
};

// Set virtuals khi convert to JSON
userInventorySchema.set('toJSON', { virtuals: true });
userInventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserInventory', userInventorySchema); 