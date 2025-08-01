const mongoose = require('mongoose');
const userPetSchema = new mongoose.Schema({
  // References
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  pet: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    required: true 
  },
  
  // Level và Experience
  level: { 
    type: Number, 
    default: 1, 
    min: 1 
  },
  exp: { 
    type: Number, 
    default: 0 
  },
  
  // Location trong game
  location: { 
    type: String, 
    enum: ['bag', 'storage', 'formation'], 
    default: 'storage' 
  },
  
  // Evolution state
  evolutionStage: { 
    type: Number, 
    default: 1, 
    min: 1, 
    max: 3 
  },
  _canEvolve: { 
    type: Boolean, 
    default: false 
  },

  actualStats: {
    hp: { type: Number, default: 0 },
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    evasion: { type: Number, default: 0 },
    criticalRate: { type: Number, default: 0 }
  },
  actualCombatPower: { 
    type: Number, 
    default: 0 
  },
  
  totalDamageDealt: { 
    type: Number, 
    default: 0 
  },
  totalDamageTaken: { 
    type: Number, 
    default: 0 
  },
  
  // Skill levels của pet này
  skillLevels: {
    normalSkill: { type: Number, default: 1, min: 1 },
    ultimateSkill: { type: Number, default: 1, min: 1 },
    passiveSkill: { type: Number, default: 1, min: 1 }
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ==================== METHODS ====================

/**
 * Tính toán stats thực tế với Stat Growth System và Equipment
 */
userPetSchema.methods.calculateActualStats = async function() {
  await this.populate('pet');
  if (!this.pet) return null;
  
  // Populate element
  await this.pet.populate('element');
  
  // Base stats with stat growth scaling
  this.actualStats = {
    hp: Math.floor(this.pet.baseHp * this.level * (this.pet.statGrowth?.hp || 1.0)),
    attack: Math.floor(this.pet.baseAttack * this.level * (this.pet.statGrowth?.attack || 1.0)),
    defense: Math.floor(this.pet.baseDefense * this.level * (this.pet.statGrowth?.defense || 1.0)),
    speed: Math.floor(this.pet.baseSpeed * this.level * (this.pet.statGrowth?.speed || 1.0)),
    accuracy: Math.floor(this.pet.baseAccuracy * this.level * (this.pet.statGrowth?.accuracy || 1.0)),
    evasion: Math.floor(this.pet.baseEvasion * this.level * (this.pet.statGrowth?.evasion || 1.0)),
    criticalRate: Math.floor(this.pet.baseCriticalRate * this.level * (this.pet.statGrowth?.criticalRate || 1.0))
  };
  
  // Cộng thêm stats từ equipment
  try {
    const UserPetEquipment = require('./UserPetEquipment');
    const equipmentStats = await UserPetEquipment.getPetTotalEquipmentStats(this._id);
    
    this.actualStats.hp += equipmentStats.hp;
    this.actualStats.attack += equipmentStats.attack;
    this.actualStats.defense += equipmentStats.defense;
    this.actualStats.speed += equipmentStats.speed;
    this.actualStats.accuracy += equipmentStats.accuracy;
    this.actualStats.evasion += equipmentStats.evasion;
    this.actualStats.criticalRate += equipmentStats.criticalRate;
  } catch (error) {
    console.log('Không thể load equipment stats:', error.message);
  }
  
  return this.actualStats;
};

/**
 * Tính toán combat power thực tế theo Stat Growth System
 */
userPetSchema.methods.calculateCombatPower = async function() {
  const stats = await this.calculateActualStats();
  if (!stats) return 0;
  
  await this.populate('pet');
  if (!this.pet) return 0;
  
  // Lấy growth rates từ pet template
  const growthRates = this.pet.statGrowth || {
    hp: 1.0, attack: 1.0, defense: 1.0, speed: 1.0,
    accuracy: 1.0, evasion: 1.0, criticalRate: 1.0
  };
  
  // Tính combat power dựa trên growth rates
  const growthBasedCP = Math.floor(
    stats.hp * growthRates.hp +
    stats.attack * growthRates.attack +
    stats.defense * growthRates.defense +
    stats.speed * growthRates.speed +
    stats.accuracy * growthRates.accuracy +
    stats.evasion * growthRates.evasion +
    stats.criticalRate * growthRates.criticalRate
  );
  
  // Baseline CP với trọng số cân bằng
  const baselineCP = Math.floor(
    stats.hp * 1.0 +
    stats.attack * 1.0 +
    stats.defense * 1.0 +
    stats.speed * 1.0 +
    stats.accuracy * 1.0 +
    stats.evasion * 1.0 +
    stats.criticalRate * 1.0
  );
  
  // Kết hợp growth-based và baseline (70% growth, 30% baseline)
  this.actualCombatPower = Math.floor(growthBasedCP * 0.7 + baselineCP * 0.3);
  
  return this.actualCombatPower;
};

/**
 * Kiểm tra có thể level up không
 */
userPetSchema.methods.canLevelUp = async function() {
  await this.populate('pet');
  if (!this.pet) return false;
  
  console.log(`canLevelUp: current level=${this.level}, pet levelCap=${this.pet.levelCap}, current exp=${this.exp}`);
  
  // Check level cap
  if (this.level >= this.pet.levelCap) {
    console.log('Cannot level up: reached level cap');
    return false;
  }
  
  // Calculate exp needed for next level
  const expNeeded = await this.calculateExpForLevel(this.level + 1);
  const canLevelUp = this.exp >= expNeeded;
  console.log(`canLevelUp: expNeeded=${expNeeded}, canLevelUp=${canLevelUp}`);
  return canLevelUp;
};

/**
 * Tính exp cần cho level
 */
userPetSchema.methods.calculateExpForLevel = async function(targetLevel) {
  await this.populate('pet');
  if (!this.pet) return 0;
  
  await this.pet.populate('rarity');
  
  const baseExp = targetLevel * 100; // Base exp formula (giảm từ 500 xuống 100)
  const expMultiplier = this.pet.rarity?.expMultiplier || 1.0; // Rarity chỉ ảnh hưởng exp requirements
  
  const result = Math.floor(baseExp * expMultiplier);
  console.log(`calculateExpForLevel: targetLevel=${targetLevel}, baseExp=${baseExp}, expMultiplier=${expMultiplier}, result=${result}`);
  return result;
};

/**
 * Thêm exp và tự động level up
 */
userPetSchema.methods.addExp = async function(expAmount) {
  this.exp += expAmount;
  
  // Check và level up
  while (await this.canLevelUp()) {
    const expNeeded = this.calculateExpForLevel(this.level + 1);
    
    if (this.exp >= expNeeded) {
      this.level += 1;
      this.exp -= expNeeded;
      
      // Recalculate stats và combat power
      await this.calculateActualStats();
      await this.calculateCombatPower();
      
      // Update evolve status
      await this.updateEvolveStatus();
    } else {
      break;
    }
  }
  
  return this;
};

/**
 * Kiểm tra có thể evolve không
 */
userPetSchema.methods.canEvolve = async function() {
  await this.populate('pet');
  if (!this.pet) return false;
  
  // Check if evolution chain exists and is properly structured
  if (!this.pet.evolutionChain || !Array.isArray(this.pet.evolutionChain)) {
    return false;
  }
  
  // Check if there's a next evolution in the chain
  const nextEvolution = this.pet.evolutionChain.find(evo => evo.stage === this.evolutionStage + 1);
  if (!nextEvolution) return false;
  
  // Check level requirement only (removed affinity requirement)
  if (this.level < nextEvolution.requirements.level) return false;
  
  return true;
};

/**
 * Update evolve status
 */
userPetSchema.methods.updateEvolveStatus = async function() {
  this._canEvolve = await this.canEvolve();
  return this;
};

/**
 * Evolve pet
 */
userPetSchema.methods.evolve = async function() {
  if (!(await this.canEvolve())) {
    throw new Error('Cannot evolve pet');
  }
  
  this.evolutionStage += 1;
  await this.updateEvolveStatus();
  
  // Recalculate stats after evolution
  await this.calculateActualStats();
  await this.calculateCombatPower();
  
  return this;
};

/**
 * Lấy thông tin evolution
 */
userPetSchema.methods.getEvolutionInfo = async function() {
  await this.populate('pet');
  if (!this.pet) return null;
  
  // Check if evolution chain exists
  if (!this.pet.evolutionChain || !Array.isArray(this.pet.evolutionChain)) {
    return null;
  }
  
  const nextEvolution = this.pet.evolutionChain.find(evo => evo.stage === this.evolutionStage + 1);
  if (!nextEvolution) {
    return {
      currentStage: this.evolutionStage,
      maxStage: this.evolutionStage,
      requirements: null,
      newPet: null,
      canEvolve: false
    };
  }
  
  return {
    currentStage: this.evolutionStage,
    maxStage: Math.max(...this.pet.evolutionChain.map(evo => evo.stage)),
    requirements: nextEvolution.requirements,
    newPet: nextEvolution.petId,
    canEvolve: await this.canEvolve()
  };
};

/**
 * Lấy thông tin level up
 */
userPetSchema.methods.getLevelUpInfo = async function() {
  await this.populate('pet');
  if (!this.pet) return null;
  
  // Check if can level up
  if (!(await this.canLevelUp())) {
    return null;
  }
  
  const nextLevel = this.level + 1;
  const expNeeded = await this.calculateExpForLevel(nextLevel);
  
  // Calculate new stats
  const newStats = {
    hp: Math.floor(this.pet.baseHp * nextLevel * (this.pet.statGrowth?.hp || 1.0)),
    attack: Math.floor(this.pet.baseAttack * nextLevel * (this.pet.statGrowth?.attack || 1.0)),
    defense: Math.floor(this.pet.baseDefense * nextLevel * (this.pet.statGrowth?.defense || 1.0)),
    speed: Math.floor(this.pet.baseSpeed * nextLevel * (this.pet.statGrowth?.speed || 1.0)),
    accuracy: Math.floor(this.pet.baseAccuracy * nextLevel * (this.pet.statGrowth?.accuracy || 1.0)),
    evasion: Math.floor(this.pet.baseEvasion * nextLevel * (this.pet.statGrowth?.evasion || 1.0)),
    criticalRate: Math.floor(this.pet.baseCriticalRate * nextLevel * (this.pet.statGrowth?.criticalRate || 1.0))
  };
  
  return {
    currentLevel: this.level,
    currentExp: this.exp,
    requiredExp: expNeeded,
    cost: {
      golds: this.level * 1000, // Simple gold cost formula
      materials: []
    },
    newStats: newStats
  };
};

/**
 * Level up pet
 */
userPetSchema.methods.levelUp = async function(userInventory = []) {
  const levelUpInfo = await this.getLevelUpInfo();
  
  if (!levelUpInfo) {
    throw new Error('Cannot level up pet');
  }
  
  console.log(`levelUp: starting level up from level ${this.level} to ${this.level + 1}`);
  
  // Check if user has enough golds (simplified check)
  // In real implementation, you would check user's golds here
  
  // Level up
  this.level += 1;
  this.exp -= levelUpInfo.requiredExp;
  
  console.log(`levelUp: new level=${this.level}, remaining exp=${this.exp}`);
  
  // Recalculate stats
  await this.calculateActualStats();
  await this.calculateCombatPower();
  
  // Update evolve status
  await this.updateEvolveStatus();
  
  console.log(`levelUp: completed successfully`);
  
  return {
    success: true,
    oldLevel: levelUpInfo.currentLevel,
    newLevel: this.level,
    newStats: this.actualStats,
    newCombatPower: this.actualCombatPower
  };
};

/**
 * Lấy thông tin đầy đủ của pet
 */
userPetSchema.methods.getFullInfo = async function() {
  await this.populate('pet');
  if (!this.pet) return null;
  
  await this.pet.populate('element rarity normalSkill ultimateSkill passiveSkill');
  
  // Lấy skills với levels
  const skillsWithLevels = await this.getSkillsWithLevels();
  
  // Lấy equipment info
  let equipment = null;
  try {
    const UserPetEquipment = require('./UserPetEquipment');
    equipment = await UserPetEquipment.getPetEquipment(this._id);
  } catch (error) {
    console.log('Không thể load equipment:', error.message);
  }
  
  return {
    _id: this._id,
    user: this.user,
    pet: this.pet,
    level: this.level,
    exp: this.exp,
    location: this.location,
    evolutionStage: this.evolutionStage,
    canEvolve: this._canEvolve,
    actualStats: this.actualStats,
    actualCombatPower: this.actualCombatPower,
    totalDamageDealt: this.totalDamageDealt,
    totalDamageTaken: this.totalDamageTaken,
    equipment: equipment,
    skills: skillsWithLevels,
    skillLevels: this.skillLevels,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Lấy thông tin tóm tắt của pet
 */
userPetSchema.methods.getSummary = async function() {
  await this.populate('pet');
  if (!this.pet) return null;
  
  await this.pet.populate('element rarity');
  
  return {
    _id: this._id,
    petName: this.pet.name,
    petImg: this.pet.img,
    element: this.pet.element,
    rarity: this.pet.rarity,
    level: this.level,
    evolutionStage: this.evolutionStage,
    actualCombatPower: this.actualCombatPower,
    location: this.location,
    canEvolve: this._canEvolve
  };
};

/**
 * Lấy skill level theo type
 */
userPetSchema.methods.getSkillLevel = function(skillType) {
  const skillKey = `${skillType}Skill`;
  return this.skillLevels[skillKey] || 1;
};

/**
 * Set skill level
 */
userPetSchema.methods.setSkillLevel = function(skillType, level) {
  const skillKey = `${skillType}Skill`;
  if (level >= 1) {
    this.skillLevels[skillKey] = level;
  }
  return this;
};



/**
 * Lấy thông tin skills với level hiện tại
 */
userPetSchema.methods.getSkillsWithLevels = async function() {
  await this.populate('pet');
  if (!this.pet) return [];
  
  await this.pet.populate('normalSkill ultimateSkill passiveSkill');
  
  const skills = [];
  
  // Lấy skill templates từ pet
  const skillTemplates = [
    { type: 'normal', skill: this.pet.normalSkill },
    { type: 'ultimate', skill: this.pet.ultimateSkill },
    { type: 'passive', skill: this.pet.passiveSkill }
  ].filter(s => s.skill);
  
  // Kết hợp với skill levels
  for (const template of skillTemplates) {
    const currentLevel = this.getSkillLevel(template.type);
    
    // Tính toán current scaling dựa trên level
    const currentScaling = template.skill.calculateScalingForLevel(currentLevel);
    
    skills.push({
      type: template.type,
      skillTemplate: template.skill,
      currentLevel: currentLevel,
      currentScaling: currentScaling
    });
  }
  
  return skills;
};

/**
 * Lấy thông tin nâng cấp skill
 */
userPetSchema.methods.getSkillUpgradeInfo = async function(skillType) {
  await this.populate('pet');
  if (!this.pet) return null;
  
  const skillKey = `${skillType}Skill`;
  const skillTemplate = this.pet[skillKey];
  
  if (!skillTemplate) return null;
  
  // Populate skill template để đảm bảo có thể gọi methods
  await this.pet.populate(skillKey);
  
  const currentLevel = this.getSkillLevel(skillType);
  console.log('Current skill level:', currentLevel);
  console.log('Skill template:', skillTemplate);
  
  // Kiểm tra xem skill template có method getNextLevelInfo không
  if (typeof skillTemplate.getNextLevelInfo !== 'function') {
    console.error('Skill template does not have getNextLevelInfo method:', skillTemplate);
    return null;
  }
  
  const nextLevelInfo = skillTemplate.getNextLevelInfo(currentLevel);
  console.log('Next level info:', nextLevelInfo);
  
  if (!nextLevelInfo) return null;
  
  // Sử dụng gold cost từ Skill model thay vì tính riêng
  const goldsCost = nextLevelInfo.upgradeRequirements.gold;
  
  return {
    ...nextLevelInfo,
    goldsCost: goldsCost,
    requirements: nextLevelInfo.upgradeRequirements,
    totalCost: {
      materials: nextLevelInfo.upgradeRequirements.materials,
      golds: goldsCost,
      petLevel: nextLevelInfo.upgradeRequirements.petLevel
    }
  };
};

/**
 * Tính damage của skill
 */
userPetSchema.methods.calculateSkillDamage = async function(skillType, targetElement, targetPet = null) {
  await this.populate('pet');
  if (!this.pet) return 0;
  
  const skillLevel = this.getSkillLevel(skillType);
  
  // Sử dụng Pet template để tính damage với pet level và skill level
  return this.pet.calculateSkillDamage(
    skillType,
    targetElement,
    skillLevel,  // Skill level
    targetPet,   // Target pet for defense calculation
    this.level   // Pet level
  );
};

/**
 * Nâng cấp skill
 */
userPetSchema.methods.upgradeSkill = async function(skillType, userInventory, userGolds) {
  const upgradeInfo = await this.getSkillUpgradeInfo(skillType);
  
  if (!upgradeInfo) {
    throw new Error('Không thể nâng cấp skill');
  }
  
  // Kiểm tra requirements
  const requirements = upgradeInfo.requirements;
  
  // Kiểm tra pet level
  if (this.level < requirements.petLevel) {
    throw new Error(`Pet cần level ${requirements.petLevel} (hiện tại: ${this.level})`);
  }
  
  // Sử dụng gold cost từ Skill model
  const goldsCost = upgradeInfo.goldsCost;
  
  // Kiểm tra golds
  if (userGolds < goldsCost) {
    throw new Error(`Cần ${goldsCost} golds để nâng cấp skill (hiện tại: ${userGolds})`);
  }
  
  // Kiểm tra materials - cải thiện validation
  for (const material of requirements.materials) {
    // Tìm item trong user inventory
    const userItem = userInventory.find(item => {
      // So sánh ObjectId
      return item.itemId && item.itemId.toString() === material.itemId.toString();
    });
    
    if (!userItem || userItem.quantity < material.quantity) {
      throw new Error(`Thiếu ${material.quantity} items cho skill upgrade`);
    }
  }
  
  // Nâng cấp skill
  const newLevel = upgradeInfo.nextLevel;
  this.setSkillLevel(skillType, newLevel);
  
  return {
    success: true,
    skillType: skillType,
    oldLevel: upgradeInfo.currentLevel,
    newLevel: newLevel,
    newScaling: upgradeInfo.nextScaling,
    materialsUsed: requirements.materials,
    goldsSpent: goldsCost,
    requirements: requirements
  };
};

/**
 * Tính chi phí golds để nâng cấp skill (DEPRECATED - Sử dụng từ Skill model)
 * @deprecated Sử dụng skillTemplate.calculateSkillUpgradeGoldsCost() thay thế
 */
userPetSchema.methods.calculateSkillUpgradeGoldsCost = function(skillType, targetLevel) {
  console.warn('DEPRECATED: calculateSkillUpgradeGoldsCost in UserPet. Use Skill model instead.');
  
  // Fallback calculation - nên sử dụng từ Skill model
  const baseCost = 5000;
  const levelMultiplier = 1.85;
  const multiplier = Math.pow(levelMultiplier, targetLevel - 2);
  return Math.floor(baseCost * multiplier);
};

/**
 * Kiểm tra pet có trong bag không
 */
userPetSchema.methods.isInBag = function() {
  return this.location === 'bag';
};

/**
 * Kiểm tra pet có trong storage không
 */
userPetSchema.methods.isInStorage = function() {
  return this.location === 'storage';
};

/**
 * Di chuyển pet giữa bag và storage
 */
userPetSchema.methods.moveTo = function(newLocation) {
  if (!['bag', 'storage'].includes(newLocation)) {
    throw new Error('Invalid location. Must be "bag" or "storage"');
  }
  
  this.location = newLocation;
  return this;
};

/**
 * Lấy exp cần thiết cho level tiếp theo
 */
userPetSchema.methods.getExpNeededForNextLevel = async function() {
  return this.calculateExpForLevel(this.level + 1);
};

/**
 * Kiểm tra tính hợp lệ của UserPet data
 */
userPetSchema.methods.validateData = async function() {
  const errors = [];
  
  // Check required fields
  if (!this.user) errors.push('User reference is required');
  if (!this.pet) errors.push('Pet reference is required');
  
  // Check level range
  if (this.level < 1) {
    errors.push('Level must be at least 1');
  }
  
  // Check exp
  if (this.exp < 0) errors.push('Experience cannot be negative');
  
  // Check location
  if (!['bag', 'storage'].includes(this.location)) {
    errors.push('Location must be either "bag" or "storage"');
  }
  
  // Check evolution stage
  if (this.evolutionStage < 1 || this.evolutionStage > 3) {
    errors.push('Evolution stage must be between 1 and 3');
  }
  
  // Check if pet exists and is valid
  if (this.pet) {
    await this.populate('pet');
    if (!this.pet) {
      errors.push('Referenced pet does not exist');
    } else if (!this.pet.isActive) {
      errors.push('Referenced pet is not active');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// ==================== EQUIPMENT METHODS ====================

/**
 * Lấy tất cả equipment của pet
 */
userPetSchema.methods.getEquipment = async function() {
  try {
    const UserPetEquipment = require('./UserPetEquipment');
    return await UserPetEquipment.getPetEquipment(this._id);
  } catch (error) {
    console.log('Không thể load equipment:', error.message);
    return [];
  }
};

/**
 * Lấy equipment theo slot
 */
userPetSchema.methods.getEquipmentBySlot = async function(slot) {
  try {
    const UserPetEquipment = require('./UserPetEquipment');
    return await UserPetEquipment.getEquipmentBySlot(this._id, slot);
  } catch (error) {
    console.log('Không thể load equipment by slot:', error.message);
    return null;
  }
};

/**
 * Trang bị item cho pet
 */
userPetSchema.methods.equipItem = async function(itemId, slot) {
  try {
    const UserPetEquipment = require('./UserPetEquipment');
    return await UserPetEquipment.equipItem(this._id, itemId, slot, this.level);
  } catch (error) {
    throw new Error(`Không thể trang bị item: ${error.message}`);
  }
};

/**
 * Tháo equipment khỏi pet
 */
userPetSchema.methods.unequipItem = async function(slot) {
  try {
    const UserPetEquipment = require('./UserPetEquipment');
    return await UserPetEquipment.unequipItem(this._id, slot);
  } catch (error) {
    throw new Error(`Không thể tháo equipment: ${error.message}`);
  }
};

/**
 * Lấy tổng stats từ equipment
 */
userPetSchema.methods.getEquipmentStats = async function() {
  try {
    const UserPetEquipment = require('./UserPetEquipment');
    return await UserPetEquipment.getPetTotalEquipmentStats(this._id);
  } catch (error) {
    console.log('Không thể load equipment stats:', error.message);
    return {
      hp: 0, attack: 0, defense: 0, speed: 0,
      accuracy: 0, evasion: 0, criticalRate: 0, criticalDamage: 0
    };
  }
};

// ==================== MIDDLEWARE ====================

/**
 * Pre-save middleware
 */
userPetSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Tạm thời disable để tránh infinite loop
  console.log('Pre-save middleware: updating timestamp only');
  
  next();
});

// ==================== INDEXES ====================

// Index để tối ưu truy vấn
userPetSchema.index({ user: 1, pet: 1 });
userPetSchema.index({ user: 1, location: 1 });
userPetSchema.index({ user: 1, level: -1 });
userPetSchema.index({ actualCombatPower: -1 });
userPetSchema.index({ evolutionStage: 1 });

module.exports = mongoose.model('UserPet', userPetSchema); 