const mongoose = require('mongoose');

/**
 * Formation Model - Quản lý team battle của user
 * Mỗi user có thể có nhiều formation, nhưng chỉ 1 formation active
 * Formation chứa tối đa 5 pets với vị trí cụ thể
 */
const formationSchema = new mongoose.Schema({
  // User sở hữu formation
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // Trạng thái formation
  isActive: { 
    type: Boolean, 
    default: false 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  
  // Formation slots (tối đa 5 pets)
  slots: [{
    position: { type: Number, required: true, min: 1, max: 9 },
    userPet: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPet', required: true }
  }],
  
  // Formation stats (tính toán động)
  totalCombatPower: { 
    type: Number, 
    default: 0 
  },
  totalPets: { 
    type: Number, 
    default: 0 
  },
  
  // Formation type và metadata
  formationType: { 
    type: String, 
    enum: ['pvp', 'pve', 'boss', 'arena', 'general'],
    default: 'general'
  },
  
  // Formation description
  description: { 
    type: String, 
    maxlength: 200,
    default: ''
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

// Index để tối ưu truy vấn
formationSchema.index({ user: 1, isActive: 1 });
formationSchema.index({ user: 1, isDefault: 1 });
formationSchema.index({ user: 1, formationType: 1 });
formationSchema.index({ 'slots.userPet': 1 });

// ==================== VALIDATION ====================

/**
 * Validate formation slots
 */
formationSchema.pre('save', async function(next) {
  // Validate slots
  if (this.slots.length > 5) {
    return next(new Error('Formation không thể có quá 5 pets'));
  }
  
  // Validate positions are unique
  const positions = this.slots.map(slot => slot.position);
  const uniquePositions = [...new Set(positions)];
  if (positions.length !== uniquePositions.length) {
    return next(new Error('Vị trí trong formation phải unique'));
  }
  
  // Validate positions are within valid range (1-5)
  if (positions.length > 0) {
    const invalidPositions = positions.filter(pos => pos < 1 || pos > 5);
    if (invalidPositions.length > 0) {
      return next(new Error('Vị trí formation phải từ 1-5'));
    }
  }
  
  // Validate leader logic (position 1 is always leader)
  const position1Slot = this.slots.find(slot => slot.position === 1);
  if (position1Slot) {
    // Position 1 exists, it's automatically the leader
    // No need to validate isLeader field since it's removed
  }
  
  // Update timestamps
  this.updatedAt = new Date();
  
  next();
});

// ==================== METHODS ====================

/**
 * Tính toán formation stats
 */
formationSchema.methods.calculateFormationStats = async function() {
  if (this.slots.length === 0) {
    this.totalCombatPower = 0;
    this.averageLevel = 0;
    this.totalPets = 0;
    return;
  }
  
  // Populate userPet để lấy thông tin
  await this.populate('slots.userPet');
  
  let totalCP = 0;
  let totalLevel = 0;
  let validPets = 0;
  
  for (const slot of this.slots) {
    if (slot.userPet) {
      // Recalculate stats cho userPet
      await slot.userPet.calculateActualStats();
      await slot.userPet.calculateCombatPower();
      
      totalCP += slot.userPet.actualCombatPower || 0;
      totalLevel += slot.userPet.level || 1;
      validPets++;
    }
  }
  
  this.totalCombatPower = totalCP;
  this.totalPets = validPets;
  
  return {
    totalCombatPower: this.totalCombatPower,
    totalPets: this.totalPets
  };
};

/**
 * Thêm pet vào formation
 */
formationSchema.methods.addPetToFormation = async function(userPetId, position) {
  // Validate position
  if (position < 1 || position > 5) {
    throw new Error('Vị trí phải từ 1-5');
  }
  
  // Check if position is already occupied
  const existingSlot = this.slots.find(slot => slot.position === position);
  if (existingSlot) {
    throw new Error(`Vị trí ${position} đã có pet`);
  }
  
  // Check if formation is full
  if (this.slots.length >= 5) {
    throw new Error('Formation đã đầy (tối đa 5 pets)');
  }
  
  // Validate userPet exists and belongs to this user
  const UserPet = require('./UserPet');
  const userPet = await UserPet.findOne({ 
    _id: userPetId, 
    user: this.user 
  });
  
  if (!userPet) {
    throw new Error('Pet không tồn tại hoặc không thuộc về user này');
  }
  
  // Check if pet is in bag
  if (userPet.location !== 'bag') {
    throw new Error('Pet phải ở trong bag để có thể vào formation');
  }
  
  // Check if pet is already in another formation
  const Formation = require('./Formation');
  const existingFormation = await Formation.findOne({
    user: this.user,
    'slots.userPet': userPetId,
    _id: { $ne: this._id }
  });
  
  if (existingFormation) {
    throw new Error('Pet đã có trong formation khác');
  }
  
  // Add pet to formation
  const newSlot = {
    position: position,
    userPet: userPetId
  };
  
  this.slots.push(newSlot);
  
  // Move pet to formation location
  userPet.location = 'formation';
  await userPet.save();
  
  // Recalculate formation stats
  await this.calculateFormationStats();
  
  return newSlot;
};

/**
 * Xóa pet khỏi formation
 */
formationSchema.methods.removePetFromFormation = async function(position) {
  const slotIndex = this.slots.findIndex(slot => slot.position === position);
  if (slotIndex === -1) {
    throw new Error(`Không có pet ở vị trí ${position}`);
  }
  
  const slot = this.slots[slotIndex];
  
  // Move pet back to bag
  const UserPet = require('./UserPet');
  const userPet = await UserPet.findById(slot.userPet);
  if (userPet) {
    userPet.location = 'bag';
    await userPet.save();
  }
  
  // Remove slot
  this.slots.splice(slotIndex, 1);
  
  // Recalculate formation stats
  await this.calculateFormationStats();
  
  return slot;
};

/**
 * Di chuyển pet trong formation
 */
formationSchema.methods.movePetInFormation = async function(fromPosition, toPosition) {
  if (fromPosition === toPosition) {
    throw new Error('Vị trí nguồn và đích phải khác nhau');
  }
  
  const fromSlotIndex = this.slots.findIndex(slot => slot.position === fromPosition);
  const toSlotIndex = this.slots.findIndex(slot => slot.position === toPosition);
  
  if (fromSlotIndex === -1) {
    throw new Error(`Không có pet ở vị trí ${fromPosition}`);
  }
  
  if (toSlotIndex !== -1) {
    throw new Error(`Vị trí ${toPosition} đã có pet`);
  }
  
  // Swap positions
  this.slots[fromSlotIndex].position = toPosition;
  
  // Recalculate formation stats
  await this.calculateFormationStats();
  
  return this.slots[fromSlotIndex];
};

/**
 * Set formation as active
 */
formationSchema.methods.setActive = async function() {
  // Deactivate all other formations for this user
  const Formation = require('./Formation');
  await Formation.updateMany(
    { user: this.user, _id: { $ne: this._id } },
    { isActive: false }
  );
  
  // Activate this formation
  this.isActive = true;
  await this.save();
  
  return this;
};

/**
 * Lấy thông tin đầy đủ của formation
 */
formationSchema.methods.getFullInfo = async function() {
  await this.populate('slots.userPet');
  
  // Populate pet information for each slot
  for (const slot of this.slots) {
    if (slot.userPet) {
      await slot.userPet.populate('pet');
      await slot.userPet.pet.populate('element rarity');
    }
  }
  
  return {
    _id: this._id,
    user: this.user,
    isActive: this.isActive,
    isDefault: this.isDefault,
    formationType: this.formationType,
    description: this.description,
    slots: this.slots,
    totalCombatPower: this.totalCombatPower,
    totalPets: this.totalPets,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Lấy thông tin tóm tắt của formation
 */
formationSchema.methods.getSummary = async function() {
  return {
    _id: this._id,
    isActive: this.isActive,
    isDefault: this.isDefault,
    formationType: this.formationType,
    totalCombatPower: this.totalCombatPower,
    totalPets: this.totalPets
  };
};

// ==================== STATIC METHODS ====================

/**
 * Tạo formation mặc định cho user
 */
formationSchema.statics.createDefaultFormation = async function(userId) {
  const formation = new this({
    user: userId,
    isActive: true,
    isDefault: true,
    formationType: 'general',
    description: 'Formation mặc định khi bắt đầu game',
    slots: []
  });
  
  await formation.save();
  return formation;
};

/**
 * Lấy formation active của user
 */
formationSchema.statics.getActiveFormation = async function(userId) {
  return await this.findOne({ user: userId, isActive: true });
};

/**
 * Lấy tất cả formation của user
 */
formationSchema.statics.getUserFormations = async function(userId) {
  return await this.find({ user: userId }).sort({ isActive: -1, createdAt: -1 });
};

/**
 * Kiểm tra user có formation active không
 */
formationSchema.statics.hasActiveFormation = async function(userId) {
  const count = await this.countDocuments({ user: userId, isActive: true });
  return count > 0;
};

/**
 * Lấy formation theo type
 */
formationSchema.statics.getFormationsByType = async function(userId, formationType) {
  return await this.find({ user: userId, formationType: formationType });
};

module.exports = mongoose.model('Formation', formationSchema); 