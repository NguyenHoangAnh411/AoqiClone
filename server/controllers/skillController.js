const Skill = require('../models/Skill');
const Pet = require('../models/Pet');

// Tạo skill set cho một pet (normal + ultimate + passive)
exports.createSkillSet = async (req, res) => {
  try {
    const { petId, skillSet } = req.body;
    
    // Validate skill set
    if (!skillSet.normal || !skillSet.ultimate) {
      return res.status(400).json({ error: 'Cần có ít nhất normal skill và ultimate skill' });
    }

    // Kiểm tra pet tồn tại
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Không tìm thấy pet' });
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

    res.status(201).json({
      success: true,
      message: 'Tạo skill set thành công',
      skillSet: {
        normal: normalSkill,
        ultimate: ultimateSkill,
        passive: passiveSkill
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    res.json(skillSet);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy skill theo ID
exports.getSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id).populate('petId', 'name element');
    if (!skill) return res.status(404).json({ error: 'Không tìm thấy skill' });
    res.json(skill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật skill
exports.updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!skill) return res.status(404).json({ error: 'Không tìm thấy skill' });
    res.json(skill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa skill
exports.deleteSkill = async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    res.json({ success: true, message: 'Đã xóa toàn bộ skill set của pet' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Legacy functions for backward compatibility
exports.createSkill = async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json(skill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 