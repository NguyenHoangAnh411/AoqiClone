const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');

mongoose.connect('mongodb+srv://hoanganh:hoanganh@cluster0.xjghqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find Rock element and Common rarity
      const rockElement = await Element.findOne({ name: 'rock' });
      const commonRarity = await Rarity.findOne({ name: 'common' });
      
      if (!rockElement) {
        console.error('Rock element not found!');
        return;
      }
      
      if (!commonRarity) {
        console.error('Common rarity not found!');
        return;
      }
      
      console.log('Found Rock element and Common rarity');
      
      // Create Rock Golem - Starter Pet
      const rockGolem = new Pet({
        name: 'Rock Golem',
        img: 'rock_golem_starter.png',
        description: 'A sturdy golem made of solid rock. Perfect for tanking and heavy attacks!',
        element: rockElement._id,
        rarity: commonRarity._id,
        // Rock-focused stats: High HP, Defense, moderate Attack, low Speed
        baseHp: 1200,
        baseAttack: 75,
        baseDefense: 90,
        baseSpeed: 45,
        baseAccuracy: 75,
        baseEvasion: 5,
        baseCriticalRate: 3,
        // Rock growth rates: HP and Defense focused, Speed slow
        statGrowth: {
          hp: 1.4,        // HP tăng rất nhanh
          attack: 1.0,    // Attack tăng bình thường
          defense: 1.3,   // Defense tăng rất nhanh
          speed: 0.7,     // Speed tăng rất chậm
          accuracy: 0.9,  // Accuracy tăng chậm
          evasion: 0.6,   // Evasion tăng rất chậm
          criticalRate: 0.7 // Crit rate tăng chậm
        },
        levelCap: 100,
        isActive: true,
        isStarter: true
      });
      
      await rockGolem.save();
      console.log('Created Rock Golem starter pet:', rockGolem._id);
      
      // Create Normal Skill - Stone Fist
      const normalSkill = new Skill({
        name: 'Stone Fist',
        description: 'A powerful rock punch that deals heavy damage',
        type: 'normal',
        energyCost: 0,
        energyGeneration: 15,
        damageScaling: {
          attack: 50,
          defense: 40,  // Sử dụng cả attack và defense
          speed: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 0
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 50,
            defense: 40,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 0
          },
          scalingIncrease: {
            attack: 5,
            defense: 5,
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
          effectiveness: 1.2
        },
        petId: rockGolem._id,
        isActive: true
      });
      
      await normalSkill.save();
      console.log('Created normal skill: Stone Fist');
      
      // Create Ultimate Skill - Mountain Crash
      const ultimateSkill = new Skill({
        name: 'Mountain Crash',
        description: 'A devastating rock slam that crushes enemies',
        type: 'ultimate',
        energyCost: 60,
        energyGeneration: 0,
        damageScaling: {
          attack: 70,
          defense: 60,  // Sử dụng cả attack và defense
          speed: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 5  // Low crit chance
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 70,
            defense: 60,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 5
          },
          scalingIncrease: {
            attack: 8,
            defense: 8,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 1
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
          effectiveness: 1.5
        },
        petId: rockGolem._id,
        isActive: true
      });
      
      await ultimateSkill.save();
      console.log('Created ultimate skill: Mountain Crash');
      
      // Create Passive Skill - Rock Armor
      const passiveSkill = new Skill({
        name: 'Rock Armor',
        description: 'Passive rock enhancement that increases defense and reduces damage',
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
        petId: rockGolem._id,
        isActive: true
      });
      
      await passiveSkill.save();
      console.log('Created passive skill: Rock Armor');
      
      // Update pet with skill references
      rockGolem.normalSkill = normalSkill._id;
      rockGolem.ultimateSkill = ultimateSkill._id;
      rockGolem.passiveSkill = passiveSkill._id;
      await rockGolem.save();
      
      console.log('\n=== ROCK GOLEM STARTER PET CREATED SUCCESSFULLY ===');
      console.log('Pet ID:', rockGolem._id);
      console.log('Normal Skill ID:', normalSkill._id);
      console.log('Ultimate Skill ID:', ultimateSkill._id);
      console.log('Passive Skill ID:', passiveSkill._id);
      
      console.log('\nBase Stats:');
      console.log('- HP: 1200');
      console.log('- Attack: 75');
      console.log('- Defense: 90');
      console.log('- Speed: 45');
      console.log('- Accuracy: 75');
      console.log('- Evasion: 5');
      console.log('- Critical Rate: 3');
      console.log('- Element: Rock');
      console.log('- Rarity: Common');
      
      console.log('\nStat Growth Rates:');
      console.log('- HP: 1.4x (Tăng rất nhanh)');
      console.log('- Defense: 1.3x (Tăng rất nhanh)');
      console.log('- Attack: 1.0x (Tăng bình thường)');
      console.log('- Accuracy: 0.9x (Tăng chậm)');
      console.log('- Speed: 0.7x (Tăng rất chậm)');
      console.log('- Critical Rate: 0.7x (Tăng chậm)');
      console.log('- Evasion: 0.6x (Tăng rất chậm)');
      
      // Test Combat Power
      console.log('\n=== COMBAT POWER TEST ===');
      const cpBreakdown = await rockGolem.getCombatPowerBreakdown(1);
      console.log(`Level 1 CP: ${cpBreakdown.finalCP}`);
      console.log(`Growth-based: ${cpBreakdown.breakdown.growthBased}`);
      console.log(`Baseline: ${cpBreakdown.breakdown.baseline}`);
      
      const cpLevel5 = await rockGolem.getCombatPowerBreakdown(5);
      console.log(`Level 5 CP: ${cpLevel5.finalCP}`);
      
      console.log('\nSkills:');
      console.log('- Normal: Stone Fist (Attack + Defense scaling)');
      console.log('- Ultimate: Mountain Crash (High Attack + Defense)');
      console.log('- Passive: Rock Armor (Rock enhancement)');
      
    } catch (error) {
      console.error('Error creating Rock Golem:', error);
    } finally {
      mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 