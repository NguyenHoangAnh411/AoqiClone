const Element = require('../models/Element');
const Rarity = require('../models/Rarity');
const Effect = require('../models/Effect');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/controllerUtils');

// ==================== ELEMENT APIs ====================

// Tạo element mới
exports.createElement = async (req, res) => {
  try {
    const {
      name,
      displayName,
      icon,
      color,
      description,
      characteristics,
      effectivenessMatrix
    } = req.body;

    // Kiểm tra element đã tồn tại chưa
    const existingElement = await Element.findOne({ name });
    if (existingElement) {
      return sendErrorResponse(res, 400, 'Element đã tồn tại');
    }

    // Tạo element mới
    const element = new Element({
      name,
      displayName,
      icon,
      color,
      description,
      characteristics,
      effectivenessMatrix
    });

    await element.save();

    sendSuccessResponse(res, 201, { element }, 'Tạo element thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi tạo element', error);
  }
};

// Lấy tất cả elements
exports.getAllElements = async (req, res) => {
  try {
    const elements = await Element.find({ isActive: true }).sort({ name: 1 });
    sendSuccessResponse(res, 200, { elements }, 'Lấy danh sách elements thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy danh sách elements', error);
  }
};

// Lấy element theo ID
exports.getElementById = async (req, res) => {
  try {
    const element = await Element.findById(req.params.id);
    if (!element) {
      return sendErrorResponse(res, 404, 'Không tìm thấy element');
    }
    sendSuccessResponse(res, 200, { element }, 'Lấy element thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy element', error);
  }
};

// Cập nhật element
exports.updateElement = async (req, res) => {
  try {
    const element = await Element.findById(req.params.id);
    if (!element) {
      return sendErrorResponse(res, 404, 'Không tìm thấy element');
    }

    // Cập nhật các trường
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        element[key] = req.body[key];
      }
    });

    await element.save();
    sendSuccessResponse(res, 200, { element }, 'Cập nhật element thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi cập nhật element', error);
  }
};

// Xóa element (soft delete)
exports.deleteElement = async (req, res) => {
  try {
    const element = await Element.findById(req.params.id);
    if (!element) {
      return sendErrorResponse(res, 404, 'Không tìm thấy element');
    }

    element.isActive = false;
    await element.save();

    sendSuccessResponse(res, 200, {}, 'Xóa element thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi xóa element', error);
  }
};

// ==================== RARITY APIs ====================

// Tạo rarity mới
exports.createRarity = async (req, res) => {
  try {
    const {
      name,
      displayName,
      icon,
      color,
      dropRate,
      expMultiplier
    } = req.body;

    // Kiểm tra rarity đã tồn tại chưa
    const existingRarity = await Rarity.findOne({ name });
    if (existingRarity) {
      return sendErrorResponse(res, 400, 'Rarity đã tồn tại');
    }

    // Tạo rarity mới
    const rarity = new Rarity({
      name,
      displayName,
      icon,
      color,
      dropRate,
      expMultiplier
    });

    await rarity.save();

    sendSuccessResponse(res, 201, { rarity }, 'Tạo rarity thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi tạo rarity', error);
  }
};

// Lấy tất cả rarities
exports.getAllRarities = async (req, res) => {
  try {
    const rarities = await Rarity.find({ isActive: true }).sort({ name: 1 });
    sendSuccessResponse(res, 200, { rarities }, 'Lấy danh sách rarities thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy danh sách rarities', error);
  }
};

// Lấy rarity theo ID
exports.getRarityById = async (req, res) => {
  try {
    const rarity = await Rarity.findById(req.params.id);
    if (!rarity) {
      return sendErrorResponse(res, 404, 'Không tìm thấy rarity');
    }
    sendSuccessResponse(res, 200, { rarity }, 'Lấy rarity thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy rarity', error);
  }
};

// Cập nhật rarity
exports.updateRarity = async (req, res) => {
  try {
    const rarity = await Rarity.findById(req.params.id);
    if (!rarity) {
      return sendErrorResponse(res, 404, 'Không tìm thấy rarity');
    }

    // Cập nhật các trường
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        rarity[key] = req.body[key];
      }
    });

    await rarity.save();
    sendSuccessResponse(res, 200, { rarity }, 'Cập nhật rarity thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi cập nhật rarity', error);
  }
};

// Xóa rarity (soft delete)
exports.deleteRarity = async (req, res) => {
  try {
    const rarity = await Rarity.findById(req.params.id);
    if (!rarity) {
      return sendErrorResponse(res, 404, 'Không tìm thấy rarity');
    }

    // Check if rarity is being used by any pets
    const petsUsingRarity = await Pet.find({ rarity: rarity._id });

    if (petsUsingRarity.length > 0) {
      return sendErrorResponse(res, 400, 
        `Không thể xóa rarity vì đang được sử dụng bởi ${petsUsingRarity.length} pets`
      );
    }

    rarity.isActive = false;
    await rarity.save();

    sendSuccessResponse(res, 200, {}, 'Xóa rarity thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi xóa rarity', error);
  }
};

// ==================== EFFECT APIs ====================

// Tạo effect mới
exports.createEffect = async (req, res) => {
  try {
    const {
      name,
      displayName,
      type,
      category,
      description,
      icon,
      parameters,
      targetType,
      range,
      conditions,
      stacking,
      resistance,
      visualEffects,
      isActive,
      isStackable
    } = req.body;

    // Kiểm tra effect đã tồn tại chưa
    const existingEffect = await Effect.findOne({ name });
    if (existingEffect) {
      return sendErrorResponse(res, 400, 'Effect đã tồn tại');
    }

    // Tạo effect mới
    const effect = new Effect({
      name,
      displayName,
      type,
      category,
      description,
      icon,
      parameters,
      targetType,
      range,
      conditions,
      stacking,
      resistance,
      visualEffects,
      isActive,
      isStackable
    });

    await effect.save();

    sendSuccessResponse(res, 201, { effect }, 'Tạo effect thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi tạo effect', error);
  }
};

// Lấy tất cả effects
exports.getAllEffects = async (req, res) => {
  try {
    const { type, category, isActive = true } = req.query;
    
    // Build filter
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    const effects = await Effect.find(filter).sort({ name: 1 });
    
    // Group by type for better organization
    const effectsByType = {
      status: effects.filter(e => e.type === 'status'),
      buff: effects.filter(e => e.type === 'buff'),
      debuff: effects.filter(e => e.type === 'debuff'),
      special: effects.filter(e => e.type === 'special')
    };
    
    sendSuccessResponse(res, 200, { 
      effects, 
      effectsByType,
      total: effects.length,
      counts: {
        status: effectsByType.status.length,
        buff: effectsByType.buff.length,
        debuff: effectsByType.debuff.length,
        special: effectsByType.special.length
      }
    }, 'Lấy danh sách effects thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy danh sách effects', error);
  }
};

// Lấy effect theo ID
exports.getEffectById = async (req, res) => {
  try {
    const effect = await Effect.findById(req.params.id);
    if (!effect) {
      return sendErrorResponse(res, 404, 'Không tìm thấy effect');
    }
    
    // Get display info using the method
    const displayInfo = effect.getDisplayInfo();
    
    sendSuccessResponse(res, 200, { 
      effect,
      displayInfo 
    }, 'Lấy effect thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy effect', error);
  }
};

// Cập nhật effect
exports.updateEffect = async (req, res) => {
  try {
    const effect = await Effect.findById(req.params.id);
    if (!effect) {
      return sendErrorResponse(res, 404, 'Không tìm thấy effect');
    }

    // Cập nhật các trường
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt') {
        effect[key] = req.body[key];
      }
    });

    await effect.save();
    
    // Get updated display info
    const displayInfo = effect.getDisplayInfo();
    
    sendSuccessResponse(res, 200, { 
      effect,
      displayInfo 
    }, 'Cập nhật effect thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi cập nhật effect', error);
  }
};

// Xóa effect (soft delete)
exports.deleteEffect = async (req, res) => {
  try {
    const effect = await Effect.findById(req.params.id);
    if (!effect) {
      return sendErrorResponse(res, 404, 'Không tìm thấy effect');
    }

    // Check if effect is being used by any skills
    const skillsUsingEffect = await Skill.find({
      'effects.effect': effect._id
    });

    if (skillsUsingEffect.length > 0) {
      return sendErrorResponse(res, 400, 
        `Không thể xóa effect vì đang được sử dụng bởi ${skillsUsingEffect.length} skills`
      );
    }

    effect.isActive = false;
    await effect.save();

    sendSuccessResponse(res, 200, {}, 'Xóa effect thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi xóa effect', error);
  }
};

// Lấy effects theo type
exports.getEffectsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { isActive = true } = req.query;
    
    if (!['status', 'buff', 'debuff', 'special'].includes(type)) {
      return sendErrorResponse(res, 400, 'Type không hợp lệ');
    }
    
    const filter = { type, isActive: isActive === 'true' };
    const effects = await Effect.find(filter).sort({ name: 1 });
    
    sendSuccessResponse(res, 200, { 
      effects,
      type,
      total: effects.length
    }, `Lấy danh sách ${type} effects thành công`);
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy effects theo type', error);
  }
};

// Lấy effects theo category
exports.getEffectsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { isActive = true } = req.query;
    
    const filter = { category, isActive: isActive === 'true' };
    const effects = await Effect.find(filter).sort({ name: 1 });
    
    sendSuccessResponse(res, 200, { 
      effects,
      category,
      total: effects.length
    }, `Lấy danh sách effects category ${category} thành công`);
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy effects theo category', error);
  }
};

// Tìm kiếm effects
exports.searchEffects = async (req, res) => {
  try {
    const { q, type, category, isActive = true } = req.query;
    
    const filter = { isActive: isActive === 'true' };
    
    // Text search
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Type filter
    if (type) filter.type = type;
    
    // Category filter
    if (category) filter.category = category;
    
    const effects = await Effect.find(filter).sort({ name: 1 });
    
    sendSuccessResponse(res, 200, { 
      effects,
      query: q,
      total: effects.length
    }, 'Tìm kiếm effects thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi tìm kiếm effects', error);
  }
};

// Lấy thống kê effects
exports.getEffectStats = async (req, res) => {
  try {
    const stats = await Effect.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);
    
    const categoryStats = await Effect.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const totalEffects = await Effect.countDocuments();
    const activeEffects = await Effect.countDocuments({ isActive: true });
    
    sendSuccessResponse(res, 200, {
      stats: {
        total: totalEffects,
        active: activeEffects,
        inactive: totalEffects - activeEffects
      },
      typeStats: stats,
      categoryStats,
      topCategories: categoryStats.slice(0, 5)
    }, 'Lấy thống kê effects thành công');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy thống kê effects', error);
  }
};

// ==================== BULK OPERATIONS ====================

// Tạo nhiều elements cùng lúc
exports.createMultipleElements = async (req, res) => {
  try {
    const elements = req.body;

    if (!Array.isArray(elements)) {
      return sendErrorResponse(res, 400, 'Elements phải là một array');
    }

    const createdElements = [];
    const errors = [];

    for (const elementData of elements) {
      try {
        // Kiểm tra element đã tồn tại chưa
        const existingElement = await Element.findOne({ name: elementData.name });
        if (existingElement) {
          errors.push(`Element "${elementData.name}" đã tồn tại`);
          continue;
        }

        const element = new Element(elementData);
        await element.save();
        createdElements.push(element);
      } catch (error) {
        errors.push(`Lỗi khi tạo element "${elementData.name}": ${error.message}`);
      }
    }

    sendSuccessResponse(res, 201, { 
      createdElements, 
      errors,
      totalCreated: createdElements.length,
      totalErrors: errors.length
    }, 'Tạo elements hoàn tất');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi tạo multiple elements', error);
  }
};

// Tạo nhiều rarities cùng lúc
exports.createMultipleRarities = async (req, res) => {
  try {
    const rarities = req.body;

    if (!Array.isArray(rarities)) {
      return sendErrorResponse(res, 400, 'Rarities phải là một array');
    }

    const createdRarities = [];
    const errors = [];

    for (const rarityData of rarities) {
      try {
        // Kiểm tra rarity đã tồn tại chưa
        const existingRarity = await Rarity.findOne({ name: rarityData.name });
        if (existingRarity) {
          errors.push(`Rarity "${rarityData.name}" đã tồn tại`);
          continue;
        }

        const rarity = new Rarity(rarityData);
        await rarity.save();
        createdRarities.push(rarity);
      } catch (error) {
        errors.push(`Lỗi khi tạo rarity "${rarityData.name}": ${error.message}`);
      }
    }

    sendSuccessResponse(res, 201, { 
      createdRarities, 
      errors,
      totalCreated: createdRarities.length,
      totalErrors: errors.length
    }, 'Tạo rarities hoàn tất');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi tạo multiple rarities', error);
  }
};

// Import rarities từ JSON
exports.importRaritiesFromJson = async (req, res) => {
  try {
    const { rarities, clearExisting = false } = req.body;

    if (!Array.isArray(rarities)) {
      return sendErrorResponse(res, 400, 'Rarities phải là một array');
    }

    // Clear existing rarities if requested
    if (clearExisting) {
      await Rarity.deleteMany({});
    }

    const createdRarities = [];
    const updatedRarities = [];
    const errors = [];

    for (const rarityData of rarities) {
      try {
        // Kiểm tra rarity đã tồn tại chưa
        const existingRarity = await Rarity.findOne({ name: rarityData.name });
        
        if (existingRarity) {
          // Update existing rarity
          Object.keys(rarityData).forEach(key => {
            if (key !== '_id' && key !== '__v' && key !== 'createdAt') {
              existingRarity[key] = rarityData[key];
            }
          });
          
          await existingRarity.save();
          updatedRarities.push(existingRarity);
        } else {
          // Create new rarity
          const rarity = new Rarity(rarityData);
          await rarity.save();
          createdRarities.push(rarity);
        }
      } catch (error) {
        errors.push(`Lỗi khi xử lý rarity "${rarityData.name}": ${error.message}`);
      }
    }

    sendSuccessResponse(res, 200, { 
      createdRarities,
      updatedRarities,
      errors,
      totalCreated: createdRarities.length,
      totalUpdated: updatedRarities.length,
      totalErrors: errors.length
    }, 'Import rarities hoàn tất');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi import rarities', error);
  }
};

// Tạo nhiều effects cùng lúc
exports.createMultipleEffects = async (req, res) => {
  try {
    const effects = req.body;

    if (!Array.isArray(effects)) {
      return sendErrorResponse(res, 400, 'Effects phải là một array');
    }

    const createdEffects = [];
    const errors = [];

    for (const effectData of effects) {
      try {
        // Kiểm tra effect đã tồn tại chưa
        const existingEffect = await Effect.findOne({ name: effectData.name });
        if (existingEffect) {
          errors.push(`Effect "${effectData.name}" đã tồn tại`);
          continue;
        }

        const effect = new Effect(effectData);
        await effect.save();
        createdEffects.push(effect);
      } catch (error) {
        errors.push(`Lỗi khi tạo effect "${effectData.name}": ${error.message}`);
      }
    }

    sendSuccessResponse(res, 201, { 
      createdEffects, 
      errors,
      totalCreated: createdEffects.length,
      totalErrors: errors.length
    }, 'Tạo effects hoàn tất');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi tạo multiple effects', error);
  }
};

// Cập nhật nhiều effects cùng lúc
exports.updateMultipleEffects = async (req, res) => {
  try {
    const { effects } = req.body;

    if (!Array.isArray(effects)) {
      return sendErrorResponse(res, 400, 'Effects phải là một array');
    }

    const updatedEffects = [];
    const errors = [];

    for (const effectUpdate of effects) {
      try {
        const { id, ...updateData } = effectUpdate;
        
        if (!id) {
          errors.push('Thiếu ID cho effect');
          continue;
        }

        const effect = await Effect.findById(id);
        if (!effect) {
          errors.push(`Không tìm thấy effect với ID: ${id}`);
          continue;
        }

        // Cập nhật các trường
        Object.keys(updateData).forEach(key => {
          if (key !== '_id' && key !== '__v' && key !== 'createdAt') {
            effect[key] = updateData[key];
          }
        });

        await effect.save();
        updatedEffects.push(effect);
      } catch (error) {
        errors.push(`Lỗi khi cập nhật effect: ${error.message}`);
      }
    }

    sendSuccessResponse(res, 200, { 
      updatedEffects, 
      errors,
      totalUpdated: updatedEffects.length,
      totalErrors: errors.length
    }, 'Cập nhật effects hoàn tất');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi cập nhật multiple effects', error);
  }
};

// Import effects từ JSON
exports.importEffectsFromJson = async (req, res) => {
  try {
    const { effects, clearExisting = false } = req.body;

    if (!Array.isArray(effects)) {
      return sendErrorResponse(res, 400, 'Effects phải là một array');
    }

    // Clear existing effects if requested
    if (clearExisting) {
      await Effect.deleteMany({});
    }

    const createdEffects = [];
    const updatedEffects = [];
    const errors = [];

    for (const effectData of effects) {
      try {
        // Kiểm tra effect đã tồn tại chưa
        const existingEffect = await Effect.findOne({ name: effectData.name });
        
        if (existingEffect) {
          // Update existing effect
          Object.keys(effectData).forEach(key => {
            if (key !== '_id' && key !== '__v' && key !== 'createdAt') {
              existingEffect[key] = effectData[key];
            }
          });
          
          await existingEffect.save();
          updatedEffects.push(existingEffect);
        } else {
          // Create new effect
          const effect = new Effect(effectData);
          await effect.save();
          createdEffects.push(effect);
        }
      } catch (error) {
        errors.push(`Lỗi khi xử lý effect "${effectData.name}": ${error.message}`);
      }
    }

    sendSuccessResponse(res, 200, { 
      createdEffects,
      updatedEffects,
      errors,
      totalCreated: createdEffects.length,
      totalUpdated: updatedEffects.length,
      totalErrors: errors.length
    }, 'Import effects hoàn tất');
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi import effects', error);
  }
}; 