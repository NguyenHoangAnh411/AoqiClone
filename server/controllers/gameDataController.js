const Element = require('../models/Element');
const Rarity = require('../models/Rarity');
const Skill = require('../models/Skill');
const Effect = require('../models/Effect');
const { 
  BASE_ELEMENT_EFFECTIVENESS, 
  BASE_RARITY_MULTIPLIERS,
  getElementEffectiveness,
  getRarityMultiplier,
  LEVEL_CONSTANTS,
  PET_CONSTANTS,
  BATTLE_CONSTANTS,
  FORMATION_CONSTANTS,
  SKILL_CONSTANTS,
  ITEM_CONSTANTS,
  INVENTORY_CONSTANTS,
  EQUIPMENT_CONSTANTS,
  BAG_CONSTANTS,
  CURRENCY_CONSTANTS
} = require('../utils/gameConstants');

class GameDataController {
  /**
   * Lấy danh sách tất cả elements
   */
  static async getElements(req, res) {
    try {
      const elements = await Element.find({}).sort({ name: 1 });

      res.json({
        success: true,
        data: elements,
        message: 'Lấy danh sách elements thành công'
      });
    } catch (error) {
      console.error('Get elements error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách elements',
        error: error.message
      });
    }
  }

  /**
   * Lấy chi tiết element theo ID
   */
  static async getElementById(req, res) {
    try {
      const { elementId } = req.params;

      const element = await Element.findById(elementId);
      if (!element) {
        return res.status(404).json({
          success: false,
          message: 'Element không tồn tại'
        });
      }

      res.json({
        success: true,
        data: element,
        message: 'Lấy chi tiết element thành công'
      });
    } catch (error) {
      console.error('Get element by ID error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID element không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết element',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách tất cả rarities
   */
  static async getRarities(req, res) {
    try {
      const rarities = await Rarity.find({}).sort({ dropRate: 1 });

      res.json({
        success: true,
        data: rarities,
        message: 'Lấy danh sách rarities thành công'
      });
    } catch (error) {
      console.error('Get rarities error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách rarities',
        error: error.message
      });
    }
  }

  /**
   * Lấy chi tiết rarity theo ID
   */
  static async getRarityById(req, res) {
    try {
      const { rarityId } = req.params;

      const rarity = await Rarity.findById(rarityId);
      if (!rarity) {
        return res.status(404).json({
          success: false,
          message: 'Rarity không tồn tại'
        });
      }

      res.json({
        success: true,
        data: rarity,
        message: 'Lấy chi tiết rarity thành công'
      });
    } catch (error) {
      console.error('Get rarity by ID error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID rarity không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết rarity',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách skills
   */
  static async getSkills(req, res) {
    try {
      const { type, page = 1, limit = 20 } = req.query;
      
      const skip = (page - 1) * limit;
      
      let query = {};
      if (type) query.type = type;

      const skills = await Skill.find(query)
        .populate('effects.effect', 'name displayName type category')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ name: 1 });

      const total = await Skill.countDocuments(query);

      res.json({
        success: true,
        data: {
          skills,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Lấy danh sách skills thành công'
      });
    } catch (error) {
      console.error('Get skills error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách skills',
        error: error.message
      });
    }
  }

  /**
   * Lấy chi tiết skill theo ID
   */
  static async getSkillById(req, res) {
    try {
      const { skillId } = req.params;

      const skill = await Skill.findById(skillId)
        .populate('effects.effect', 'name displayName type category parameters targetType range conditions stacking resistance visualEffects');

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Skill không tồn tại'
        });
      }

      res.json({
        success: true,
        data: skill,
        message: 'Lấy chi tiết skill thành công'
      });
    } catch (error) {
      console.error('Get skill by ID error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID skill không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết skill',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách effects
   */
  static async getEffects(req, res) {
    try {
      const { type, category, page = 1, limit = 20 } = req.query;
      
      const skip = (page - 1) * limit;
      
      let query = {};
      if (type) query.type = type;
      if (category) query.category = category;

      const effects = await Effect.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ name: 1 });

      const total = await Effect.countDocuments(query);

      res.json({
        success: true,
        data: {
          effects,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Lấy danh sách effects thành công'
      });
    } catch (error) {
      console.error('Get effects error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách effects',
        error: error.message
      });
    }
  }

  /**
   * Lấy chi tiết effect theo ID
   */
  static async getEffectById(req, res) {
    try {
      const { effectId } = req.params;

      const effect = await Effect.findById(effectId);
      if (!effect) {
        return res.status(404).json({
          success: false,
          message: 'Effect không tồn tại'
        });
      }

      res.json({
        success: true,
        data: effect,
        message: 'Lấy chi tiết effect thành công'
      });
    } catch (error) {
      console.error('Get effect by ID error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID effect không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết effect',
        error: error.message
      });
    }
  }

  /**
   * Lấy tất cả game constants
   */
  static async getGameConstants(req, res) {
    try {
      const constants = {
        level: LEVEL_CONSTANTS,
        pet: PET_CONSTANTS,
        battle: BATTLE_CONSTANTS,
        formation: FORMATION_CONSTANTS,
        skill: SKILL_CONSTANTS,
        item: ITEM_CONSTANTS,
        inventory: INVENTORY_CONSTANTS,
        equipment: EQUIPMENT_CONSTANTS,
        bag: BAG_CONSTANTS,
        currency: CURRENCY_CONSTANTS,
        baseElementEffectiveness: BASE_ELEMENT_EFFECTIVENESS,
        baseRarityMultipliers: BASE_RARITY_MULTIPLIERS
      };

      res.json({
        success: true,
        data: constants,
        message: 'Lấy game constants thành công'
      });
    } catch (error) {
      console.error('Get game constants error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy game constants',
        error: error.message
      });
    }
  }

  /**
   * Lấy element effectiveness matrix (base data)
   */
  static async getElementEffectiveness(req, res) {
    try {
      res.json({
        success: true,
        data: BASE_ELEMENT_EFFECTIVENESS,
        message: 'Lấy base element effectiveness matrix thành công'
      });
    } catch (error) {
      console.error('Get element effectiveness error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy element effectiveness matrix',
        error: error.message
      });
    }
  }

  /**
   * Lấy tất cả dữ liệu game cơ bản (hybrid approach)
   */
  static async getAllGameData(req, res) {
    try {
      // Lấy dynamic data từ database
      const [elements, rarities, skills, effects] = await Promise.all([
        Element.find({}).sort({ name: 1 }),
        Rarity.find({}).sort({ dropRate: 1 }),
        Skill.find({}).sort({ name: 1 }).limit(50), // Limit để tránh quá tải
        Effect.find({}).sort({ name: 1 }).limit(50)
      ]);

      // Static constants từ code
      const gameData = {
        // Dynamic data từ database
        elements,
        rarities,
        skills,
        effects,
        
        // Static constants từ code
        constants: {
          level: LEVEL_CONSTANTS,
          pet: PET_CONSTANTS,
          battle: BATTLE_CONSTANTS,
          formation: FORMATION_CONSTANTS,
          skill: SKILL_CONSTANTS,
          item: ITEM_CONSTANTS,
          inventory: INVENTORY_CONSTANTS,
          equipment: EQUIPMENT_CONSTANTS,
          bag: BAG_CONSTANTS,
          currency: CURRENCY_CONSTANTS,
          baseElementEffectiveness: BASE_ELEMENT_EFFECTIVENESS,
          baseRarityMultipliers: BASE_RARITY_MULTIPLIERS
        }
      };

      res.json({
        success: true,
        data: gameData,
        message: 'Lấy tất cả game data thành công'
      });
    } catch (error) {
      console.error('Get all game data error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy game data',
        error: error.message
      });
    }
  }

  /**
   * Lấy thông tin về element effectiveness giữa 2 elements
   */
  static async getElementEffectivenessBetween(req, res) {
    try {
      const { element1Id, element2Id } = req.params;

      const [element1, element2] = await Promise.all([
        Element.findById(element1Id),
        Element.findById(element2Id)
      ]);

      if (!element1 || !element2) {
        return res.status(404).json({
          success: false,
          message: 'Element không tồn tại'
        });
      }

      // Sử dụng static constants thay vì database methods
      const multiplier = getElementEffectiveness(element1.name, element2.name);
      const effectivenessLevel = multiplier > 1.0 ? 'strong' : multiplier < 1.0 ? 'weak' : 'normal';
      const isStrong = multiplier > 1.0;
      const isWeak = multiplier < 1.0;

      const result = {
        attacker: {
          id: element1._id,
          name: element1.name,
          displayName: element1.displayName
        },
        defender: {
          id: element2._id,
          name: element2.name,
          displayName: element2.displayName
        },
        effectiveness: {
          multiplier,
          level: effectivenessLevel,
          isStrong,
          isWeak
        }
      };

      res.json({
        success: true,
        data: result,
        message: 'Lấy thông tin element effectiveness thành công'
      });
    } catch (error) {
      console.error('Get element effectiveness between error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID element không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin element effectiveness',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách skill types
   */
  static async getSkillTypes(req, res) {
    try {
      const skillTypes = [
        { value: 'normal', label: 'Normal Skill', description: 'Kỹ năng cơ bản' },
        { value: 'ultimate', label: 'Ultimate Skill', description: 'Kỹ năng tối thượng' },
        { value: 'passive', label: 'Passive Skill', description: 'Kỹ năng thụ động' }
      ];

      res.json({
        success: true,
        data: skillTypes,
        message: 'Lấy danh sách skill types thành công'
      });
    } catch (error) {
      console.error('Get skill types error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách skill types',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách effect types
   */
  static async getEffectTypes(req, res) {
    try {
      const effectTypes = [
        { value: 'status', label: 'Status Effect', description: 'Hiệu ứng trạng thái' },
        { value: 'buff', label: 'Buff', description: 'Hiệu ứng tăng cường' },
        { value: 'debuff', label: 'Debuff', description: 'Hiệu ứng giảm yếu' },
        { value: 'special', label: 'Special Effect', description: 'Hiệu ứng đặc biệt' }
      ];

      res.json({
        success: true,
        data: effectTypes,
        message: 'Lấy danh sách effect types thành công'
      });
    } catch (error) {
      console.error('Get effect types error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách effect types',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách effect categories
   */
  static async getEffectCategories(req, res) {
    try {
      const effectCategories = [
        { value: 'stun', label: 'Stun', description: 'Choáng' },
        { value: 'poison', label: 'Poison', description: 'Độc' },
        { value: 'burn', label: 'Burn', description: 'Bỏng' },
        { value: 'freeze', label: 'Freeze', description: 'Đóng băng' },
        { value: 'heal', label: 'Heal', description: 'Hồi máu' },
        { value: 'shield', label: 'Shield', description: 'Khiên' },
        { value: 'speed_up', label: 'Speed Up', description: 'Tăng tốc' },
        { value: 'speed_down', label: 'Speed Down', description: 'Giảm tốc' },
        { value: 'attack_up', label: 'Attack Up', description: 'Tăng tấn công' },
        { value: 'attack_down', label: 'Attack Down', description: 'Giảm tấn công' },
        { value: 'defense_up', label: 'Defense Up', description: 'Tăng phòng thủ' },
        { value: 'defense_down', label: 'Defense Down', description: 'Giảm phòng thủ' }
      ];

      res.json({
        success: true,
        data: effectCategories,
        message: 'Lấy danh sách effect categories thành công'
      });
    } catch (error) {
      console.error('Get effect categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách effect categories',
        error: error.message
      });
    }
  }
}

module.exports = GameDataController; 