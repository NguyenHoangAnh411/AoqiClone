const UserPet = require('../models/UserPet');
const Pet = require('../models/Pet');
const User = require('../models/User');
const UserBag = require('../models/UserBag');
const Formation = require('../models/Formation');

// ==================== PUBLIC APIs ====================

/**
 * @route   GET /api/userpets
 * @desc    Lấy danh sách pets của user
 * @access  Private
 */
const getUserPets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { location, page = 1, limit = 20, sortBy = 'level', sortOrder = 'desc' } = req.query;
    
    // Build query
    const query = { user: userId };
    if (location && ['bag', 'storage'].includes(location)) {
      query.location = location;
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const userPets = await UserPet.find(query)
      .populate('pet', 'name img element rarity isActive')
      .populate('pet.element', 'name displayName icon color')
      .populate('pet.rarity', 'name displayName icon color')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await UserPet.countDocuments(query);
    
    // Get summary info for each pet
    const petsWithSummary = await Promise.all(
      userPets.map(async (userPet) => {
        const summary = await userPet.getSummary();
        return summary;
      })
    );
    
    res.json({
      success: true,
      data: {
        pets: petsWithSummary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting user pets:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách pets'
    });
  }
};

/**
 * @route   GET /api/userpets/:userPetId
 * @desc    Lấy chi tiết pet của user
 * @access  Private
 */
const getUserPetDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId } = req.params;
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId })
      .populate('pet')
      .populate('pet.element', 'name displayName icon color effectivenessMatrix')
      .populate('pet.rarity', 'name displayName icon color dropRate expMultiplier');
    
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    // Get full info including skills and equipment
    const fullInfo = await userPet.getFullInfo();
    
    res.json({
      success: true,
      data: fullInfo
    });
    
  } catch (error) {
    console.error('Error getting user pet detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết pet'
    });
  }
};

/**
 * @route   POST /api/userpets
 * @desc    Tạo pet mới cho user (từ pet template)
 * @access  Private
 */
const createUserPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { petId, location = 'storage' } = req.body;
    
    // Validate input
    if (!petId) {
      return res.status(400).json({
        success: false,
        message: 'Pet ID là bắt buộc'
      });
    }
    
    if (!['bag', 'storage'].includes(location)) {
      return res.status(400).json({
        success: false,
        message: 'Location phải là "bag" hoặc "storage"'
      });
    }
    
    // Check if pet template exists and is active
    const petTemplate = await Pet.findOne({ _id: petId, isActive: true });
    if (!petTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet template hoặc pet không active'
      });
    }
    
    // Check bag capacity if adding to bag
    if (location === 'bag') {
      const userBag = await UserBag.findOne({ user: userId });
      if (userBag && userBag.pets.length >= userBag.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Bag đã đầy, không thể thêm pet'
        });
      }
    }
    
    // Create new user pet
    const newUserPet = new UserPet({
      user: userId,
      pet: petId,
      level: 1,
      exp: 0,
      location: location,
      evolutionStage: 1,
      skillLevels: {
        normalSkill: 1,
        ultimateSkill: 1,
        passiveSkill: 1
      }
    });
    
    // Calculate initial stats
    await newUserPet.calculateActualStats();
    await newUserPet.calculateCombatPower();
    await newUserPet.updateEvolveStatus();
    
    await newUserPet.save();
    
    // Add to bag if location is bag
    if (location === 'bag') {
      await UserBag.findOneAndUpdate(
        { user: userId },
        { $push: { pets: newUserPet._id } },
        { upsert: true }
      );
    }
    
    // Get full info for response
    const fullInfo = await newUserPet.getFullInfo();
    
    res.status(201).json({
      success: true,
      message: 'Tạo pet thành công',
      data: fullInfo
    });
    
  } catch (error) {
    console.error('Error creating user pet:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo pet'
    });
  }
};

/**
 * @route   PUT /api/userpets/:userPetId/move
 * @desc    Di chuyển pet giữa bag và storage
 * @access  Private
 */
const moveUserPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId } = req.params;
    const { newLocation } = req.body;
    
    if (!['bag', 'storage'].includes(newLocation)) {
      return res.status(400).json({
        success: false,
        message: 'Location phải là "bag" hoặc "storage"'
      });
    }
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId });
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    const oldLocation = userPet.location;
    
    // Check bag capacity if moving to bag
    if (newLocation === 'bag') {
      const userBag = await UserBag.findOne({ user: userId });
      if (userBag && userBag.pets.length >= userBag.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Bag đã đầy, không thể thêm pet'
        });
      }
    }
    
    // Move pet
    userPet.moveTo(newLocation);
    await userPet.save();
    
    // Update bag
    if (oldLocation === 'bag' && newLocation === 'storage') {
      // Remove from bag
      await UserBag.findOneAndUpdate(
        { user: userId },
        { $pull: { pets: userPetId } }
      );
    } else if (oldLocation === 'storage' && newLocation === 'bag') {
      // Add to bag
      await UserBag.findOneAndUpdate(
        { user: userId },
        { $push: { pets: userPetId } },
        { upsert: true }
      );
    }
    
    res.json({
      success: true,
      message: `Di chuyển pet thành công từ ${oldLocation} sang ${newLocation}`,
      data: {
        userPetId: userPet._id,
        oldLocation,
        newLocation
      }
    });
    
  } catch (error) {
    console.error('Error moving user pet:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi di chuyển pet'
    });
  }
};

/**
 * @route   POST /api/userpets/:userPetId/levelup
 * @desc    Level up pet
 * @access  Private
 */
const levelUpUserPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId } = req.params;
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId });
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    // Check if can level up
    const canLevelUp = await userPet.canLevelUp();
    if (!canLevelUp) {
      return res.status(400).json({
        success: false,
        message: 'Không thể level up pet'
      });
    }
    
    // Get user for gold check
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    // Get level up info
    const levelUpInfo = await userPet.getLevelUpInfo();
    if (!levelUpInfo) {
      return res.status(400).json({
        success: false,
        message: 'Không thể lấy thông tin level up'
      });
    }
    
    // Check gold cost (simplified)
    const goldCost = levelUpInfo.cost.golds;
    if (user.golds < goldCost) {
      return res.status(400).json({
        success: false,
        message: `Không đủ gold để level up (cần ${goldCost}, có ${user.golds})`
      });
    }
    
    // Level up
    const result = await userPet.levelUp();
    
    // Deduct gold
    user.golds -= goldCost;
    await user.save();
    
    res.json({
      success: true,
      message: 'Level up thành công',
      data: {
        ...result,
        goldSpent: goldCost,
        remainingGolds: user.golds
      }
    });
    
  } catch (error) {
    console.error('Error leveling up user pet:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi level up pet'
    });
  }
};

/**
 * @route   POST /api/userpets/:userPetId/evolve
 * @desc    Evolve pet
 * @access  Private
 */
const evolveUserPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId } = req.params;
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId });
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    // Check if can evolve
    const canEvolve = await userPet.canEvolve();
    if (!canEvolve) {
      return res.status(400).json({
        success: false,
        message: 'Không thể evolve pet'
      });
    }
    
    // Evolve
    await userPet.evolve();
    await userPet.save();
    
    res.json({
      success: true,
      message: 'Evolve thành công',
      data: {
        userPetId: userPet._id,
        newEvolutionStage: userPet.evolutionStage,
        newStats: userPet.actualStats,
        newCombatPower: userPet.actualCombatPower
      }
    });
    
  } catch (error) {
    console.error('Error evolving user pet:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi evolve pet'
    });
  }
};

/**
 * @route   GET /api/userpets/:userPetId/skills
 * @desc    Lấy thông tin skills của pet
 * @access  Private
 */
const getUserPetSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId } = req.params;
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId });
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    // Get skills with levels
    const skills = await userPet.getSkillsWithLevels();
    
    res.json({
      success: true,
      data: {
        skills,
        skillLevels: userPet.skillLevels
      }
    });
    
  } catch (error) {
    console.error('Error getting user pet skills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin skills'
    });
  }
};

/**
 * @route   POST /api/userpets/:userPetId/skills/:skillType/upgrade
 * @desc    Nâng cấp skill của pet
 * @access  Private
 */
const upgradeUserPetSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId, skillType } = req.params;
    
    if (!['normal', 'ultimate', 'passive'].includes(skillType)) {
      return res.status(400).json({
        success: false,
        message: 'Skill type không hợp lệ'
      });
    }
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId });
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    // Get user for inventory and gold check
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    // Get user inventory (simplified - you might need to implement this)
    const userInventory = []; // TODO: Get from UserInventory model
    
    // Upgrade skill
    const result = await userPet.upgradeSkill(skillType, userInventory, user.golds);
    
    // Deduct gold
    user.golds -= result.goldsSpent;
    await user.save();
    
    // Save user pet
    await userPet.save();
    
    res.json({
      success: true,
      message: 'Nâng cấp skill thành công',
      data: {
        ...result,
        remainingGolds: user.golds
      }
    });
    
  } catch (error) {
    console.error('Error upgrading user pet skill:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi nâng cấp skill'
    });
  }
};

/**
 * @route   GET /api/userpets/:userPetId/equipment
 * @desc    Lấy thông tin equipment của pet
 * @access  Private
 */
const getUserPetEquipment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId } = req.params;
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId });
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    // Get equipment
    const equipment = await userPet.getEquipment();
    const equipmentStats = await userPet.getEquipmentStats();
    
    res.json({
      success: true,
      data: {
        equipment,
        equipmentStats
      }
    });
    
  } catch (error) {
    console.error('Error getting user pet equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin equipment'
    });
  }
};

/**
 * @route   POST /api/userpets/:userPetId/equipment/equip
 * @desc    Trang bị item cho pet
 * @access  Private
 */
const equipItemToUserPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId } = req.params;
    const { itemId, slot } = req.body;
    
    if (!itemId || !slot) {
      return res.status(400).json({
        success: false,
        message: 'Item ID và slot là bắt buộc'
      });
    }
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId });
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    // Equip item
    const result = await userPet.equipItem(itemId, slot);
    
    // Recalculate stats
    await userPet.calculateActualStats();
    await userPet.calculateCombatPower();
    await userPet.save();
    
    res.json({
      success: true,
      message: 'Trang bị item thành công',
      data: {
        ...result,
        newStats: userPet.actualStats,
        newCombatPower: userPet.actualCombatPower
      }
    });
    
  } catch (error) {
    console.error('Error equipping item to user pet:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi trang bị item'
    });
  }
};

/**
 * @route   POST /api/userpets/:userPetId/equipment/unequip
 * @desc    Tháo equipment khỏi pet
 * @access  Private
 */
const unequipItemFromUserPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPetId } = req.params;
    const { slot } = req.body;
    
    if (!slot) {
      return res.status(400).json({
        success: false,
        message: 'Slot là bắt buộc'
      });
    }
    
    const userPet = await UserPet.findOne({ _id: userPetId, user: userId });
    if (!userPet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy pet'
      });
    }
    
    // Unequip item
    const result = await userPet.unequipItem(slot);
    
    // Recalculate stats
    await userPet.calculateActualStats();
    await userPet.calculateCombatPower();
    await userPet.save();
    
    res.json({
      success: true,
      message: 'Tháo equipment thành công',
      data: {
        ...result,
        newStats: userPet.actualStats,
        newCombatPower: userPet.actualCombatPower
      }
    });
    
  } catch (error) {
    console.error('Error unequipping item from user pet:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tháo equipment'
    });
  }
};

module.exports = {
  // Public APIs
  getUserPets,
  getUserPetDetail,
  createUserPet,
  moveUserPet,
  levelUpUserPet,
  evolveUserPet,
  getUserPetSkills,
  upgradeUserPetSkill,
  getUserPetEquipment,
  equipItemToUserPet,
  unequipItemFromUserPet
}; 