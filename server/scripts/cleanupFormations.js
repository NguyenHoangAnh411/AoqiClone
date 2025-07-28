const mongoose = require('mongoose');
const Formation = require('../models/Formation');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/aoqi_game', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanupFormations() {
  try {
    console.log('🔄 Bắt đầu cleanup formations...');
    
    const formations = await Formation.find({});
    let totalCleaned = 0;
    let totalRecordsRemoved = 0;
    
    for (const formation of formations) {
      const beforeCount = formation.pets.length;
      console.log(`\n📋 Formation "${formation.name}" (${formation._id}):`);
      console.log(`   - Trước: ${beforeCount} pet records`);
      
      // Cleanup inactive pets
      formation.cleanupInactivePets();
      
      const afterCount = formation.pets.length;
      const removed = beforeCount - afterCount;
      
      console.log(`   - Sau: ${afterCount} pet records`);
      console.log(`   - Đã xóa: ${removed} records cũ`);
      
      if (removed > 0) {
        await formation.save();
        totalCleaned++;
        totalRecordsRemoved += removed;
      }
    }
    
    console.log(`\n✅ Hoàn thành cleanup!`);
    console.log(`   - Formations đã cleanup: ${totalCleaned}`);
    console.log(`   - Tổng records đã xóa: ${totalRecordsRemoved}`);
    
  } catch (error) {
    console.error('❌ Lỗi khi cleanup:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối database');
  }
}

// Chạy cleanup
cleanupFormations(); 