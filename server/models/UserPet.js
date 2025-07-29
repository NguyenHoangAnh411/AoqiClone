const mongoose = require('mongoose');

/**
 * UserPet Model - Liên kết User với Pet
 * Mỗi UserPet đại diện cho một pet cụ thể mà user sở hữu
 * Có level, exp, stats riêng cho từng pet
 */
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
    enum: ['bag', 'storage'], 
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
  
  // Calculated stats (tính toán động)
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
  
  // Equipment slots (cho tương lai)
  equipment: {
    weapon: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    armor: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    accessory: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }
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
 * Tính toán stats thực tế với Stat Growth System
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
  
  // Check level cap
  if (this.level >= this.pet.levelCap) return false;
  
  // Calculate exp needed for next level
  const expNeeded = this.calculateExpForLevel(this.level + 1);
  return this.exp >= expNeeded;
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
  
  return Math.floor(baseExp * expMultiplier);
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
 * Lấy thông tin đầy đủ của pet
 */
userPetSchema.methods.getFullInfo = async function() {
  await this.populate('pet');
  if (!this.pet) return null;
  
  await this.pet.populate('element rarity normalSkill ultimateSkill passiveSkill');
  
  // Lấy skills với levels
  const skillsWithLevels = await this.getSkillsWithLevels();
  
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
    equipment: this.equipment,
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
  const nextLevelInfo = skillTemplate.getNextLevelInfo(currentLevel);
  
  return nextLevelInfo;
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
userPetSchema.methods.upgradeSkill = async function(skillType, userInventory, userGold) {
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
  
  // Kiểm tra gold
  if (userGold < requirements.gold) {
    throw new Error(`Cần ${requirements.gold} gold (hiện tại: ${userGold})`);
  }
  
  // Kiểm tra materials
  for (const material of requirements.materials) {
    const userItem = userInventory.find(item => item.itemId.toString() === material.itemId.toString());
    if (!userItem || userItem.quantity < material.quantity) {
      throw new Error(`Thiếu ${material.quantity} ${material.itemId}`);
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
    goldSpent: requirements.gold
  };
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

// ==================== MIDDLEWARE ====================

/**
 * Pre-save middleware
 */
userPetSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  try {
    // Calculate stats và combat power nếu chưa có hoặc level thay đổi
    const needsRecalculation = !this.actualStats.hp || 
                              !this.actualCombatPower || 
                              this.isModified('level') ||
                              this.isModified('evolutionStage');
    
    if (needsRecalculation) {
      await this.calculateActualStats();
      await this.calculateCombatPower();
    }
    
    // Update evolve status
    await this.updateEvolveStatus();
  } catch (error) {
    console.error('Error in UserPet pre-save middleware:', error);
    // Continue with save even if calculation fails
  }
  
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