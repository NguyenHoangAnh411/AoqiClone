const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Game currency
  coins: { type: Number, default: 1000 }, // Tiền trong game
  gems: { type: Number, default: 50 }, // Đá quý (premium currency)
  
  // Game progress
  score: { type: Number, default: 0 }, // Điểm tổng
  hasChosenStarterPet: { type: Boolean, default: false }, // Đã chọn starter pet chưa
  
  // Battle stats tổng hợp
  totalBattlesWon: { type: Number, default: 0 },
  totalBattlesLost: { type: Number, default: 0 },
  totalDamageDealt: { type: Number, default: 0 },
  totalDamageTaken: { type: Number, default: 0 },
  
  // Thông tin profile
  avatar: { type: String, default: null },
  bio: { type: String, default: '' },
  
  // Cài đặt game
  settings: {
    soundEnabled: { type: Boolean, default: true },
    musicEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Virtual để lấy danh sách linh thú của user (sẽ được populate)
userSchema.virtual('pets', {
  ref: 'UserPet',
  localField: '_id',
  foreignField: 'user'
});

// Virtual để lấy pets trong bag
userSchema.virtual('bagPets', {
  ref: 'UserPet',
  localField: '_id',
  foreignField: 'user',
  match: { location: 'bag' }
});

// Virtual để lấy pets trong storage
userSchema.virtual('storagePets', {
  ref: 'UserPet',
  localField: '_id',
  foreignField: 'user',
  match: { location: 'storage' }
});

// Virtual để lấy thông tin túi của user
userSchema.virtual('bag', {
  ref: 'UserBag',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

// Method để lấy tổng số pets
userSchema.methods.getTotalPets = async function() {
  const UserPet = require('./UserPet');
  return await UserPet.countDocuments({ user: this._id });
};

// Method để lấy pets trong bag
userSchema.methods.getBagPets = async function() {
  const UserPet = require('./UserPet');
  return await UserPet.find({ user: this._id, location: 'bag' })
    .populate({
      path: 'pet',
      populate: ['element', 'rarity']
    });
};

// Method để lấy pets trong storage
userSchema.methods.getStoragePets = async function() {
  const UserPet = require('./UserPet');
  return await UserPet.find({ user: this._id, location: 'storage' })
    .populate({
      path: 'pet',
      populate: ['element', 'rarity']
    });
};

// Method để lấy pet mạnh nhất
userSchema.methods.getStrongestPet = async function() {
  const UserPet = require('./UserPet');
  return await UserPet.findOne({ user: this._id })
    .sort({ actualCombatPower: -1 })
    .populate({
      path: 'pet',
      populate: ['element', 'rarity']
    });
};

// Method để lấy thống kê pets
userSchema.methods.getPetStats = async function() {
  const UserPet = require('./UserPet');
  
  const totalPets = await UserPet.countDocuments({ user: this._id });
  const bagPets = await UserPet.countDocuments({ user: this._id, location: 'bag' });
  const storagePets = await UserPet.countDocuments({ user: this._id, location: 'storage' });
  
  // Get highest level pet
  const highestLevelPet = await UserPet.findOne({ user: this._id })
    .sort({ level: -1 })
    .populate('pet');
  
  // Get pets by rarity
  const petsByRarity = await UserPet.aggregate([
    { $match: { user: this._id } },
    { $lookup: { from: 'pets', localField: 'pet', foreignField: '_id', as: 'petData' } },
    { $unwind: '$petData' },
    { $lookup: { from: 'rarities', localField: 'petData.rarity', foreignField: '_id', as: 'rarityData' } },
    { $unwind: '$rarityData' },
    { $group: { _id: '$rarityData.name', count: { $sum: 1 } } }
  ]);
  
  return {
    totalPets,
    bagPets,
    storagePets,
    highestLevel: highestLevelPet?.level || 0,
    highestLevelPet: highestLevelPet?.pet?.name || null,
    petsByRarity
  };
};

// Method để kiểm tra có thể nhận pet mới không
userSchema.methods.canReceivePet = async function() {
  const UserBag = require('./UserBag');
  const bag = await UserBag.findOne({ user: this._id });
  
  if (!bag) return true; // Chưa có bag, có thể nhận pet
  
  return bag.canAddPet();
};

// Method để thêm pet vào bag
userSchema.methods.addPetToBag = async function(petId) {
  const UserPet = require('./UserPet');
  const UserBag = require('./UserBag');
  
  // Check if user can receive pet
  if (!(await this.canReceivePet())) {
    throw new Error('Bag is full');
  }
  
  // Create UserPet
  const userPet = new UserPet({
    user: this._id,
    pet: petId,
    location: 'bag'
  });
  
  await userPet.save();
  
  // Update bag size
  const bag = await UserBag.findOne({ user: this._id });
  if (bag) {
    bag.currentSize += 1;
    await bag.save();
  }
  
  return userPet;
};

// Method để di chuyển pet giữa bag và storage
userSchema.methods.movePet = async function(userPetId, newLocation) {
  const UserPet = require('./UserPet');
  const UserBag = require('./UserBag');
  
  const userPet = await UserPet.findOne({ _id: userPetId, user: this._id });
  if (!userPet) {
    throw new Error('Pet not found');
  }
  
  const oldLocation = userPet.location;
  userPet.location = newLocation;
  await userPet.save();
  
  // Update bag size if moving to/from bag
  const bag = await UserBag.findOne({ user: this._id });
  if (bag) {
    if (oldLocation === 'bag' && newLocation === 'storage') {
      bag.currentSize -= 1;
    } else if (oldLocation === 'storage' && newLocation === 'bag') {
      if (!bag.canAddPet()) {
        throw new Error('Bag is full');
      }
      bag.currentSize += 1;
    }
    await bag.save();
  }
  
  return userPet;
};

// Đảm bảo virtual fields được include khi convert to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Index để tối ưu truy vấn
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ score: -1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema); 