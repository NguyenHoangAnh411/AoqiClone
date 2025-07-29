const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');

mongoose.connect('mongodb+srv://hoanganh:hoanganh@cluster0.xjghqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find Thunder element and Common rarity
      const thunderElement = await Element.findOne({ name: 'thunder' });
      const commonRarity = await Rarity.findOne({ name: 'common' });
      
      if (!thunderElement) {
        console.error('Thunder element not found!');
        return;
      }
      
      if (!commonRarity) {
        console.error('Common rarity not found!');
        return;
      }
      
      console.log('Found Thunder element and Common rarity');
      
      // Create Thunder Eagle - Starter Pet
      const thunderEagle = new Pet({
        name: 'Thunder Eagle',
        img: 'thunder_eagle_starter.png',
        description: 'A majestic eagle with lightning powers. Perfect for burst damage and critical hits!',
        element: thunderElement._id,
        rarity: commonRarity._id,
        // Thunder-focused stats: High Attack, Speed, Critical Rate, moderate HP
        baseHp: 900,
        baseAttack: 95,
        baseDefense: 50,
        baseSpeed: 85,
        baseAccuracy: 88,
        baseEvasion: 12,
        baseCriticalRate: 12,
        // Thunder growth rates: Attack, Speed, and Critical Rate focused
        statGrowth: {
          hp: 0.8,        // HP tăng chậm
          attack: 1.2,    // Attack tăng nhanh
          defense: 0.7,   // Defense tăng chậm
          speed: 1.2,     // Speed tăng nhanh
          accuracy: 1.0,  // Accuracy tăng bình thường
          evasion: 1.1,   // Evasion tăng nhanh
          criticalRate: 1.4 // Crit rate tăng rất nhanh
        },
        levelCap: 100,
        isActive: true,
        isStarter: true
      });
      
      await thunderEagle.save();
      console.log('Created Thunder Eagle starter pet:', thunderEagle._id);
      
      // Create Normal Skill - Lightning Strike
      const normalSkill = new Skill({
        name: 'Lightning Strike',
        description: 'A quick lightning bolt that can chain to multiple enemies',
        type: 'normal',
        energyCost: 0,
        energyGeneration: 30,
        damageScaling: {
          attack: 65,
          speed: 15,  // Sử dụng cả attack và speed
          defense: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 10  // High crit chance
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 65,
            speed: 15,
            defense: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 10
          },
          scalingIncrease: {
            attack: 7,
            speed: 2,
            defense: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 2
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
          effectiveness: 0.9
        },
        petId: thunderEagle._id,
        isActive: true
      });
      
      await normalSkill.save();
      console.log('Created normal skill: Lightning Strike');
      
      // Create Ultimate Skill - Thunder Storm
      const ultimateSkill = new Skill({
        name: 'Thunder Storm',
        description: 'A devastating thunderstorm that rains lightning from above',
        type: 'ultimate',
        energyCost: 60,
        energyGeneration: 0,
        damageScaling: {
          attack: 100,
          speed: 20,  // Sử dụng cả attack và speed
          defense: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 20  // Very high crit chance
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 100,
            speed: 20,
            defense: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 20
          },
          scalingIncrease: {
            attack: 12,
            speed: 3,
            defense: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 4
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
          effectiveness: 1.1
        },
        petId: thunderEagle._id,
        isActive: true
      });
      
      await ultimateSkill.save();
      console.log('Created ultimate skill: Thunder Storm');
      
      // Create Passive Skill - Electric Field
      const passiveSkill = new Skill({
        name: 'Electric Field',
        description: 'Passive electric enhancement that increases critical rate and speed',
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
        petId: thunderEagle._id,
        isActive: true
      });
      
      await passiveSkill.save();
      console.log('Created passive skill: Electric Field');
      
      // Update pet with skill references
      thunderEagle.normalSkill = normalSkill._id;
      thunderEagle.ultimateSkill = ultimateSkill._id;
      thunderEagle.passiveSkill = passiveSkill._id;
      await thunderEagle.save();
      
      console.log('\n=== THUNDER EAGLE STARTER PET CREATED SUCCESSFULLY ===');
      console.log('Pet ID:', thunderEagle._id);
      console.log('Normal Skill ID:', normalSkill._id);
      console.log('Ultimate Skill ID:', ultimateSkill._id);
      console.log('Passive Skill ID:', passiveSkill._id);
      
      console.log('\nBase Stats:');
      console.log('- HP: 900');
      console.log('- Attack: 95');
      console.log('- Defense: 50');
      console.log('- Speed: 85');
      console.log('- Accuracy: 88');
      console.log('- Evasion: 12');
      console.log('- Critical Rate: 12');
      console.log('- Element: Thunder');
      console.log('- Rarity: Common');
      
      console.log('\nStat Growth Rates:');
      console.log('- Attack: 1.2x (Tăng nhanh)');
      console.log('- Speed: 1.2x (Tăng nhanh)');
      console.log('- Critical Rate: 1.4x (Tăng rất nhanh)');
      console.log('- Evasion: 1.1x (Tăng nhanh)');
      console.log('- Accuracy: 1.0x (Tăng bình thường)');
      console.log('- HP: 0.8x (Tăng chậm)');
      console.log('- Defense: 0.7x (Tăng chậm)');
      
      // Test Combat Power
      console.log('\n=== COMBAT POWER TEST ===');
      const cpBreakdown = await thunderEagle.getCombatPowerBreakdown(1);
      console.log(`Level 1 CP: ${cpBreakdown.finalCP}`);
      console.log(`Growth-based: ${cpBreakdown.breakdown.growthBased}`);
      console.log(`Baseline: ${cpBreakdown.breakdown.baseline}`);
      
      const cpLevel5 = await thunderEagle.getCombatPowerBreakdown(5);
      console.log(`Level 5 CP: ${cpLevel5.finalCP}`);
      
      console.log('\nSkills:');
      console.log('- Normal: Lightning Strike (Attack + Speed + Crit)');
      console.log('- Ultimate: Thunder Storm (High Attack + Speed + High Crit)');
      console.log('- Passive: Electric Field (Thunder enhancement)');
      
    } catch (error) {
      console.error('Error creating Thunder Eagle:', error);
    } finally {
      mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 