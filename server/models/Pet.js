const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  img: { type: String, required: true },
  description: String,
  element: { type: String, required: true }, // hệ: fire, water, wind, thunder, grass, rock, ice
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  // Chỉ số cơ bản (base stats) - sẽ được nhân với level
  baseHp: { type: Number, default: 1000 },
  baseAttack: { type: Number, default: 100 },
  baseDefense: { type: Number, default: 50 },
  baseSpeed: { type: Number, default: 100 },
  baseAccuracy: { type: Number, default: 100 }, // Độ chính xác cơ bản
  baseEvasion: { type: Number, default: 10 }, // Khả năng né tránh cơ bản
  baseCriticalRate: { type: Number, default: 5 }, // Tỷ lệ chí mạng cơ bản
  // Skills cố định của linh thú (không cần học) - optional để có thể tạo pet trước
  normalSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  ultimateSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  passiveSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  // Thông tin khác
  evolutionLevel: { type: Number, default: null }, // Level cần để tiến hóa
  evolutionPet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }, // Linh thú sau khi tiến hóa
  isActive: { type: Boolean, default: true }, // Có thể nhận được không
  isStarter: { type: Boolean, default: false }, // Linh thú mở đầu cho người dùng mới
  createdAt: { type: Date, default: Date.now }
});

// Index để tối ưu truy vấn
petSchema.index({ element: 1, rarity: 1 });
petSchema.index({ isActive: 1 });

module.exports = mongoose.model('Pet', petSchema); 