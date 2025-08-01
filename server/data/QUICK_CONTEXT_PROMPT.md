# 🎮 AOQI GAME SERVER - QUICK CONTEXT

## 📋 **CURRENT STATUS**
- **Phase 1**: ✅ COMPLETED (Authentication, User Management, Game Data APIs)
- **Phase 2**: 🚀 READY TO START (Core Pet System)
- **Stack**: Node.js, Express, MongoDB, Mongoose

## 🏗️ **ARCHITECTURE**
- **Controller-First**: Business logic in controllers, routes only handle routing
- **Hybrid Data**: Elements/Rarities in DB + Constants fallback, Skills/Effects in DB
- **Auth**: JWT with role-based access control
- **Error Handling**: Comprehensive with CastError handling

## ✅ **COMPLETED APIs**
- **Auth**: register, login, profile, change-password
- **Users**: profile, statistics, search, leaderboard
- **Game Data**: elements, rarities, skills, effects, constants (all with pagination)

## 📊 **DATABASE STATE**
- **Elements**: 7 (fire, water, grass, etc.) ✅
- **Rarities**: 4 (common, rare, epic, legendary) ✅
- **Skills**: 0 (empty - admin will add) ⚠️
- **Effects**: 0 (empty - admin will add) ⚠️

## 🎯 **NEXT: PHASE 2 - CORE PET SYSTEM**
**APIs needed:**
- Pet Management: get pets, choose starter, acquire, level up, evolve
- Pet Training: train, evolve, upgrade skills
- Pet Equipment: equip/unequip items
- Pet Storage: bag management, formations

## 🔧 **TECHNICAL**
- **Port**: 9000
- **DB**: MongoDB Atlas (connection string in .env)
- **Models**: All 20+ models ready (User, Pet, UserPet, Skill, Effect, etc.)
- **Testing**: All Phase 1 APIs tested and working

## 💡 **PATTERNS TO FOLLOW**
- Controller-First approach
- Comprehensive error handling with CastError
- Consistent response format: `{success, data, message}`
- Authentication middleware for protected routes
- Pagination where appropriate

---

## 🔄 **SUGGESTED WORKFLOW**

### **Step 1: Planning**
- Review Pet.js, UserPet.js, UserBag.js models
- Define all API endpoints needed
- Plan data flow between bag/formation/training

### **Step 2: Controller Development**
- Create PetController with business logic
- Implement pet acquisition, training, evolution
- Add validation and error handling

### **Step 3: Route Development**
- Create pet.js routes with all endpoints
- Add authentication middleware
- Connect routes to controller methods

### **Step 4: Integration & Testing**
- Register routes in server.js
- Create test scripts
- Verify all APIs work correctly

---

## 🎯 **DEVELOPMENT PRIORITY**

### **Priority 1: Core Pet Management**
- `GET /api/pets` - Get available pets
- `GET /api/user-pets` - Get user's pets  
- `POST /api/pets/choose-starter` - Choose starter pet
- `POST /api/user-pets` - Acquire new pet

### **Priority 2: Pet Training**
- `PUT /api/user-pets/:userPetId` - Level up pet
- `POST /api/user-pets/:userPetId/train` - Train pet
- `POST /api/user-pets/:userPetId/evolve` - Evolve pet

### **Priority 3: Equipment & Storage**
- Pet equipment (equip/unequip items)
- Pet storage (bag management, formations)

**Ready for Phase 2! Start with PetController and pet.js routes.** 