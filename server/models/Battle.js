const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  // Thông tin người chơi
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player1Pet: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPet', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2Pet: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPet', required: true },
  
  // Kết quả trận đấu
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  result: { 
    type: String, 
    enum: ['player1_win', 'player2_win', 'draw', 'disconnect'], 
    required: true 
  },
  
  // Thông tin chi tiết trận đấu
  battleType: { 
    type: String, 
    enum: ['pvp', 'pve', 'tournament', 'friendly'], 
    default: 'pvp' 
  },
  duration: { type: Number, default: 0 }, // Thời gian trận đấu (giây)
  rounds: { type: Number, default: 0 }, // Số lượt đấu
  
  // Phần thưởng
  expGained: { type: Number, default: 0 },
  coinsGained: { type: Number, default: 0 },
  itemsGained: [{ 
    itemId: { type: mongoose.Schema.Types.ObjectId },
    quantity: { type: Number, default: 1 }
  }],
  
  // Thời gian
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Index để tối ưu truy vấn
battleSchema.index({ player1: 1, createdAt: -1 });
battleSchema.index({ player2: 1, createdAt: -1 });
battleSchema.index({ winner: 1, createdAt: -1 });
battleSchema.index({ battleType: 1, createdAt: -1 });

module.exports = mongoose.model('Battle', battleSchema); 