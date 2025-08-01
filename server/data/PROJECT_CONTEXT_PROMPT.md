# 🎮 AOQI GAME SERVER - PROJECT CONTEXT PROMPT

## 📋 **PROJECT OVERVIEW**

**Game Type**: Turn-based RPG Pet Battle Game  
**Technology Stack**: Node.js, Express, MongoDB, Mongoose  
**Current Status**: Phase 1 (Foundation) - COMPLETED ✅  
**Next Phase**: Phase 2 (Core Pet System) - READY TO START 🚀

---

## 🏗️ **ARCHITECTURE DECISIONS**

### **1. Controller-First Approach**
- ✅ Business logic separated into controllers (`AuthController`, `UserController`, `GameDataController`)
- ✅ Routes only handle routing, no inline logic
- ✅ Clean separation of concerns

### **2. Hybrid Data Storage Strategy**
- **Elements & Rarities**: Database (primary) + Constants (fallback)
- **Skills & Effects**: Database (admin management)
- **Game Rules**: Constants (performance)
- **Helper Functions**: Constants (reusability)

### **3. Authentication & Authorization**
- ✅ JWT-based authentication
- ✅ Role-based access control (user, admin)
- ✅ Middleware for protected routes
- ✅ Token validation with expiration (7 days)

### **4. Error Handling**
- ✅ Global error handler middleware
- ✅ Specific CastError handling for invalid ObjectIds
- ✅ Consistent error response format
- ✅ User-friendly error messages

---

## ✅ **COMPLETED FEATURES (PHASE 1)**

### **Authentication APIs**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get profile (auth)
- `PUT /api/auth/profile` - Update profile (auth)
- `POST /api/auth/change-password` - Change password

### **User Management APIs**
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/statistics` - Get user statistics
- `GET /api/users/search` - Search users (public)
- `GET /api/users/leaderboard` - Leaderboard (public)
- `GET /api/users/:userId` - Get user by ID (supports username/ObjectId)

### **Game Data APIs**
- `GET /api/gamedata/elements` - Get all elements
- `GET /api/gamedata/elements/:elementId` - Get element by ID
- `GET /api/gamedata/elements/:element1Id/effectiveness/:element2Id` - Element effectiveness
- `GET /api/gamedata/rarities` - Get all rarities
- `GET /api/gamedata/rarities/:rarityId` - Get rarity by ID
- `GET /api/gamedata/skills` - Get skills (with pagination)
- `GET /api/gamedata/skills/:skillId` - Get skill by ID
- `GET /api/gamedata/skill-types` - Get skill types
- `GET /api/gamedata/effects` - Get effects (with pagination)
- `GET /api/gamedata/effects/:effectId` - Get effect by ID
- `GET /api/gamedata/effect-types` - Get effect types
- `GET /api/gamedata/effect-categories` - Get effect categories
- `GET /api/gamedata/constants` - Get all game constants
- `GET /api/gamedata/element-effectiveness` - Get element effectiveness matrix
- `GET /api/gamedata/all` - Get all game data (hybrid approach)

---

## 📊 **CURRENT DATABASE STATE**

### **Available Data**
- **Elements**: 7 elements (fire, water, grass, etc.)
- **Rarities**: 4 rarities (common, rare, epic, legendary)
- **Skills**: 0 skills (empty - will be added by admin)
- **Effects**: 0 effects (empty - will be added by admin)

### **Models Available**
- `User.js` - User accounts and profiles
- `Pet.js` - Base pet data and stats
- `UserPet.js` - User's pet instances
- `Skill.js` - Skill definitions
- `Effect.js` - Effect definitions
- `Element.js` - Element types and effectiveness
- `Rarity.js` - Rarity levels and multipliers
- `Formation.js` - Battle team formations
- `Battle.js` - Battle instances
- `BattleParticipant.js` - Pet state in battles
- `BattleLog.js` - Battle event logs
- `Item.js` - Item definitions
- `UserInventory.js` - User's inventory
- `UserPetEquipment.js` - Pet equipment
- `UserBag.js` - Pet storage bag
- `Quest.js` - Quest definitions
- `UserQuest.js` - User's quest progress
- `Map.js` - Game maps
- `Stage.js` - Map stages
- `PvEBattle.js` - PvE battle configurations
- `Reward.js` - Battle/quest rewards

---

## 🎯 **NEXT STEPS (PHASE 2)**

### **Core Pet System APIs Needed**
1. **Pet Management**
   - `GET /api/pets` - Get available pets
   - `GET /api/pets/:petId` - Get pet details
   - `POST /api/pets/choose-starter` - Choose starter pet
   - `GET /api/user-pets` - Get user's pets
   - `POST /api/user-pets` - Acquire new pet
   - `PUT /api/user-pets/:userPetId` - Update pet (level up, evolve)
   - `DELETE /api/user-pets/:userPetId` - Release pet

2. **Pet Training & Evolution**
   - `POST /api/user-pets/:userPetId/train` - Train pet
   - `POST /api/user-pets/:userPetId/evolve` - Evolve pet
   - `GET /api/user-pets/:userPetId/skills` - Get pet skills
   - `POST /api/user-pets/:userPetId/skills/upgrade` - Upgrade skill

3. **Pet Equipment**
   - `GET /api/user-pets/:userPetId/equipment` - Get pet equipment
   - `POST /api/user-pets/:userPetId/equipment` - Equip item
   - `DELETE /api/user-pets/:userPetId/equipment/:slot` - Unequip item

4. **Pet Storage**
   - `GET /api/user-bag` - Get user's pet bag
   - `POST /api/user-bag/expand` - Expand bag capacity
   - `POST /api/user-pets/:userPetId/move` - Move pet between bag/formation

---

## 🔧 **TECHNICAL CONTEXT**

### **File Structure**
```
server/
├── controllers/
│   ├── authController.js ✅
│   ├── userController.js ✅
│   └── gameDataController.js ✅
├── routes/
│   ├── auth.js ✅
│   ├── user.js ✅
│   └── gameData.js ✅
├── models/ (all models ready)
├── utils/
│   ├── auth.js ✅ (middleware)
│   └── gameConstants.js ✅
├── scripts/
│   ├── testPhase1Restored.js ✅
│   └── restoreGameData.js ✅
└── server.js ✅
```

### **Key Constants & Rules**
- **Level Cap**: 100
- **EXP Formula**: `targetLevel * 100 * rarityMultiplier`
- **Formation Size**: 5 pets max
- **Bag Size**: Configurable (default 20)
- **Element Effectiveness**: Matrix-based calculations
- **Rarity Multipliers**: Affect EXP, stats, drop rates

### **Database Connection**
```javascript
MONGO_DB_URI=mongodb+srv://hoanganh:hoanganh@cluster0.xjghqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

---

## 🚨 **IMPORTANT NOTES**

### **Architecture Decisions Made**
1. **Elements & Rarities stay in Database** - Required for model compatibility
2. **gameConstants.js** - Contains fallback data and helper functions
3. **Controller-First** - All business logic in controllers
4. **Comprehensive Error Handling** - CastError, validation, etc.

### **Testing Status**
- ✅ All Phase 1 APIs tested and working
- ✅ Error handling verified
- ✅ Performance acceptable (< 200ms response times)
- ✅ Database relationships maintained

### **Known Limitations**
- Skills and Effects data empty (intentional - admin will add)
- No admin panel yet (will be Phase 5)
- No battle system yet (will be Phase 4)

---

## 🎯 **IMMEDIATE TASKS FOR PHASE 2**

1. **Create PetController** - Business logic for pet operations
2. **Create pet.js routes** - API endpoints for pet management
3. **Implement pet acquisition** - Starter pet, gacha, rewards
4. **Implement pet training** - Level up, EXP, evolution
5. **Implement pet equipment** - Equip/unequip items
6. **Implement pet storage** - Bag management, formations
7. **Add to server.js** - Register new routes
8. **Create test scripts** - Verify all pet APIs work

---

## 🔄 **SUGGESTED WORKFLOW**

### **Step 1: Planning & Analysis**
1. **Review existing models** - Understand Pet.js, UserPet.js, UserBag.js relationships
2. **Define API requirements** - List all endpoints needed for Phase 2
3. **Plan data flow** - How pets move between bag, formation, training
4. **Identify dependencies** - What data is needed from other models

### **Step 2: Controller Development**
1. **Create PetController** - Start with basic CRUD operations
2. **Implement business logic** - Pet acquisition, training, evolution
3. **Add validation** - Input validation, business rules
4. **Error handling** - CastError, validation errors, business logic errors

### **Step 3: Route Development**
1. **Create pet.js routes** - Define all API endpoints
2. **Add middleware** - Authentication, validation
3. **Connect to controller** - Map routes to controller methods
4. **Test individual routes** - Verify each endpoint works

### **Step 4: Integration**
1. **Register routes in server.js** - Add new route files
2. **Test integration** - Verify routes are accessible
3. **Check dependencies** - Ensure all required data exists
4. **Performance check** - Verify response times

### **Step 5: Testing & Validation**
1. **Create test scripts** - Comprehensive API testing
2. **Test all scenarios** - Success cases, error cases, edge cases
3. **Validate business logic** - Ensure game rules are followed
4. **Performance testing** - Check response times under load

### **Step 6: Documentation & Cleanup**
1. **Update documentation** - API docs, code comments
2. **Code review** - Check for best practices
3. **Optimization** - Performance improvements if needed
4. **Prepare for Phase 3** - Ensure Phase 2 is complete and stable

---

## 🎯 **DEVELOPMENT PRIORITY ORDER**

### **Priority 1: Core Pet Management**
1. `GET /api/pets` - Get available pets
2. `GET /api/user-pets` - Get user's pets
3. `POST /api/pets/choose-starter` - Choose starter pet
4. `POST /api/user-pets` - Acquire new pet

### **Priority 2: Pet Training & Evolution**
1. `PUT /api/user-pets/:userPetId` - Update pet (level up)
2. `POST /api/user-pets/:userPetId/train` - Train pet
3. `POST /api/user-pets/:userPetId/evolve` - Evolve pet

### **Priority 3: Pet Equipment**
1. `GET /api/user-pets/:userPetId/equipment` - Get pet equipment
2. `POST /api/user-pets/:userPetId/equipment` - Equip item
3. `DELETE /api/user-pets/:userPetId/equipment/:slot` - Unequip item

### **Priority 4: Pet Storage**
1. `GET /api/user-bag` - Get user's pet bag
2. `POST /api/user-pets/:userPetId/move` - Move pet between bag/formation
3. `POST /api/user-bag/expand` - Expand bag capacity

### **Priority 5: Advanced Features**
1. `GET /api/user-pets/:userPetId/skills` - Get pet skills
2. `POST /api/user-pets/:userPetId/skills/upgrade` - Upgrade skill
3. `DELETE /api/user-pets/:userPetId` - Release pet

---

## 💡 **DEVELOPMENT GUIDELINES**

### **Follow Established Patterns**
- Use Controller-First approach
- Implement comprehensive error handling
- Add CastError handling for ObjectId validation
- Use consistent response format
- Add pagination where appropriate
- Include authentication middleware for protected routes

### **Response Format**
```javascript
{
  success: true/false,
  data: {...},
  message: "User-friendly message"
}
```

### **Error Handling**
```javascript
// CastError handling
if (error.name === 'CastError') {
  return res.status(400).json({
    success: false,
    message: 'ID không hợp lệ'
  });
}
```

---

## 🎉 **SUCCESS METRICS**

Phase 2 will be successful when:
- ✅ All pet management APIs work
- ✅ Pet training and evolution functional
- ✅ Equipment system operational
- ✅ Storage and formation management working
- ✅ All APIs tested and error-free
- ✅ Ready for Phase 3 (Battle Preparation)

---

**Ready to start Phase 2: Core Pet System! 🚀** 