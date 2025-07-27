const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['normal', 'ultimate', 'passive'], required: true }, // loại skill
  element: { type: String }, // hệ: fire, water, wind, thunder, grass, rock, ice
  power: Number, // sát thương cơ bản
  energyCost: { type: Number, default: 0 }, // chi phí năng lượng
  accuracy: { type: Number, default: 100, min: 0, max: 100 }, // độ chính xác (0-100)
  criticalRate: { type: Number, default: 0, min: 0, max: 100 }, // tỷ lệ chí mạng (0-100)
  
  // Hiệu ứng đặc biệt
  effects: {
    // Status Effects (Hiệu ứng trạng thái)
    status: {
      stun: { type: Boolean, default: false }, // làm choáng
      poison: { type: Boolean, default: false }, // gây độc
      burn: { type: Boolean, default: false }, // gây cháy
      freeze: { type: Boolean, default: false }, // đóng băng
      paralyze: { type: Boolean, default: false }, // làm tê liệt
      sleep: { type: Boolean, default: false }, // làm ngủ
      confusion: { type: Boolean, default: false } // làm lẫn lộn
    },
    
    // Buff Effects (Tăng chỉ số)
    buff: {
      attack: { type: Number, default: 0 }, // tăng tấn công (0-3 levels)
      defense: { type: Number, default: 0 }, // tăng phòng thủ (0-3 levels)
      speed: { type: Number, default: 0 }, // tăng tốc độ (0-3 levels)
      accuracy: { type: Number, default: 0 }, // tăng độ chính xác (0-3 levels)
      evasion: { type: Number, default: 0 }, // tăng né tránh (0-3 levels)
      criticalRate: { type: Number, default: 0 } // tăng tỷ lệ chí mạng (0-3 levels)
    },
    
    // Debuff Effects (Giảm chỉ số địch)
    debuff: {
      attack: { type: Number, default: 0 }, // giảm tấn công địch (0-3 levels)
      defense: { type: Number, default: 0 }, // giảm phòng thủ địch (0-3 levels)
      speed: { type: Number, default: 0 }, // giảm tốc độ địch (0-3 levels)
      accuracy: { type: Number, default: 0 }, // giảm độ chính xác địch (0-3 levels)
      evasion: { type: Number, default: 0 }, // giảm né tránh địch (0-3 levels)
      criticalRate: { type: Number, default: 0 } // giảm tỷ lệ chí mạng địch (0-3 levels)
    },
    
    // Special Effects (Hiệu ứng đặc biệt)
    special: {
      heal: { type: Number, default: 0 }, // hồi máu (số % HP)
      drain: { type: Number, default: 0 }, // hút máu (số % damage)
      reflect: { type: Boolean, default: false }, // phản đòn
      counter: { type: Boolean, default: false }, // phản công
      priority: { type: Number, default: 0 }, // độ ưu tiên (-3 đến +3)
      multiHit: { type: Number, default: 1 }, // số lần đánh (1-5)
      recoil: { type: Number, default: 0 } // sát thương phản lại (số %)
    },
    
    // Duration (Thời gian hiệu lực)
    duration: {
      status: { type: Number, default: 0 }, // thời gian status effect (turns)
      buff: { type: Number, default: 0 }, // thời gian buff (turns)
      debuff: { type: Number, default: 0 } // thời gian debuff (turns)
    }
  },
  
  // Thông tin liên kết với pet
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }, // Pet sở hữu skill này
  skillSetId: { type: String }, // ID để nhóm các skill của cùng 1 pet
  isActive: { type: Boolean, default: true }
});

// Index để tối ưu truy vấn
skillSchema.index({ petId: 1, type: 1 });
skillSchema.index({ skillSetId: 1 });
skillSchema.index({ element: 1, type: 1 });

module.exports = mongoose.model('Skill', skillSchema); 