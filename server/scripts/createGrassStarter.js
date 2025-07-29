const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');

mongoose.connect('mongodb+srv://hoanganh:hoanganh@cluster0.xjghqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find Grass element and Common rarity
      const grassElement = await Element.findOne({ name: 'grass' });
      const commonRarity = await Rarity.findOne({ name: 'common' });
      
      if (!grassElement) {
        console.error('Grass element not found!');
        return;
      }
      
      if (!commonRarity) {
        console.error('Common rarity not found!');
        return;
      }
      
      console.log('Found Grass element and Common rarity');
      
      // Create Grass Deer - Starter Pet
      const grassDeer = new Pet({
        name: 'Grass Deer',
        img: 'grass_deer_starter.png',
        description: 'A graceful deer with nature powers. Perfect for healing and balanced combat!',
        element: grassElement._id,
        rarity: commonRarity._id,
        // Grass-focused stats: Balanced stats with focus on HP, moderate Attack, Defense
        baseHp: 950,
        baseAttack: 75,
        baseDefense: 70,
        baseSpeed: 75,
        baseAccuracy: 85,
        baseEvasion: 10,
        baseCriticalRate: 5,
        // Grass growth rates: Balanced growth with HP and Defense focus
        statGrowth: {
          hp: 1.1,        // HP tăng nhanh
          attack: 1.0,    // Attack tăng bình thường
          defense: 1.1,   // Defense tăng nhanh
          speed: 1.0,     // Speed tăng bình thường
          accuracy: 1.1,  // Accuracy tăng nhanh
          evasion: 1.0,   // Evasion tăng bình thường
          criticalRate: 0.8 // Crit rate tăng chậm
        },
        levelCap: 100,
        isActive: true,
        isStarter: true
      });
      
      await grassDeer.save();
      console.log('Created Grass Deer starter pet:', grassDeer._id);
      
      // Create Normal Skill - Nature Strike
      const normalSkill = new Skill({
        name: 'Nature Strike',
        description: 'A natural attack that harnesses the power of plants',
        type: 'normal',
        energyCost: 0,
        energyGeneration: 20,
        damageScaling: {
          attack: 50,
          defense: 20,  // Sử dụng cả attack và defense
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
            defense: 20,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 0
          },
          scalingIncrease: {
            attack: 5,
            defense: 3,
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
        petId: grassDeer._id,
        isActive: true
      });
      
      await normalSkill.save();
      console.log('Created normal skill: Nature Strike');
      
      // Create Ultimate Skill - Forest Rage
      const ultimateSkill = new Skill({
        name: 'Forest Rage',
        description: 'A powerful nature attack that calls upon the forest',
        type: 'ultimate',
        energyCost: 60,
        energyGeneration: 0,
        damageScaling: {
          attack: 80,
          defense: 30,  // Sử dụng cả attack và defense
          speed: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 6  // Low crit chance
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 80,
            defense: 30,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 6
          },
          scalingIncrease: {
            attack: 10,
            defense: 4,
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
          effectiveness: 1.0
        },
        petId: grassDeer._id,
        isActive: true
      });
      
      await ultimateSkill.save();
      console.log('Created ultimate skill: Forest Rage');
      
      // Create Passive Skill - Nature's Blessing
      const passiveSkill = new Skill({
        name: 'Nature\'s Blessing',
        description: 'Passive nature enhancement that increases healing and regeneration',
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
        petId: grassDeer._id,
        isActive: true
      });
      
      await passiveSkill.save();
      console.log('Created passive skill: Nature\'s Blessing');
      
      // Update pet with skill references
      grassDeer.normalSkill = normalSkill._id;
      grassDeer.ultimateSkill = ultimateSkill._id;
      grassDeer.passiveSkill = passiveSkill._id;
      await grassDeer.save();
      
      console.log('\n=== GRASS DEER STARTER PET CREATED SUCCESSFULLY ===');
      console.log('Pet ID:', grassDeer._id);
      console.log('Normal Skill ID:', normalSkill._id);
      console.log('Ultimate Skill ID:', ultimateSkill._id);
      console.log('Passive Skill ID:', passiveSkill._id);
      
      console.log('\nBase Stats:');
      console.log('- HP: 950');
      console.log('- Attack: 75');
      console.log('- Defense: 70');
      console.log('- Speed: 75');
      console.log('- Accuracy: 85');
      console.log('- Evasion: 10');
      console.log('- Critical Rate: 5');
      console.log('- Element: Grass');
      console.log('- Rarity: Common');
      
      console.log('\nStat Growth Rates:');
      console.log('- HP: 1.1x (Tăng nhanh)');
      console.log('- Defense: 1.1x (Tăng nhanh)');
      console.log('- Accuracy: 1.1x (Tăng nhanh)');
      console.log('- Attack: 1.0x (Tăng bình thường)');
      console.log('- Speed: 1.0x (Tăng bình thường)');
      console.log('- Evasion: 1.0x (Tăng bình thường)');
      console.log('- Critical Rate: 0.8x (Tăng chậm)');
      
      // Test Combat Power
      console.log('\n=== COMBAT POWER TEST ===');
      const cpBreakdown = await grassDeer.getCombatPowerBreakdown(1);
      console.log(`Level 1 CP: ${cpBreakdown.finalCP}`);
      console.log(`Growth-based: ${cpBreakdown.breakdown.growthBased}`);
      console.log(`Baseline: ${cpBreakdown.breakdown.baseline}`);
      
      const cpLevel5 = await grassDeer.getCombatPowerBreakdown(5);
      console.log(`Level 5 CP: ${cpLevel5.finalCP}`);
      
      console.log('\nSkills:');
      console.log('- Normal: Nature Strike (Attack + Defense scaling)');
      console.log('- Ultimate: Forest Rage (High Attack + Defense)');
      console.log('- Passive: Nature\'s Blessing (Nature enhancement)');
      
    } catch (error) {
      console.error('Error creating Grass Deer:', error);
    } finally {
      mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 