const mongoose = require('mongoose');

const userPetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true }, // Tham chiếu đến template Pet
  level: { type: Number, default: 1, min: 1, max: 100 }, // Max level 100
  exp: { type: Number, default: 0 },
  hp: { type: Number, default: 1000 },
  attack: { type: Number, default: 100 },
  defense: { type: Number, default: 50 },
  speed: { type: Number, default: 100 },
  accuracy: { type: Number, default: 100 },
  evasion: { type: Number, default: 10 },
  criticalRate: { type: Number, default: 5 },
  location: { type: String, enum: ['bag', 'storage'], default: 'storage' }, // Vị trí: túi hoặc kho
  createdAt: { type: Date, default: Date.now },
});

// Index để tối ưu truy vấn
userPetSchema.index({ user: 1, pet: 1 });
userPetSchema.index({ user: 1, location: 1 });

module.exports = mongoose.model('UserPet', userPetSchema); 