const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');
const Effect = require('../models/Effect');

class PetController {
  
  // ==================== PET MANAGEMENT ====================
  
  /**
   * Create a new pet with skills
   * POST /api/pets
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
        levelCap,
        isStarter,
        isActive,
        // Skills data
        skills: {
          normalSkill,
          ultimateSkill,
          passiveSkill
        } = {}
      } = req.body;

      // Validate required fields
      if (!name || !img || !element || !rarity) {
        return res.status(400).json({
          success: false,
          message: 'Name, img, element, and rarity are required'
        });
      }

      // Validate element and rarity exist
      const elementExists = await Element.findById(element);
      const rarityExists = await Rarity.findById(rarity);
      
      if (!elementExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid element ID'
        });
      }
      
      if (!rarityExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid rarity ID'
        });
      }

      // Create pet data
      const petData = {
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
        statGrowth: req.body.statGrowth || {
          hp: 1.0,
          attack: 1.0,
          defense: 1.0,
          speed: 1.0,
          accuracy: 1.0,
          evasion: 1.0,
          criticalRate: 1.0
        },
        levelCap: levelCap || 100,
        isStarter: isStarter || false,
        isActive: isActive !== undefined ? isActive : true,
        evolutionStage: 1,
        evolutionChain: []
      };

      // Create pet
      const pet = new Pet(petData);
      await pet.save();

      // Create skills if provided
      const createdSkills = {};
      
      if (normalSkill) {
        const normalSkillData = {
          ...normalSkill,
          petId: pet._id,
          type: 'normal',
          isActive: true
        };
        
        // Set default values for skill
        const defaultNormalSkill = {
          name: normalSkillData.name || 'Normal Attack',
          description: normalSkillData.description || 'Basic attack',
          energyCost: 0,
          energyGeneration: 10,
          damageScaling: {
            attack: normalSkillData.damageScaling?.attack || 75,
            defense: normalSkillData.damageScaling?.defense || 0,
            speed: normalSkillData.damageScaling?.speed || 0,
            hp: normalSkillData.damageScaling?.hp || 0,
            accuracy: normalSkillData.damageScaling?.accuracy || 0,
            evasion: normalSkillData.damageScaling?.evasion || 0,
            criticalRate: normalSkillData.damageScaling?.criticalRate || 0
          },
          levelScaling: {
            maxLevel: 10,
            baseScaling: {
              attack: normalSkillData.levelScaling?.baseScaling?.attack || 75,
              defense: normalSkillData.levelScaling?.baseScaling?.defense || 0,
              speed: normalSkillData.levelScaling?.baseScaling?.speed || 0,
              hp: normalSkillData.levelScaling?.baseScaling?.hp || 0,
              accuracy: normalSkillData.levelScaling?.baseScaling?.accuracy || 0,
              evasion: normalSkillData.levelScaling?.baseScaling?.evasion || 0,
              criticalRate: normalSkillData.levelScaling?.baseScaling?.criticalRate || 0
            },
            scalingIncrease: {
              attack: normalSkillData.levelScaling?.scalingIncrease?.attack || 12,
              defense: normalSkillData.levelScaling?.scalingIncrease?.defense || 0,
              speed: normalSkillData.levelScaling?.scalingIncrease?.speed || 0,
              hp: normalSkillData.levelScaling?.scalingIncrease?.hp || 0,
              accuracy: normalSkillData.levelScaling?.scalingIncrease?.accuracy || 0,
              evasion: normalSkillData.levelScaling?.scalingIncrease?.evasion || 0,
              criticalRate: normalSkillData.levelScaling?.scalingIncrease?.criticalRate || 0
            },
            upgradeRequirements: {
              materials: normalSkillData.levelScaling?.upgradeRequirements?.materials || [],
              gold: normalSkillData.levelScaling?.upgradeRequirements?.gold || 1000,
              petLevel: normalSkillData.levelScaling?.upgradeRequirements?.petLevel || 5
            }
          },
          targetType: 'single',
          range: 1,
          effects: normalSkillData.effects || [],
          conditions: normalSkillData.conditions || {},
          defenseReduction: {
            enabled: true,
            formula: 'linear',
            effectiveness: 1.0
          }
        };
        
        const normalSkillObj = new Skill(defaultNormalSkill);
        await normalSkillObj.save();
        createdSkills.normalSkill = normalSkillObj._id;
      }

      if (ultimateSkill) {
        const ultimateSkillData = {
          ...ultimateSkill,
          petId: pet._id,
          type: 'ultimate',
          isActive: true
        };
        
        // Set default values for ultimate skill
        const defaultUltimateSkill = {
          name: ultimateSkillData.name || 'Ultimate Attack',
          description: ultimateSkillData.description || 'Powerful ultimate attack',
          energyCost: ultimateSkillData.energyCost || 50,
          energyGeneration: 0,
          damageScaling: {
            attack: ultimateSkillData.damageScaling?.attack || 120,
            defense: ultimateSkillData.damageScaling?.defense || 0,
            speed: ultimateSkillData.damageScaling?.speed || 0,
            hp: ultimateSkillData.damageScaling?.hp || 0,
            accuracy: ultimateSkillData.damageScaling?.accuracy || 0,
            evasion: ultimateSkillData.damageScaling?.evasion || 0,
            criticalRate: ultimateSkillData.damageScaling?.criticalRate || 0
          },
          levelScaling: {
            maxLevel: 10,
            baseScaling: {
              attack: ultimateSkillData.levelScaling?.baseScaling?.attack || 120,
              defense: ultimateSkillData.levelScaling?.baseScaling?.defense || 0,
              speed: ultimateSkillData.levelScaling?.baseScaling?.speed || 0,
              hp: ultimateSkillData.levelScaling?.baseScaling?.hp || 0,
              accuracy: ultimateSkillData.levelScaling?.baseScaling?.accuracy || 0,
              evasion: ultimateSkillData.levelScaling?.baseScaling?.evasion || 0,
              criticalRate: ultimateSkillData.levelScaling?.baseScaling?.criticalRate || 0
            },
            scalingIncrease: {
              attack: ultimateSkillData.levelScaling?.scalingIncrease?.attack || 15,
              defense: ultimateSkillData.levelScaling?.scalingIncrease?.defense || 0,
              speed: ultimateSkillData.levelScaling?.scalingIncrease?.speed || 0,
              hp: ultimateSkillData.levelScaling?.scalingIncrease?.hp || 0,
              accuracy: ultimateSkillData.levelScaling?.scalingIncrease?.accuracy || 0,
              evasion: ultimateSkillData.levelScaling?.scalingIncrease?.evasion || 0,
              criticalRate: ultimateSkillData.levelScaling?.scalingIncrease?.criticalRate || 0
            },
            upgradeRequirements: {
              materials: ultimateSkillData.levelScaling?.upgradeRequirements?.materials || [],
              gold: ultimateSkillData.levelScaling?.upgradeRequirements?.gold || 2000,
              petLevel: ultimateSkillData.levelScaling?.upgradeRequirements?.petLevel || 10
            }
          },
          targetType: 'single',
          range: 1,
          effects: ultimateSkillData.effects || [],
          conditions: ultimateSkillData.conditions || {},
          defenseReduction: {
            enabled: true,
            formula: 'linear',
            effectiveness: 1.0
          }
        };
        
        const ultimateSkillObj = new Skill(defaultUltimateSkill);
        await ultimateSkillObj.save();
        createdSkills.ultimateSkill = ultimateSkillObj._id;
      }

      if (passiveSkill) {
        const passiveSkillData = {
          ...passiveSkill,
          petId: pet._id,
          type: 'passive',
          isActive: true
        };
        
        // Set default values for passive skill
        const defaultPassiveSkill = {
          name: passiveSkillData.name || 'Passive Ability',
          description: passiveSkillData.description || 'Passive ability',
          energyCost: 0,
          energyGeneration: 0,
          damageScaling: {
            attack: passiveSkillData.damageScaling?.attack || 0,
            defense: passiveSkillData.damageScaling?.defense || 0,
            speed: passiveSkillData.damageScaling?.speed || 0,
            hp: passiveSkillData.damageScaling?.hp || 0,
            accuracy: passiveSkillData.damageScaling?.accuracy || 0,
            evasion: passiveSkillData.damageScaling?.evasion || 0,
            criticalRate: passiveSkillData.damageScaling?.criticalRate || 0
          },
          levelScaling: {
            maxLevel: 10,
            baseScaling: {
              attack: passiveSkillData.levelScaling?.baseScaling?.attack || 0,
              defense: passiveSkillData.levelScaling?.baseScaling?.defense || 0,
              speed: passiveSkillData.levelScaling?.baseScaling?.speed || 0,
              hp: passiveSkillData.levelScaling?.baseScaling?.hp || 0,
              accuracy: passiveSkillData.levelScaling?.baseScaling?.accuracy || 0,
              evasion: passiveSkillData.levelScaling?.baseScaling?.evasion || 0,
              criticalRate: passiveSkillData.levelScaling?.baseScaling?.criticalRate || 0
            },
            scalingIncrease: {
              attack: passiveSkillData.levelScaling?.scalingIncrease?.attack || 0,
              defense: passiveSkillData.levelScaling?.scalingIncrease?.defense || 0,
              speed: passiveSkillData.levelScaling?.scalingIncrease?.speed || 0,
              hp: passiveSkillData.levelScaling?.scalingIncrease?.hp || 0,
              accuracy: passiveSkillData.levelScaling?.scalingIncrease?.accuracy || 0,
              evasion: passiveSkillData.levelScaling?.scalingIncrease?.evasion || 0,
              criticalRate: passiveSkillData.levelScaling?.scalingIncrease?.criticalRate || 0
            },
            upgradeRequirements: {
              materials: passiveSkillData.levelScaling?.upgradeRequirements?.materials || [],
              gold: passiveSkillData.levelScaling?.upgradeRequirements?.gold || 1500,
              petLevel: passiveSkillData.levelScaling?.upgradeRequirements?.petLevel || 8
            }
          },
          targetType: 'self',
          range: 0,
          effects: passiveSkillData.effects || [],
          conditions: passiveSkillData.conditions || {},
          defenseReduction: {
            enabled: false,
            formula: 'linear',
            effectiveness: 0
          }
        };
        
        const passiveSkillObj = new Skill(defaultPassiveSkill);
        await passiveSkillObj.save();
        createdSkills.passiveSkill = passiveSkillObj._id;
      }

      // Update pet with skill references
      if (Object.keys(createdSkills).length > 0) {
        Object.assign(pet, createdSkills);
        await pet.save();
      }

      // Populate and return created pet
      await pet.populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill']);

      res.status(201).json({
        success: true,
        message: 'Pet created successfully',
        data: {
          pet,
          skills: createdSkills
        }
      });

    } catch (error) {
      console.error('Error creating pet:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get all pets with filters
   * GET /api/pets
   */
  async getAllPets(req, res) {
    try {
      const { 
        element, 
        rarity, 
        isStarter, 
        name,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {};
      if (element) filters.element = element;
      if (rarity) filters.rarity = rarity;
      if (isStarter !== undefined) filters.isStarter = isStarter === 'true';
      if (name) filters.name = { $regex: name, $options: 'i' };
      filters.isActive = true; // Only show active pets

      const skip = (page - 1) * limit;
      
      const pets = await Pet.find(filters)
        .populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill'])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Pet.countDocuments(filters);

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
        }
      });

    } catch (error) {
      console.error('Error getting pets:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get pet by ID
   * GET /api/pets/:id
   */
  async getPetById(req, res) {
    try {
      const { id } = req.params;

      const pet = await Pet.findById(id)
        .populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill']);

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      if (!pet.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Pet is not active'
        });
      }

      res.json({
        success: true,
        data: pet
      });

    } catch (error) {
      console.error('Error getting pet:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Update pet
   * PUT /api/pets/:id
   */
  async updatePet(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove skills from update data (skills should be updated separately)
      const { skills, ...petUpdateData } = updateData;

      const pet = await Pet.findById(id);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      // Update pet
      Object.assign(pet, petUpdateData);
      await pet.save();

      // Populate and return updated pet
      await pet.populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill']);

      res.json({
        success: true,
        message: 'Pet updated successfully',
        data: pet
      });

    } catch (error) {
      console.error('Error updating pet:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Delete pet (soft delete)
   * DELETE /api/pets/:id
   */
  async deletePet(req, res) {
    try {
      const { id } = req.params;

      const pet = await Pet.findById(id);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      // Soft delete - set isActive to false
      pet.isActive = false;
      await pet.save();

      res.json({
        success: true,
        message: 'Pet deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting pet:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // ==================== SKILL MANAGEMENT ====================
  
  /**
   * Create skill for pet
   * POST /api/pets/:petId/skills
   */
  async createSkill(req, res) {
    try {
      const { petId } = req.params;
      const skillData = req.body;

      // Check if pet exists
      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      // Validate skill data
      if (!skillData.name || !skillData.type) {
        return res.status(400).json({
          success: false,
          message: 'Skill must have name and type'
        });
      }

      if (!['normal', 'ultimate', 'passive'].includes(skillData.type)) {
        return res.status(400).json({
          success: false,
          message: 'Skill type must be normal, ultimate, or passive'
        });
      }

      // Check if pet already has this type of skill
      const existingSkill = await Skill.findOne({ 
        petId, 
        type: skillData.type 
      });

      if (existingSkill) {
        return res.status(400).json({
          success: false,
          message: `Pet already has a ${skillData.type} skill`
        });
      }

      // Create skill with default values
      const defaultSkillData = {
        name: skillData.name,
        description: skillData.description || '',
        type: skillData.type,
        energyCost: skillData.energyCost || 0,
        energyGeneration: skillData.energyGeneration || 0,
        damageScaling: skillData.damageScaling || {
          attack: 0, defense: 0, speed: 0, hp: 0, accuracy: 0, evasion: 0, criticalRate: 0
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: skillData.levelScaling?.baseScaling || {
            attack: 0, defense: 0, speed: 0, hp: 0, accuracy: 0, evasion: 0, criticalRate: 0
          },
          scalingIncrease: skillData.levelScaling?.scalingIncrease || {
            attack: 0, defense: 0, speed: 0, hp: 0, accuracy: 0, evasion: 0, criticalRate: 0
          },
          upgradeRequirements: {
            materials: skillData.levelScaling?.upgradeRequirements?.materials || [],
            gold: skillData.levelScaling?.upgradeRequirements?.gold || 1000,
            petLevel: skillData.levelScaling?.upgradeRequirements?.petLevel || 5
          }
        },
        targetType: skillData.targetType || 'single',
        range: skillData.range || 1,
        effects: skillData.effects || [],
        conditions: skillData.conditions || {},
        defenseReduction: {
          enabled: skillData.defenseReduction?.enabled !== undefined ? skillData.defenseReduction.enabled : true,
          formula: skillData.defenseReduction?.formula || 'linear',
          effectiveness: skillData.defenseReduction?.effectiveness || 1.0
        },
        petId,
        isActive: true
      };

      // Create skill
      const skill = new Skill(defaultSkillData);
      await skill.save();

      // Update pet with skill reference
      const skillField = `${skillData.type}Skill`;
      pet[skillField] = skill._id;
      await pet.save();

      // Populate and return
      await skill.populate('petId');
      await pet.populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill']);

      res.status(201).json({
        success: true,
        message: 'Skill created successfully',
        data: {
          skill,
          pet
        }
      });

    } catch (error) {
      console.error('Error creating skill:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Update skill
   * PUT /api/skills/:id
   */
  async updateSkill(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const skill = await Skill.findById(id);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Skill not found'
        });
      }

      // Update skill
      Object.assign(skill, updateData);
      await skill.save();

      // Populate and return
      await skill.populate('petId');

      res.json({
        success: true,
        message: 'Skill updated successfully',
        data: skill
      });

    } catch (error) {
      console.error('Error updating skill:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Delete skill
   * DELETE /api/skills/:id
   */
  async deleteSkill(req, res) {
    try {
      const { id } = req.params;

      const skill = await Skill.findById(id);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Skill not found'
        });
      }

      // Remove skill reference from pet
      const pet = await Pet.findById(skill.petId);
      if (pet) {
        const skillField = `${skill.type}Skill`;
        if (pet[skillField] && pet[skillField].toString() === id) {
          pet[skillField] = null;
          await pet.save();
        }
      }

      // Delete skill
      await Skill.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Skill deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting skill:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // ==================== UTILITY ENDPOINTS ====================
  
  /**
   * Get starter pets
   * GET /api/pets/starter
   */
  async getStarterPets(req, res) {
    try {
      const pets = await Pet.find({ isStarter: true, isActive: true })
        .populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill'])
        .sort({ name: 1 });
      
      res.json({
        success: true,
        data: pets
      });

    } catch (error) {
      console.error('Error getting starter pets:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get pets by element
   * GET /api/pets/element/:elementId
   */
  async getPetsByElement(req, res) {
    try {
      const { elementId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const pets = await Pet.find({ 
        element: elementId, 
        isActive: true 
      })
        .populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill'])
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit));

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
        }
      });

    } catch (error) {
      console.error('Error getting pets by element:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get pets by rarity
   * GET /api/pets/rarity/:rarityId
   */
  async getPetsByRarity(req, res) {
    try {
      const { rarityId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const pets = await Pet.find({ 
        rarity: rarityId, 
        isActive: true 
      })
        .populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill'])
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit));

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
        }
      });

    } catch (error) {
      console.error('Error getting pets by rarity:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Search pets by name
   * GET /api/pets/search
   */
  async searchPets(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const pets = await Pet.find({ 
        name: { $regex: q, $options: 'i' },
        isActive: true 
      })
        .populate(['element', 'rarity', 'normalSkill', 'ultimateSkill', 'passiveSkill'])
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Pet.countDocuments({ 
        name: { $regex: q, $options: 'i' },
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
        }
      });

    } catch (error) {
      console.error('Error searching pets:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get pet statistics
   * GET /api/pets/stats
   */
  async getPetStats(req, res) {
    try {
      const totalPets = await Pet.countDocuments({ isActive: true });
      const starterPets = await Pet.countDocuments({ isStarter: true, isActive: true });
      
      const petsByElement = await Pet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$element', count: { $sum: 1 } } },
        { $lookup: { from: 'elements', localField: '_id', foreignField: '_id', as: 'element' } },
        { $unwind: '$element' },
        { $project: { elementName: '$element.name', count: 1 } }
      ]);

      const petsByRarity = await Pet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$rarity', count: { $sum: 1 } } },
        { $lookup: { from: 'rarities', localField: '_id', foreignField: '_id', as: 'rarity' } },
        { $unwind: '$rarity' },
        { $project: { rarityName: '$rarity.name', count: 1 } }
      ]);

      res.json({
        success: true,
        data: {
          totalPets,
          starterPets,
          petsByElement,
          petsByRarity
        }
      });

    } catch (error) {
      console.error('Error getting pet stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get pet stat growth info
   * GET /api/pets/:id/stat-growth
   */
  async getPetStatGrowth(req, res) {
    try {
      const { id } = req.params;
      const { startLevel = 1, endLevel = 10 } = req.query;

      const pet = await Pet.findById(id)
        .populate(['element', 'rarity']);

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      const statGrowthInfo = pet.getStatGrowthInfo();
      const statGrowthPreview = pet.getStatGrowthPreview(
        parseInt(startLevel), 
        parseInt(endLevel)
      );

      res.json({
        success: true,
        data: {
          pet: {
            id: pet._id,
            name: pet.name,
            element: pet.element,
            rarity: pet.rarity
          },
          statGrowth: statGrowthInfo,
          preview: statGrowthPreview
        }
      });

    } catch (error) {
      console.error('Error getting pet stat growth:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get pet combat power breakdown
   * GET /api/pets/:id/combat-power
   */
  async getPetCombatPower(req, res) {
    try {
      const { id } = req.params;
      const { level = 1 } = req.query;

      const pet = await Pet.findById(id)
        .populate(['element', 'rarity']);

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      const combatPowerBreakdown = await pet.getCombatPowerBreakdown(parseInt(level));

      res.json({
        success: true,
        data: {
          pet: {
            id: pet._id,
            name: pet.name,
            element: pet.element,
            rarity: pet.rarity
          },
          combatPower: combatPowerBreakdown
        }
      });

    } catch (error) {
      console.error('Error getting pet combat power:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new PetController(); 