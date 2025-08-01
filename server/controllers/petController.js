const Pet = require('../models/Pet');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');
const Skill = require('../models/Skill');

/**
 * Pet Controller - Quản lý pet base data (public APIs + admin APIs)
 */
class PetController {
  
  // ==================== PUBLIC APIs ====================
  
  /**
   * Lấy danh sách tất cả pet gốc
   * GET /api/pets
   */
  async getAllPets(req, res) {
    try {
      const { page = 1, limit = 20, element, rarity, search, isStarter } = req.query;
      
      let query = { isActive: true };
      
      // Filter theo element
      if (element) {
        query.element = element;
      }
      
      // Filter theo rarity
      if (rarity) {
        query.rarity = rarity;
      }
      
      // Filter theo starter pets
      if (isStarter !== undefined) {
        query.isStarter = isStarter === 'true';
      }
      
      // Search theo tên
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { name: 1 }
      };
      
      const pets = await Pet.find(query)
        .populate('element', 'name icon description')
        .populate('rarity', 'name color multiplier')
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .sort(options.sort);
      
      const total = await Pet.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          pets,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            pages: Math.ceil(total / options.limit)
          }
        },
        message: 'Lấy danh sách pet thành công'
      });
      
    } catch (error) {
      console.error('Error in getAllPets:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách pet'
      });
    }
  }
  
  /**
   * Lấy chi tiết pet gốc theo ID
   * GET /api/pets/:petId
   */
  async getPetById(req, res) {
    try {
      const { petId } = req.params;
      
      const pet = await Pet.findById(petId)
        .populate('element', 'name icon description')
        .populate('rarity', 'name color multiplier')
        .populate('normalSkill', 'name description type damageScaling levelScaling')
        .populate('ultimateSkill', 'name description type damageScaling levelScaling')
        .populate('passiveSkill', 'name description type damageScaling levelScaling')
        .populate('evolutionChain.petId', 'name img element rarity');
      
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy pet'
        });
      }
      
      // Lấy thông tin skills với levels
      const skillsWithLevels = await pet.getAllSkillsWithLevels();
      
      // Lấy stat growth preview
      const statGrowthPreview = pet.getStatGrowthPreview(1, 10);
      
      // Lấy evolution info
      const evolutionChain = await pet.getEvolutionChain();
      
      const petData = {
        ...pet.toObject(),
        skills: skillsWithLevels,
        statGrowthPreview,
        evolutionChain
      };
      
      res.json({
        success: true,
        data: petData,
        message: 'Lấy thông tin pet thành công'
      });
      
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID pet không hợp lệ'
        });
      }
      
      console.error('Error in getPetById:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin pet'
      });
    }
  }
  
  /**
   * Tìm kiếm pet
   * GET /api/pets/search
   */
  async searchPets(req, res) {
    try {
      const { q, element, rarity, page = 1, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập từ khóa tìm kiếm'
        });
      }
      
      let query = {
        isActive: true,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      };
      
      if (element) query.element = element;
      if (rarity) query.rarity = rarity;
      
      const pets = await Pet.find(query)
        .populate('element', 'name icon')
        .populate('rarity', 'name color multiplier')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ name: 1 });
      
      const total = await Pet.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          pets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Tìm kiếm pet thành công'
      });
      
    } catch (error) {
      console.error('Error in searchPets:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tìm kiếm pet'
      });
    }
  }
  
  /**
   * Lấy danh sách pet theo element
   * GET /api/pets/elements/:elementId
   */
  async getPetsByElement(req, res) {
    try {
      const { elementId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const pets = await Pet.find({ 
        element: elementId, 
        isActive: true 
      })
        .populate('element', 'name icon')
        .populate('rarity', 'name color multiplier')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ name: 1 });
      
      const total = await Pet.countDocuments({ 
        element: elementId, 
        isActive: true 
      });
      
      res.json({
        success: true,
        data: {
          pets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Lấy danh sách pet theo element thành công'
      });
      
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID element không hợp lệ'
        });
      }
      
      console.error('Error in getPetsByElement:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách pet theo element'
      });
    }
  }
  
  /**
   * Lấy danh sách pet theo rarity
   * GET /api/pets/rarities/:rarityId
   */
  async getPetsByRarity(req, res) {
    try {
      const { rarityId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const pets = await Pet.find({ 
        rarity: rarityId, 
        isActive: true 
      })
        .populate('element', 'name icon')
        .populate('rarity', 'name color multiplier')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ name: 1 });
      
      const total = await Pet.countDocuments({ 
        rarity: rarityId, 
        isActive: true 
      });
      
      res.json({
        success: true,
        data: {
          pets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Lấy danh sách pet theo rarity thành công'
      });
      
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID rarity không hợp lệ'
        });
      }
      
      console.error('Error in getPetsByRarity:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách pet theo rarity'
      });
    }
  }
  
  /**
   * Lấy danh sách starter pets
   * GET /api/pets/starters
   */
  async getStarterPets(req, res) {
    try {
      const pets = await Pet.find({ 
        isStarter: true, 
        isActive: true 
      })
        .populate('element', 'name icon description')
        .populate('rarity', 'name color multiplier')
        .sort({ name: 1 });
      
      res.json({
        success: true,
        data: pets,
        message: 'Lấy danh sách starter pets thành công'
      });
      
    } catch (error) {
      console.error('Error in getStarterPets:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách starter pets'
      });
    }
  }
  
  /**
   * Lấy thông tin evolution chain của pet
   * GET /api/pets/:petId/evolution
   */
  async getPetEvolution(req, res) {
    try {
      const { petId } = req.params;
      
      const pet = await Pet.findById(petId)
        .populate('evolutionChain.petId', 'name img element rarity evolutionStage');
      
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy pet'
        });
      }
      
      const evolutionChain = await pet.getEvolutionChain();
      const evolutionRequirements = pet.getEvolutionRequirements();
      
      res.json({
        success: true,
        data: {
          currentPet: pet,
          evolutionChain,
          evolutionRequirements
        },
        message: 'Lấy thông tin evolution thành công'
      });
      
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID pet không hợp lệ'
        });
      }
      
      console.error('Error in getPetEvolution:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin evolution'
      });
    }
  }
  
  /**
   * Lấy thông tin skills của pet
   * GET /api/pets/:petId/skills
   */
  async getPetSkills(req, res) {
    try {
      const { petId } = req.params;
      
      const pet = await Pet.findById(petId)
        .populate('normalSkill', 'name description type damageScaling levelScaling')
        .populate('ultimateSkill', 'name description type damageScaling levelScaling')
        .populate('passiveSkill', 'name description type damageScaling levelScaling');
      
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy pet'
        });
      }
      
      const skillsWithLevels = await pet.getAllSkillsWithLevels();
      
      res.json({
        success: true,
        data: skillsWithLevels,
        message: 'Lấy thông tin skills thành công'
      });
      
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID pet không hợp lệ'
        });
      }
      
      console.error('Error in getPetSkills:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin skills'
      });
    }
  }
  
  /**
   * Lấy thông tin stat growth của pet
   * GET /api/pets/:petId/stats
   */
  async getPetStats(req, res) {
    try {
      const { petId } = req.params;
      const { level = 1 } = req.query;
      
      const pet = await Pet.findById(petId)
        .populate('element', 'name icon');
      
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy pet'
        });
      }
      
      const stats = await pet.calculateStats(parseInt(level));
      const statGrowthInfo = pet.getStatGrowthInfo();
      const statGrowthPreview = pet.getStatGrowthPreview(1, 20);
      const combatPower = await pet.calculateCombatPower(parseInt(level));
      const combatPowerBreakdown = await pet.getCombatPowerBreakdown(parseInt(level));
      
      res.json({
        success: true,
        data: {
          level: parseInt(level),
          stats,
          statGrowthInfo,
          statGrowthPreview,
          combatPower,
          combatPowerBreakdown
        },
        message: 'Lấy thông tin stats thành công'
      });
      
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID pet không hợp lệ'
        });
      }
      
      console.error('Error in getPetStats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin stats'
      });
    }
  }
  
  /**
   * Lấy danh sách elements có pet
   * GET /api/pets/elements
   */
  async getPetElements(req, res) {
    try {
      const elements = await Element.find({});
      
      // Lấy số lượng pet cho mỗi element
      const elementsWithPetCount = await Promise.all(
        elements.map(async (element) => {
          const petCount = await Pet.countDocuments({ 
            element: element._id, 
            isActive: true 
          });
          
          return {
            _id: element._id,
            name: element.name,
            icon: element.icon,
            description: element.description,
            petCount: petCount
          };
        })
      );
      
      res.json({
        success: true,
        data: elementsWithPetCount,
        message: 'Lấy danh sách elements thành công'
      });
      
    } catch (error) {
      console.error('Error in getPetElements:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách elements'
      });
    }
  }
  
  /**
   * Lấy danh sách rarities có pet
   * GET /api/pets/rarities
   */
  async getPetRarities(req, res) {
    try {
      const rarities = await Rarity.find({});
      
      // Lấy số lượng pet cho mỗi rarity
      const raritiesWithPetCount = await Promise.all(
        rarities.map(async (rarity) => {
          const petCount = await Pet.countDocuments({ 
            rarity: rarity._id, 
            isActive: true 
          });
          
          return {
            _id: rarity._id,
            name: rarity.name,
            color: rarity.color,
            multiplier: rarity.multiplier,
            petCount: petCount
          };
        })
      );
      
      res.json({
        success: true,
        data: raritiesWithPetCount,
        message: 'Lấy danh sách rarities thành công'
      });
      
    } catch (error) {
      console.error('Error in getPetRarities:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách rarities'
      });
    }
  }

  // ==================== ADMIN APIs ====================

  /**
   * Tạo pet mới (Admin) - Tự động tạo skills
   * POST /api/pets/
   */
  async createPet(req, res) {
    try {
      const {
        name,
        img,
        description,
        element,
        rarity,
        baseHp,
        baseAttack,
        baseDefense,
        baseSpeed,
        baseAccuracy,
        baseEvasion,
        baseCriticalRate,
        statGrowth,
        skills, // Object chứa thông tin skills: { normal: {...}, ultimate: {...}, passive: {...} }
        evolutionStage,
        evolutionChain,
        levelCap,
        isActive,
        isStarter,
        teamBuff
      } = req.body;

      // Validate required fields
      if (!name || !img || !element || !rarity) {
        return res.status(400).json({
          success: false,
          message: 'Tên, hình ảnh, element và rarity là bắt buộc'
        });
      }

      // Check if pet name already exists
      const existingPet = await Pet.findOne({ name });
      if (existingPet) {
        return res.status(400).json({
          success: false,
          message: 'Tên pet đã tồn tại'
        });
      }

      // Validate element exists
      const elementExists = await Element.findById(element);
      if (!elementExists) {
        return res.status(400).json({
          success: false,
          message: 'Element không tồn tại'
        });
      }

      // Validate rarity exists
      const rarityExists = await Rarity.findById(rarity);
      if (!rarityExists) {
        return res.status(400).json({
          success: false,
          message: 'Rarity không tồn tại'
        });
      }

             // Tạo skills nếu được cung cấp
       let normalSkillId = null;
       let ultimateSkillId = null;
       let passiveSkillId = null;

       if (skills) {
         // Tạo Normal Skill
         if (skills.normal) {
           const normalSkillData = {
             name: `${name} - Normal Attack`,
             description: skills.normal.description || `Normal attack của ${name}`,
             type: 'normal',
             energyCost: 0,
             energyGeneration: skills.normal.energyGeneration || 10,
             damageScaling: {
               attack: skills.normal.damageScaling?.attack || 80,
               defense: skills.normal.damageScaling?.defense || 0,
               speed: skills.normal.damageScaling?.speed || 0,
               hp: skills.normal.damageScaling?.hp || 0,
               accuracy: skills.normal.damageScaling?.accuracy || 0,
               evasion: skills.normal.damageScaling?.evasion || 0,
               criticalRate: skills.normal.damageScaling?.criticalRate || 0
             },
             levelScaling: {
               maxLevel: skills.normal.levelScaling?.maxLevel || 10,
               baseScaling: {
                 attack: skills.normal.levelScaling?.baseScaling?.attack || 80,
                 defense: skills.normal.levelScaling?.baseScaling?.defense || 0,
                 speed: skills.normal.levelScaling?.baseScaling?.speed || 0,
                 hp: skills.normal.levelScaling?.baseScaling?.hp || 0,
                 accuracy: skills.normal.levelScaling?.baseScaling?.accuracy || 0,
                 evasion: skills.normal.levelScaling?.baseScaling?.evasion || 0,
                 criticalRate: skills.normal.levelScaling?.baseScaling?.criticalRate || 0
               },
               scalingIncrease: {
                 attack: skills.normal.levelScaling?.scalingIncrease?.attack || 5,
                 defense: skills.normal.levelScaling?.scalingIncrease?.defense || 0,
                 speed: skills.normal.levelScaling?.scalingIncrease?.speed || 0,
                 hp: skills.normal.levelScaling?.scalingIncrease?.hp || 0,
                 accuracy: skills.normal.levelScaling?.scalingIncrease?.accuracy || 0,
                 evasion: skills.normal.levelScaling?.scalingIncrease?.evasion || 0,
                 criticalRate: skills.normal.levelScaling?.scalingIncrease?.criticalRate || 0
               },
               upgradeRequirements: {
                 materials: skills.normal.levelScaling?.upgradeRequirements?.materials || [],
                 gold: skills.normal.levelScaling?.upgradeRequirements?.gold || 1000,
                 petLevel: skills.normal.levelScaling?.upgradeRequirements?.petLevel || 5
               }
             },
             targetPattern: {
               type: skills.normal.targetPattern?.type || 'single',
               pattern: {
                 positions: skills.normal.targetPattern?.pattern?.positions || [],
                 relativePositions: skills.normal.targetPattern?.pattern?.relativePositions || [],
                 direction: skills.normal.targetPattern?.pattern?.direction || 'any',
                 range: skills.normal.targetPattern?.pattern?.range || 1,
                 maxTargets: skills.normal.targetPattern?.pattern?.maxTargets || 1
               },
               line: {
                 direction: skills.normal.targetPattern?.line?.direction,
                 length: skills.normal.targetPattern?.line?.length || 3,
                 canTargetSelf: skills.normal.targetPattern?.line?.canTargetSelf || false
               },
               cross: {
                 size: skills.normal.targetPattern?.cross?.size || 3,
                 canTargetSelf: skills.normal.targetPattern?.cross?.canTargetSelf || false
               },
               area: {
                 shape: skills.normal.targetPattern?.area?.shape || 'square',
                 size: skills.normal.targetPattern?.area?.size || 3,
                 centerOnTarget: skills.normal.targetPattern?.area?.centerOnTarget !== undefined ? skills.normal.targetPattern.area.centerOnTarget : true
               }
             },
             targetType: skills.normal.targetType || 'single',
             range: skills.normal.range || 1,
             targetCondition: skills.normal.targetCondition || null,
             defenseReduction: {
               enabled: skills.normal.defenseReduction?.enabled !== undefined ? skills.normal.defenseReduction.enabled : true,
               formula: skills.normal.defenseReduction?.formula || 'linear',
               effectiveness: skills.normal.defenseReduction?.effectiveness || 1
             },
             conditions: {
               lowHp: skills.normal.conditions?.lowHp || 0,
               highHp: skills.normal.conditions?.highHp || 0,
               lowEnergy: skills.normal.conditions?.lowEnergy || 0,
               highEnergy: skills.normal.conditions?.highEnergy || 0,
               elementAdvantage: skills.normal.conditions?.elementAdvantage || false,
               formationPosition: skills.normal.conditions?.formationPosition || 0,
               comboCount: skills.normal.conditions?.comboCount || 0
             },
             effects: skills.normal.effects || [],
             petId: null, // Sẽ được set sau khi tạo pet
             skillSetId: `${name}_normal`,
             isActive: true,
             passiveTrigger: null
           };

           const normalSkill = new Skill(normalSkillData);
           await normalSkill.save();
           normalSkillId = normalSkill._id;
         }

         // Tạo Ultimate Skill
         if (skills.ultimate) {
           const ultimateSkillData = {
             name: `${name} - Ultimate`,
             description: skills.ultimate.description || `Ultimate skill của ${name}`,
             type: 'ultimate',
             energyCost: skills.ultimate.energyCost || 100,
             energyGeneration: 0,
             damageScaling: {
               attack: skills.ultimate.damageScaling?.attack || 150,
               defense: skills.ultimate.damageScaling?.defense || 0,
               speed: skills.ultimate.damageScaling?.speed || 0,
               hp: skills.ultimate.damageScaling?.hp || 0,
               accuracy: skills.ultimate.damageScaling?.accuracy || 0,
               evasion: skills.ultimate.damageScaling?.evasion || 0,
               criticalRate: skills.ultimate.damageScaling?.criticalRate || 0
             },
             levelScaling: {
               maxLevel: skills.ultimate.levelScaling?.maxLevel || 10,
               baseScaling: {
                 attack: skills.ultimate.levelScaling?.baseScaling?.attack || 150,
                 defense: skills.ultimate.levelScaling?.baseScaling?.defense || 0,
                 speed: skills.ultimate.levelScaling?.baseScaling?.speed || 0,
                 hp: skills.ultimate.levelScaling?.baseScaling?.hp || 0,
                 accuracy: skills.ultimate.levelScaling?.baseScaling?.accuracy || 0,
                 evasion: skills.ultimate.levelScaling?.baseScaling?.evasion || 0,
                 criticalRate: skills.ultimate.levelScaling?.baseScaling?.criticalRate || 0
               },
               scalingIncrease: {
                 attack: skills.ultimate.levelScaling?.scalingIncrease?.attack || 10,
                 defense: skills.ultimate.levelScaling?.scalingIncrease?.defense || 0,
                 speed: skills.ultimate.levelScaling?.scalingIncrease?.speed || 0,
                 hp: skills.ultimate.levelScaling?.scalingIncrease?.hp || 0,
                 accuracy: skills.ultimate.levelScaling?.scalingIncrease?.accuracy || 0,
                 evasion: skills.ultimate.levelScaling?.scalingIncrease?.evasion || 0,
                 criticalRate: skills.ultimate.levelScaling?.scalingIncrease?.criticalRate || 0
               },
               upgradeRequirements: {
                 materials: skills.ultimate.levelScaling?.upgradeRequirements?.materials || [],
                 gold: skills.ultimate.levelScaling?.upgradeRequirements?.gold || 1000,
                 petLevel: skills.ultimate.levelScaling?.upgradeRequirements?.petLevel || 5
               }
             },
             targetPattern: {
               type: skills.ultimate.targetPattern?.type || 'all_enemies',
               pattern: {
                 positions: skills.ultimate.targetPattern?.pattern?.positions || [],
                 relativePositions: skills.ultimate.targetPattern?.pattern?.relativePositions || [],
                 direction: skills.ultimate.targetPattern?.pattern?.direction || 'any',
                 range: skills.ultimate.targetPattern?.pattern?.range || 1,
                 maxTargets: skills.ultimate.targetPattern?.pattern?.maxTargets || 1
               },
               line: {
                 direction: skills.ultimate.targetPattern?.line?.direction,
                 length: skills.ultimate.targetPattern?.line?.length || 3,
                 canTargetSelf: skills.ultimate.targetPattern?.line?.canTargetSelf || false
               },
               cross: {
                 size: skills.ultimate.targetPattern?.cross?.size || 3,
                 canTargetSelf: skills.ultimate.targetPattern?.cross?.canTargetSelf || false
               },
               area: {
                 shape: skills.ultimate.targetPattern?.area?.shape || 'square',
                 size: skills.ultimate.targetPattern?.area?.size || 3,
                 centerOnTarget: skills.ultimate.targetPattern?.area?.centerOnTarget !== undefined ? skills.ultimate.targetPattern.area.centerOnTarget : true
               }
             },
             targetType: skills.ultimate.targetType || 'all_enemies',
             range: skills.ultimate.range || 1,
             targetCondition: skills.ultimate.targetCondition || null,
             defenseReduction: {
               enabled: skills.ultimate.defenseReduction?.enabled !== undefined ? skills.ultimate.defenseReduction.enabled : true,
               formula: skills.ultimate.defenseReduction?.formula || 'linear',
               effectiveness: skills.ultimate.defenseReduction?.effectiveness || 1
             },
             conditions: {
               lowHp: skills.ultimate.conditions?.lowHp || 0,
               highHp: skills.ultimate.conditions?.highHp || 0,
               lowEnergy: skills.ultimate.conditions?.lowEnergy || 0,
               highEnergy: skills.ultimate.conditions?.highEnergy || 0,
               elementAdvantage: skills.ultimate.conditions?.elementAdvantage || false,
               formationPosition: skills.ultimate.conditions?.formationPosition || 0,
               comboCount: skills.ultimate.conditions?.comboCount || 0
             },
             effects: skills.ultimate.effects || [],
             petId: null, // Sẽ được set sau khi tạo pet
             skillSetId: `${name}_ultimate`,
             isActive: true,
             passiveTrigger: null
           };

           const ultimateSkill = new Skill(ultimateSkillData);
           await ultimateSkill.save();
           ultimateSkillId = ultimateSkill._id;
         }

         // Tạo Passive Skill
         if (skills.passive) {
           const passiveSkillData = {
             name: `${name} - Passive`,
             description: skills.passive.description || `Passive skill của ${name}`,
             type: 'passive',
             energyCost: 0,
             energyGeneration: 0,
             damageScaling: {
               attack: skills.passive.damageScaling?.attack || 0,
               defense: skills.passive.damageScaling?.defense || 20,
               speed: skills.passive.damageScaling?.speed || 0,
               hp: skills.passive.damageScaling?.hp || 0,
               accuracy: skills.passive.damageScaling?.accuracy || 0,
               evasion: skills.passive.damageScaling?.evasion || 0,
               criticalRate: skills.passive.damageScaling?.criticalRate || 0
             },
             levelScaling: {
               maxLevel: skills.passive.levelScaling?.maxLevel || 10,
               baseScaling: {
                 attack: skills.passive.levelScaling?.baseScaling?.attack || 0,
                 defense: skills.passive.levelScaling?.baseScaling?.defense || 20,
                 speed: skills.passive.levelScaling?.baseScaling?.speed || 0,
                 hp: skills.passive.levelScaling?.baseScaling?.hp || 0,
                 accuracy: skills.passive.levelScaling?.baseScaling?.accuracy || 0,
                 evasion: skills.passive.levelScaling?.baseScaling?.evasion || 0,
                 criticalRate: skills.passive.levelScaling?.baseScaling?.criticalRate || 0
               },
               scalingIncrease: {
                 attack: skills.passive.levelScaling?.scalingIncrease?.attack || 0,
                 defense: skills.passive.levelScaling?.scalingIncrease?.defense || 2,
                 speed: skills.passive.levelScaling?.scalingIncrease?.speed || 0,
                 hp: skills.passive.levelScaling?.scalingIncrease?.hp || 0,
                 accuracy: skills.passive.levelScaling?.scalingIncrease?.accuracy || 0,
                 evasion: skills.passive.levelScaling?.scalingIncrease?.evasion || 0,
                 criticalRate: skills.passive.levelScaling?.scalingIncrease?.criticalRate || 0
               },
               upgradeRequirements: {
                 materials: skills.passive.levelScaling?.upgradeRequirements?.materials || [],
                 gold: skills.passive.levelScaling?.upgradeRequirements?.gold || 1000,
                 petLevel: skills.passive.levelScaling?.upgradeRequirements?.petLevel || 5
               }
             },
             targetPattern: {
               type: skills.passive.targetPattern?.type || 'self',
               pattern: {
                 positions: skills.passive.targetPattern?.pattern?.positions || [],
                 relativePositions: skills.passive.targetPattern?.pattern?.relativePositions || [],
                 direction: skills.passive.targetPattern?.pattern?.direction || 'any',
                 range: skills.passive.targetPattern?.pattern?.range || 1,
                 maxTargets: skills.passive.targetPattern?.pattern?.maxTargets || 1
               },
               line: {
                 direction: skills.passive.targetPattern?.line?.direction,
                 length: skills.passive.targetPattern?.line?.length || 3,
                 canTargetSelf: skills.passive.targetPattern?.line?.canTargetSelf || false
               },
               cross: {
                 size: skills.passive.targetPattern?.cross?.size || 3,
                 canTargetSelf: skills.passive.targetPattern?.cross?.canTargetSelf || false
               },
               area: {
                 shape: skills.passive.targetPattern?.area?.shape || 'square',
                 size: skills.passive.targetPattern?.area?.size || 3,
                 centerOnTarget: skills.passive.targetPattern?.area?.centerOnTarget !== undefined ? skills.passive.targetPattern.area.centerOnTarget : true
               }
             },
             targetType: skills.passive.targetType || 'self',
             range: skills.passive.range || 1,
             targetCondition: skills.passive.targetCondition || null,
             defenseReduction: {
               enabled: skills.passive.defenseReduction?.enabled !== undefined ? skills.passive.defenseReduction.enabled : true,
               formula: skills.passive.defenseReduction?.formula || 'linear',
               effectiveness: skills.passive.defenseReduction?.effectiveness || 1
             },
             conditions: {
               lowHp: skills.passive.conditions?.lowHp || 0,
               highHp: skills.passive.conditions?.highHp || 0,
               lowEnergy: skills.passive.conditions?.lowEnergy || 0,
               highEnergy: skills.passive.conditions?.highEnergy || 0,
               elementAdvantage: skills.passive.conditions?.elementAdvantage || false,
               formationPosition: skills.passive.conditions?.formationPosition || 0,
               comboCount: skills.passive.conditions?.comboCount || 0
             },
             effects: skills.passive.effects || [],
             petId: null, // Sẽ được set sau khi tạo pet
             skillSetId: `${name}_passive`,
             isActive: true,
             passiveTrigger: skills.passive.passiveTrigger || 'onBattleStart'
           };

           const passiveSkill = new Skill(passiveSkillData);
           await passiveSkill.save();
           passiveSkillId = passiveSkill._id;
         }
       }

      const pet = new Pet({
        name,
        img,
        description,
        element,
        rarity,
        baseHp: baseHp || 1000,
        baseAttack: baseAttack || 100,
        baseDefense: baseDefense || 50,
        baseSpeed: baseSpeed || 100,
        baseAccuracy: baseAccuracy || 100,
        baseEvasion: baseEvasion || 10,
        baseCriticalRate: baseCriticalRate || 5,
        statGrowth: statGrowth || {},
        normalSkill: normalSkillId,
        ultimateSkill: ultimateSkillId,
        passiveSkill: passiveSkillId,
        evolutionStage: evolutionStage || 1,
        evolutionChain: evolutionChain || [],
        levelCap: levelCap || 100,
        isActive: isActive !== undefined ? isActive : true,
        isStarter: isStarter || false,
        teamBuff
      });

      await pet.save();

      // Populate references for response
      await pet.populate([
        { path: 'element', select: 'name icon' },
        { path: 'rarity', select: 'name color' },
        { path: 'normalSkill', select: 'name type' },
        { path: 'ultimateSkill', select: 'name type' },
        { path: 'passiveSkill', select: 'name type' }
      ]);

      res.status(201).json({
        success: true,
        data: pet,
        message: 'Tạo pet và skills thành công'
      });

    } catch (error) {
      console.error('Error in createPet:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo pet'
      });
    }
  }

  /**
   * Cập nhật pet (Admin) - Có thể cập nhật skills
   * PUT /api/pets/:petId
   */
  async updatePet(req, res) {
    try {
      const { petId } = req.params;
      const updateData = req.body;

      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy pet'
        });
      }

      // Check if name is being changed and if it already exists
      if (updateData.name && updateData.name !== pet.name) {
        const existingPet = await Pet.findOne({ name: updateData.name });
        if (existingPet) {
          return res.status(400).json({
            success: false,
            message: 'Tên pet đã tồn tại'
          });
        }
      }

      // Validate references if being updated
      if (updateData.element) {
        const elementExists = await Element.findById(updateData.element);
        if (!elementExists) {
          return res.status(400).json({
            success: false,
            message: 'Element không tồn tại'
          });
        }
      }

      if (updateData.rarity) {
        const rarityExists = await Rarity.findById(updateData.rarity);
        if (!rarityExists) {
          return res.status(400).json({
            success: false,
            message: 'Rarity không tồn tại'
          });
        }
      }

      // Xử lý cập nhật skills nếu có
      if (updateData.skills) {
        const skills = updateData.skills;
        delete updateData.skills; // Xóa skills khỏi updateData để không update trực tiếp

                 // Cập nhật Normal Skill
         if (skills.normal) {
           if (pet.normalSkill) {
             // Cập nhật skill hiện có
             await Skill.findByIdAndUpdate(pet.normalSkill, {
               name: skills.normal.name || `${updateData.name || pet.name} - Normal Attack`,
               description: skills.normal.description,
               energyGeneration: skills.normal.energyGeneration,
               damageScaling: {
                 attack: skills.normal.damageScaling?.attack || 80,
                 defense: skills.normal.damageScaling?.defense || 0,
                 speed: skills.normal.damageScaling?.speed || 0,
                 hp: skills.normal.damageScaling?.hp || 0,
                 accuracy: skills.normal.damageScaling?.accuracy || 0,
                 evasion: skills.normal.damageScaling?.evasion || 0,
                 criticalRate: skills.normal.damageScaling?.criticalRate || 0
               },
               levelScaling: {
                 maxLevel: skills.normal.levelScaling?.maxLevel || 10,
                 baseScaling: {
                   attack: skills.normal.levelScaling?.baseScaling?.attack || 80,
                   defense: skills.normal.levelScaling?.baseScaling?.defense || 0,
                   speed: skills.normal.levelScaling?.baseScaling?.speed || 0,
                   hp: skills.normal.levelScaling?.baseScaling?.hp || 0,
                   accuracy: skills.normal.levelScaling?.baseScaling?.accuracy || 0,
                   evasion: skills.normal.levelScaling?.baseScaling?.evasion || 0,
                   criticalRate: skills.normal.levelScaling?.baseScaling?.criticalRate || 0
                 },
                 scalingIncrease: {
                   attack: skills.normal.levelScaling?.scalingIncrease?.attack || 5,
                   defense: skills.normal.levelScaling?.scalingIncrease?.defense || 0,
                   speed: skills.normal.levelScaling?.scalingIncrease?.speed || 0,
                   hp: skills.normal.levelScaling?.scalingIncrease?.hp || 0,
                   accuracy: skills.normal.levelScaling?.scalingIncrease?.accuracy || 0,
                   evasion: skills.normal.levelScaling?.scalingIncrease?.evasion || 0,
                   criticalRate: skills.normal.levelScaling?.scalingIncrease?.criticalRate || 0
                 },
                 upgradeRequirements: {
                   materials: skills.normal.levelScaling?.upgradeRequirements?.materials || [],
                   gold: skills.normal.levelScaling?.upgradeRequirements?.gold || 1000,
                   petLevel: skills.normal.levelScaling?.upgradeRequirements?.petLevel || 5
                 }
               },
               targetPattern: {
                 type: skills.normal.targetPattern?.type || 'single',
                 pattern: {
                   positions: skills.normal.targetPattern?.pattern?.positions || [],
                   relativePositions: skills.normal.targetPattern?.pattern?.relativePositions || [],
                   direction: skills.normal.targetPattern?.pattern?.direction || 'any',
                   range: skills.normal.targetPattern?.pattern?.range || 1,
                   maxTargets: skills.normal.targetPattern?.pattern?.maxTargets || 1
                 },
                 line: {
                   direction: skills.normal.targetPattern?.line?.direction,
                   length: skills.normal.targetPattern?.line?.length || 3,
                   canTargetSelf: skills.normal.targetPattern?.line?.canTargetSelf || false
                 },
                 cross: {
                   size: skills.normal.targetPattern?.cross?.size || 3,
                   canTargetSelf: skills.normal.targetPattern?.cross?.canTargetSelf || false
                 },
                 area: {
                   shape: skills.normal.targetPattern?.area?.shape || 'square',
                   size: skills.normal.targetPattern?.area?.size || 3,
                   centerOnTarget: skills.normal.targetPattern?.area?.centerOnTarget !== undefined ? skills.normal.targetPattern.area.centerOnTarget : true
                 }
               },
               targetType: skills.normal.targetType || 'single',
               range: skills.normal.range || 1,
               targetCondition: skills.normal.targetCondition || null,
               defenseReduction: {
                 enabled: skills.normal.defenseReduction?.enabled !== undefined ? skills.normal.defenseReduction.enabled : true,
                 formula: skills.normal.defenseReduction?.formula || 'linear',
                 effectiveness: skills.normal.defenseReduction?.effectiveness || 1
               },
               conditions: {
                 lowHp: skills.normal.conditions?.lowHp || 0,
                 highHp: skills.normal.conditions?.highHp || 0,
                 lowEnergy: skills.normal.conditions?.lowEnergy || 0,
                 highEnergy: skills.normal.conditions?.highEnergy || 0,
                 elementAdvantage: skills.normal.conditions?.elementAdvantage || false,
                 formationPosition: skills.normal.conditions?.formationPosition || 0,
                 comboCount: skills.normal.conditions?.comboCount || 0
               },
               effects: skills.normal.effects || []
             });
           } else {
             // Tạo skill mới
             const normalSkillData = {
               name: skills.normal.name || `${updateData.name || pet.name} - Normal Attack`,
               description: skills.normal.description || `Normal attack của ${updateData.name || pet.name}`,
               type: 'normal',
               energyCost: 0,
               energyGeneration: skills.normal.energyGeneration || 10,
               damageScaling: {
                 attack: skills.normal.damageScaling?.attack || 80,
                 defense: skills.normal.damageScaling?.defense || 0,
                 speed: skills.normal.damageScaling?.speed || 0,
                 hp: skills.normal.damageScaling?.hp || 0,
                 accuracy: skills.normal.damageScaling?.accuracy || 0,
                 evasion: skills.normal.damageScaling?.evasion || 0,
                 criticalRate: skills.normal.damageScaling?.criticalRate || 0
               },
               levelScaling: {
                 maxLevel: skills.normal.levelScaling?.maxLevel || 10,
                 baseScaling: {
                   attack: skills.normal.levelScaling?.baseScaling?.attack || 80,
                   defense: skills.normal.levelScaling?.baseScaling?.defense || 0,
                   speed: skills.normal.levelScaling?.baseScaling?.speed || 0,
                   hp: skills.normal.levelScaling?.baseScaling?.hp || 0,
                   accuracy: skills.normal.levelScaling?.baseScaling?.accuracy || 0,
                   evasion: skills.normal.levelScaling?.baseScaling?.evasion || 0,
                   criticalRate: skills.normal.levelScaling?.baseScaling?.criticalRate || 0
                 },
                 scalingIncrease: {
                   attack: skills.normal.levelScaling?.scalingIncrease?.attack || 5,
                   defense: skills.normal.levelScaling?.scalingIncrease?.defense || 0,
                   speed: skills.normal.levelScaling?.scalingIncrease?.speed || 0,
                   hp: skills.normal.levelScaling?.scalingIncrease?.hp || 0,
                   accuracy: skills.normal.levelScaling?.scalingIncrease?.accuracy || 0,
                   evasion: skills.normal.levelScaling?.scalingIncrease?.evasion || 0,
                   criticalRate: skills.normal.levelScaling?.scalingIncrease?.criticalRate || 0
                 },
                 upgradeRequirements: {
                   materials: skills.normal.levelScaling?.upgradeRequirements?.materials || [],
                   gold: skills.normal.levelScaling?.upgradeRequirements?.gold || 1000,
                   petLevel: skills.normal.levelScaling?.upgradeRequirements?.petLevel || 5
                 }
               },
               targetPattern: {
                 type: skills.normal.targetPattern?.type || 'single',
                 pattern: {
                   positions: skills.normal.targetPattern?.pattern?.positions || [],
                   relativePositions: skills.normal.targetPattern?.pattern?.relativePositions || [],
                   direction: skills.normal.targetPattern?.pattern?.direction || 'any',
                   range: skills.normal.targetPattern?.pattern?.range || 1,
                   maxTargets: skills.normal.targetPattern?.pattern?.maxTargets || 1
                 },
                 line: {
                   direction: skills.normal.targetPattern?.line?.direction,
                   length: skills.normal.targetPattern?.line?.length || 3,
                   canTargetSelf: skills.normal.targetPattern?.line?.canTargetSelf || false
                 },
                 cross: {
                   size: skills.normal.targetPattern?.cross?.size || 3,
                   canTargetSelf: skills.normal.targetPattern?.cross?.canTargetSelf || false
                 },
                 area: {
                   shape: skills.normal.targetPattern?.area?.shape || 'square',
                   size: skills.normal.targetPattern?.area?.size || 3,
                   centerOnTarget: skills.normal.targetPattern?.area?.centerOnTarget !== undefined ? skills.normal.targetPattern.area.centerOnTarget : true
                 }
               },
               targetType: skills.normal.targetType || 'single',
               range: skills.normal.range || 1,
               targetCondition: skills.normal.targetCondition || null,
               defenseReduction: {
                 enabled: skills.normal.defenseReduction?.enabled !== undefined ? skills.normal.defenseReduction.enabled : true,
                 formula: skills.normal.defenseReduction?.formula || 'linear',
                 effectiveness: skills.normal.defenseReduction?.effectiveness || 1
               },
               conditions: {
                 lowHp: skills.normal.conditions?.lowHp || 0,
                 highHp: skills.normal.conditions?.highHp || 0,
                 lowEnergy: skills.normal.conditions?.lowEnergy || 0,
                 highEnergy: skills.normal.conditions?.highEnergy || 0,
                 elementAdvantage: skills.normal.conditions?.elementAdvantage || false,
                 formationPosition: skills.normal.conditions?.formationPosition || 0,
                 comboCount: skills.normal.conditions?.comboCount || 0
               },
               effects: skills.normal.effects || [],
               petId: pet._id,
               skillSetId: `${updateData.name || pet.name}_normal`,
               isActive: true,
               passiveTrigger: null
             };

             const normalSkill = new Skill(normalSkillData);
             await normalSkill.save();
             updateData.normalSkill = normalSkill._id;
           }
         }

                 // Cập nhật Ultimate Skill
         if (skills.ultimate) {
           if (pet.ultimateSkill) {
             // Cập nhật skill hiện có với đầy đủ fields
             await Skill.findByIdAndUpdate(pet.ultimateSkill, {
               name: skills.ultimate.name || `${updateData.name || pet.name} - Ultimate`,
               description: skills.ultimate.description,
               energyCost: skills.ultimate.energyCost || 100,
               energyGeneration: 0,
               damageScaling: {
                 attack: skills.ultimate.damageScaling?.attack || 150,
                 defense: skills.ultimate.damageScaling?.defense || 0,
                 speed: skills.ultimate.damageScaling?.speed || 0,
                 hp: skills.ultimate.damageScaling?.hp || 0,
                 accuracy: skills.ultimate.damageScaling?.accuracy || 0,
                 evasion: skills.ultimate.damageScaling?.evasion || 0,
                 criticalRate: skills.ultimate.damageScaling?.criticalRate || 0
               },
               levelScaling: {
                 maxLevel: skills.ultimate.levelScaling?.maxLevel || 10,
                 baseScaling: {
                   attack: skills.ultimate.levelScaling?.baseScaling?.attack || 150,
                   defense: skills.ultimate.levelScaling?.baseScaling?.defense || 0,
                   speed: skills.ultimate.levelScaling?.baseScaling?.speed || 0,
                   hp: skills.ultimate.levelScaling?.baseScaling?.hp || 0,
                   accuracy: skills.ultimate.levelScaling?.baseScaling?.accuracy || 0,
                   evasion: skills.ultimate.levelScaling?.baseScaling?.evasion || 0,
                   criticalRate: skills.ultimate.levelScaling?.baseScaling?.criticalRate || 0
                 },
                 scalingIncrease: {
                   attack: skills.ultimate.levelScaling?.scalingIncrease?.attack || 10,
                   defense: skills.ultimate.levelScaling?.scalingIncrease?.defense || 0,
                   speed: skills.ultimate.levelScaling?.scalingIncrease?.speed || 0,
                   hp: skills.ultimate.levelScaling?.scalingIncrease?.hp || 0,
                   accuracy: skills.ultimate.levelScaling?.scalingIncrease?.accuracy || 0,
                   evasion: skills.ultimate.levelScaling?.scalingIncrease?.evasion || 0,
                   criticalRate: skills.ultimate.levelScaling?.scalingIncrease?.criticalRate || 0
                 },
                 upgradeRequirements: {
                   materials: skills.ultimate.levelScaling?.upgradeRequirements?.materials || [],
                   gold: skills.ultimate.levelScaling?.upgradeRequirements?.gold || 1000,
                   petLevel: skills.ultimate.levelScaling?.upgradeRequirements?.petLevel || 5
                 }
               },
               targetPattern: {
                 type: skills.ultimate.targetPattern?.type || 'all_enemies',
                 pattern: {
                   positions: skills.ultimate.targetPattern?.pattern?.positions || [],
                   relativePositions: skills.ultimate.targetPattern?.pattern?.relativePositions || [],
                   direction: skills.ultimate.targetPattern?.pattern?.direction || 'any',
                   range: skills.ultimate.targetPattern?.pattern?.range || 1,
                   maxTargets: skills.ultimate.targetPattern?.pattern?.maxTargets || 1
                 },
                 line: {
                   direction: skills.ultimate.targetPattern?.line?.direction,
                   length: skills.ultimate.targetPattern?.line?.length || 3,
                   canTargetSelf: skills.ultimate.targetPattern?.line?.canTargetSelf || false
                 },
                 cross: {
                   size: skills.ultimate.targetPattern?.cross?.size || 3,
                   canTargetSelf: skills.ultimate.targetPattern?.cross?.canTargetSelf || false
                 },
                 area: {
                   shape: skills.ultimate.targetPattern?.area?.shape || 'square',
                   size: skills.ultimate.targetPattern?.area?.size || 3,
                   centerOnTarget: skills.ultimate.targetPattern?.area?.centerOnTarget !== undefined ? skills.ultimate.targetPattern.area.centerOnTarget : true
                 }
               },
               targetType: skills.ultimate.targetType || 'all_enemies',
               range: skills.ultimate.range || 1,
               targetCondition: skills.ultimate.targetCondition || null,
               defenseReduction: {
                 enabled: skills.ultimate.defenseReduction?.enabled !== undefined ? skills.ultimate.defenseReduction.enabled : true,
                 formula: skills.ultimate.defenseReduction?.formula || 'linear',
                 effectiveness: skills.ultimate.defenseReduction?.effectiveness || 1
               },
               conditions: {
                 lowHp: skills.ultimate.conditions?.lowHp || 0,
                 highHp: skills.ultimate.conditions?.highHp || 0,
                 lowEnergy: skills.ultimate.conditions?.lowEnergy || 0,
                 highEnergy: skills.ultimate.conditions?.highEnergy || 0,
                 elementAdvantage: skills.ultimate.conditions?.elementAdvantage || false,
                 formationPosition: skills.ultimate.conditions?.formationPosition || 0,
                 comboCount: skills.ultimate.conditions?.comboCount || 0
               },
               effects: skills.ultimate.effects || []
             });
           } else {
             // Tạo skill mới với đầy đủ fields
             const ultimateSkillData = {
               name: skills.ultimate.name || `${updateData.name || pet.name} - Ultimate`,
               description: skills.ultimate.description || `Ultimate skill của ${updateData.name || pet.name}`,
               type: 'ultimate',
               energyCost: skills.ultimate.energyCost || 100,
               energyGeneration: 0,
               damageScaling: {
                 attack: skills.ultimate.damageScaling?.attack || 150,
                 defense: skills.ultimate.damageScaling?.defense || 0,
                 speed: skills.ultimate.damageScaling?.speed || 0,
                 hp: skills.ultimate.damageScaling?.hp || 0,
                 accuracy: skills.ultimate.damageScaling?.accuracy || 0,
                 evasion: skills.ultimate.damageScaling?.evasion || 0,
                 criticalRate: skills.ultimate.damageScaling?.criticalRate || 0
               },
               levelScaling: {
                 maxLevel: skills.ultimate.levelScaling?.maxLevel || 10,
                 baseScaling: {
                   attack: skills.ultimate.levelScaling?.baseScaling?.attack || 150,
                   defense: skills.ultimate.levelScaling?.baseScaling?.defense || 0,
                   speed: skills.ultimate.levelScaling?.baseScaling?.speed || 0,
                   hp: skills.ultimate.levelScaling?.baseScaling?.hp || 0,
                   accuracy: skills.ultimate.levelScaling?.baseScaling?.accuracy || 0,
                   evasion: skills.ultimate.levelScaling?.baseScaling?.evasion || 0,
                   criticalRate: skills.ultimate.levelScaling?.baseScaling?.criticalRate || 0
                 },
                 scalingIncrease: {
                   attack: skills.ultimate.levelScaling?.scalingIncrease?.attack || 10,
                   defense: skills.ultimate.levelScaling?.scalingIncrease?.defense || 0,
                   speed: skills.ultimate.levelScaling?.scalingIncrease?.speed || 0,
                   hp: skills.ultimate.levelScaling?.scalingIncrease?.hp || 0,
                   accuracy: skills.ultimate.levelScaling?.scalingIncrease?.accuracy || 0,
                   evasion: skills.ultimate.levelScaling?.scalingIncrease?.evasion || 0,
                   criticalRate: skills.ultimate.levelScaling?.scalingIncrease?.criticalRate || 0
                 },
                 upgradeRequirements: {
                   materials: skills.ultimate.levelScaling?.upgradeRequirements?.materials || [],
                   gold: skills.ultimate.levelScaling?.upgradeRequirements?.gold || 1000,
                   petLevel: skills.ultimate.levelScaling?.upgradeRequirements?.petLevel || 5
                 }
               },
               targetPattern: {
                 type: skills.ultimate.targetPattern?.type || 'all_enemies',
                 pattern: {
                   positions: skills.ultimate.targetPattern?.pattern?.positions || [],
                   relativePositions: skills.ultimate.targetPattern?.pattern?.relativePositions || [],
                   direction: skills.ultimate.targetPattern?.pattern?.direction || 'any',
                   range: skills.ultimate.targetPattern?.pattern?.range || 1,
                   maxTargets: skills.ultimate.targetPattern?.pattern?.maxTargets || 1
                 },
                 line: {
                   direction: skills.ultimate.targetPattern?.line?.direction,
                   length: skills.ultimate.targetPattern?.line?.length || 3,
                   canTargetSelf: skills.ultimate.targetPattern?.line?.canTargetSelf || false
                 },
                 cross: {
                   size: skills.ultimate.targetPattern?.cross?.size || 3,
                   canTargetSelf: skills.ultimate.targetPattern?.cross?.canTargetSelf || false
                 },
                 area: {
                   shape: skills.ultimate.targetPattern?.area?.shape || 'square',
                   size: skills.ultimate.targetPattern?.area?.size || 3,
                   centerOnTarget: skills.ultimate.targetPattern?.area?.centerOnTarget !== undefined ? skills.ultimate.targetPattern.area.centerOnTarget : true
                 }
               },
               targetType: skills.ultimate.targetType || 'all_enemies',
               range: skills.ultimate.range || 1,
               targetCondition: skills.ultimate.targetCondition || null,
               defenseReduction: {
                 enabled: skills.ultimate.defenseReduction?.enabled !== undefined ? skills.ultimate.defenseReduction.enabled : true,
                 formula: skills.ultimate.defenseReduction?.formula || 'linear',
                 effectiveness: skills.ultimate.defenseReduction?.effectiveness || 1
               },
               conditions: {
                 lowHp: skills.ultimate.conditions?.lowHp || 0,
                 highHp: skills.ultimate.conditions?.highHp || 0,
                 lowEnergy: skills.ultimate.conditions?.lowEnergy || 0,
                 highEnergy: skills.ultimate.conditions?.highEnergy || 0,
                 elementAdvantage: skills.ultimate.conditions?.elementAdvantage || false,
                 formationPosition: skills.ultimate.conditions?.formationPosition || 0,
                 comboCount: skills.ultimate.conditions?.comboCount || 0
               },
               effects: skills.ultimate.effects || [],
               petId: pet._id,
               skillSetId: `${updateData.name || pet.name}_ultimate`,
               isActive: true,
               passiveTrigger: null
             };

             const ultimateSkill = new Skill(ultimateSkillData);
             await ultimateSkill.save();
             updateData.ultimateSkill = ultimateSkill._id;
           }
         }

         // Cập nhật Passive Skill
         if (skills.passive) {
           if (pet.passiveSkill) {
             // Cập nhật skill hiện có với đầy đủ fields
             await Skill.findByIdAndUpdate(pet.passiveSkill, {
               name: skills.passive.name || `${updateData.name || pet.name} - Passive`,
               description: skills.passive.description,
               energyCost: 0,
               energyGeneration: 0,
               damageScaling: {
                 attack: skills.passive.damageScaling?.attack || 0,
                 defense: skills.passive.damageScaling?.defense || 20,
                 speed: skills.passive.damageScaling?.speed || 0,
                 hp: skills.passive.damageScaling?.hp || 0,
                 accuracy: skills.passive.damageScaling?.accuracy || 0,
                 evasion: skills.passive.damageScaling?.evasion || 0,
                 criticalRate: skills.passive.damageScaling?.criticalRate || 0
               },
               levelScaling: {
                 maxLevel: skills.passive.levelScaling?.maxLevel || 10,
                 baseScaling: {
                   attack: skills.passive.levelScaling?.baseScaling?.attack || 0,
                   defense: skills.passive.levelScaling?.baseScaling?.defense || 20,
                   speed: skills.passive.levelScaling?.baseScaling?.speed || 0,
                   hp: skills.passive.levelScaling?.baseScaling?.hp || 0,
                   accuracy: skills.passive.levelScaling?.baseScaling?.accuracy || 0,
                   evasion: skills.passive.levelScaling?.baseScaling?.evasion || 0,
                   criticalRate: skills.passive.levelScaling?.baseScaling?.criticalRate || 0
                 },
                 scalingIncrease: {
                   attack: skills.passive.levelScaling?.scalingIncrease?.attack || 0,
                   defense: skills.passive.levelScaling?.scalingIncrease?.defense || 2,
                   speed: skills.passive.levelScaling?.scalingIncrease?.speed || 0,
                   hp: skills.passive.levelScaling?.scalingIncrease?.hp || 0,
                   accuracy: skills.passive.levelScaling?.scalingIncrease?.accuracy || 0,
                   evasion: skills.passive.levelScaling?.scalingIncrease?.evasion || 0,
                   criticalRate: skills.passive.levelScaling?.scalingIncrease?.criticalRate || 0
                 },
                 upgradeRequirements: {
                   materials: skills.passive.levelScaling?.upgradeRequirements?.materials || [],
                   gold: skills.passive.levelScaling?.upgradeRequirements?.gold || 1000,
                   petLevel: skills.passive.levelScaling?.upgradeRequirements?.petLevel || 5
                 }
               },
               targetPattern: {
                 type: skills.passive.targetPattern?.type || 'self',
                 pattern: {
                   positions: skills.passive.targetPattern?.pattern?.positions || [],
                   relativePositions: skills.passive.targetPattern?.pattern?.relativePositions || [],
                   direction: skills.passive.targetPattern?.pattern?.direction || 'any',
                   range: skills.passive.targetPattern?.pattern?.range || 1,
                   maxTargets: skills.passive.targetPattern?.pattern?.maxTargets || 1
                 },
                 line: {
                   direction: skills.passive.targetPattern?.line?.direction,
                   length: skills.passive.targetPattern?.line?.length || 3,
                   canTargetSelf: skills.passive.targetPattern?.line?.canTargetSelf || false
                 },
                 cross: {
                   size: skills.passive.targetPattern?.cross?.size || 3,
                   canTargetSelf: skills.passive.targetPattern?.cross?.canTargetSelf || false
                 },
                 area: {
                   shape: skills.passive.targetPattern?.area?.shape || 'square',
                   size: skills.passive.targetPattern?.area?.size || 3,
                   centerOnTarget: skills.passive.targetPattern?.area?.centerOnTarget !== undefined ? skills.passive.targetPattern.area.centerOnTarget : true
                 }
               },
               targetType: skills.passive.targetType || 'self',
               range: skills.passive.range || 1,
               targetCondition: skills.passive.targetCondition || null,
               defenseReduction: {
                 enabled: skills.passive.defenseReduction?.enabled !== undefined ? skills.passive.defenseReduction.enabled : true,
                 formula: skills.passive.defenseReduction?.formula || 'linear',
                 effectiveness: skills.passive.defenseReduction?.effectiveness || 1
               },
               conditions: {
                 lowHp: skills.passive.conditions?.lowHp || 0,
                 highHp: skills.passive.conditions?.highHp || 0,
                 lowEnergy: skills.passive.conditions?.lowEnergy || 0,
                 highEnergy: skills.passive.conditions?.highEnergy || 0,
                 elementAdvantage: skills.passive.conditions?.elementAdvantage || false,
                 formationPosition: skills.passive.conditions?.formationPosition || 0,
                 comboCount: skills.passive.conditions?.comboCount || 0
               },
               effects: skills.passive.effects || []
             });
           } else {
             // Tạo skill mới với đầy đủ fields
             const passiveSkillData = {
               name: skills.passive.name || `${updateData.name || pet.name} - Passive`,
               description: skills.passive.description || `Passive skill của ${updateData.name || pet.name}`,
               type: 'passive',
               energyCost: 0,
               energyGeneration: 0,
               damageScaling: {
                 attack: skills.passive.damageScaling?.attack || 0,
                 defense: skills.passive.damageScaling?.defense || 20,
                 speed: skills.passive.damageScaling?.speed || 0,
                 hp: skills.passive.damageScaling?.hp || 0,
                 accuracy: skills.passive.damageScaling?.accuracy || 0,
                 evasion: skills.passive.damageScaling?.evasion || 0,
                 criticalRate: skills.passive.damageScaling?.criticalRate || 0
               },
               levelScaling: {
                 maxLevel: skills.passive.levelScaling?.maxLevel || 10,
                 baseScaling: {
                   attack: skills.passive.levelScaling?.baseScaling?.attack || 0,
                   defense: skills.passive.levelScaling?.baseScaling?.defense || 20,
                   speed: skills.passive.levelScaling?.baseScaling?.speed || 0,
                   hp: skills.passive.levelScaling?.baseScaling?.hp || 0,
                   accuracy: skills.passive.levelScaling?.baseScaling?.accuracy || 0,
                   evasion: skills.passive.levelScaling?.baseScaling?.evasion || 0,
                   criticalRate: skills.passive.levelScaling?.baseScaling?.criticalRate || 0
                 },
                 scalingIncrease: {
                   attack: skills.passive.levelScaling?.scalingIncrease?.attack || 0,
                   defense: skills.passive.levelScaling?.scalingIncrease?.defense || 2,
                   speed: skills.passive.levelScaling?.scalingIncrease?.speed || 0,
                   hp: skills.passive.levelScaling?.scalingIncrease?.hp || 0,
                   accuracy: skills.passive.levelScaling?.scalingIncrease?.accuracy || 0,
                   evasion: skills.passive.levelScaling?.scalingIncrease?.evasion || 0,
                   criticalRate: skills.passive.levelScaling?.scalingIncrease?.criticalRate || 0
                 },
                 upgradeRequirements: {
                   materials: skills.passive.levelScaling?.upgradeRequirements?.materials || [],
                   gold: skills.passive.levelScaling?.upgradeRequirements?.gold || 1000,
                   petLevel: skills.passive.levelScaling?.upgradeRequirements?.petLevel || 5
                 }
               },
               targetPattern: {
                 type: skills.passive.targetPattern?.type || 'self',
                 pattern: {
                   positions: skills.passive.targetPattern?.pattern?.positions || [],
                   relativePositions: skills.passive.targetPattern?.pattern?.relativePositions || [],
                   direction: skills.passive.targetPattern?.pattern?.direction || 'any',
                   range: skills.passive.targetPattern?.pattern?.range || 1,
                   maxTargets: skills.passive.targetPattern?.pattern?.maxTargets || 1
                 },
                 line: {
                   direction: skills.passive.targetPattern?.line?.direction,
                   length: skills.passive.targetPattern?.line?.length || 3,
                   canTargetSelf: skills.passive.targetPattern?.line?.canTargetSelf || false
                 },
                 cross: {
                   size: skills.passive.targetPattern?.cross?.size || 3,
                   canTargetSelf: skills.passive.targetPattern?.cross?.canTargetSelf || false
                 },
                 area: {
                   shape: skills.passive.targetPattern?.area?.shape || 'square',
                   size: skills.passive.targetPattern?.area?.size || 3,
                   centerOnTarget: skills.passive.targetPattern?.area?.centerOnTarget !== undefined ? skills.passive.targetPattern.area.centerOnTarget : true
                 }
               },
               targetType: skills.passive.targetType || 'self',
               range: skills.passive.range || 1,
               targetCondition: skills.passive.targetCondition || null,
               defenseReduction: {
                 enabled: skills.passive.defenseReduction?.enabled !== undefined ? skills.passive.defenseReduction.enabled : true,
                 formula: skills.passive.defenseReduction?.formula || 'linear',
                 effectiveness: skills.passive.defenseReduction?.effectiveness || 1
               },
               conditions: {
                 lowHp: skills.passive.conditions?.lowHp || 0,
                 highHp: skills.passive.conditions?.highHp || 0,
                 lowEnergy: skills.passive.conditions?.lowEnergy || 0,
                 highEnergy: skills.passive.conditions?.highEnergy || 0,
                 elementAdvantage: skills.passive.conditions?.elementAdvantage || false,
                 formationPosition: skills.passive.conditions?.formationPosition || 0,
                 comboCount: skills.passive.conditions?.comboCount || 0
               },
               effects: skills.passive.effects || [],
               petId: pet._id,
               skillSetId: `${updateData.name || pet.name}_passive`,
               isActive: true,
               passiveTrigger: skills.passive.passiveTrigger || 'onBattleStart'
             };

             const passiveSkill = new Skill(passiveSkillData);
             await passiveSkill.save();
             updateData.passiveSkill = passiveSkill._id;
           }
         }
      }

      // Update pet
      Object.assign(pet, updateData);
      pet.updatedAt = new Date();
      await pet.save();

      // Populate references for response
      await pet.populate([
        { path: 'element', select: 'name icon' },
        { path: 'rarity', select: 'name color' },
        { path: 'normalSkill', select: 'name type' },
        { path: 'ultimateSkill', select: 'name type' },
        { path: 'passiveSkill', select: 'name type' }
      ]);

      res.json({
        success: true,
        data: pet,
        message: 'Cập nhật pet và skills thành công'
      });

    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID pet không hợp lệ'
        });
      }

      console.error('Error in updatePet:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật pet'
      });
    }
  }

  /**
   * Xóa pet (Admin)
   * DELETE /api/pets/:petId
   */
  async deletePet(req, res) {
    try {
      const { petId } = req.params;

      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy pet'
        });
      }

      // Soft delete - set isActive to false
      pet.isActive = false;
      pet.updatedAt = new Date();
      await pet.save();

      res.json({
        success: true,
        message: 'Xóa pet thành công'
      });

    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID pet không hợp lệ'
        });
      }

      console.error('Error in deletePet:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa pet'
      });
    }
  }
}

module.exports = new PetController(); 