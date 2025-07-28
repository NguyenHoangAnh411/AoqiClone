const Formation = require('../models/Formation');
const UserPet = require('../models/UserPet');
const { 
  calculatePetInfo,
  calculateFormationPetCombatPower,
  calculateFormationPetsCombatPower,
  userPetPopulateOptions,
  sendErrorResponse,
  sendSuccessResponse,
  validateObjectOwnership
} = require('../utils/controllerUtils');

// Lấy tất cả đội hình của user
exports.getUserFormations = async (req, res) => {
  try {
    const formations = await Formation.find({ user: req.user.id })
      .populate(userPetPopulateOptions)
      .sort({ createdAt: -1 });

    // Tính toán combat power cho mỗi formation
    for (let formation of formations) {
      calculateFormationPetsCombatPower(formation);
      await formation.calculateTotalCombatPower();
    }

    sendSuccessResponse(res, 200, { formations });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải danh sách đội hình', err);
  }
};

// Lấy đội hình cụ thể
exports.getFormation = async (req, res) => {
  try {
    const formation = await Formation.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    }).populate(userPetPopulateOptions);

    const validation = validateObjectOwnership(formation, req.user.id, 'đội hình');
    if (!validation.isValid) {
      return sendErrorResponse(res, 404, validation.error);
    }

    calculateFormationPetsCombatPower(formation);
    await formation.calculateTotalCombatPower();

    sendSuccessResponse(res, 200, { formation });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải đội hình', err);
  }
};

// Tạo đội hình mới
exports.createFormation = async (req, res) => {
  try {
    const { name } = req.body;

    // Kiểm tra tên đội hình đã tồn tại chưa
    const existingFormation = await Formation.findOne({ 
      user: req.user.id, 
      name: name.trim() 
    });
    if (existingFormation) {
      return sendErrorResponse(res, 400, 'Tên đội hình đã tồn tại');
    }

    const formation = new Formation({
      user: req.user.id,
      name: name.trim(),
      pets: []
    });

    await formation.save();
    sendSuccessResponse(res, 201, { formation }, 'Tạo đội hình thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi tạo đội hình', err);
  }
};

// Cập nhật đội hình
exports.updateFormation = async (req, res) => {
  try {
    const { name, pets } = req.body;
    const formationId = req.params.id;

    const formation = await Formation.findOne({ 
      _id: formationId, 
      user: req.user.id 
    });

    const validation = validateObjectOwnership(formation, req.user.id, 'đội hình');
    if (!validation.isValid) {
      return sendErrorResponse(res, 404, validation.error);
    }

    // Cập nhật tên nếu có
    if (name && name.trim().length > 0) {
      // Kiểm tra tên đội hình đã tồn tại chưa (trừ đội hình hiện tại)
      const existingFormation = await Formation.findOne({ 
        user: req.user.id, 
        name: name.trim(),
        _id: { $ne: formationId }
      });
      if (existingFormation) {
        return sendErrorResponse(res, 400, 'Tên đội hình đã tồn tại');
      }
      formation.name = name.trim();
    }

    // Cập nhật pets nếu có
    if (pets) {
      formation.pets = pets;
      if (!formation.isValid()) {
        return sendErrorResponse(res, 400, 'Đội hình không hợp lệ');
      }
    }

    await formation.save();
    await formation.populate(userPetPopulateOptions);

    sendSuccessResponse(res, 200, { formation }, 'Cập nhật đội hình thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi cập nhật đội hình', err);
  }
};

// Xóa đội hình
exports.deleteFormation = async (req, res) => {
  try {
    const formation = await Formation.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!formation) {
      return sendErrorResponse(res, 404, 'Không tìm thấy đội hình');
    }

    sendSuccessResponse(res, 200, {}, 'Đã xóa đội hình thành công');
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi xóa đội hình', err);
  }
};

// Set đội hình active
exports.setActiveFormation = async (req, res) => {
  try {
    const formationId = req.params.id;

    // Tắt tất cả đội hình active
    await Formation.updateMany(
      { user: req.user.id },
      { isActive: false }
    );

    // Bật đội hình được chọn
    const formation = await Formation.findOneAndUpdate(
      { _id: formationId, user: req.user.id },
      { isActive: true },
      { new: true }
    ).populate(userPetPopulateOptions);

    if (!formation) {
      return sendErrorResponse(res, 404, 'Không tìm thấy đội hình');
    }

    sendSuccessResponse(res, 200, { formation }, 'Đặt đội hình active thành công');
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi đặt đội hình active', err);
  }
};

// Thêm pet vào đội hình
exports.addPetToFormation = async (req, res) => {
  try {
    const { userPetId, position } = req.body;
    const formationId = req.params.id;

    // Kiểm tra userPet có thuộc về user không
    const userPet = await UserPet.findOne({ 
      _id: userPetId, 
      user: req.user.id 
    });
    if (!userPet) {
      return sendErrorResponse(res, 404, 'Không tìm thấy linh thú');
    }

    const formation = await Formation.findOne({ 
      _id: formationId, 
      user: req.user.id 
    });
    if (!formation) {
      return sendErrorResponse(res, 404, 'Không tìm thấy đội hình');
    }

    // Thêm pet vào đội hình
    formation.addPet(userPetId, position);
    
    // Cleanup inactive pets trước khi save
    formation.cleanupInactivePets();
    
    await formation.save();
    await formation.populate(userPetPopulateOptions);

    // Tính toán combat power cho mỗi pet trong formation
    calculateFormationPetsCombatPower(formation);
    await formation.calculateTotalCombatPower();

    sendSuccessResponse(res, 200, { formation }, 'Thêm linh thú vào đội hình thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi thêm linh thú vào đội hình', err);
  }
};

// Xóa pet khỏi đội hình
exports.removePetFromFormation = async (req, res) => {
  try {
    const { position } = req.params;
    const formationId = req.params.id;

    const formation = await Formation.findOne({ 
      _id: formationId, 
      user: req.user.id 
    });
    if (!formation) {
      return sendErrorResponse(res, 404, 'Không tìm thấy đội hình');
    }

    // Xóa pet khỏi đội hình
    formation.removePet(parseInt(position));
    
    // Cleanup inactive pets trước khi save
    formation.cleanupInactivePets();
    
    await formation.save();
    await formation.populate(userPetPopulateOptions);

    // Tính toán combat power cho mỗi pet trong formation
    calculateFormationPetsCombatPower(formation);
    await formation.calculateTotalCombatPower();

    sendSuccessResponse(res, 200, { formation }, 'Xóa linh thú khỏi đội hình thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi xóa linh thú khỏi đội hình', err);
  }
};

// Di chuyển pet trong đội hình
exports.movePetInFormation = async (req, res) => {
  try {
    const { fromPosition, toPosition } = req.body;
    const formationId = req.params.id;

    const formation = await Formation.findOne({ 
      _id: formationId, 
      user: req.user.id 
    });
    if (!formation) {
      return sendErrorResponse(res, 404, 'Không tìm thấy đội hình');
    }

    // Di chuyển pet
    formation.movePet(parseInt(fromPosition), parseInt(toPosition));
    await formation.save();
    await formation.populate(userPetPopulateOptions);

    sendSuccessResponse(res, 200, { formation }, 'Di chuyển linh thú thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi di chuyển linh thú', err);
  }
};

// Lấy danh sách pet có thể thêm vào đội hình
exports.getAvailablePets = async (req, res) => {
  try {
    const formationId = req.params.id;

    const formation = await Formation.findOne({ 
      _id: formationId, 
      user: req.user.id 
    });
    if (!formation) {
      return sendErrorResponse(res, 404, 'Không tìm thấy đội hình');
    }

    // Lấy tất cả pet của user
    const allUserPets = await UserPet.find({ user: req.user.id })
      .populate([
        { path: 'pet', populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' }
        ]}
      ]);

    // Lọc ra những pet chưa có trong đội hình
    const usedPetIds = formation.pets
      .filter(pet => pet.isActive)
      .map(pet => pet.userPet.toString());

    const availablePets = allUserPets.filter(pet => 
      !usedPetIds.includes(pet._id.toString())
    );

    // Tính toán thông tin cho mỗi pet
    const enrichedAvailablePets = availablePets.map(pet => calculatePetInfo(pet));

    sendSuccessResponse(res, 200, { availablePets: enrichedAvailablePets });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải danh sách linh thú có thể thêm', err);
  }
};

// Cập nhật lại lực chiến cho tất cả đội hình
exports.recalculateAllFormations = async (req, res) => {
  try {
    const formations = await Formation.find({ user: req.user.id });
    
    for (let formation of formations) {
      await formation.calculateTotalCombatPower();
      await formation.save();
    }

    sendSuccessResponse(res, 200, {
      count: formations.length
    }, `Đã cập nhật lực chiến cho ${formations.length} đội hình`);
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi cập nhật lực chiến', err);
  }
};

// Cleanup tất cả formations của user
exports.cleanupAllFormations = async (req, res) => {
  try {
    const formations = await Formation.find({ user: req.user.id });
    let totalCleaned = 0;
    
    for (let formation of formations) {
      const beforeCount = formation.pets.length;
      formation.cleanupInactivePets();
      const afterCount = formation.pets.length;
      
      if (beforeCount !== afterCount) {
        await formation.save();
        totalCleaned += (beforeCount - afterCount);
      }
    }

    sendSuccessResponse(res, 200, {
      formationsCleaned: formations.length,
      recordsRemoved: totalCleaned
    }, `Đã cleanup ${formations.length} đội hình, xóa ${totalCleaned} records cũ`);
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi cleanup formations', err);
  }
}; 