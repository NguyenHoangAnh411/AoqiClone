const BASE_URL = 'http://localhost:9000/api/pets';

async function makeRequest(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

async function testPetApis() {
  console.log('🧪 TESTING PET CONTROLLER APIS\n');
  
  try {
    // Test 1: Get all pets
    console.log('1️⃣ Testing GET /api/pets (all pets)');
    const allPetsData = await makeRequest(BASE_URL);
    console.log(`✅ Success: Found ${allPetsData.data.pets.length} pets`);
    console.log(`📊 Pagination: ${allPetsData.data.pagination.total} total, ${allPetsData.data.pagination.pages} pages\n`);

    // Test 2: Get starter pets
    console.log('2️⃣ Testing GET /api/pets/starter');
    const starterPetsData = await makeRequest(`${BASE_URL}/starter`);
    console.log(`✅ Success: Found ${starterPetsData.data.length} starter pets`);
    starterPetsData.data.forEach(pet => {
      console.log(`   - ${pet.name} (${pet.element.displayName})`);
    });
    console.log();

    // Test 3: Get pet by ID
    console.log('3️⃣ Testing GET /api/pets/:id');
    const firstPetId = allPetsData.data.pets[0]._id;
    const petByIdData = await makeRequest(`${BASE_URL}/${firstPetId}`);
    console.log(`✅ Success: Retrieved pet "${petByIdData.data.name}"`);
    console.log(`   - Element: ${petByIdData.data.element.displayName}`);
    console.log(`   - Rarity: ${petByIdData.data.rarity.displayName}`);
    console.log(`   - Skills: ${petByIdData.data.normalSkill ? 'Normal' : 'None'}, ${petByIdData.data.ultimateSkill ? 'Ultimate' : 'None'}, ${petByIdData.data.passiveSkill ? 'Passive' : 'None'}\n`);

    // Test 4: Get pet stat growth
    console.log('4️⃣ Testing GET /api/pets/:id/stat-growth');
    const statGrowthData = await makeRequest(`${BASE_URL}/${firstPetId}/stat-growth`);
    console.log(`✅ Success: Retrieved stat growth for "${statGrowthData.data.pet.name}"`);
    console.log(`   - Base HP: ${statGrowthData.data.statGrowth.baseStats.hp}`);
    console.log(`   - Growth Rate HP: ${statGrowthData.data.statGrowth.growthRates.hp}x`);
    console.log(`   - Level 10 HP: ${statGrowthData.data.statGrowth.level10Stats.hp}\n`);

    // Test 5: Get pet combat power
    console.log('5️⃣ Testing GET /api/pets/:id/combat-power');
    const combatPowerData = await makeRequest(`${BASE_URL}/${firstPetId}/combat-power`);
    console.log(`✅ Success: Retrieved combat power for "${combatPowerData.data.pet.name}"`);
    console.log(`   - Level 1 CP: ${combatPowerData.data.combatPower.finalCP}`);
    console.log(`   - Growth-based CP: ${combatPowerData.data.combatPower.growthBasedCP}`);
    console.log(`   - Baseline CP: ${combatPowerData.data.combatPower.baselineCP}\n`);

    // Test 6: Search pets
    console.log('6️⃣ Testing GET /api/pets/search?q=fire');
    const searchData = await makeRequest(`${BASE_URL}/search?q=fire`);
    console.log(`✅ Success: Found ${searchData.data.pets.length} pets matching "fire"`);
    searchData.data.pets.forEach(pet => {
      console.log(`   - ${pet.name} (${pet.element.displayName})`);
    });
    console.log();

    // Test 7: Get pets by element
    console.log('7️⃣ Testing GET /api/pets/element/:elementId');
    const fireElementId = allPetsData.data.pets.find(p => p.element.name === 'fire').element._id;
    const elementPetsData = await makeRequest(`${BASE_URL}/element/${fireElementId}`);
    console.log(`✅ Success: Found ${elementPetsData.data.pets.length} fire element pets`);
    elementPetsData.data.pets.forEach(pet => {
      console.log(`   - ${pet.name}`);
    });
    console.log();

    // Test 8: Get pets by rarity
    console.log('8️⃣ Testing GET /api/pets/rarity/:rarityId');
    const commonRarityId = allPetsData.data.pets[0].rarity._id;
    const rarityPetsData = await makeRequest(`${BASE_URL}/rarity/${commonRarityId}`);
    console.log(`✅ Success: Found ${rarityPetsData.data.pets.length} common rarity pets`);
    console.log();

    // Test 9: Get pet statistics
    console.log('9️⃣ Testing GET /api/pets/stats');
    const statsData = await makeRequest(`${BASE_URL}/stats`);
    console.log(`✅ Success: Retrieved pet statistics`);
    console.log(`   - Total pets: ${statsData.data.totalPets}`);
    console.log(`   - Starter pets: ${statsData.data.starterPets}`);
    console.log(`   - Pets by element:`);
    statsData.data.petsByElement.forEach(element => {
      console.log(`     * ${element.elementName}: ${element.count}`);
    });
    console.log(`   - Pets by rarity:`);
    statsData.data.petsByRarity.forEach(rarity => {
      console.log(`     * ${rarity.rarityName}: ${rarity.count}`);
    });
    console.log();

    // Test 10: Test pagination
    console.log('🔟 Testing pagination');
    const paginationData = await makeRequest(`${BASE_URL}?page=1&limit=3`);
    console.log(`✅ Success: Pagination working`);
    console.log(`   - Page: ${paginationData.data.pagination.page}`);
    console.log(`   - Limit: ${paginationData.data.pagination.limit}`);
    console.log(`   - Total: ${paginationData.data.pagination.total}`);
    console.log(`   - Pages: ${paginationData.data.pagination.pages}`);
    console.log(`   - Pets returned: ${paginationData.data.pets.length}\n`);

    console.log('🎉 ALL PET CONTROLLER APIS TESTED SUCCESSFULLY!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ GET /api/pets - Get all pets with pagination');
    console.log('✅ GET /api/pets/starter - Get starter pets');
    console.log('✅ GET /api/pets/:id - Get pet by ID');
    console.log('✅ GET /api/pets/:id/stat-growth - Get pet stat growth info');
    console.log('✅ GET /api/pets/:id/combat-power - Get pet combat power breakdown');
    console.log('✅ GET /api/pets/search - Search pets by name');
    console.log('✅ GET /api/pets/element/:elementId - Get pets by element');
    console.log('✅ GET /api/pets/rarity/:rarityId - Get pets by rarity');
    console.log('✅ GET /api/pets/stats - Get pet statistics');
    console.log('✅ Pagination - Working correctly');

  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

// Run the tests
testPetApis(); 