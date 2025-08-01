require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserStats = require('../models/UserStats');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateUserStats() {
  try {
    console.log('🚀 Bắt đầu migration UserStats...');
    
    // Lấy tất cả users
    const users = await User.find();
    console.log(`📊 Tìm thấy ${users.length} users cần migration`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      try {
        // Kiểm tra xem đã có UserStats chưa
        const existingStats = await UserStats.findOne({ user: user._id });
        
        if (existingStats) {
          console.log(`⏭️  User ${user.username} đã có UserStats, bỏ qua`);
          skippedCount++;
          continue;
        }
        
        // Tạo UserStats mới với dữ liệu từ User
        const userStats = new UserStats({
          user: user._id,
          golds: user.golds || 1000,
          diamonds: user.diamonds || 50,
          standardFate: user.standardFate || 0,
          specialFate: user.specialFate || 0,
          MasterlessStarglitter: 0, // Default value
          MasterlessStardust: 0, // Default value
          score: user.score || 0,
          rank: user.rank || 0,
          hasChosenStarterPet: user.hasChosenStarterPet || false,
          tutorialCompleted: user.tutorialCompleted || false
        });
        
        await userStats.save();
        console.log(`✅ Đã migration UserStats cho ${user.username}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Lỗi migration cho user ${user.username}:`, error.message);
      }
    }
    
    console.log('\n📈 Kết quả migration:');
    console.log(`✅ Đã migration: ${migratedCount} users`);
    console.log(`⏭️  Đã bỏ qua: ${skippedCount} users`);
    console.log(`📊 Tổng cộng: ${users.length} users`);
    
    // Kiểm tra kết quả
    const totalUserStats = await UserStats.countDocuments();
    console.log(`\n🎯 Tổng số UserStats trong database: ${totalUserStats}`);
    
  } catch (error) {
    console.error('❌ Lỗi migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối database');
  }
}

// Chạy migration
migrateUserStats(); 