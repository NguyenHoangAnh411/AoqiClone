const mongoose = require('mongoose');

const effectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Tên hiệu ứng
  displayName: { type: String, required: true }, // Tên hiển thị
  type: { 
    type: String, 
    enum: ['status', 'buff', 'debuff', 'special'], 
    required: true 
  }, // Loại hiệu ứng
  category: { type: String, required: true }, // Danh mục: stun, poison, burn, heal, etc.
  
  // Thông tin mô tả
  description: String,
  icon: String, // Icon hiển thị
  
  // Thông số hiệu ứng
  parameters: {
    value: { type: Number, default: 0 }, // Giá trị cơ bản
    percentage: { type: Number, default: 0 }, // Phần trăm (nếu có)
    duration: { type: Number, default: 0 }, // Thời gian hiệu lực (turns)
    chance: { type: Number, default: 100 } // Tỷ lệ kích hoạt (%)
  },
  
  // Target information
  targetType: { 
    type: String, 
    enum: ['self', 'single', 'all_enemies', 'all_allies', 'random_enemy', 'random_ally'], 
    default: 'single' 
  },
  range: { type: Number, default: 1 }, // Phạm vi
  
  // Conditions để kích hoạt
  conditions: {
    lowHp: { type: Number, default: 0 }, // Kích hoạt khi HP < X%
    highHp: { type: Number, default: 0 }, // Kích hoạt khi HP > X%
    lowEnergy: { type: Number, default: 0 }, // Kích hoạt khi Energy < X
    highEnergy: { type: Number, default: 0 }, // Kích hoạt khi Energy > X
    elementAdvantage: { type: Boolean, default: false }, // Kích hoạt khi có ưu thế element
    formationPosition: { type: Number, default: 0 }, // Kích hoạt ở vị trí X
    comboCount: { type: Number, default: 0 } // Kích hoạt khi combo >= X
  },
  
  // Stacking behavior
  stacking: {
    canStack: { type: Boolean, default: false }, // Có thể stack không
    stackType: { 
      type: String, 
      enum: ['additive', 'multiplicative', 'refresh'], 
      default: 'refresh' 
    }, // Cách stack
    maxStacks: { type: Number, default: 1 } // Số stack tối đa
  },
  
  // Resistance và immunity
  resistance: {
    canResist: { type: Boolean, default: true }, // Có thể kháng cự không
    resistanceStat: { type: String, default: 'statusResistance' }, // Stat để tính kháng cự
    immunityElements: [{ type: String }], // Elements miễn nhiễm
    immunityTypes: [{ type: String }] // Types miễn nhiễm
  },
  
  // Visual effects
  visualEffects: {
    animation: String, // Tên animation
    sound: String, // Tên sound effect
    particles: String, // Tên particle effect
    color: String // Màu sắc hiệu ứng
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ==================== METHODS ====================

/**
 * Kiểm tra có thể áp dụng cho target không
 */
effectSchema.methods.canApplyTo = function(target, attacker = null) {
  // Validate target
  if (!target) {
    return false;
  }
  
  // Kiểm tra immunity - handle both string and object element
  let targetElement;
  if (typeof target.element === 'string') {
    targetElement = target.element;
  } else if (target.element && target.element.name) {
    targetElement = target.element.name;
  }
  
  if (targetElement && this.resistance.immunityElements.includes(targetElement)) {
    return false;
  }
  
  // Kiểm tra conditions - ensure target has required properties
  if (this.conditions.lowHp > 0) {
    if (!target.currentHp || !target.maxHp) {
      return false;
    }
    const hpPercentage = (target.currentHp / target.maxHp) * 100;
    if (hpPercentage >= this.conditions.lowHp) {
      return false;
    }
  }
  
  if (this.conditions.highHp > 0) {
    if (!target.currentHp || !target.maxHp) {
      return false;
    }
    const hpPercentage = (target.currentHp / target.maxHp) * 100;
    if (hpPercentage <= this.conditions.highHp) {
      return false;
    }
  }
  
  return true;
};

/**
 * Tính toán giá trị hiệu ứng với custom parameters
 */
effectSchema.methods.calculateValue = function(customValue = null, target = null, attacker = null) {
  let value = customValue !== null ? customValue : this.parameters.value;
  
  // Tính theo phần trăm nếu có
  if (this.parameters.percentage > 0) {
    switch (this.category) {
      case 'heal':
        if (target && target.maxHp) {
          value = Math.floor(target.maxHp * (this.parameters.percentage / 100));
        }
        break;
      case 'damage':
        value = Math.floor(value * (this.parameters.percentage / 100));
        break;
      case 'drain':
        value = Math.floor(value * (this.parameters.percentage / 100));
        break;
    }
  }
  
  // Áp dụng modifiers dựa trên attacker stats
  if (attacker && this.type === 'debuff') {
    // Debuff value có thể bị ảnh hưởng bởi attacker stats
    const attackerLevel = attacker.level || 1;
    value = Math.floor(value * (1 + attackerLevel * 0.01));
  }
  
  return Math.max(1, value); // Đảm bảo ít nhất 1
};

/**
 * Tính toán duration với custom duration
 */
effectSchema.methods.calculateDuration = function(customDuration = null, target = null, attacker = null) {
  let duration = customDuration !== null ? customDuration : this.parameters.duration;
  
  // Có thể thêm logic tính duration dựa trên stats
  if (attacker && this.type === 'debuff') {
    // Debuff duration có thể bị ảnh hưởng bởi attacker stats
    const attackerLevel = attacker.level || 1;
    duration = Math.floor(duration * (1 + attackerLevel * 0.02));
  }
  
  if (target && this.type === 'buff') {
    // Buff duration có thể bị ảnh hưởng bởi target stats
    const targetLevel = target.level || 1;
    duration = Math.floor(duration * (1 + targetLevel * 0.01));
  }
  
  return Math.max(1, duration); // Đảm bảo ít nhất 1 turn
};

/**
 * Tính toán chance với custom chance
 */
effectSchema.methods.calculateChance = function(customChance = null, target = null, attacker = null) {
  let chance = customChance !== null ? customChance : this.parameters.chance;
  
  // Có thể thêm logic tính chance dựa trên accuracy/resistance
  if (attacker && target) {
    const accuracy = attacker.accuracy || 100;
    const resistance = target.statusResistance || 0;
    chance = Math.max(0, Math.min(100, chance * (accuracy / 100) * (1 - resistance / 100)));
  }
  
  return Math.max(0, Math.min(100, chance));
};

/**
 * Kiểm tra có thể stack với effect hiện tại không
 */
effectSchema.methods.canStackWith = function(existingEffect) {
  if (!this.stacking.canStack) return false;
  if (existingEffect.stacks >= this.stacking.maxStacks) return false;
  return true;
};

/**
 * Kiểm tra conditions có thỏa mãn không
 */
effectSchema.methods.checkConditions = function(target, attacker = null) {
  const conditions = this.conditions;
  
  // HP conditions
  if (conditions.lowHp > 0 && target.currentHp && target.maxHp) {
    const hpPercentage = (target.currentHp / target.maxHp) * 100;
    if (hpPercentage >= conditions.lowHp) return false;
  }
  
  if (conditions.highHp > 0 && target.currentHp && target.maxHp) {
    const hpPercentage = (target.currentHp / target.maxHp) * 100;
    if (hpPercentage <= conditions.highHp) return false;
  }
  
  // Energy conditions
  if (conditions.lowEnergy > 0 && target.energy !== undefined) {
    if (target.energy >= conditions.lowEnergy) return false;
  }
  
  if (conditions.highEnergy > 0 && target.energy !== undefined) {
    if (target.energy <= conditions.highEnergy) return false;
  }
  
  // Element advantage condition
  if (conditions.elementAdvantage && attacker && target) {
    // Cần implement logic kiểm tra element advantage
    // Tạm thời return true
  }
  
  // Formation position condition
  if (conditions.formationPosition > 0 && target.position !== undefined) {
    if (target.position !== conditions.formationPosition) return false;
  }
  
  // Combo count condition
  if (conditions.comboCount > 0 && attacker && attacker.comboCount !== undefined) {
    if (attacker.comboCount < conditions.comboCount) return false;
  }
  
  return true;
};

/**
 * Lấy thông tin hiển thị
 */
effectSchema.methods.getDisplayInfo = function() {
  return {
    name: this.name,
    displayName: this.displayName,
    type: this.type,
    category: this.category,
    description: this.description,
    icon: this.icon,
    parameters: this.parameters,
    targetType: this.targetType,
    range: this.range,
    conditions: this.conditions,
    stacking: this.stacking,
    resistance: this.resistance,
    visualEffects: this.visualEffects,
    isActive: this.isActive
  };
};

/**
 * Lấy thông tin ngắn gọn cho skill
 */
effectSchema.methods.getSkillInfo = function() {
  return {
    name: this.name,
    displayName: this.displayName,
    type: this.type,
    category: this.category,
    icon: this.icon,
    baseValue: this.parameters.value,
    baseDuration: this.parameters.duration,
    baseChance: this.parameters.chance,
    targetType: this.targetType,
    canResist: this.resistance.canResist,
    canStack: this.stacking.canStack
  };
};

// Pre-save middleware
effectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure parameters are initialized
  if (!this.parameters) {
    this.parameters = {
      value: 0,
      percentage: 0,
      duration: 0,
      chance: 100,
      maxStacks: 1
    };
  }
  
  // Ensure resistance is initialized
  if (!this.resistance) {
    this.resistance = {
      canResist: true,
      resistanceStat: 'statusResistance',
      immunityElements: [],
      immunityTypes: []
    };
  }
  
  // Ensure conditions are initialized
  if (!this.conditions) {
    this.conditions = {
      lowHp: 0,
      highHp: 0,
      lowEnergy: 0,
      highEnergy: 0,
      elementAdvantage: false,
      formationPosition: 0,
      comboCount: 0
    };
  }
  
  // Ensure stacking is initialized
  if (!this.stacking) {
    this.stacking = {
      canStack: false,
      stackType: 'refresh',
      maxStacks: 1
    };
  }
  
  // Ensure visualEffects is initialized
  if (!this.visualEffects) {
    this.visualEffects = {};
  }
  
  next();
});

// Indexes
effectSchema.index({ type: 1 });
effectSchema.index({ category: 1 });
effectSchema.index({ isActive: 1 });

module.exports = mongoose.model('Effect', effectSchema); 