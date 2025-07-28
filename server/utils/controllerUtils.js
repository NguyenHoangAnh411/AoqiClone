const { 
  getExpNeededForNextLevel, 
  canLevelUp, 
  calculateActualCombatPower,
  calculatePetRating,
  getPetClass
} = require('./petUtils');

/**
 * Helper function để tính toán thông tin pet (dùng cho available pets)
 * @param {Object} userPet - UserPet object đã được populate
 * @returns {Object} Pet info với đầy đủ thông tin
 */
const calculatePetInfo = (userPet) => {
  // Đảm bảo userPet.pet đã được populate
  if (!userPet.pet) {
    console.error('userPet.pet is not populated:', userPet);
    return userPet.toObject();
  }

  const expNeeded = getExpNeededForNextLevel(userPet.level, userPet.pet.rarity);
  const canLevelUpNow = canLevelUp(userPet.level, userPet.exp, userPet.pet.rarity);
  
  // Tính combat power và rating
  const baseStats = {
    baseHp: userPet.pet.baseHp,
    baseAttack: userPet.pet.baseAttack,
    baseDefense: userPet.pet.baseDefense,
    baseSpeed: userPet.pet.baseSpeed,
    baseAccuracy: userPet.pet.baseAccuracy,
    baseEvasion: userPet.pet.baseEvasion,
    baseCriticalRate: userPet.pet.baseCriticalRate
  };
  
  const actualCombatPower = calculateActualCombatPower(
    baseStats, 
    userPet.level, 
    userPet.pet.rarity, 
    userPet.pet.element
  );
  
  const petRating = calculatePetRating({
    hp: userPet.hp,
    attack: userPet.attack,
    defense: userPet.defense,
    speed: userPet.speed
  });
  
  const petClass = getPetClass(actualCombatPower);
  
  return {
    ...userPet.toObject(),
    expNeededForNextLevel: expNeeded,
    canLevelUp: canLevelUpNow,
    actualCombatPower: actualCombatPower,
    petRating: petRating,
    petClass: petClass,
    progressPercentage: userPet.level >= 100 ? 100 : Math.floor((userPet.exp / expNeeded) * 100)
  };
};

/**
 * Helper function để tính toán actualCombatPower cho pet trong formation
 * @param {Object} userPet - UserPet object đã được populate
 * @returns {Number} Combat power
 */
const calculateFormationPetCombatPower = (userPet) => {
  if (!userPet.pet) {
    console.error('userPet.pet is not populated:', userPet);
    return 0;
  }

  const baseStats = {
    baseHp: userPet.pet.baseHp,
    baseAttack: userPet.pet.baseAttack,
    baseDefense: userPet.pet.baseDefense,
    baseSpeed: userPet.pet.baseSpeed,
    baseAccuracy: userPet.pet.baseAccuracy,
    baseEvasion: userPet.pet.baseEvasion,
    baseCriticalRate: userPet.pet.baseCriticalRate
  };
  
  return calculateActualCombatPower(
    baseStats, 
    userPet.level, 
    userPet.pet.rarity, 
    userPet.pet.element
  );
};

/**
 * Standard populate options cho UserPet trong Formation
 */
const userPetPopulateOptions = {
  path: 'pets.userPet',
  populate: {
    path: 'pet',
    populate: [
      { path: 'normalSkill' },
      { path: 'ultimateSkill' },
      { path: 'passiveSkill' }
    ]
  }
};

/**
 * Standard populate options cho single UserPet
 */
const singleUserPetPopulateOptions = {
  path: 'pet',
  populate: [
    { path: 'normalSkill' },
    { path: 'ultimateSkill' },
    { path: 'passiveSkill' }
  ]
};

/**
 * Standard populate options cho Pet
 */
const petPopulateOptions = [
  { path: 'normalSkill' },
  { path: 'ultimateSkill' },
  { path: 'passiveSkill' },
  { path: 'evolutionPet' }
];

/**
 * Standard populate options cho User
 */
const userPopulateOptions = {
  path: 'pets',
  populate: {
    path: 'pet',
    select: 'name img element rarity'
  }
};

/**
 * Standard populate options cho Inventory
 */
const inventoryPopulateOptions = {
  path: 'itemId'
};

/**
 * Tính toán combat power cho tất cả pet trong formation
 * @param {Object} formation - Formation object
 */
const calculateFormationPetsCombatPower = (formation) => {
  for (let petSlot of formation.pets) {
    if (petSlot.isActive && petSlot.userPet) {
      petSlot.userPet.actualCombatPower = calculateFormationPetCombatPower(petSlot.userPet);
    }
  }
};

/**
 * Enrich tất cả user pets với thông tin bổ sung
 * @param {Array} userPets - Array of UserPet objects
 * @returns {Array} Enriched user pets
 */
const enrichUserPets = (userPets) => {
  return userPets.map(pet => calculatePetInfo(pet));
};

/**
 * Standard error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Error} err - Original error (optional)
 */
const sendErrorResponse = (res, statusCode, message, err = null) => {
  if (err) {
    console.error(`${message}:`, err);
  }
  res.status(statusCode).json({ error: message });
};

/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @param {String} message - Success message (optional)
 */
const sendSuccessResponse = (res, statusCode, data, message = null) => {
  const response = { ...data };
  if (message) {
    response.message = message;
  }
  res.status(statusCode).json(response);
};

/**
 * Validate object exists and belongs to user
 * @param {Object} object - Object to validate
 * @param {String} userId - User ID
 * @param {String} objectName - Name of object for error message
 * @returns {Object} Validation result { isValid, error }
 */
const validateObjectOwnership = (object, userId, objectName) => {
  if (!object) {
    return { isValid: false, error: `Không tìm thấy ${objectName}` };
  }
  
  if (object.user && object.user.toString() !== userId) {
    return { isValid: false, error: `${objectName} không thuộc về bạn` };
  }
  
  return { isValid: true };
};

/**
 * Validate required fields
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result { isValid, error }
 */
const validateRequiredFields = (body, requiredFields) => {
  for (const field of requiredFields) {
    if (!body[field]) {
      return { isValid: false, error: `Thiếu thông tin ${field}` };
    }
  }
  return { isValid: true };
};

/**
 * Async wrapper để handle errors trong controllers
 * @param {Function} fn - Controller function
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Pagination helper
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} Pagination options
 */
const getPaginationOptions = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

/**
 * Sort options helper
 * @param {String} sortBy - Field to sort by
 * @param {String} sortOrder - Sort order (asc/desc)
 * @returns {Object} Sort options
 */
const getSortOptions = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  return sort;
};

/**
 * Filter options helper
 * @param {Object} filters - Filter object
 * @returns {Object} Filter options
 */
const getFilterOptions = (filters) => {
  const filterOptions = {};
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      filterOptions[key] = filters[key];
    }
  });
  
  return filterOptions;
};

/**
 * Create fake UserPet for AI opponents
 * @param {Object} petData - Pet data
 * @returns {Object} Fake UserPet object
 */
const createFakeUserPet = (petData) => {
  return {
    user: petData.userId || 'ai',
    pet: petData.petId,
    level: Math.floor(Math.random() * 50) + 20, // Level 20-70
    exp: 0,
    hp: 1000,
    attack: 100,
    defense: 50,
    speed: 100,
    accuracy: 100,
    evasion: 10,
    criticalRate: 5,
    isActive: false,
    createdAt: new Date()
  };
};

/**
 * Process consumable item effects
 * @param {Object} item - Item object
 * @param {String} targetId - Target ID
 * @param {String} targetType - Target type
 * @returns {Object} Process result
 */
const processConsumableEffect = async (item, targetId, targetType) => {
  // Implementation depends on specific game logic
  return { success: true, effect: item.effect };
};

/**
 * Process food item effects
 * @param {Object} item - Item object
 * @param {String} petId - Pet ID
 * @returns {Object} Process result
 */
const processFoodEffect = async (item, petId) => {
  // Implementation depends on specific game logic
  return { success: true, effect: item.effect };
};

module.exports = {
  calculatePetInfo,
  calculateFormationPetCombatPower,
  calculateFormationPetsCombatPower,
  enrichUserPets,
  userPetPopulateOptions,
  singleUserPetPopulateOptions,
  petPopulateOptions,
  userPopulateOptions,
  inventoryPopulateOptions,
  sendErrorResponse,
  sendSuccessResponse,
  validateObjectOwnership,
  validateRequiredFields,
  asyncHandler,
  getPaginationOptions,
  getSortOptions,
  getFilterOptions,
  createFakeUserPet,
  processConsumableEffect,
  processFoodEffect
}; 