const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, default: 'Đội hình 1' }, // Tên đội hình
  pets: [{
    userPet: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPet', required: true },
    position: { type: Number, required: true, min: 1, max: 5 }, // Vị trí trong đội hình (1-5)
    isActive: { type: Boolean, default: true } // Pet có được sử dụng trong đội hình không
  }],
  totalCombatPower: { type: Number, default: 0 }, // Tổng lực chiến của đội hình
  isActive: { type: Boolean, default: false }, // Đội hình đang được sử dụng
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method để tính toán tổng lực chiến của đội hình
formationSchema.methods.calculateTotalCombatPower = async function() {
  let totalPower = 0;
  
  for (let petSlot of this.pets) {
    if (petSlot.isActive) {
      // Populate thông tin userPet để lấy combatPower
      await this.populate('pets.userPet');
      const userPet = petSlot.userPet;
      if (userPet && userPet.combatPower) {
        totalPower += userPet.combatPower;
      }
    }
  }
  
  this.totalCombatPower = totalPower;
  return totalPower;
};

// Method để kiểm tra xem đội hình có hợp lệ không
formationSchema.methods.isValid = function() {
  // Kiểm tra số lượng pet active không vượt quá 5
  const activePets = this.pets.filter(pet => pet.isActive);
  if (activePets.length > 5) {
    return false;
  }
  
  // Kiểm tra vị trí không trùng lặp
  const positions = activePets.map(pet => pet.position);
  const uniquePositions = [...new Set(positions)];
  if (positions.length !== uniquePositions.length) {
    return false;
  }
  
  return true;
};

// Method để thêm pet vào đội hình
formationSchema.methods.addPet = function(userPetId, position) {
  // Kiểm tra vị trí hợp lệ
  if (position < 1 || position > 5) {
    throw new Error('Vị trí phải từ 1 đến 5');
  }
  
  // Kiểm tra vị trí đã có pet chưa
  const existingPet = this.pets.find(pet => pet.position === position && pet.isActive);
  if (existingPet) {
    throw new Error(`Vị trí ${position} đã có pet`);
  }
  
  // Kiểm tra số lượng pet không vượt quá 5
  const activePets = this.pets.filter(pet => pet.isActive);
  if (activePets.length >= 5) {
    throw new Error('Đội hình đã đầy (tối đa 5 pet)');
  }
  
  // Thêm pet vào đội hình
  this.pets.push({
    userPet: userPetId,
    position: position,
    isActive: true
  });
  
  return this;
};

// Method để xóa pet khỏi đội hình
formationSchema.methods.removePet = function(position) {
  const petIndex = this.pets.findIndex(pet => pet.position === position && pet.isActive);
  if (petIndex === -1) {
    throw new Error(`Không tìm thấy pet ở vị trí ${position}`);
  }
  
  this.pets[petIndex].isActive = false;
  return this;
};

// Method để thay đổi vị trí pet
formationSchema.methods.movePet = function(fromPosition, toPosition) {
  if (fromPosition < 1 || fromPosition > 5 || toPosition < 1 || toPosition > 5) {
    throw new Error('Vị trí phải từ 1 đến 5');
  }
  
  const fromPet = this.pets.find(pet => pet.position === fromPosition && pet.isActive);
  const toPet = this.pets.find(pet => pet.position === toPosition && pet.isActive);
  
  if (!fromPet) {
    throw new Error(`Không tìm thấy pet ở vị trí ${fromPosition}`);
  }
  
  if (toPet) {
    // Hoán đổi vị trí
    fromPet.position = toPosition;
    toPet.position = fromPosition;
  } else {
    // Di chuyển đến vị trí trống
    fromPet.position = toPosition;
  }
  
  return this;
};

// Pre-save middleware để tự động tính toán lực chiến
formationSchema.pre('save', async function(next) {
  if (this.isModified('pets')) {
    await this.calculateTotalCombatPower();
  }
  this.updatedAt = new Date();
  next();
});

// Index để tối ưu truy vấn
formationSchema.index({ user: 1, isActive: 1 });
formationSchema.index({ user: 1, name: 1 });

module.exports = mongoose.model('Formation', formationSchema); 