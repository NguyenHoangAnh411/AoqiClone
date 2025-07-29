const mongoose = require('mongoose');

const raritySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // common, rare, epic, legendary
  displayName: { type: String, required: true }, // Thường, Hiếm, Epic, Huyền Thoại
  icon: { type: String, required: true }, // ⭐, ⭐⭐, ⭐⭐⭐, ⭐⭐⭐⭐
  color: { type: String, required: true }, // CSS color code
  
  // Drop rate
  dropRate: { type: Number, default: 0 }, // Tỷ lệ rơi (0-100)
  
  // Experience multiplier - càng hiếm càng cần nhiều exp
  expMultiplier: { type: Number, default: 1.0 },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method để lấy exp multiplier
raritySchema.methods.getExpMultiplier = function() {
  return this.expMultiplier;
};

// Method để lấy drop rate percentage
raritySchema.methods.getDropRatePercentage = function() {
  return this.dropRate;
};

// Pre-save middleware
raritySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
raritySchema.index({ name: 1 });

module.exports = mongoose.model('Rarity', raritySchema); 