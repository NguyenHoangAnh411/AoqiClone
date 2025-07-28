const Inventory = require('../models/Inventory');
const { 
  sendErrorResponse, 
  sendSuccessResponse, 
  inventoryPopulateOptions,
  getPaginationOptions,
  getSortOptions,
  getFilterOptions,
  processConsumableEffect,
  processFoodEffect
} = require('../utils/controllerUtils');

exports.getInventory = async (req, res) => {
  try {
    const { itemType, limit = 50, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build filter
    const filter = { user: req.user.id };
    if (itemType) {
      filter.itemType = itemType;
    }

    // Get pagination and sort options
    const { skip, limit: limitNum } = getPaginationOptions(page, limit);
    const sort = getSortOptions(sortBy, sortOrder);

    const inventory = await Inventory.find(filter)
      .populate(inventoryPopulateOptions)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Inventory.countDocuments(filter);

    sendSuccessResponse(res, 200, { 
      inventory,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải inventory', err);
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
      ).populate(inventoryPopulateOptions);
      
      return sendSuccessResponse(res, 200, { item: updatedItem }, 'Cập nhật số lượng item thành công');
    }

    // Nếu chưa có, tạo mới
    const newItem = await Inventory.create({
      user: req.user.id,
      itemId,
      itemType,
      quantity,
      durability
    });

    const populatedItem = await Inventory.findById(newItem._id).populate(inventoryPopulateOptions);
    sendSuccessResponse(res, 201, { item: populatedItem }, 'Thêm item thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi thêm item', err);
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
      return sendErrorResponse(res, 404, 'Không tìm thấy item');
    }

    if (item.quantity < quantity) {
      return sendErrorResponse(res, 400, 'Số lượng item không đủ');
    }

    if (item.quantity === quantity) {
      // Xóa item nếu số lượng = 0
      await Inventory.findByIdAndDelete(item._id);
      sendSuccessResponse(res, 200, {}, 'Item đã được xóa');
    } else {
      // Giảm số lượng
      const updatedItem = await Inventory.findByIdAndUpdate(
        item._id,
        { $inc: { quantity: -quantity } },
        { new: true }
      ).populate(inventoryPopulateOptions);
      
      sendSuccessResponse(res, 200, { item: updatedItem }, 'Giảm số lượng item thành công');
    }
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi xóa item', err);
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { quantity, durability, isActive } = req.body;
    
    const item = await Inventory.findOne({ 
      _id: inventoryId, 
      user: req.user.id 
    });

    if (!item) {
      return sendErrorResponse(res, 404, 'Không tìm thấy item');
    }

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (durability !== undefined) updateData.durability = durability;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedItem = await Inventory.findByIdAndUpdate(
      inventoryId,
      updateData,
      { new: true }
    ).populate(inventoryPopulateOptions);

    sendSuccessResponse(res, 200, { item: updatedItem }, 'Cập nhật item thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi cập nhật item', err);
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
      return sendErrorResponse(res, 404, 'Không tìm thấy equipment');
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
    ).populate(inventoryPopulateOptions);

    sendSuccessResponse(res, 200, { item: equippedItem }, 'Trang bị item thành công');
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi trang bị item', err);
  }
};

exports.unequipItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    
    const item = await Inventory.findOneAndUpdate(
      { _id: inventoryId, user: req.user.id },
      { isEquipped: false },
      { new: true }
    ).populate(inventoryPopulateOptions);

    if (!item) {
      return sendErrorResponse(res, 404, 'Không tìm thấy item');
    }

    sendSuccessResponse(res, 200, { item: item }, 'Bỏ trang bị item thành công');
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi bỏ trang bị item', err);
  }
};

exports.getEquippedItems = async (req, res) => {
  try {
    const equippedItems = await Inventory.find({
      user: req.user.id,
      isEquipped: true
    }).populate(inventoryPopulateOptions);

    sendSuccessResponse(res, 200, { equippedItems });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải trang bị', err);
  }
};

exports.useItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { targetId, targetType } = req.body;
    
    const item = await Inventory.findOne({ 
      _id: inventoryId, 
      user: req.user.id 
    }).populate(inventoryPopulateOptions);

    if (!item) {
      return sendErrorResponse(res, 404, 'Không tìm thấy item');
    }

    if (item.quantity <= 0) {
      return sendErrorResponse(res, 400, 'Item đã hết');
    }

    // Process item effect based on type
    let result;
    if (item.itemType === 'consumable') {
      result = await processConsumableEffect(item, targetId, targetType);
    } else if (item.itemType === 'food') {
      result = await processFoodEffect(item, targetId);
    } else {
      return sendErrorResponse(res, 400, 'Loại item không hỗ trợ sử dụng');
    }

    if (!result.success) {
      return sendErrorResponse(res, 400, 'Không thể sử dụng item');
    }

    // Reduce quantity
    if (item.quantity === 1) {
      await Inventory.findByIdAndDelete(inventoryId);
    } else {
      await Inventory.findByIdAndUpdate(inventoryId, { $inc: { quantity: -1 } });
    }

    sendSuccessResponse(res, 200, { 
      effect: result.effect,
      remainingQuantity: item.quantity - 1
    }, 'Sử dụng item thành công');
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi sử dụng item', err);
  }
}; 