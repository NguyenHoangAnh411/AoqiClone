const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');

mongoose.connect('mongodb+srv://hoanganh:hoanganh@cluster0.xjghqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find Water element and Common rarity
      const waterElement = await Element.findOne({ name: 'water' });
      const commonRarity = await Rarity.findOne({ name: 'common' });
      
      if (!waterElement) {
        console.error('Water element not found!');
        return;
      }
      
      if (!commonRarity) {
        console.error('Common rarity not found!');
        return;
      }
      
      console.log('Found Water element and Common rarity');
      
      // Create Water Turtle - Starter Pet
      const waterTurtle = new Pet({
        name: 'Water Turtle',
        img: 'water_turtle_starter.png',
        description: 'A gentle turtle with calming water powers. Perfect for defensive play!',
        element: waterElement._id,
        rarity: commonRarity._id,
        // Water-focused stats: High HP, Defense, moderate Attack
        baseHp: 1000,
        baseAttack: 70,
        baseDefense: 80,
        baseSpeed: 60,
        baseAccuracy: 85,
        baseEvasion: 8,
        baseCriticalRate: 4,
        // Water growth rates: HP and Defense focused
        statGrowth: {
          hp: 1.2,        // HP tăng nhanh
          attack: 0.9,    // Attack tăng chậm
          defense: 1.1,   // Defense tăng nhanh
          speed: 0.8,     // Speed tăng chậm
          accuracy: 1.0,  // Accuracy bình thường
          evasion: 0.9,   // Evasion tăng chậm
          criticalRate: 0.8 // Crit rate tăng chậm
        },
        levelCap: 100,
        isActive: true,
        isStarter: true
      });
      
      await waterTurtle.save();
      console.log('Created Water Turtle starter pet:', waterTurtle._id);
      
      // Create Normal Skill - Water Shield
      const normalSkill = new Skill({
        name: 'Water Shield',
        description: 'A protective water barrier that defends and counter-attacks',
        type: 'normal',
        energyCost: 0,
        energyGeneration: 20,
        damageScaling: {
          attack: 40,
          defense: 30,  // Sử dụng cả attack và defense
          speed: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 0
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 40,
            defense: 30,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 0
          },
          scalingIncrease: {
            attack: 4,
            defense: 4,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 0
          },
          upgradeRequirements: {
            materials: [],
            gold: 500,
            petLevel: 3
          }
        },
        targetType: 'single',
        range: 1,
        effects: [],
        conditions: {},
        defenseReduction: {
          enabled: true,
          formula: 'linear',
          effectiveness: 1.0
        },
        petId: waterTurtle._id,
        isActive: true
      });
      
      await normalSkill.save();
      console.log('Created normal skill: Water Shield');
      
      // Create Ultimate Skill - Tidal Wave
      const ultimateSkill = new Skill({
        name: 'Tidal Wave',
        description: 'A powerful wave attack that overwhelms enemies',
        type: 'ultimate',
        energyCost: 60,
        energyGeneration: 0,
        damageScaling: {
          attack: 80,
          defense: 20,  // Sử dụng cả attack và defense
          speed: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 10  // Low crit chance
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 80,
            defense: 20,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 10
          },
          scalingIncrease: {
            attack: 10,
            defense: 3,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 2
          },
          upgradeRequirements: {
            materials: [],
            gold: 1000,
            petLevel: 8
          }
        },
        targetType: 'single',
        range: 1,
        effects: [],
        conditions: {},
        defenseReduction: {
          enabled: true,
          formula: 'percentage',
          effectiveness: 1.2
        },
        petId: waterTurtle._id,
        isActive: true
      });
      
      await ultimateSkill.save();
      console.log('Created ultimate skill: Tidal Wave');
      
      // Create Passive Skill - Water Flow
      const passiveSkill = new Skill({
        name: 'Water Flow',
        description: 'Passive water enhancement that increases defense and healing',
        type: 'passive',
        energyCost: 0,
        energyGeneration: 0,
        damageScaling: {
          attack: 0,
          defense: 0,
          speed: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 0
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 0,
            defense: 0,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 0
          },
          scalingIncrease: {
            attack: 0,
            defense: 0,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 0
          },
          upgradeRequirements: {
            materials: [],
            gold: 800,
            petLevel: 5
          }
        },
        targetType: 'self',
        range: 0,
        effects: [],
        conditions: {},
        defenseReduction: {
          enabled: false,
          formula: 'linear',
          effectiveness: 0
        },
        petId: waterTurtle._id,
        isActive: true
      });
      
      await passiveSkill.save();
      console.log('Created passive skill: Water Flow');
      
      // Update pet with skill references
      waterTurtle.normalSkill = normalSkill._id;
      waterTurtle.ultimateSkill = ultimateSkill._id;
      waterTurtle.passiveSkill = passiveSkill._id;
      await waterTurtle.save();
      
      console.log('\n=== WATER TURTLE STARTER PET CREATED SUCCESSFULLY ===');
      console.log('Pet ID:', waterTurtle._id);
      console.log('Normal Skill ID:', normalSkill._id);
      console.log('Ultimate Skill ID:', ultimateSkill._id);
      console.log('Passive Skill ID:', passiveSkill._id);
      
      console.log('\nBase Stats:');
      console.log('- HP: 1000');
      console.log('- Attack: 70');
      console.log('- Defense: 80');
      console.log('- Speed: 60');
      console.log('- Accuracy: 85');
      console.log('- Evasion: 8');
      console.log('- Critical Rate: 4');
      console.log('- Element: Water');
      console.log('- Rarity: Common');
      
      console.log('\nStat Growth Rates:');
      console.log('- HP: 1.2x (Tăng nhanh)');
      console.log('- Attack: 0.9x (Tăng chậm)');
      console.log('- Defense: 1.1x (Tăng nhanh)');
      console.log('- Speed: 0.8x (Tăng chậm)');
      console.log('- Accuracy: 1.0x (Bình thường)');
      console.log('- Evasion: 0.9x (Tăng chậm)');
      console.log('- Critical Rate: 0.8x (Tăng chậm)');
      
      // Test Combat Power
      console.log('\n=== COMBAT POWER TEST ===');
      const cpBreakdown = await waterTurtle.getCombatPowerBreakdown(1);
      console.log(`Level 1 CP: ${cpBreakdown.finalCP}`);
      console.log(`Growth-based: ${cpBreakdown.breakdown.growthBased}`);
      console.log(`Baseline: ${cpBreakdown.breakdown.baseline}`);
      
      const cpLevel5 = await waterTurtle.getCombatPowerBreakdown(5);
      console.log(`Level 5 CP: ${cpLevel5.finalCP}`);
      
      console.log('\nSkills:');
      console.log('- Normal: Water Shield (Attack + Defense scaling)');
      console.log('- Ultimate: Tidal Wave (High Attack + Defense)');
      console.log('- Passive: Water Flow (Water enhancement)');
      
    } catch (error) {
      console.error('Error creating Water Turtle:', error);
    } finally {
      mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 