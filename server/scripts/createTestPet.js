const axios = require('axios');

const BASE_URL = 'http://localhost:9000/api';

const createTestPet = async () => {
  try {
    console.log('🐉 Creating Test Pet Template...\n');
    
    // 1. Get Element and Rarity IDs
    console.log('🔧 Getting Element and Rarity IDs...');
    const elementResponse = await axios.get(`${BASE_URL}/gamedata/elements`);
    const rarityResponse = await axios.get(`${BASE_URL}/gamedata/rarities`);
    
    const fireElement = elementResponse.data.data.find(e => e.name === 'fire');
    const commonRarity = rarityResponse.data.data.find(r => r.name === 'common');
    
    if (!fireElement || !commonRarity) {
      console.log('❌ Could not find fire element or common rarity');
      return;
    }
    
    console.log(`✅ Fire Element ID: ${fireElement._id}`);
    console.log(`✅ Common Rarity ID: ${commonRarity._id}\n`);
    
    // 2. Create simple pet
    console.log('🐉 Creating Test Pet...');
    const petData = {
      name: 'Test Fire Dragon',
      description: 'A test fire dragon for testing',
      img: 'https://example.com/test_dragon.png',
      element: fireElement._id,
      rarity: commonRarity._id,
      isStarter: false,
      isActive: true,
      
      // Base stats
      baseHp: 1000,
      baseAttack: 80,
      baseDefense: 60,
      baseSpeed: 70,
      baseAccuracy: 75,
      baseEvasion: 60,
      baseCriticalRate: 10,
      
      // Stat growth
      statGrowth: {
        hp: 10,
        attack: 8,
        defense: 6,
        speed: 7,
        accuracy: 7.5,
        evasion: 6,
        criticalRate: 1
      },
      
      // Simple skills
      skills: {
        normal: {
          description: 'Basic fire attack',
          energyGeneration: 10,
          damageScaling: { attack: 80 }
        }
      }
    };
    
    const createResponse = await axios.post(`${BASE_URL}/pets`, petData);
    
    if (createResponse.data.success) {
      const createdPet = createResponse.data.data;
      console.log('✅ Test Pet Created Successfully!');
      console.log(`📋 Pet ID: ${createdPet._id}`);
      console.log(`📋 Pet Name: ${createdPet.name}`);
      console.log(`📋 Element: ${createdPet.element.name}`);
      console.log(`📋 Rarity: ${createdPet.rarity.name}`);
      
      return createdPet._id;
    } else {
      console.log('❌ Failed to create pet:', createResponse.data.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error creating test pet:', error.response?.data || error.message);
    return null;
  }
};

createTestPet(); 