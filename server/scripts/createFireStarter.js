const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const Skill = require('../models/Skill');
const Element = require('../models/Element');
const Rarity = require('../models/Rarity');

mongoose.connect('mongodb+srv://hoanganh:hoanganh@cluster0.xjghqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find Fire element and Common rarity
      const fireElement = await Element.findOne({ name: 'fire' });
      const commonRarity = await Rarity.findOne({ name: 'common' });
      
      if (!fireElement) {
        console.error('Fire element not found!');
        return;
      }
      
      if (!commonRarity) {
        console.error('Common rarity not found!');
        return;
      }
      
      console.log('Found Fire element and Common rarity');
      
      // Create Fire Fox - Starter Pet
      const fireFox = new Pet({
        name: 'Fire Fox',
        img: 'fire_fox_starter.png',
        description: 'A friendly fox with warm fire abilities. Perfect for beginners!',
        element: fireElement._id,
        rarity: commonRarity._id,
        // Starter pet stats: Lower but balanced
        baseHp: 800,
        baseAttack: 90,
        baseDefense: 50,
        baseSpeed: 80,
        baseAccuracy: 85,
        baseEvasion: 10,
        baseCriticalRate: 6,
        // Starter growth rates: Moderate but fire-focused
        statGrowth: {
          hp: 0.8,        // HP tăng chậm
          attack: 1.2,    // Attack tăng nhanh
          defense: 0.8,   // Defense tăng chậm
          speed: 1.0,     // Speed bình thường
          accuracy: 1.0,  // Accuracy bình thường
          evasion: 1.1,   // Evasion tăng nhẹ
          criticalRate: 1.2 // Crit rate tăng nhanh
        },
        levelCap: 100,
        isActive: true,
        isStarter: true
      });
      
      await fireFox.save();
      console.log('Created Fire Fox starter pet:', fireFox._id);
      
      // Create Normal Skill - Fire Claw
      const normalSkill = new Skill({
        name: 'Fire Claw',
        description: 'A swift claw attack infused with fire energy',
        type: 'normal',
        energyCost: 0,
        energyGeneration: 25,
        damageScaling: {
          attack: 60,
          defense: 0,
          speed: 10,  // Sử dụng cả attack và speed
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 0
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 60,
            defense: 0,
            speed: 10,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 0
          },
          scalingIncrease: {
            attack: 6,
            defense: 0,
            speed: 2,
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
          effectiveness: 1.1
        },
        petId: fireFox._id,
        isActive: true
      });
      
      await normalSkill.save();
      console.log('Created normal skill: Fire Claw');
      
      // Create Ultimate Skill - Flame Burst
      const ultimateSkill = new Skill({
        name: 'Flame Burst',
        description: 'Explosive fire attack that burns enemies',
        type: 'ultimate',
        energyCost: 70,
        energyGeneration: 0,
        damageScaling: {
          attack: 100,
          defense: 0,
          speed: 0,
          hp: 0,
          accuracy: 0,
          evasion: 0,
          criticalRate: 20  // Moderate crit chance
        },
        levelScaling: {
          maxLevel: 10,
          baseScaling: {
            attack: 100,
            defense: 0,
            speed: 0,
            hp: 0,
            accuracy: 0,
            evasion: 0,
            criticalRate: 20
          },
          scalingIncrease: {
            attack: 12,
            defense: 0,
            speed: 0,
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
          effectiveness: 1.3
        },
        petId: fireFox._id,
        isActive: true
      });
      
      await ultimateSkill.save();
      console.log('Created ultimate skill: Flame Burst');
      
      // Create Passive Skill - Fire Aura
      const passiveSkill = new Skill({
        name: 'Fire Aura',
        description: 'Passive fire enhancement that increases attack power',
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
        petId: fireFox._id,
        isActive: true
      });
      
      await passiveSkill.save();
      console.log('Created passive skill: Fire Aura');
      
      // Update pet with skill references
      fireFox.normalSkill = normalSkill._id;
      fireFox.ultimateSkill = ultimateSkill._id;
      fireFox.passiveSkill = passiveSkill._id;
      await fireFox.save();
      
      console.log('\n=== FIRE FOX STARTER PET CREATED SUCCESSFULLY ===');
      console.log('Pet ID:', fireFox._id);
      console.log('Normal Skill ID:', normalSkill._id);
      console.log('Ultimate Skill ID:', ultimateSkill._id);
      console.log('Passive Skill ID:', passiveSkill._id);
      
      console.log('\nBase Stats:');
      console.log('- HP: 800');
      console.log('- Attack: 90');
      console.log('- Defense: 50');
      console.log('- Speed: 80');
      console.log('- Accuracy: 85');
      console.log('- Evasion: 10');
      console.log('- Critical Rate: 6');
      console.log('- Element: Fire');
      console.log('- Rarity: Common');
      
      console.log('\nStat Growth Rates:');
      console.log('- HP: 0.8x (Tăng chậm)');
      console.log('- Attack: 1.2x (Tăng nhanh)');
      console.log('- Defense: 0.8x (Tăng chậm)');
      console.log('- Speed: 1.0x (Bình thường)');
      console.log('- Accuracy: 1.0x (Bình thường)');
      console.log('- Evasion: 1.1x (Tăng nhẹ)');
      console.log('- Critical Rate: 1.2x (Tăng nhanh)');
      
      // Test Combat Power
      console.log('\n=== COMBAT POWER TEST ===');
      const cpBreakdown = await fireFox.getCombatPowerBreakdown(1);
      console.log(`Level 1 CP: ${cpBreakdown.finalCP}`);
      console.log(`Growth-based: ${cpBreakdown.breakdown.growthBased}`);
      console.log(`Baseline: ${cpBreakdown.breakdown.baseline}`);
      
      const cpLevel5 = await fireFox.getCombatPowerBreakdown(5);
      console.log(`Level 5 CP: ${cpLevel5.finalCP}`);
      
      console.log('\nSkills:');
      console.log('- Normal: Fire Claw (Attack + Speed scaling)');
      console.log('- Ultimate: Flame Burst (High Attack + Crit)');
      console.log('- Passive: Fire Aura (Fire enhancement)');
      
    } catch (error) {
      console.error('Error creating Fire Fox:', error);
    } finally {
      mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 