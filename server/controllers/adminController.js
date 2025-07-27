const User = require('../models/User');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const UserPet = require('../models/UserPet');
const Battle = require('../models/Battle');
const { 
  calculateCombatPower, 
  calculateStats, 
  calculateActualCombatPower,
  calculateBaseCombatPower,
  calculatePetRating,
  getPetClass
} = require('../utils/petUtils');

class AdminController {

  async getDashboard(req, res) {
    try {
      // Get counts
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalPets = await Pet.countDocuments({ isActive: true });
      const totalSkills = await Skill.countDocuments();
      const totalBattles = await Battle.countDocuments();
      
      // Đảm bảo admin có tất cả linh thú
      // await this.ensureAdminHasAllPets(req.user.id);
  
      // Get recent users (last 5)
      const recentUsers = await User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username createdAt');
  
      // Get recent pets (last 5)
      const recentPets = await Pet.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name createdAt');
  
      res.json({
        totalUsers,
        totalPets,
        totalSkills,
        totalBattles,
        recentUsers,
        recentPets
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  }

  async getPets(req, res) {
    try {
      const { page = 1, limit = 10, element, rarity, search } = req.query;
      const skip = (page - 1) * limit;
  
      let query = { isActive: true };
  
      if (element) query.element = element;
      if (rarity) query.rarity = rarity;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
  
      const pets = await Pet.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('normalSkill ultimateSkill passiveSkill');
  
      // Tính toán thông tin lực chiến động cho mỗi pet
      const petsWithCombatPower = pets.map(pet => {
        const baseCombatPower = calculateBaseCombatPower(pet, pet.rarity, pet.element);
        const petClass = getPetClass(baseCombatPower);
        const rating = calculatePetRating({
          hp: pet.baseHp,
          attack: pet.baseAttack,
          defense: pet.baseDefense,
          speed: pet.baseSpeed
        });
        
        return {
          ...pet.toObject(),
          baseCombatPower,
          petClass,
          rating
        };
      });
  
      const total = await Pet.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
  
      res.json({
        pets: petsWithCombatPower,
        total,
        totalPages,
        currentPage: parseInt(page)
      });
    } catch (err) {
      console.error('Get pets error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };

  async getPet(req, res) {
    try {
      const pet = await Pet.findById(req.params.id)
        .populate('normalSkill ultimateSkill passiveSkill');
      
      if (!pet) {
        return res.status(404).json({ error: 'Không tìm thấy linh thú' });
      }
  
      res.json(pet);
    } catch (err) {
      console.error('Get pet error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };
  
  async createPet(req, res) {
    try {
      const pet = await Pet.create(req.body);
      res.status(201).json(pet);
    } catch (err) {
      console.error('Create pet error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };
  
  async updatePet(req, res) {
    try {
      const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
      
      if (!pet) {
        return res.status(404).json({ error: 'Không tìm thấy linh thú' });
      }
  
      res.json(pet);
    } catch (err) {
      console.error('Update pet error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };
  
  async deletePet(req, res) {
    try {
      const petId = req.params.id;
      
      // Tìm pet trước khi xóa
      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({ error: 'Không tìm thấy linh thú' });
      }

      // Xóa tất cả skills liên quan đến pet này
      const deletedSkills = await Skill.deleteMany({ petId: petId });
      
      // Xóa tất cả UserPet records liên quan đến pet này
      const deletedUserPets = await UserPet.deleteMany({ pet: petId });
      
      // Xóa pet
      const deletedPet = await Pet.findByIdAndDelete(petId);
      
      console.log(`Đã xóa linh thú: ${pet.name}, ${deletedSkills.deletedCount} skills và ${deletedUserPets.deletedCount} UserPet records liên quan`);
  
      res.json({ 
        message: 'Xóa linh thú thành công',
        deletedPet: pet.name,
        deletedSkillsCount: deletedSkills.deletedCount,
        deletedUserPetsCount: deletedUserPets.deletedCount
      });
    } catch (err) {
      console.error('Delete pet error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };
  
  async getPetStats(req, res) {
    try {
      const totalPets = await Pet.countDocuments({ isActive: true });
      const petsByElement = await Pet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$element', count: { $sum: 1 } } }
      ]);
      const petsByRarity = await Pet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$rarity', count: { $sum: 1 } } }
      ]);
      
      // Tính thống kê lực chiến động
      const pets = await Pet.find({ isActive: true });
      const combatPowerStats = {
        average: 0,
        highest: 0,
        lowest: Infinity,
        byClass: {
          COMMON: 0,
          UNCOMMON: 0,
          RARE: 0,
          EPIC: 0,
          LEGENDARY: 0
        }
      };
      
      let totalCombatPower = 0;
      pets.forEach(pet => {
        // Tính lực chiến căn bản (level 1) động
        const combatPower = calculateBaseCombatPower(pet, pet.rarity, pet.element);
        totalCombatPower += combatPower;
        
        if (combatPower > combatPowerStats.highest) {
          combatPowerStats.highest = combatPower;
        }
        if (combatPower < combatPowerStats.lowest) {
          combatPowerStats.lowest = combatPower;
        }
        
        const petClass = getPetClass(combatPower);
        combatPowerStats.byClass[petClass]++;
      });
      
      combatPowerStats.average = Math.floor(totalCombatPower / totalPets);
      if (combatPowerStats.lowest === Infinity) {
        combatPowerStats.lowest = 0;
      }
  
      res.json({
        totalPets,
        petsByElement,
        petsByRarity,
        combatPowerStats
      });
    } catch (err) {
      console.error('Get pet stats error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };

  // Thêm function để admin xem preview lực chiến trước khi lưu
  async previewCombatPower(req, res) {
    try {
      const { baseHp, baseAttack, baseDefense, baseSpeed, rarity, element } = req.body;
      
      const baseCombatPower = calculateBaseCombatPower(
        { baseHp, baseAttack, baseDefense, baseSpeed },
        rarity || 'common',
        element || 'water'
      );
      
      // Tính lực chiến ở các level khác nhau để preview
      const levelPreview = [];
      for (let level = 1; level <= 100; level += 25) {
        const actualCombatPower = calculateActualCombatPower(
          { baseHp, baseAttack, baseDefense, baseSpeed },
          level,
          rarity || 'common',
          element || 'water'
        );
        levelPreview.push({
          level,
          combatPower: actualCombatPower,
          class: getPetClass(actualCombatPower)
        });
      }
      
      res.json({
        baseCombatPower,
        levelPreview,
        petClass: getPetClass(baseCombatPower)
      });
    } catch (err) {
      console.error('Preview combat power error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  }
  
  async getSkills(req, res) {
    try {
      const { page = 1, limit = 10, element, type, petId, search } = req.query;
      const skip = (page - 1) * limit;
  
      let query = {};
  
      if (element) query.element = element;
      if (type) query.type = type;
      if (petId) query.petId = petId;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
  
      const skills = await Skill.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
  
      const total = await Skill.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
  
      res.json({
        skills,
        total,
        totalPages,
        currentPage: parseInt(page)
      });
    } catch (err) {
      console.error('Get skills error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };
  
    async createSkillSet(req, res) {
    try {
      const { petId, skillSet } = req.body;
      
      if (!skillSet.normal || !skillSet.ultimate) {
        return res.status(400).json({ error: 'Cần có ít nhất normal skill và ultimate skill' });
      }

      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({ error: 'Không tìm thấy pet' });
      }

      const skillSetId = `skillset_${petId}_${Date.now()}`;

      // Tạo normal skill với thông tin mới
      const normalSkillData = {
        name: skillSet.normal.name,
        description: skillSet.normal.description,
        power: skillSet.normal.power || 0,
        energyCost: skillSet.normal.energyCost || 20,
        accuracy: skillSet.normal.accuracy || 90,
        criticalRate: skillSet.normal.criticalRate || 5,
        effects: {
          status: skillSet.normal.effects?.status || {},
          buff: skillSet.normal.effects?.buff || {},
          debuff: skillSet.normal.effects?.debuff || {},
          special: skillSet.normal.effects?.special || {},
          duration: skillSet.normal.effects?.duration || {}
        },
        element: pet.element,
        petId,
        skillSetId,
        type: 'normal'
      };

      const normalSkill = await Skill.create(normalSkillData);

      // Tạo ultimate skill với thông tin mới
      const ultimateSkillData = {
        name: skillSet.ultimate.name,
        description: skillSet.ultimate.description,
        power: skillSet.ultimate.power || 0,
        energyCost: skillSet.ultimate.energyCost || 50,
        accuracy: skillSet.ultimate.accuracy || 80,
        criticalRate: skillSet.ultimate.criticalRate || 15,
        effects: {
          status: skillSet.ultimate.effects?.status || {},
          buff: skillSet.ultimate.effects?.buff || {},
          debuff: skillSet.ultimate.effects?.debuff || {},
          special: skillSet.ultimate.effects?.special || {},
          duration: skillSet.ultimate.effects?.duration || {}
        },
        element: pet.element,
        petId,
        skillSetId,
        type: 'ultimate'
      };

      const ultimateSkill = await Skill.create(ultimateSkillData);

      let passiveSkill = null;
      if (skillSet.passive && skillSet.passive.name) {
        const passiveSkillData = {
          name: skillSet.passive.name,
          description: skillSet.passive.description,
          effects: {
            status: skillSet.passive.effects?.status || {},
            buff: skillSet.passive.effects?.buff || {},
            debuff: skillSet.passive.effects?.debuff || {},
            special: skillSet.passive.effects?.special || {},
            duration: skillSet.passive.effects?.duration || {}
          },
          element: pet.element,
          petId,
          skillSetId,
          type: 'passive'
        };

        passiveSkill = await Skill.create(passiveSkillData);
      }

      // Update pet with skill references
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
      console.error('Create skill set error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };
  
  async getPetSkillSet(req, res) {
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
      console.error('Get pet skill set error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
    };
  
  async updateSkill(req, res) {
    try {
      const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
      
      if (!skill) {
        return res.status(404).json({ error: 'Không tìm thấy kỹ năng' });
      }
  
      res.json(skill);
    } catch (err) {
      console.error('Update skill error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
    };
  
    async deleteSkill(req, res) {
    try {
      const skill = await Skill.findByIdAndDelete(req.params.id);
      
      if (!skill) {
        return res.status(404).json({ error: 'Không tìm thấy kỹ năng' });
      }
  
      res.json({ message: 'Xóa kỹ năng thành công' });
    } catch (err) {
      console.error('Delete skill error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
    };
  
  async deletePetSkillSet(req, res) {
    try {
      const { petId } = req.params;
      
      await Skill.deleteMany({ petId });
      
      // Clear skill references from pet
      await Pet.findByIdAndUpdate(petId, {
        normalSkill: null,
        ultimateSkill: null,
        passiveSkill: null
      });
  
      res.json({ message: 'Xóa skill set thành công' });
    } catch (err) {
      console.error('Delete pet skill set error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  };
  
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, role, search, isActive } = req.query;
      const skip = (page - 1) * limit;
  
      let query = {};
  
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
  
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
  
      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
  
      res.json({
        users,
        total,
        totalPages,
        currentPage: parseInt(page)
      });
    } catch (err) {
      console.error('Get users error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  }
  
  async getBattles(req, res) {
    try {
      const { page = 1, limit = 10, battleType, result } = req.query;
      const skip = (page - 1) * limit;
  
      let query = {};
  
      if (battleType) query.battleType = battleType;
      if (result) query.result = result;
  
      const battles = await Battle.find(query)
        .populate('player1', 'username')
        .populate('player2', 'username')
        .populate('winner', 'username')
        .populate('loser', 'username')
        .populate({
          path: 'player1Pet',
          populate: { path: 'pet', select: 'name element' }
        })
        .populate({
          path: 'player2Pet',
          populate: { path: 'pet', select: 'name element' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
  
      const total = await Battle.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
  
      res.json({
        battles,
        total,
        totalPages,
        currentPage: parseInt(page)
      });
    } catch (err) {
      console.error('Get battles error:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  }; 

  // Đảm bảo admin có tất cả linh thú
  async ensureAdminHasAllPets(adminId) {
    try {
      // Lấy tất cả pets active
      const allPets = await Pet.find({ isActive: true });
      
      // Lấy tất cả UserPet hiện tại của admin
      const existingUserPets = await UserPet.find({ user: adminId });
      const existingPetIds = existingUserPets.map(up => up.pet.toString());
      
      // Tìm pets mà admin chưa có
      const missingPets = allPets.filter(pet => !existingPetIds.includes(pet._id.toString()));
      
      // Tạo UserPet cho những pets còn thiếu
      if (missingPets.length > 0) {
        const userPetsToCreate = missingPets.map(pet => ({
          user: adminId,
          pet: pet._id,
          level: 100, // Admin có tất cả pets ở level max
          exp: 0,
          isActive: true
        }));
        
        await UserPet.insertMany(userPetsToCreate);
        console.log(`Đã tạo ${userPetsToCreate.length} UserPet records cho admin ${adminId}`);
      }
    } catch (err) {
      console.error('Ensure admin has all pets error:', err);
    }
  }
}

module.exports = new AdminController();