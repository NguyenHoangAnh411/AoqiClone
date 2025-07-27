const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  score: { type: Number, default: 0 },
  coins: { type: Number, default: 1000 }, // Tiền trong game
  gems: { type: Number, default: 50 }, // Đá quý (premium currency)
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  hasChosenStarterPet: { type: Boolean, default: false }, // Đã chọn starter pet chưa
  // Thông tin profile
  avatar: { type: String, default: null },
  bio: { type: String, default: '' },
  // Cài đặt game
  settings: {
    soundEnabled: { type: Boolean, default: true },
    musicEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true }
  }
});

// Virtual để lấy danh sách linh thú của user (sẽ được populate)
userSchema.virtual('pets', {
  ref: 'UserPet',
  localField: '_id',
  foreignField: 'user'
});

// Virtual để lấy thông tin túi của user
userSchema.virtual('bag', {
  ref: 'UserBag',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

// Đảm bảo virtual fields được include khi convert to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema); 