const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  // Reference to User
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  
  // ==================== GAME CURRENCY ====================
  golds: { 
    type: Number, 
    default: 0,
    min: 0
  },
  diamonds: { 
    type: Number, 
    default: 0,
    min: 0
  },
  standardFate: {
    type: Number,
    default: 0,
    min: 0
  },
  specialFate: {
    type: Number,
    default: 0,
    min: 0
  },
  MasterlessStarglitter: {
    type: Number,
    default: 0,
    min: 0
  },
  MasterlessStardust: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // ==================== GAME PROGRESS ====================
  score: { 
    type: Number, 
    default: 0,
    min: 0
  },
  rank: { 
    type: Number, 
    default: 0 
  },
  hasChosenStarterPet: { 
    type: Boolean, 
    default: false 
  },
  tutorialCompleted: { 
    type: Boolean, 
    default: false 
  },
  
  // ==================== TIMESTAMPS ====================
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ==================== METHODS ====================

/**
 * Thêm currency
 */
userStatsSchema.methods.addCurrency = function(type, amount) {
  switch (type) {
    case 'golds':
      this.golds += amount;
      break;
    case 'diamonds':
      this.diamonds += amount;
      break;
    case 'standardFate':
      this.standardFate += amount;
      break;
    case 'specialFate':
      this.specialFate += amount;
      break;
    case 'MasterlessStarglitter':
      this.MasterlessStarglitter += amount;
      break;
    case 'MasterlessStardust':
      this.MasterlessStardust += amount;
      break;
  }
  return this;
};

/**
 * Kiểm tra có đủ currency không
 */
userStatsSchema.methods.hasEnoughCurrency = function(type, amount) {
  switch (type) {
    case 'golds':
      return this.golds >= amount;
    case 'diamonds':
      return this.diamonds >= amount;
    case 'standardFate':
      return this.standardFate >= amount;
    case 'specialFate':
      return this.specialFate >= amount;
    case 'MasterlessStarglitter':
      return this.MasterlessStarglitter >= amount;
    case 'MasterlessStardust':
      return this.MasterlessStardust >= amount;
    default:
      return false;
  }
};

/**
 * Trừ currency
 */
userStatsSchema.methods.deductCurrency = function(type, amount) {
  if (!this.hasEnoughCurrency(type, amount)) {
    throw new Error(`Không đủ ${type} để thực hiện giao dịch`);
  }
  
  switch (type) {
    case 'golds':
      this.golds -= amount;
      break;
    case 'diamonds':
      this.diamonds -= amount;
      break;
    case 'standardFate':
      this.standardFate -= amount;
      break;
    case 'specialFate':
      this.specialFate -= amount;
      break;
    case 'MasterlessStarglitter':
      this.MasterlessStarglitter -= amount;
      break;
    case 'MasterlessStardust':
      this.MasterlessStardust -= amount;
      break;
  }
  return this;
};

/**
 * Lấy thông tin tóm tắt
 */
userStatsSchema.methods.getSummary = function() {
  return {
    score: this.score,
    rank: this.rank,
    golds: this.golds,
    diamonds: this.diamonds,
    standardFate: this.standardFate,
    specialFate: this.specialFate,
    MasterlessStarglitter: this.MasterlessStarglitter,
    MasterlessStardust: this.MasterlessStardust,
    hasChosenStarterPet: this.hasChosenStarterPet,
    tutorialCompleted: this.tutorialCompleted
  };
};

/**
 * Lấy tất cả currency
 */
userStatsSchema.methods.getAllCurrency = function() {
  return {
    golds: this.golds,
    diamonds: this.diamonds,
    standardFate: this.standardFate,
    specialFate: this.specialFate,
    MasterlessStarglitter: this.MasterlessStarglitter,
    MasterlessStardust: this.MasterlessStardust
  };
};

// ==================== MIDDLEWARE ====================

// Pre-save middleware
userStatsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure non-negative values
  if (this.golds < 0) this.golds = 0;
  if (this.diamonds < 0) this.diamonds = 0;
  if (this.standardFate < 0) this.standardFate = 0;
  if (this.specialFate < 0) this.specialFate = 0;
  if (this.MasterlessStarglitter < 0) this.MasterlessStarglitter = 0;
  if (this.MasterlessStardust < 0) this.MasterlessStardust = 0;
  if (this.score < 0) this.score = 0;
  
  next();
});

// ==================== INDEXES ====================

// Performance indexes
userStatsSchema.index({ user: 1 });
userStatsSchema.index({ score: -1 });
userStatsSchema.index({ rank: 1 });

module.exports = mongoose.model('UserStats', userStatsSchema); 