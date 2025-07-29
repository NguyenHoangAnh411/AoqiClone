const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');

mongoose.connect('mongodb+srv://hoanganh:hoanganh@cluster0.xjghqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find Wind element and Common rarity
      const windElement = await Element.findOne({ name: 'wind' });
      const commonRarity = await Rarity.findOne({ name: 'common' });
      
      if (!windElement) {
        console.error('Wind element not found!');
        return;
      }
      
      if (!commonRarity) {
        console.error('Common rarity not found!');
        return;
      }
      
      console.log('Found Wind element and Common rarity');
      
      // Create Wind Phoenix - Starter Pet
      const windPhoenix = new Pet({
        name: 'Wind Phoenix',
        img: 'wind_phoenix_starter.png',
        description: 'A graceful phoenix with wind powers. Perfect for mobility and support!',
        element: windElement._id,
        rarity: commonRarity._id,
        // Wind-focused stats: High Speed, Evasion, Accuracy, moderate Attack
        baseHp: 800,
        baseAttack: 80,
        baseDefense: 60,
        baseSpeed: 100,
        baseAccuracy: 95,
        baseEvasion: 20,
        baseCriticalRate: 6,
        // Wind growth rates: Speed, Evasion, and Accuracy focused
        statGrowth: {
          hp: 0.9,        // HP tăng chậm
          attack: 1.0,    // Attack tăng bình thường
          defense: 0.8,   // Defense tăng chậm
          speed: 1.3,     // Speed tăng rất nhanh
          accuracy: 1.2,  // Accuracy tăng nhanh
          evasion: 1.4,   // Evasion tăng rất nhanh
          criticalRate: 0.9 // Crit rate tăng chậm
        },
        levelCap: 100,
        isActive: true,
        isStarter: true
      });
      
      await windPhoenix.save();
      console.log('Created Wind Phoenix starter pet:', windPhoenix._id);
      
      // Create Normal Skill - Wind Slash
      const normalSkill = new Skill({
        name: 'Wind Slash',
        description: 'A swift wind blade that cuts through enemies',
        type: 'normal',
        energyCost: 0,
        energyGeneration: 25,
        damageScaling: {
          attack: 55,
          speed: 25,  // Sử dụng cả attack và speed
          defense: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 0
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 55,
            speed: 25,
            defense: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 0
          },
          scalingIncrease: {
            attack: 6,
            speed: 3,
            defense: 0,
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
          effectiveness: 0.8
        },
        petId: windPhoenix._id,
        isActive: true
      });
      
      await normalSkill.save();
      console.log('Created normal skill: Wind Slash');
      
      // Create Ultimate Skill - Hurricane Strike
      const ultimateSkill = new Skill({
        name: 'Hurricane Strike',
        description: 'A powerful wind storm that hits multiple enemies',
        type: 'ultimate',
        energyCost: 60,
        energyGeneration: 0,
        damageScaling: {
          attack: 85,
          speed: 35,  // Sử dụng cả attack và speed
          defense: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 8  // Moderate crit chance
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 85,
            speed: 35,
            defense: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 8
          },
          scalingIncrease: {
            attack: 10,
            speed: 4,
            defense: 0,
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
          effectiveness: 1.0
        },
        petId: windPhoenix._id,
        isActive: true
      });
      
      await ultimateSkill.save();
      console.log('Created ultimate skill: Hurricane Strike');
      
      // Create Passive Skill - Wind Aura
      const passiveSkill = new Skill({
        name: 'Wind Aura',
        description: 'Passive wind enhancement that increases speed and evasion',
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
        petId: windPhoenix._id,
        isActive: true
      });
      
      await passiveSkill.save();
      console.log('Created passive skill: Wind Aura');
      
      // Update pet with skill references
      windPhoenix.normalSkill = normalSkill._id;
      windPhoenix.ultimateSkill = ultimateSkill._id;
      windPhoenix.passiveSkill = passiveSkill._id;
      await windPhoenix.save();
      
      console.log('\n=== WIND PHOENIX STARTER PET CREATED SUCCESSFULLY ===');
      console.log('Pet ID:', windPhoenix._id);
      console.log('Normal Skill ID:', normalSkill._id);
      console.log('Ultimate Skill ID:', ultimateSkill._id);
      console.log('Passive Skill ID:', passiveSkill._id);
      
      console.log('\nBase Stats:');
      console.log('- HP: 800');
      console.log('- Attack: 80');
      console.log('- Defense: 60');
      console.log('- Speed: 100');
      console.log('- Accuracy: 95');
      console.log('- Evasion: 20');
      console.log('- Critical Rate: 6');
      console.log('- Element: Wind');
      console.log('- Rarity: Common');
      
      console.log('\nStat Growth Rates:');
      console.log('- Speed: 1.3x (Tăng rất nhanh)');
      console.log('- Evasion: 1.4x (Tăng rất nhanh)');
      console.log('- Accuracy: 1.2x (Tăng nhanh)');
      console.log('- Attack: 1.0x (Tăng bình thường)');
      console.log('- HP: 0.9x (Tăng chậm)');
      console.log('- Critical Rate: 0.9x (Tăng chậm)');
      console.log('- Defense: 0.8x (Tăng chậm)');
      
      // Test Combat Power
      console.log('\n=== COMBAT POWER TEST ===');
      const cpBreakdown = await windPhoenix.getCombatPowerBreakdown(1);
      console.log(`Level 1 CP: ${cpBreakdown.finalCP}`);
      console.log(`Growth-based: ${cpBreakdown.breakdown.growthBased}`);
      console.log(`Baseline: ${cpBreakdown.breakdown.baseline}`);
      
      const cpLevel5 = await windPhoenix.getCombatPowerBreakdown(5);
      console.log(`Level 5 CP: ${cpLevel5.finalCP}`);
      
      console.log('\nSkills:');
      console.log('- Normal: Wind Slash (Attack + Speed scaling)');
      console.log('- Ultimate: Hurricane Strike (High Attack + Speed)');
      console.log('- Passive: Wind Aura (Wind enhancement)');
      
    } catch (error) {
      console.error('Error creating Wind Phoenix:', error);
    } finally {
      mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 