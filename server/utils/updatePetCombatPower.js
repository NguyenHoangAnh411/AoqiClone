/**
 * Script để cập nhật baseCombatPower cho các pet template hiện có
 * Chạy một lần sau khi thêm field baseCombatPower
 */

const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { calculateCombatPower } = require('./petUtils');

const updatePetCombatPower = async () => {
  try {
    console.log('Bắt đầu cập nhật baseCombatPower cho các pet...');
    
    // Lấy tất cả pet templates
    const pets = await Pet.find({});
    
    for (const pet of pets) {
      // Tính baseCombatPower từ các chỉ số cơ bản
      const baseCombatPower = calculateCombatPower(
        pet.baseHp,
        pet.baseAttack,
        pet.baseDefense,
        pet.baseSpeed
      );
      
      // Cập nhật pet
      await Pet.findByIdAndUpdate(pet._id, { baseCombatPower });
      console.log(`Đã cập nhật ${pet.name}: baseCombatPower = ${baseCombatPower}`);
    }
    
    console.log('Hoàn thành cập nhật baseCombatPower!');
  } catch (error) {
    console.error('Lỗi khi cập nhật:', error);
  }
};

// Export để có thể chạy từ command line
if (require.main === module) {
  // Kết nối database (cần điều chỉnh theo config của bạn)
  mongoose.connect('mongodb://localhost:27017/your_database_name')
    .then(() => {
      console.log('Đã kết nối database');
      return updatePetCombatPower();
    })
    .then(() => {
      console.log('Script hoàn thành');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Lỗi:', error);
      process.exit(1);
    });
}

module.exports = updatePetCombatPower; 