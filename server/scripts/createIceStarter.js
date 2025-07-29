const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');

mongoose.connect('mongodb+srv://hoanganh:hoanganh@cluster0.xjghqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find Ice element and Common rarity
      const iceElement = await Element.findOne({ name: 'ice' });
      const commonRarity = await Rarity.findOne({ name: 'common' });
      
      if (!iceElement) {
        console.error('Ice element not found!');
        return;
      }
      
      if (!commonRarity) {
        console.error('Common rarity not found!');
        return;
      }
      
      console.log('Found Ice element and Common rarity');
      
      // Create Ice Wolf - Starter Pet
      const iceWolf = new Pet({
        name: 'Ice Wolf',
        img: 'ice_wolf_starter.png',
        description: 'A swift wolf with freezing ice powers. Perfect for speed and control!',
        element: iceElement._id,
        rarity: commonRarity._id,
        // Ice-focused stats: High Speed, Attack, moderate Defense
        baseHp: 850,
        baseAttack: 85,
        baseDefense: 55,
        baseSpeed: 95,
        baseAccuracy: 90,
        baseEvasion: 15,
        baseCriticalRate: 8,
        // Ice growth rates: Speed and Attack focused
        statGrowth: {
          hp: 0.9,        // HP tăng chậm
          attack: 1.1,    // Attack tăng nhanh
          defense: 0.8,   // Defense tăng chậm
          speed: 1.3,     // Speed tăng rất nhanh
          accuracy: 1.1,  // Accuracy tăng nhanh
          evasion: 1.2,   // Evasion tăng nhanh
          criticalRate: 1.1 // Crit rate tăng nhanh
        },
        levelCap: 100,
        isActive: true,
        isStarter: true
      });
      
      await iceWolf.save();
      console.log('Created Ice Wolf starter pet:', iceWolf._id);
      
      // Create Normal Skill - Frost Bite
      const normalSkill = new Skill({
        name: 'Frost Bite',
        description: 'A quick ice attack that can freeze enemies',
        type: 'normal',
        energyCost: 0,
        energyGeneration: 25,
        damageScaling: {
          attack: 60,
          speed: 20,  // Sử dụng cả attack và speed
          defense: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 0
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 60,
            speed: 20,
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
        petId: iceWolf._id,
        isActive: true
      });
      
      await normalSkill.save();
      console.log('Created normal skill: Frost Bite');
      
      // Create Ultimate Skill - Blizzard Strike
      const ultimateSkill = new Skill({
        name: 'Blizzard Strike',
        description: 'A devastating ice storm that hits multiple enemies',
        type: 'ultimate',
        energyCost: 60,
        energyGeneration: 0,
        damageScaling: {
          attack: 90,
          speed: 30,  // Sử dụng cả attack và speed
          defense: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 15  // High crit chance
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 90,
            speed: 30,
            defense: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 15
          },
          scalingIncrease: {
            attack: 12,
            speed: 4,
            defense: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 3
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
        petId: iceWolf._id,
        isActive: true
      });
      
      await ultimateSkill.save();
      console.log('Created ultimate skill: Blizzard Strike');
      
      // Create Passive Skill - Ice Aura
      const passiveSkill = new Skill({
        name: 'Ice Aura',
        description: 'Passive ice enhancement that increases speed and evasion',
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
        petId: iceWolf._id,
        isActive: true
      });
      
      await passiveSkill.save();
      console.log('Created passive skill: Ice Aura');
      
      // Update pet with skill references
      iceWolf.normalSkill = normalSkill._id;
      iceWolf.ultimateSkill = ultimateSkill._id;
      iceWolf.passiveSkill = passiveSkill._id;
      await iceWolf.save();
      
      console.log('\n=== ICE WOLF STARTER PET CREATED SUCCESSFULLY ===');
      console.log('Pet ID:', iceWolf._id);
      console.log('Normal Skill ID:', normalSkill._id);
      console.log('Ultimate Skill ID:', ultimateSkill._id);
      console.log('Passive Skill ID:', passiveSkill._id);
      
      console.log('\nBase Stats:');
      console.log('- HP: 850');
      console.log('- Attack: 85');
      console.log('- Defense: 55');
      console.log('- Speed: 95');
      console.log('- Accuracy: 90');
      console.log('- Evasion: 15');
      console.log('- Critical Rate: 8');
      console.log('- Element: Ice');
      console.log('- Rarity: Common');
      
      console.log('\nStat Growth Rates:');
      console.log('- HP: 0.9x (Tăng chậm)');
      console.log('- Attack: 1.1x (Tăng nhanh)');
      console.log('- Defense: 0.8x (Tăng chậm)');
      console.log('- Speed: 1.3x (Tăng rất nhanh)');
      console.log('- Accuracy: 1.1x (Tăng nhanh)');
      console.log('- Evasion: 1.2x (Tăng nhanh)');
      console.log('- Critical Rate: 1.1x (Tăng nhanh)');
      
      // Test Combat Power
      console.log('\n=== COMBAT POWER TEST ===');
      const cpBreakdown = await iceWolf.getCombatPowerBreakdown(1);
      console.log(`Level 1 CP: ${cpBreakdown.finalCP}`);
      console.log(`Growth-based: ${cpBreakdown.breakdown.growthBased}`);
      console.log(`Baseline: ${cpBreakdown.breakdown.baseline}`);
      
      const cpLevel5 = await iceWolf.getCombatPowerBreakdown(5);
      console.log(`Level 5 CP: ${cpLevel5.finalCP}`);
      
      console.log('\nSkills:');
      console.log('- Normal: Frost Bite (Attack + Speed scaling)');
      console.log('- Ultimate: Blizzard Strike (High Attack + Speed + Crit)');
      console.log('- Passive: Ice Aura (Ice enhancement)');
      
    } catch (error) {
      console.error('Error creating Ice Wolf:', error);
    } finally {
      mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 