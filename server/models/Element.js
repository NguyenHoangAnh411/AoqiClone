const mongoose = require('mongoose');

const elementSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // fire, water, wind, thunder, grass, rock, ice
  displayName: { type: String, required: true }, // Hỏa, Thủy, Phong, Lôi, Thảo, Nham, Băng
  icon: { type: String, required: true }, // 🔥, 💧, 🌪️, ⚡, 🌿, 🗿, ❄️
  color: { type: String, required: true }, // CSS color code
  
  // Effectiveness matrix - multiplier cho từng element
  effectivenessMatrix: {
    fire: { type: Number, default: 1.0 },
    water: { type: Number, default: 1.0 },
    ice: { type: Number, default: 1.0 },
    rock: { type: Number, default: 1.0 },
    thunder: { type: Number, default: 1.0 },
    wind: { type: Number, default: 1.0 },
    grass: { type: Number, default: 1.0 }
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method để lấy effectiveness multiplier
elementSchema.methods.getEffectivenessMultiplier = function(targetElement) {
  // Handle both string and object inputs
  let targetElementName;
  
  if (typeof targetElement === 'string') {
    targetElementName = targetElement;
  } else if (targetElement && targetElement.name) {
    targetElementName = targetElement.name;
  } else {
    return 1.0; // Default neutral
  }
  
  return this.effectivenessMatrix[targetElementName] || 1.0;
};

// Method để kiểm tra có mạnh hơn element khác không
elementSchema.methods.isStrongAgainst = function(targetElement) {
  const multiplier = this.getEffectivenessMultiplier(targetElement);
  return multiplier > 1.0;
};

// Method để kiểm tra có yếu hơn element khác không
elementSchema.methods.isWeakAgainst = function(targetElement) {
  const multiplier = this.getEffectivenessMultiplier(targetElement);
  return multiplier < 1.0;
};

// Method để lấy mức độ mạnh/yếu
elementSchema.methods.getEffectivenessLevel = function(targetElement) {
  const multiplier = this.getEffectivenessMultiplier(targetElement);
  
  if (multiplier >= 2.0) return 'very_strong';
  if (multiplier >= 1.5) return 'strong';
  if (multiplier >= 1.25) return 'slightly_strong';
  if (multiplier === 1.0) return 'neutral';
  if (multiplier >= 0.75) return 'slightly_weak';
  if (multiplier >= 0.5) return 'weak';
  return 'very_weak';
};

// Pre-save middleware
elementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure effectivenessMatrix is initialized
  if (!this.effectivenessMatrix) {
    this.effectivenessMatrix = {
      fire: 1.0,
      water: 1.0,
      ice: 1.0,
      rock: 1.0,
      thunder: 1.0,
      wind: 1.0,
      grass: 1.0
    };
  }
  
  next();
});

// No additional indexes needed - name is already unique in schema

module.exports = mongoose.model('Element', elementSchema); 