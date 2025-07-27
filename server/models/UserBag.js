const mongoose = require('mongoose');

const userBagSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // Mỗi user chỉ có 1 túi
  },
  maxSize: { 
    type: Number, 
    default: 20,
    min: 1,
    max: 20,
    validate: {
      validator: function(v) {
        return v >= 1 && v <= 20;
      },
      message: 'Bag size must be between 1 and 20'
    }
  },
  currentSize: { 
    type: Number, 
    default: 0,
    min: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware để tự động cập nhật updatedAt
userBagSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
userBagSchema.statics.DEFAULT_MAX_SIZE = 20;
userBagSchema.statics.MAX_BAG_SIZE = 20;

// Instance methods
userBagSchema.methods.canAddPet = function() {
  return this.currentSize < this.maxSize;
};

userBagSchema.methods.getAvailableSlots = function() {
  return this.maxSize - this.currentSize;
};

userBagSchema.methods.isFull = function() {
  return this.currentSize >= this.maxSize;
};

// Virtual để lấy danh sách pet trong túi
userBagSchema.virtual('pets', {
  ref: 'UserPet',
  localField: 'user',
  foreignField: 'user',
  match: { location: 'bag' }
});

// Đảm bảo virtual fields được include khi convert to JSON
userBagSchema.set('toJSON', { virtuals: true });
userBagSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserBag', userBagSchema); 