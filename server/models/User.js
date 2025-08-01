const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  username: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/ // Chỉ cho phép chữ cái, số và dấu gạch dưới
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  
  // ==================== PROFILE INFO ====================
  displayName: { 
    type: String, 
    trim: true,
    maxlength: 30,
    default: function() { return this.username; }
  },
  avatar: { 
    type: String, 
    default: null 
  },
  bio: { 
    type: String, 
    maxlength: 500,
    default: '' 
  },
  
  // ==================== ACCOUNT STATUS ====================
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  isBanned: { 
    type: Boolean, 
    default: false 
  },
  banReason: { 
    type: String, 
    default: null 
  },
  banExpiresAt: { 
    type: Date, 
    default: null 
  },
  
  // ==================== LOGIN INFO ====================
  lastLogin: { 
    type: Date, 
    default: Date.now 
  },
  lastLoginIp: { 
    type: String, 
    default: null 
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

// ==================== VIRTUAL FIELDS ====================

// Virtual để lấy UserStats
userSchema.virtual('stats', {
  ref: 'UserStats',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

// ==================== BASIC METHODS ====================

/**
 * Hash password trước khi save
 */
userSchema.methods.hashPassword = async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
};

/**
 * So sánh password
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Lấy thông tin đầy đủ của user (bao gồm stats)
 */
userSchema.methods.getFullInfo = async function() {
  await this.populate('stats');
  
  // Nếu chưa có stats, tạo mới
  if (!this.stats) {
    const UserStats = require('./UserStats');
    this.stats = await UserStats.create({ user: this._id });
  }
  
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    displayName: this.displayName,
    avatar: this.avatar,
    bio: this.bio,
    isActive: this.isActive,
    isVerified: this.isVerified,
    isBanned: this.isBanned,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    stats: this.stats
  };
};

/**
 * Lấy thông tin tóm tắt của user
 */
userSchema.methods.getSummary = async function() {
  await this.populate('stats');
  
  // Nếu chưa có stats, tạo mới
  if (!this.stats) {
    const UserStats = require('./UserStats');
    this.stats = await UserStats.create({ user: this._id });
  }
  
  return {
    _id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    stats: this.stats.getSummary()
  };
};

// ==================== MIDDLEWARE ====================

// Pre-save middleware
userSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Hash password nếu có thay đổi
  if (this.isModified('password')) {
    await this.hashPassword();
  }
  
  // Tự động set displayName nếu chưa có
  if (!this.displayName) {
    this.displayName = this.username;
  }
  
  next();
});

// ==================== INDEXES ====================

// Performance indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Text search index
userSchema.index({ 
  username: 'text', 
  displayName: 'text', 
  bio: 'text' 
});

// ==================== SCHEMA OPTIONS ====================

// Đảm bảo virtual fields được include khi convert to JSON
userSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

// Đảm bảo virtual fields được include khi convert to Object
userSchema.set('toObject', { 
  virtuals: true 
});

module.exports = mongoose.model('User', userSchema); 