const Formation = require('../models/Formation');
const UserPet = require('../models/UserPet');

// Lấy tất cả đội hình của user
exports.getUserFormations = async (req, res) => {
  try {
    const formations = await Formation.find({ user: req.user.id })
      .populate({
        path: 'pets.userPet',
        populate: {
          path: 'pet',
          populate: [
            { path: 'normalSkill' },
            { path: 'ultimateSkill' },
            { path: 'passiveSkill' }
          ]
        }
      })
      .sort({ createdAt: -1 });

    res.json(formations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy đội hình cụ thể
exports.getFormation = async (req, res) => {
  try {
    const formation = await Formation.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    })
      .populate({
        path: 'pets.userPet',
        populate: {
          path: 'pet',
          populate: [
            { path: 'normalSkill' },
            { path: 'ultimateSkill' },
            { path: 'passiveSkill' }
          ]
        }
      });

    if (!formation) {
      return res.status(404).json({ error: 'Không tìm thấy đội hình' });
    }

    res.json(formation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo đội hình mới
exports.createFormation = async (req, res) => {
  try {
    const { name, pets } = req.body;

    // Kiểm tra tên đội hình
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên đội hình không được để trống' });
    }

    // Kiểm tra tên đội hình đã tồn tại chưa
    const existingFormation = await Formation.findOne({ 
      user: req.user.id, 
      name: name.trim() 
    });
    if (existingFormation) {
      return res.status(400).json({ error: 'Tên đội hình đã tồn tại' });
    }

    // Tạo đội hình mới
    const formation = new Formation({
      user: req.user.id,
      name: name.trim(),
      pets: pets || []
    });

    // Kiểm tra đội hình hợp lệ
    if (!formation.isValid()) {
      return res.status(400).json({ error: 'Đội hình không hợp lệ' });
    }

    await formation.save();

    // Populate thông tin pet
    await formation.populate({
      path: 'pets.userPet',
      populate: {
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' }
        ]
      }
    });

    res.status(201).json(formation);
  } catch (err) {
    res.status(400).json({ error: err.message });
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

    if (!formation) {
      return res.status(404).json({ error: 'Không tìm thấy đội hình' });
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
        return res.status(400).json({ error: 'Tên đội hình đã tồn tại' });
      }
      formation.name = name.trim();
    }

    // Cập nhật pets nếu có
    if (pets) {
      formation.pets = pets;
      if (!formation.isValid()) {
        return res.status(400).json({ error: 'Đội hình không hợp lệ' });
      }
    }

    await formation.save();

    // Populate thông tin pet
    await formation.populate({
      path: 'pets.userPet',
      populate: {
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' }
        ]
      }
    });

    res.json(formation);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
      return res.status(404).json({ error: 'Không tìm thấy đội hình' });
    }

    res.json({ success: true, message: 'Đã xóa đội hình' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    )
      .populate({
        path: 'pets.userPet',
        populate: {
          path: 'pet',
          populate: [
            { path: 'normalSkill' },
            { path: 'ultimateSkill' },
            { path: 'passiveSkill' }
          ]
        }
      });

    if (!formation) {
      return res.status(404).json({ error: 'Không tìm thấy đội hình' });
    }

    res.json(formation);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      return res.status(404).json({ error: 'Không tìm thấy linh thú' });
    }

    const formation = await Formation.findOne({ 
      _id: formationId, 
      user: req.user.id 
    });
    if (!formation) {
      return res.status(404).json({ error: 'Không tìm thấy đội hình' });
    }

    // Thêm pet vào đội hình
    formation.addPet(userPetId, position);
    await formation.save();

    // Populate thông tin pet
    await formation.populate({
      path: 'pets.userPet',
      populate: {
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' }
        ]
      }
    });

    res.json(formation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa pet khỏi đội hình
exports.removePetFromFormation = async (req, res) => {
  try {
    const { position } = req.params;
    const formationId = req.params.formationId;

    const formation = await Formation.findOne({ 
      _id: formationId, 
      user: req.user.id 
    });
    if (!formation) {
      return res.status(404).json({ error: 'Không tìm thấy đội hình' });
    }

    // Xóa pet khỏi đội hình
    formation.removePet(parseInt(position));
    await formation.save();

    // Populate thông tin pet
    await formation.populate({
      path: 'pets.userPet',
      populate: {
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' }
        ]
      }
    });

    res.json(formation);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
      return res.status(404).json({ error: 'Không tìm thấy đội hình' });
    }

    // Di chuyển pet
    formation.movePet(parseInt(fromPosition), parseInt(toPosition));
    await formation.save();

    // Populate thông tin pet
    await formation.populate({
      path: 'pets.userPet',
      populate: {
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' }
        ]
      }
    });

    res.json(formation);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
      return res.status(404).json({ error: 'Không tìm thấy đội hình' });
    }

    // Lấy tất cả pet của user
    const allUserPets = await UserPet.find({ user: req.user.id })
      .populate({
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' }
        ]
      });

    // Lọc ra những pet chưa có trong đội hình
    const usedPetIds = formation.pets
      .filter(pet => pet.isActive)
      .map(pet => pet.userPet.toString());

    const availablePets = allUserPets.filter(pet => 
      !usedPetIds.includes(pet._id.toString())
    );

    res.json(availablePets);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    res.json({
      message: `Đã cập nhật lực chiến cho ${formations.length} đội hình`,
      count: formations.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 