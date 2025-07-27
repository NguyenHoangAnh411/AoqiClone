const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { 
    type: String, 
    enum: ['material', 'food', 'equipment', 'consumable', 'special'], 
    required: true 
  },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID của item template
  quantity: { type: Number, default: 1, min: 0 },
  // Thông tin bổ sung cho equipment
  durability: { type: Number, default: 100 }, // Độ bền (cho equipment)
  isEquipped: { type: Boolean, default: false }, // Đang được trang bị không
  // Thông tin bổ sung cho special items
  expiresAt: { type: Date, default: null }, // Thời gian hết hạn
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date, default: null }
});

// Index để tối ưu truy vấn
inventorySchema.index({ user: 1, itemType: 1 });
inventorySchema.index({ user: 1, isEquipped: 1 });
inventorySchema.index({ user: 1, itemId: 1 });

module.exports = mongoose.model('Inventory', inventorySchema); 