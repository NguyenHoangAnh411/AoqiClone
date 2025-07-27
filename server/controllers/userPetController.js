const Pet = require('../models/Pet');
const User = require('../models/User');
const Skill = require('../models/Skill');
const UserPet = require('../models/UserPet');
const UserBag = require('../models/UserBag');
const { 
  getExpNeededForNextLevel, 
  canLevelUp, 
  calculateActualCombatPower,
  calculatePetRating,
  getPetClass,
  updateUserPetStats
} = require('../utils/petUtils');

// Helper function để tính toán thông tin exp và level up cho pet
const calculatePetInfo = (userPet) => {
  const expNeeded = getExpNeededForNextLevel(userPet.level, userPet.pet.rarity);
  const canLevelUpNow = canLevelUp(userPet.level, userPet.exp, userPet.pet.rarity);
  

  
  // Tính combat power và rating
  const baseStats = {
    baseHp: userPet.pet.baseHp,
    baseAttack: userPet.pet.baseAttack,
    baseDefense: userPet.pet.baseDefense,
    baseSpeed: userPet.pet.baseSpeed,
    baseAccuracy: userPet.pet.baseAccuracy,
    baseEvasion: userPet.pet.baseEvasion,
    baseCriticalRate: userPet.pet.baseCriticalRate
  };
  
  const actualCombatPower = calculateActualCombatPower(
    baseStats, 
    userPet.level, 
    userPet.pet.rarity, 
    userPet.pet.element
  );
  
  const petRating = calculatePetRating({
    hp: userPet.hp,
    attack: userPet.attack,
    defense: userPet.defense,
    speed: userPet.speed
  });
  
  const petClass = getPetClass(actualCombatPower);
  
  return {
    ...userPet.toObject(),
    expNeededForNextLevel: expNeeded,
    canLevelUp: canLevelUpNow,
    actualCombatPower: actualCombatPower,
    petRating: petRating,
    petClass: petClass,
    progressPercentage: userPet.level >= 100 ? 100 : Math.floor((userPet.exp / expNeeded) * 100)
  };
};

class UserPetController {

  async getStarterPets(req, res) {
    try {
      const starterPets = await Pet.find({ isStarter: true })
        .populate('normalSkill')
        .populate('ultimateSkill')
        .populate('passiveSkill')
        .populate('evolutionPet');
  
      res.json({ 
        success: true, 
        starterPets: starterPets 
      });
    } catch (err) {
      console.error('Get starter pets error:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Lỗi khi tải danh sách linh thú mở đầu' 
      });
    }
  };

  async chooseStarterPet(req, res) {
    try {
      const { petId } = req.body;

      // Lấy hoặc tạo UserBag cho user
      let userBag = await UserBag.findOne({ user: req.user.id });
      if (!userBag) {
        userBag = new UserBag({ user: req.user.id });
        await userBag.save();
      }

      // Kiểm tra user đã có starter pet chưa
      const existingStarterPet = await UserPet.findOne({
        user: req.user.id,
        'pet.isStarter': true
      }).populate('pet');

      if (existingStarterPet) {
        return res.status(400).json({ 
          error: 'Bạn đã có linh thú mở đầu rồi' 
        });
      }

      // Kiểm tra pet có phải là starter pet không
      const starterPet = await Pet.findOne({ 
        _id: petId, 
        isStarter: true 
      });

      if (!starterPet) {
        return res.status(400).json({ 
          error: 'Linh thú này không phải là linh thú mở đầu' 
        });
      }

      // Kiểm tra số pet trong túi hiện tại
      const bagCount = await UserPet.countDocuments({ 
        user: req.user.id, 
        location: 'bag' 
      });

      // Cập nhật currentSize trong UserBag
      userBag.currentSize = bagCount;
      await userBag.save();

      const location = userBag.canAddPet() ? 'bag' : 'storage';

      // Tạo UserPet mới
      const newUserPet = new UserPet({
        user: req.user.id,
        pet: petId,
        level: 1,
        exp: 0,
        hp: starterPet.baseHp,
        attack: starterPet.baseAttack,
        defense: starterPet.baseDefense,
        speed: starterPet.baseSpeed,
        accuracy: starterPet.baseAccuracy,
        evasion: starterPet.baseEvasion,
        criticalRate: starterPet.baseCriticalRate,
        location: location
      });

      await newUserPet.save();

      // Populate thông tin pet
      const userPetWithInfo = await UserPet.findById(newUserPet._id).populate({
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' },
          { path: 'evolutionPet' }
        ]
      });

      // Cập nhật currentSize nếu pet được đặt vào túi
      if (location === 'bag') {
        userBag.currentSize += 1;
        await userBag.save();
      }

      res.json({ 
        success: true, 
        message: `Đã chọn linh thú mở đầu ${starterPet.name} thành công`,
        userPet: userPetWithInfo,
        location: location,
        bagInfo: {
          current: userBag.currentSize,
          max: userBag.maxSize,
          available: userBag.getAvailableSlots()
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Lấy danh sách pet trong túi (bag)
  async getBagPets(req, res) {
    try {
      // Lấy hoặc tạo UserBag cho user
      let userBag = await UserBag.findOne({ user: req.user.id });
      if (!userBag) {
        userBag = new UserBag({ user: req.user.id });
        await userBag.save();
      }

      const bagPets = await UserPet.find({ 
        user: req.user.id, 
        location: 'bag' 
      }).populate({
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' },
          { path: 'evolutionPet' }
        ]
      });

      // Cập nhật currentSize trong UserBag
      userBag.currentSize = bagPets.length;
      await userBag.save();

      // Tính toán thông tin exp và level up cho mỗi pet
      const enrichedBagPets = bagPets.map(userPet => calculatePetInfo(userPet));

      res.json({ 
        success: true, 
        bagPets: enrichedBagPets,
        bagInfo: {
          current: userBag.currentSize,
          max: userBag.maxSize,
          available: userBag.getAvailableSlots()
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Lấy danh sách pet trong kho (storage)
  async getStoragePets(req, res) {
    try {
      const storagePets = await UserPet.find({ 
        user: req.user.id, 
        location: 'storage' 
      }).populate({
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' },
          { path: 'evolutionPet' }
        ]
      });

      // Tính toán thông tin exp và level up cho mỗi pet
      const enrichedStoragePets = storagePets.map(userPet => calculatePetInfo(userPet));

      res.json({ 
        success: true, 
        storagePets: enrichedStoragePets,
        storageCount: storagePets.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Di chuyển pet từ kho vào túi
  async movePetToBag(req, res) {
    try {
      const { userPetId, replacePetId } = req.body;

      // Lấy hoặc tạo UserBag cho user
      let userBag = await UserBag.findOne({ user: req.user.id });
      if (!userBag) {
        userBag = new UserBag({ user: req.user.id });
        await userBag.save();
      }

      // Kiểm tra số pet trong túi hiện tại
      const bagCount = await UserPet.countDocuments({ 
        user: req.user.id, 
        location: 'bag' 
      });

      // Cập nhật currentSize trong UserBag
      userBag.currentSize = bagCount;

      // Kiểm tra pet có tồn tại và thuộc về user không
      const userPet = await UserPet.findOne({ 
        _id: userPetId, 
        user: req.user.id,
        location: 'storage'
      });

      if (!userPet) {
        return res.status(404).json({ 
          error: 'Không tìm thấy linh thú trong kho' 
        });
      }

      // Nếu túi đầy và không có pet để thay thế
      if (userBag.isFull() && !replacePetId) {
        return res.status(400).json({ 
          success: false,
          error: 'BAG_FULL',
          message: `Túi đã đầy! Bạn cần chọn một linh thú trong túi để thay thế.`,
          bagInfo: {
            current: userBag.currentSize,
            max: userBag.maxSize,
            available: userBag.getAvailableSlots()
          }
        });
      }

      // Nếu túi đầy và có pet để thay thế
      if (userBag.isFull() && replacePetId) {
        // Kiểm tra pet thay thế có tồn tại và thuộc về user không
        const replacePet = await UserPet.findOne({ 
          _id: replacePetId, 
          user: req.user.id,
          location: 'bag'
        });

        if (!replacePet) {
          return res.status(404).json({ 
            error: 'Không tìm thấy linh thú thay thế trong túi' 
          });
        }

        // Di chuyển pet thay thế vào storage
        await UserPet.findByIdAndUpdate(
          replacePetId,
          { location: 'storage' }
        );
      }

      // Di chuyển pet vào túi
      const updatedPet = await UserPet.findByIdAndUpdate(
        userPetId,
        { location: 'bag' },
        { new: true }
      ).populate({
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' },
          { path: 'evolutionPet' }
        ]
      });

      // Cập nhật currentSize trong UserBag (không thay đổi vì đã thay thế)
      if (!userBag.isFull()) {
        userBag.currentSize += 1;
      }
      await userBag.save();

      res.json({ 
        success: true, 
        message: userBag.isFull() ? 'Đã thay thế linh thú trong túi' : 'Đã di chuyển linh thú vào túi',
        userPet: updatedPet,
        bagInfo: {
          current: userBag.currentSize,
          max: userBag.maxSize,
          available: userBag.getAvailableSlots()
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Di chuyển pet từ túi vào kho
  async movePetToStorage(req, res) {
    try {
      const { userPetId } = req.body;

      // Lấy hoặc tạo UserBag cho user
      let userBag = await UserBag.findOne({ user: req.user.id });
      if (!userBag) {
        userBag = new UserBag({ user: req.user.id });
        await userBag.save();
      }

      // Kiểm tra pet có tồn tại và thuộc về user không
      const userPet = await UserPet.findOne({ 
        _id: userPetId, 
        user: req.user.id,
        location: 'bag'
      });

      if (!userPet) {
        return res.status(404).json({ 
          error: 'Không tìm thấy linh thú trong túi' 
        });
      }

      // Di chuyển pet vào kho (cho phép di chuyển cả pet active)
      const updatedPet = await UserPet.findByIdAndUpdate(
        userPetId,
        { location: 'storage' },
        { new: true }
      ).populate({
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' },
          { path: 'evolutionPet' }
        ]
      });

      // Cập nhật currentSize trong UserBag
      userBag.currentSize = Math.max(0, userBag.currentSize - 1);
      await userBag.save();

      res.json({ 
        success: true, 
        message: 'Đã di chuyển linh thú vào kho',
        userPet: updatedPet,
        bagInfo: {
          current: userBag.currentSize,
          max: userBag.maxSize,
          available: userBag.getAvailableSlots()
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Lấy tất cả pet của user (cả túi và kho)
  async getUserPets(req, res) {
    try {
      const userPets = await UserPet.find({ 
        user: req.user.id 
      }).populate({
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' },
          { path: 'evolutionPet' }
        ]
      });

      // Tính toán thông tin exp và level up cho mỗi pet
      const enrichedUserPets = userPets.map(userPet => calculatePetInfo(userPet));

      // Phân loại pet theo vị trí
      const bagPets = enrichedUserPets.filter(pet => pet.location === 'bag');
      const storagePets = enrichedUserPets.filter(pet => pet.location === 'storage');

      res.json({ 
        success: true, 
        userPets: enrichedUserPets,
        bagPets: bagPets,
        storagePets: storagePets,
        summary: {
          total: userPets.length,
          bag: bagPets.length,
          storage: storagePets.length
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };



  // Nhận pet (ưu tiên đưa vào túi trước, nếu đầy thì vào kho)
  async receivePet(req, res) {
    try {
      const { petId, level = 1, exp = 0 } = req.body;

      // Lấy hoặc tạo UserBag cho user
      let userBag = await UserBag.findOne({ user: req.user.id });
      if (!userBag) {
        userBag = new UserBag({ user: req.user.id });
        await userBag.save();
      }

      // Kiểm tra pet có tồn tại không
      const petTemplate = await Pet.findById(petId);
      if (!petTemplate) {
        return res.status(404).json({ 
          error: 'Không tìm thấy linh thú' 
        });
      }

      // Kiểm tra số pet trong túi hiện tại
      const bagCount = await UserPet.countDocuments({ 
        user: req.user.id, 
        location: 'bag' 
      });

      // Cập nhật currentSize trong UserBag
      userBag.currentSize = bagCount;
      await userBag.save();

      const location = userBag.canAddPet() ? 'bag' : 'storage';

      // Tạo UserPet mới
      const newUserPet = new UserPet({
        user: req.user.id,
        pet: petId,
        level: level,
        exp: exp,
        hp: petTemplate.baseHp,
        attack: petTemplate.baseAttack,
        defense: petTemplate.baseDefense,
        speed: petTemplate.baseSpeed,
        accuracy: petTemplate.baseAccuracy,
        evasion: petTemplate.baseEvasion,
        criticalRate: petTemplate.baseCriticalRate,
        location: location
      });

      await newUserPet.save();

      // Populate thông tin pet
      const userPetWithInfo = await UserPet.findById(newUserPet._id).populate({
        path: 'pet',
        populate: [
          { path: 'normalSkill' },
          { path: 'ultimateSkill' },
          { path: 'passiveSkill' },
          { path: 'evolutionPet' }
        ]
      });

      // Cập nhật currentSize nếu pet được đặt vào túi
      if (location === 'bag') {
        userBag.currentSize += 1;
        await userBag.save();
      }

      res.json({ 
        success: true, 
        message: `Đã nhận linh thú ${petTemplate.name} thành công`,
        userPet: userPetWithInfo,
        location: location,
        bagInfo: {
          current: userBag.currentSize,
          max: userBag.maxSize,
          available: userBag.getAvailableSlots()
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };


} 

module.exports = new UserPetController();