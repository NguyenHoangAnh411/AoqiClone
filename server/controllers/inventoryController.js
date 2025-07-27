const Inventory = require('../models/Inventory');

exports.getInventory = async (req, res) => {
  try {
    const { itemType, limit = 50 } = req.query;
    let filter = { user: req.user.id };
    
    if (itemType) {
      filter.itemType = itemType;
    }

    const inventory = await Inventory.find(filter)
      .populate('itemId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { itemId, itemType, quantity = 1, durability = 100 } = req.body;
    
    // Kiểm tra xem item đã tồn tại trong inventory chưa
    const existingItem = await Inventory.findOne({
      user: req.user.id,
      itemId,
      itemType
    });

    if (existingItem) {
      // Nếu đã có, tăng số lượng
      const updatedItem = await Inventory.findByIdAndUpdate(
        existingItem._id,
        { $inc: { quantity } },
        { new: true }
      ).populate('itemId');
      
      return res.json(updatedItem);
    }

    // Nếu chưa có, tạo mới
    const newItem = await Inventory.create({
      user: req.user.id,
      itemId,
      itemType,
      quantity,
      durability
    });

    const populatedItem = await Inventory.findById(newItem._id).populate('itemId');
    res.status(201).json(populatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { itemId, itemType, quantity = 1 } = req.body;
    
    const item = await Inventory.findOne({
      user: req.user.id,
      itemId,
      itemType
    });

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy item' });
    }

    if (item.quantity < quantity) {
      return res.status(400).json({ error: 'Số lượng item không đủ' });
    }

    if (item.quantity === quantity) {
      // Xóa item nếu số lượng = 0
      await Inventory.findByIdAndDelete(item._id);
      res.json({ success: true, message: 'Item đã được xóa' });
    } else {
      // Giảm số lượng
      const updatedItem = await Inventory.findByIdAndUpdate(
        item._id,
        { $inc: { quantity: -quantity } },
        { new: true }
      ).populate('itemId');
      
      res.json(updatedItem);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const updateData = req.body;
    
    const item = await Inventory.findOneAndUpdate(
      { _id: inventoryId, user: req.user.id },
      updateData,
      { new: true }
    ).populate('itemId');

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy item' });
    }

    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.equipItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    
    // Kiểm tra item có phải equipment không
    const item = await Inventory.findOne({
      _id: inventoryId,
      user: req.user.id,
      itemType: 'equipment'
    });

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy equipment' });
    }

    // Bỏ trang bị tất cả equipment cùng loại
    await Inventory.updateMany(
      { 
        user: req.user.id, 
        itemType: 'equipment',
        isEquipped: true 
      },
      { isEquipped: false }
    );

    // Trang bị item mới
    const equippedItem = await Inventory.findByIdAndUpdate(
      inventoryId,
      { isEquipped: true },
      { new: true }
    ).populate('itemId');

    res.json(equippedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unequipItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    
    const item = await Inventory.findOneAndUpdate(
      { _id: inventoryId, user: req.user.id },
      { isEquipped: false },
      { new: true }
    ).populate('itemId');

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy item' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEquippedItems = async (req, res) => {
  try {
    const equippedItems = await Inventory.find({
      user: req.user.id,
      isEquipped: true
    }).populate('itemId');

    res.json(equippedItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.useItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { targetId, targetType } = req.body; // targetType: 'pet', 'user'
    
    const item = await Inventory.findOne({
      _id: inventoryId,
      user: req.user.id
    }).populate('itemId');

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy item' });
    }

    if (item.quantity <= 0) {
      return res.status(400).json({ error: 'Item đã hết' });
    }

    // Giảm số lượng item
    await Inventory.findByIdAndUpdate(
      inventoryId,
      { 
        $inc: { quantity: -1 },
        lastUsed: new Date()
      }
    );

    // Xử lý hiệu ứng của item (tùy theo loại item)
    let effect = null;
    
    if (item.itemType === 'consumable') {
      // Xử lý consumable items
      effect = await processConsumableEffect(item, targetId, targetType);
    } else if (item.itemType === 'food') {
      // Xử lý food items
      effect = await processFoodEffect(item, targetId);
    }

    res.json({ 
      success: true, 
      effect,
      remainingQuantity: item.quantity - 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper functions
async function processConsumableEffect(item, targetId, targetType) {
  // Xử lý hiệu ứng của consumable items
  // Có thể là heal, buff stats, etc.
  return { type: 'consumable', effect: 'Item used successfully' };
}

async function processFoodEffect(item, petId) {
  // Xử lý hiệu ứng của food items cho linh thú
  const UserPet = require('../models/UserPet');
  
  const pet = await UserPet.findOneAndUpdate(
    { _id: petId, user: req.user.id },
    { 
      lastFed: new Date(),
      $inc: { happiness: 10 }
    },
    { new: true }
  );

  return { type: 'food', effect: 'Pet happiness increased', pet };
} 