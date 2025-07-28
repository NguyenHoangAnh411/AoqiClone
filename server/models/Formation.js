const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, default: 'Đội hình 1' }, // Tên đội hình
  pets: [{
    userPet: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPet', required: true },
    position: { type: Number, required: true, min: 1, max: 9 }, // Vị trí trong đội hình (1-9)
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
  
  // Chỉ populate nếu cần thiết
  if (!this.pets.some(pet => pet.userPet && typeof pet.userPet === 'object' && pet.userPet.actualCombatPower === undefined)) {
    await this.populate({
      path: 'pets.userPet',
      populate: {
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' }
        ]
      }
    });
  }
  
  for (let petSlot of this.pets) {
    if (petSlot.isActive && petSlot.userPet) {
      const userPet = petSlot.userPet;
      
      // Sử dụng actualCombatPower đã có nếu có
      if (userPet.actualCombatPower) {
        totalPower += userPet.actualCombatPower;
        continue;
      }
      
      // Chỉ tính toán nếu thực sự cần thiết
      if (userPet.pet) {
        const { calculateActualCombatPower } = require('../utils/petUtils');
        
        const baseStats = {
          baseHp: userPet.pet.baseHp,
          baseAttack: userPet.pet.baseAttack,
          baseDefense: userPet.pet.baseDefense,
          baseSpeed: userPet.pet.baseSpeed,
          baseAccuracy: userPet.pet.baseAccuracy,
          baseEvasion: userPet.pet.baseEvasion,
          baseCriticalRate: userPet.pet.baseCriticalRate
        };
        
        userPet.actualCombatPower = calculateActualCombatPower(
          baseStats, 
          userPet.level, 
          userPet.pet.rarity, 
          userPet.pet.element
        );
        
        totalPower += userPet.actualCombatPower;
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
  if (position < 1 || position > 9) {
    throw new Error('Vị trí phải từ 1 đến 9');
  }
  
  // Kiểm tra vị trí đã có pet active chưa
  const existingActivePet = this.pets.find(pet => pet.position === position && pet.isActive);
  if (existingActivePet) {
    throw new Error(`Vị trí ${position} đã có pet`);
  }
  
  // Kiểm tra số lượng pet active không vượt quá 5
  const activePets = this.pets.filter(pet => pet.isActive);
  if (activePets.length >= 5) {
    throw new Error('Đội hình đã đầy (tối đa 5 pet)');
  }
  
  // Kiểm tra xem pet này đã có trong formation chưa (có thể inactive)
  const existingPet = this.pets.find(pet => pet.userPet.toString() === userPetId.toString());
  
  if (existingPet) {
    // Nếu pet đã tồn tại, cập nhật vị trí và set active
    existingPet.position = position;
    existingPet.isActive = true;
  } else {
    // Nếu pet chưa tồn tại, thêm mới
    this.pets.push({
      userPet: userPetId,
      position: position,
      isActive: true
    });
  }
  
  return this;
};

// Method để xóa pet khỏi đội hình
formationSchema.methods.removePet = function(position) {
  const petIndex = this.pets.findIndex(pet => pet.position === position && pet.isActive);
  if (petIndex === -1) {
    throw new Error(`Không tìm thấy pet ở vị trí ${position}`);
  }
  
  // Set pet thành inactive thay vì xóa
  this.pets[petIndex].isActive = false;
  return this;
};

// Method để thay đổi vị trí pet
formationSchema.methods.movePet = function(fromPosition, toPosition) {
  if (fromPosition < 1 || fromPosition > 9 || toPosition < 1 || toPosition > 9) {
    throw new Error('Vị trí phải từ 1 đến 9');
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

// Method để cleanup các pet records cũ (inactive)
formationSchema.methods.cleanupInactivePets = function() {
  // Chỉ giữ lại các pet active và 1 record inactive gần nhất cho mỗi pet
  const activePets = this.pets.filter(pet => pet.isActive);
  const inactivePets = this.pets.filter(pet => !pet.isActive);
  
  // Nhóm inactive pets theo userPet
  const inactiveByPet = {};
  inactivePets.forEach(pet => {
    const petId = pet.userPet.toString();
    if (!inactiveByPet[petId]) {
      inactiveByPet[petId] = [];
    }
    inactiveByPet[petId].push(pet);
  });
  
  // Chỉ giữ lại record mới nhất cho mỗi pet
  const keptInactivePets = [];
  Object.values(inactiveByPet).forEach(pets => {
    // Sắp xếp theo thời gian tạo (mới nhất trước)
    pets.sort((a, b) => b._id.getTimestamp() - a._id.getTimestamp());
    // Chỉ giữ record đầu tiên (mới nhất)
    keptInactivePets.push(pets[0]);
  });
  
  // Cập nhật pets array
  this.pets = [...activePets, ...keptInactivePets];
  
  return this;
};

// Method để lấy danh sách pet active
formationSchema.methods.getActivePets = function() {
  return this.pets.filter(pet => pet.isActive);
};

// Method để lấy danh sách pet inactive
formationSchema.methods.getInactivePets = function() {
  return this.pets.filter(pet => !pet.isActive);
};

// Method để kiểm tra xem pet có trong formation không
formationSchema.methods.hasPet = function(userPetId) {
  return this.pets.some(pet => pet.userPet.toString() === userPetId.toString());
};

// Method để lấy vị trí của pet
formationSchema.methods.getPetPosition = function(userPetId) {
  const pet = this.pets.find(pet => pet.userPet.toString() === userPetId.toString() && pet.isActive);
  return pet ? pet.position : null;
};

// Pre-save middleware để tự động tính toán lực chiến
formationSchema.pre('save', async function(next) {
  // Chỉ tính toán lại nếu pets thay đổi và totalCombatPower chưa được cập nhật thủ công
  if (this.isModified('pets') && !this.isModified('totalCombatPower')) {
    await this.calculateTotalCombatPower();
  }
  this.updatedAt = new Date();
  next();
});

// Index để tối ưu truy vấn
formationSchema.index({ user: 1, isActive: 1 });
formationSchema.index({ user: 1, name: 1 });

module.exports = mongoose.model('Formation', formationSchema); 