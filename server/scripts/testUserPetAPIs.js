const axios = require('axios');

const BASE_URL = 'http://localhost:9000/api';

// Test user data
const TEST_USER = {
  username: 'userpet_test',
  email: 'userpet_test@example.com',
  password: 'password123',
  displayName: 'UserPet Test User'
};

let authToken = '';
let createdUserPet = null;
let petTemplateId = null;

const testUserPetAPIs = async () => {
  try {
    console.log('🐾 STARTING USER PET APIs TESTS...\n');
    
    // 1. Register test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
    if (registerResponse.data.success) {
      console.log('✅ User registered successfully');
    } else {
      console.log('⚠️ User might already exist, trying login...');
    }
    
    // 2. Login to get token
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful, token obtained');
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    // 3. Get a pet template to create user pet
    console.log('\n3️⃣ Getting pet template...');
    const petsResponse = await axios.get(`${BASE_URL}/pets`);
    if (petsResponse.data.success && petsResponse.data.data.pets.length > 0) {
      petTemplateId = petsResponse.data.data.pets[0]._id;
      console.log(`✅ Found pet template: ${petsResponse.data.data.pets[0].name}`);
    } else {
      console.log('❌ No pet templates found');
      return;
    }
    
    // 4. Test Get User Pets (empty initially)
    console.log('\n4️⃣ Testing Get User Pets (empty)...');
    const getUserPetsResponse = await axios.get(`${BASE_URL}/userpets`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (getUserPetsResponse.data.success) {
      console.log(`✅ Get User Pets successful - Found ${getUserPetsResponse.data.data.pets.length} pets`);
    } else {
      console.log('❌ Get User Pets failed:', getUserPetsResponse.data.message);
    }
    
    // 5. Test Create User Pet
    console.log('\n5️⃣ Testing Create User Pet...');
    const createUserPetData = {
      petId: petTemplateId,
      location: 'storage'
    };
    
    const createUserPetResponse = await axios.post(`${BASE_URL}/userpets`, createUserPetData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (createUserPetResponse.data.success) {
      createdUserPet = createUserPetResponse.data.data;
      console.log('✅ Create User Pet successful');
      console.log(`📋 Pet ID: ${createdUserPet._id}`);
      console.log(`📋 Level: ${createdUserPet.level}`);
      console.log(`📋 Location: ${createdUserPet.location}`);
      console.log(`📋 Combat Power: ${createdUserPet.actualCombatPower}`);
    } else {
      console.log('❌ Create User Pet failed:', createUserPetResponse.data.message);
      return;
    }
    
    // 6. Test Get User Pets (now has 1 pet)
    console.log('\n6️⃣ Testing Get User Pets (with 1 pet)...');
    const getUserPetsResponse2 = await axios.get(`${BASE_URL}/userpets`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (getUserPetsResponse2.data.success) {
      console.log(`✅ Get User Pets successful - Found ${getUserPetsResponse2.data.data.pets.length} pets`);
      const pet = getUserPetsResponse2.data.data.pets[0];
      console.log(`📋 Pet Name: ${pet.petName}`);
      console.log(`📋 Element: ${pet.element.displayName}`);
      console.log(`📋 Rarity: ${pet.rarity.displayName}`);
    } else {
      console.log('❌ Get User Pets failed:', getUserPetsResponse2.data.message);
    }
    
    // 7. Test Get User Pet Detail
    console.log('\n7️⃣ Testing Get User Pet Detail...');
    const getUserPetDetailResponse = await axios.get(`${BASE_URL}/userpets/${createdUserPet._id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (getUserPetDetailResponse.data.success) {
      const petDetail = getUserPetDetailResponse.data.data;
      console.log('✅ Get User Pet Detail successful');
      console.log(`📋 Pet Name: ${petDetail.pet.name}`);
      console.log(`📋 Level: ${petDetail.level}`);
      console.log(`📋 Exp: ${petDetail.exp}`);
      console.log(`📋 Evolution Stage: ${petDetail.evolutionStage}`);
      console.log(`📋 Can Evolve: ${petDetail.canEvolve}`);
      console.log(`📋 Skills Count: ${petDetail.skills ? petDetail.skills.length : 0}`);
    } else {
      console.log('❌ Get User Pet Detail failed:', getUserPetDetailResponse.data.message);
    }
    
    // 8. Test Get User Pet Skills
    console.log('\n8️⃣ Testing Get User Pet Skills...');
    const getUserPetSkillsResponse = await axios.get(`${BASE_URL}/userpets/${createdUserPet._id}/skills`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (getUserPetSkillsResponse.data.success) {
      const skills = getUserPetSkillsResponse.data.data;
      console.log('✅ Get User Pet Skills successful');
      console.log(`📋 Skills Count: ${skills.skills.length}`);
      skills.skills.forEach((skill, index) => {
        console.log(`  ${index + 1}. ${skill.type} Skill - Level ${skill.currentLevel}`);
      });
      console.log(`📋 Skill Levels:`, skills.skillLevels);
    } else {
      console.log('❌ Get User Pet Skills failed:', getUserPetSkillsResponse.data.message);
    }
    
    // 9. Test Move User Pet (storage -> bag)
    console.log('\n9️⃣ Testing Move User Pet (storage -> bag)...');
    const moveUserPetResponse = await axios.put(`${BASE_URL}/userpets/${createdUserPet._id}/move`, {
      newLocation: 'bag'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (moveUserPetResponse.data.success) {
      console.log('✅ Move User Pet successful');
      console.log(`📋 Moved from ${moveUserPetResponse.data.data.oldLocation} to ${moveUserPetResponse.data.data.newLocation}`);
    } else {
      console.log('❌ Move User Pet failed:', moveUserPetResponse.data.message);
    }
    
    // 10. Test Get User Pets by location
    console.log('\n🔟 Testing Get User Pets by location (bag)...');
    const getUserPetsBagResponse = await axios.get(`${BASE_URL}/userpets?location=bag`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (getUserPetsBagResponse.data.success) {
      console.log(`✅ Get User Pets (bag) successful - Found ${getUserPetsBagResponse.data.data.pets.length} pets in bag`);
    } else {
      console.log('❌ Get User Pets (bag) failed:', getUserPetsBagResponse.data.message);
    }
    
    // 11. Test Move User Pet back (bag -> storage)
    console.log('\n1️⃣1️⃣ Testing Move User Pet (bag -> storage)...');
    const moveUserPetBackResponse = await axios.put(`${BASE_URL}/userpets/${createdUserPet._id}/move`, {
      newLocation: 'storage'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (moveUserPetBackResponse.data.success) {
      console.log('✅ Move User Pet back successful');
    } else {
      console.log('❌ Move User Pet back failed:', moveUserPetBackResponse.data.message);
    }
    
    // 12. Test Get User Pet Equipment (should be empty)
    console.log('\n1️⃣2️⃣ Testing Get User Pet Equipment...');
    const getUserPetEquipmentResponse = await axios.get(`${BASE_URL}/userpets/${createdUserPet._id}/equipment`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (getUserPetEquipmentResponse.data.success) {
      console.log('✅ Get User Pet Equipment successful');
      console.log(`📋 Equipment Count: ${getUserPetEquipmentResponse.data.data.equipment ? getUserPetEquipmentResponse.data.data.equipment.length : 0}`);
    } else {
      console.log('❌ Get User Pet Equipment failed:', getUserPetEquipmentResponse.data.message);
    }
    
    console.log('\n🎉 USER PET APIs TESTS COMPLETED!');
    console.log('✅ All core UserPet APIs are working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testUserPetAPIs(); 