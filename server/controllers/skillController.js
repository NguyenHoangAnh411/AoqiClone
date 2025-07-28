const Skill = require('../models/Skill');
const Pet = require('../models/Pet');
const { 
  sendErrorResponse, 
  sendSuccessResponse, 
  validateRequiredFields,
  petPopulateOptions
} = require('../utils/controllerUtils');

// Tạo skill set cho một pet (normal + ultimate + passive)
exports.createSkillSet = async (req, res) => {
  try {
    const { petId, skillSet } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['petId', 'skillSet']);
    if (!validation.isValid) {
      return sendErrorResponse(res, 400, validation.error);
    }

    // Validate skill set
    if (!skillSet.normal || !skillSet.ultimate) {
      return sendErrorResponse(res, 400, 'Cần có ít nhất normal skill và ultimate skill');
    }

    // Kiểm tra pet tồn tại
    const pet = await Pet.findById(petId);
    if (!pet) {
      return sendErrorResponse(res, 404, 'Không tìm thấy pet');
    }

    // Tạo skillSetId duy nhất
    const skillSetId = `skillset_${petId}_${Date.now()}`;

    // Tạo normal skill (tự động lấy element từ pet)
    const normalSkill = await Skill.create({
      name: skillSet.normal.name,
      description: skillSet.normal.description,
      power: skillSet.normal.power,
      cooldown: skillSet.normal.cooldown,
      effect: skillSet.normal.effect,
      element: pet.element, // Tự động lấy element từ pet
      petId,
      skillSetId,
      type: 'normal'
    });

    // Tạo ultimate skill (tự động lấy element từ pet)
    const ultimateSkill = await Skill.create({
      name: skillSet.ultimate.name,
      description: skillSet.ultimate.description,
      power: skillSet.ultimate.power,
      cooldown: skillSet.ultimate.cooldown,
      effect: skillSet.ultimate.effect,
      element: pet.element, // Tự động lấy element từ pet
      petId,
      skillSetId,
      type: 'ultimate'
    });

    // Tạo passive skill (nếu có) - tự động lấy element từ pet
    let passiveSkill = null;
    if (skillSet.passive) {
      passiveSkill = await Skill.create({
        name: skillSet.passive.name,
        description: skillSet.passive.description,
        power: skillSet.passive.power,
        cooldown: skillSet.passive.cooldown,
        effect: skillSet.passive.effect,
        element: pet.element, // Tự động lấy element từ pet
        petId,
        skillSetId,
        type: 'passive'
      });
    }

    // Cập nhật pet với skill IDs
    const updateData = {
      normalSkill: normalSkill._id,
      ultimateSkill: ultimateSkill._id
    };
    
    if (passiveSkill) {
      updateData.passiveSkill = passiveSkill._id;
    }

    await Pet.findByIdAndUpdate(petId, updateData);

    sendSuccessResponse(res, 201, {
      skillSet: {
        normal: normalSkill,
        ultimate: ultimateSkill,
        passive: passiveSkill
      }
    }, 'Tạo skill set thành công');
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tạo skill set', err);
  }
};

// Lấy skill set của một pet
exports.getPetSkillSet = async (req, res) => {
  try {
    const { petId } = req.params;
    
    const skills = await Skill.find({ petId }).sort({ type: 1 });
    
    const skillSet = {
      normal: skills.find(s => s.type === 'normal'),
      ultimate: skills.find(s => s.type === 'ultimate'),
      passive: skills.find(s => s.type === 'passive')
    };

    sendSuccessResponse(res, 200, { skillSet });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải skill set', err);
  }
};

// Lấy tất cả skills
exports.getSkills = async (req, res) => {
  try {
    const { element, type, petId } = req.query;
    let filter = {};
    
    if (element) filter.element = element;
    if (type) filter.type = type;
    if (petId) filter.petId = petId;

    const skills = await Skill.find(filter).populate('petId', 'name element');
    sendSuccessResponse(res, 200, { skills });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải skills', err);
  }
};

// Lấy skill theo ID
exports.getSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id).populate('petId', 'name element');
    if (!skill) return sendErrorResponse(res, 404, 'Không tìm thấy skill');
    sendSuccessResponse(res, 200, { skill });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải skill', err);
  }
};

// Cập nhật skill
exports.updateSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const updateData = req.body;
    
    const skill = await Skill.findByIdAndUpdate(
      skillId,
      updateData,
      { new: true }
    );

    if (!skill) {
      return sendErrorResponse(res, 404, 'Không tìm thấy skill');
    }

    sendSuccessResponse(res, 200, { skill }, 'Cập nhật skill thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi cập nhật skill', err);
  }
};

// Xóa skill
exports.deleteSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    
    const skill = await Skill.findByIdAndDelete(skillId);

    if (!skill) {
      return sendErrorResponse(res, 404, 'Không tìm thấy skill');
    }

    sendSuccessResponse(res, 200, {}, 'Xóa skill thành công');
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi xóa skill', err);
  }
};

// Xóa toàn bộ skill set của một pet
exports.deletePetSkillSet = async (req, res) => {
  try {
    const { petId } = req.params;
    
    // Xóa tất cả skills của pet
    await Skill.deleteMany({ petId });
    
    // Cập nhật pet (xóa skill references)
    await Pet.findByIdAndUpdate(petId, {
      $unset: { normalSkill: 1, ultimateSkill: 1, passiveSkill: 1 }
    });

    sendSuccessResponse(res, 200, {}, 'Đã xóa toàn bộ skill set của pet');
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi xóa skill set của pet', err);
  }
};

// Lấy tất cả skills của một pet
exports.getPetSkills = async (req, res) => {
  try {
    const { petId } = req.params;
    
    const skills = await Skill.find({ petId }).sort({ type: 1 });

    sendSuccessResponse(res, 200, { skills });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải skills', err);
  }
};

// Lấy skill theo type
exports.getSkillsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    const skills = await Skill.find({ type }).sort({ name: 1 });

    sendSuccessResponse(res, 200, { skills });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải skills theo type', err);
  }
};

// Legacy functions for backward compatibility
exports.createSkill = async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    sendSuccessResponse(res, 201, { skill }, 'Tạo skill thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi tạo skill', err);
  }
}; 