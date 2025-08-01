const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  img: { type: String, required: true },
  description: String,
  
  // References to Element and Rarity models
  element: { type: mongoose.Schema.Types.ObjectId, ref: 'Element', required: true },
  rarity: { type: mongoose.Schema.Types.ObjectId, ref: 'Rarity', required: true },
  
  // Chỉ số cơ bản (base stats) - sẽ được nhân với level trong UserPet
  baseHp: { type: Number, default: 1000 },
  baseAttack: { type: Number, default: 100 },
  baseDefense: { type: Number, default: 50 },
  baseSpeed: { type: Number, default: 100 },
  baseAccuracy: { type: Number, default: 100 },
  baseEvasion: { type: Number, default: 10 },
  baseCriticalRate: { type: Number, default: 5 },
  
  // Stat Growth System - Tỷ lệ tăng stats khi lên level
  statGrowth: {
    hp: { type: Number, default: 1.0 },      // HP growth rate
    attack: { type: Number, default: 1.0 },  // Attack growth rate
    defense: { type: Number, default: 1.0 }, // Defense growth rate
    speed: { type: Number, default: 1.0 },   // Speed growth rate
    accuracy: { type: Number, default: 1.0 }, // Accuracy growth rate
    evasion: { type: Number, default: 1.0 },  // Evasion growth rate
    criticalRate: { type: Number, default: 1.0 } // Critical Rate growth rate
  },
  
  // Skills cố định của linh thú (3 skills: normal, ultimate, passive)
  normalSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  ultimateSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  passiveSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  
  // Evolution system - Simplified
  evolutionStage: { type: Number, default: 1 }, // Stage 1, 2, 3
  evolutionChain: [{ // Array of evolution stages
    stage: { type: Number, required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    requirements: {
      level: { type: Number, default: 0 },
      items: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        quantity: { type: Number, default: 1 }
      }],
      friendship: { type: Number, default: 0 },
      specialCondition: { type: String }
    }
  }],
  
  // Level cap - moved from Rarity to Pet
  levelCap: { type: Number, default: 100 },
  
  // Pet classification
  isActive: { type: Boolean, default: true }, // Có thể nhận được không
  isStarter: { type: Boolean, default: false }, // Linh thú mở đầu cho người dùng mới
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Team Buff
  teamBuff: {
    stat: { type: String, enum: ['attack', 'defense', 'hp', 'speed'], required: false },
    value: { type: Number, required: false },
    type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    requirement: {
      type: { type: String, enum: ['element', 'species'], required: false },
      value: { type: String, required: false },
      count: { type: Number, required: false }
    }
  }
});

// ==================== METHODS ====================

/**
 * Lấy evolution chain đầy đủ
 */
petSchema.methods.getEvolutionChain = async function() {
  const chain = [];
  
  // Populate evolution chain
  await this.populate('evolutionChain.petId');
  
  // Sort by stage
  const sortedChain = this.evolutionChain.sort((a, b) => a.stage - b.stage);
  
  // Add current pet to appropriate position
  const currentStageIndex = sortedChain.findIndex(evo => evo.stage === this.evolutionStage);
  
  // Add previous evolutions
  for (let i = 0; i < currentStageIndex; i++) {
    if (sortedChain[i].petId) {
      chain.push(sortedChain[i].petId);
    }
  }
  
  // Add current pet
  chain.push(this);
  
  // Add next evolutions
  for (let i = currentStageIndex + 1; i < sortedChain.length; i++) {
    if (sortedChain[i].petId) {
      chain.push(sortedChain[i].petId);
    }
  }
  
  return chain;
};

/**
 * Lấy evolution requirements cho stage tiếp theo
 */
petSchema.methods.getEvolutionRequirements = function() {
  const nextEvolution = this.evolutionChain.find(evo => evo.stage === this.evolutionStage + 1);
  return nextEvolution ? nextEvolution.requirements : null;
};

/**
 * Lấy next evolution pet
 */
petSchema.methods.getNextEvolutionPet = async function() {
  const nextEvolution = this.evolutionChain.find(evo => evo.stage === this.evolutionStage + 1);
  if (!nextEvolution || !nextEvolution.petId) return null;
  
  await this.populate('evolutionChain.petId');
  return nextEvolution.petId;
};

/**
 * Lấy tất cả skills của pet
 */
petSchema.methods.getAllSkills = function() {
  const skills = [];
  
  if (this.normalSkill) skills.push({ type: 'normal', skill: this.normalSkill });
  if (this.ultimateSkill) skills.push({ type: 'ultimate', skill: this.ultimateSkill });
  if (this.passiveSkill) skills.push({ type: 'passive', skill: this.passiveSkill });
  
  return skills;
};

/**
 * Lấy tất cả skills của pet với populate
 */
petSchema.methods.getAllSkillsPopulated = async function() {
  await this.populate('normalSkill ultimateSkill passiveSkill');
  
  const skills = [];
  
  if (this.normalSkill) skills.push({ type: 'normal', skill: this.normalSkill });
  if (this.ultimateSkill) skills.push({ type: 'ultimate', skill: this.ultimateSkill });
  if (this.passiveSkill) skills.push({ type: 'passive', skill: this.passiveSkill });
  
  return skills;
};

/**
 * Lấy skill theo type
 */
petSchema.methods.getSkillByType = async function(skillType) {
  const skillKey = `${skillType}Skill`;
  const skill = this[skillKey];
  
  if (!skill) return null;
  
  await this.populate(skillKey);
  return skill;
};

/**
 * Lấy thông tin skill với level cụ thể
 */
petSchema.methods.getSkillWithLevel = async function(skillType, skillLevel = 1) {
  const skill = await this.getSkillByType(skillType);
  
  if (!skill) return null;
  
  return {
    type: skillType,
    skill: skill,
    level: skillLevel,
    scaling: skill.calculateScalingForLevel(skillLevel),
    requirements: skill.calculateRequirementsForLevel(skillLevel + 1)
  };
};

/**
 * Lấy thông tin tất cả skills với levels
 */
petSchema.methods.getAllSkillsWithLevels = async function(skillLevels = {}) {
  await this.populate('normalSkill ultimateSkill passiveSkill');
  
  const skills = [];
  
  const skillTypes = ['normal', 'ultimate', 'passive'];
  
  for (const type of skillTypes) {
    const skillKey = `${type}Skill`;
    const skill = this[skillKey];
    const level = skillLevels[skillKey] || 1;
    
    if (skill) {
      skills.push({
        type: type,
        skill: skill,
        level: level,
        scaling: skill.calculateScalingForLevel(level),
        requirements: skill.calculateRequirementsForLevel(level + 1),
        canUpgrade: null // Sẽ được tính toán khi cần thiết với user data
      });
    }
  }
  
  return skills;
};

/**
 * Tính damage của skill
 */
petSchema.methods.calculateSkillDamage = async function(skillType, targetElement, skillLevel = 1, targetPet = null, petLevel = 1) {
  const skill = await this.getSkillByType(skillType);
  
  if (!skill) return 0;
  
  // Tạo pet object với actual stats (base stats * pet level) để tính damage
  const petForCalculation = {
    baseAttack: this.baseAttack * petLevel,
    baseDefense: this.baseDefense * petLevel,
    baseSpeed: this.baseSpeed * petLevel,
    baseHp: this.baseHp * petLevel,
    baseAccuracy: this.baseAccuracy * petLevel,
    baseEvasion: this.baseEvasion * petLevel,
    baseCriticalRate: this.baseCriticalRate * petLevel
  };
  
  return skill.calculateDamageWithCrit(
    this.element,
    targetElement,
    petForCalculation,
    skillLevel,
    targetPet
  );
};

/**
 * Lấy thông tin nâng cấp skill
 */
petSchema.methods.getSkillUpgradeInfo = async function(skillType, currentLevel) {
  const skill = await this.getSkillByType(skillType);
  
  if (!skill) return null;
  
  return skill.getNextLevelInfo(currentLevel);
};

/**
 * Kiểm tra có thể nâng cấp skill không
 */
petSchema.methods.canUpgradeSkill = async function(skillType, currentLevel, userPetLevel, userGold, userInventory) {
  const skill = await this.getSkillByType(skillType);
  
  if (!skill) return { canUpgrade: false, reason: 'Skill không tồn tại' };
  
  return skill.canUpgrade(currentLevel, userPetLevel, userGold, userInventory);
};

/**
 * Lấy thông tin đầy đủ của pet template
 */
petSchema.methods.getFullInfo = async function() {
  await this.populate('element rarity normalSkill ultimateSkill passiveSkill');
  
  // Lấy thông tin skills với level 1 (default)
  const skillsWithLevels = await this.getAllSkillsWithLevels({
    normalSkill: 1,
    ultimateSkill: 1,
    passiveSkill: 1
  });
  
  return {
    _id: this._id,
    name: this.name,
    img: this.img,
    description: this.description,
    element: this.element,
    rarity: this.rarity,
    baseHp: this.baseHp,
    baseAttack: this.baseAttack,
    baseDefense: this.baseDefense,
    baseSpeed: this.baseSpeed,
    baseAccuracy: this.baseAccuracy,
    baseEvasion: this.baseEvasion,
    baseCriticalRate: this.baseCriticalRate,
    normalSkill: this.normalSkill,
    ultimateSkill: this.ultimateSkill,
    passiveSkill: this.passiveSkill,
    skills: skillsWithLevels,
    evolutionStage: this.evolutionStage,
    evolutionChain: this.evolutionChain,
    levelCap: this.levelCap,
    isActive: this.isActive,
    isStarter: this.isStarter,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Tính toán stats với Stat Growth System
 */
petSchema.methods.calculateStats = async function(level = 1) {
  await this.populate('element');
  
  // Base stats with stat growth scaling
  const stats = {
    hp: Math.floor(this.baseHp * level * (this.statGrowth?.hp || 1.0)),
    attack: Math.floor(this.baseAttack * level * (this.statGrowth?.attack || 1.0)),
    defense: Math.floor(this.baseDefense * level * (this.statGrowth?.defense || 1.0)),
    speed: Math.floor(this.baseSpeed * level * (this.statGrowth?.speed || 1.0)),
    accuracy: Math.floor(this.baseAccuracy * level * (this.statGrowth?.accuracy || 1.0)),
    evasion: Math.floor(this.baseEvasion * level * (this.statGrowth?.evasion || 1.0)),
    criticalRate: Math.floor(this.baseCriticalRate * level * (this.statGrowth?.criticalRate || 1.0))
  };
  
  return stats;
};

/**
 * Lấy preview stats cho các levels
 */
petSchema.methods.getStatGrowthPreview = function(startLevel = 1, endLevel = 10) {
  const preview = [];
  
  for (let level = startLevel; level <= endLevel; level++) {
    const stats = {
      level: level,
      hp: Math.floor(this.baseHp * level * (this.statGrowth?.hp || 1.0)),
      attack: Math.floor(this.baseAttack * level * (this.statGrowth?.attack || 1.0)),
      defense: Math.floor(this.baseDefense * level * (this.statGrowth?.defense || 1.0)),
      speed: Math.floor(this.baseSpeed * level * (this.statGrowth?.speed || 1.0)),
      accuracy: Math.floor(this.baseAccuracy * level * (this.statGrowth?.accuracy || 1.0)),
      evasion: Math.floor(this.baseEvasion * level * (this.statGrowth?.evasion || 1.0)),
      criticalRate: Math.floor(this.baseCriticalRate * level * (this.statGrowth?.criticalRate || 1.0))
    };
    
    preview.push(stats);
  }
  
  return preview;
};

/**
 * Lấy stat growth info
 */
petSchema.methods.getStatGrowthInfo = function() {
  return {
    baseStats: {
      hp: this.baseHp,
      attack: this.baseAttack,
      defense: this.baseDefense,
      speed: this.baseSpeed,
      accuracy: this.baseAccuracy,
      evasion: this.baseEvasion,
      criticalRate: this.baseCriticalRate
    },
    growthRates: this.statGrowth || {
      hp: 1.0,
      attack: 1.0,
      defense: 1.0,
      speed: 1.0,
      accuracy: 1.0,
      evasion: 1.0,
      criticalRate: 1.0
    },
    level1Stats: {
      hp: Math.floor(this.baseHp * (this.statGrowth?.hp || 1.0)),
      attack: Math.floor(this.baseAttack * (this.statGrowth?.attack || 1.0)),
      defense: Math.floor(this.baseDefense * (this.statGrowth?.defense || 1.0)),
      speed: Math.floor(this.baseSpeed * (this.statGrowth?.speed || 1.0)),
      accuracy: Math.floor(this.baseAccuracy * (this.statGrowth?.accuracy || 1.0)),
      evasion: Math.floor(this.baseEvasion * (this.statGrowth?.evasion || 1.0)),
      criticalRate: Math.floor(this.baseCriticalRate * (this.statGrowth?.criticalRate || 1.0))
    },
    level10Stats: {
      hp: Math.floor(this.baseHp * 10 * (this.statGrowth?.hp || 1.0)),
      attack: Math.floor(this.baseAttack * 10 * (this.statGrowth?.attack || 1.0)),
      defense: Math.floor(this.baseDefense * 10 * (this.statGrowth?.defense || 1.0)),
      speed: Math.floor(this.baseSpeed * 10 * (this.statGrowth?.speed || 1.0)),
      accuracy: Math.floor(this.baseAccuracy * 10 * (this.statGrowth?.accuracy || 1.0)),
      evasion: Math.floor(this.baseEvasion * 10 * (this.statGrowth?.evasion || 1.0)),
      criticalRate: Math.floor(this.baseCriticalRate * 10 * (this.statGrowth?.criticalRate || 1.0))
    }
  };
};

/**
 * Tính combat power theo Stat Growth System
 */
petSchema.methods.calculateCombatPower = async function(level = 1) {
  const stats = await this.calculateStats(level);
  
  // Lấy growth rates (default = 1.0 nếu không có)
  const growthRates = this.statGrowth || {
    hp: 1.0, attack: 1.0, defense: 1.0, speed: 1.0,
    accuracy: 1.0, evasion: 1.0, criticalRate: 1.0
  };
  
  // Tính tổng growth rates để normalize
  const totalGrowth = Object.values(growthRates).reduce((sum, rate) => sum + rate, 0);
  
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
  const finalCP = Math.floor(growthBasedCP * 0.7 + baselineCP * 0.3);
  
  return finalCP;
};

/**
 * Phân tích Combat Power breakdown
 */
petSchema.methods.getCombatPowerBreakdown = async function(level = 1) {
  const stats = await this.calculateStats(level);
  
  const growthRates = this.statGrowth || {
    hp: 1.0, attack: 1.0, defense: 1.0, speed: 1.0,
    accuracy: 1.0, evasion: 1.0, criticalRate: 1.0
  };
  
  // Tính contribution của từng stat
  const contributions = {
    hp: Math.floor(stats.hp * growthRates.hp),
    attack: Math.floor(stats.attack * growthRates.attack),
    defense: Math.floor(stats.defense * growthRates.defense),
    speed: Math.floor(stats.speed * growthRates.speed),
    accuracy: Math.floor(stats.accuracy * growthRates.accuracy),
    evasion: Math.floor(stats.evasion * growthRates.evasion),
    criticalRate: Math.floor(stats.criticalRate * growthRates.criticalRate)
  };
  
  const growthBasedCP = Object.values(contributions).reduce((sum, val) => sum + val, 0);
  const baselineCP = Object.values(stats).reduce((sum, val) => sum + val, 0);
  const finalCP = Math.floor(growthBasedCP * 0.7 + baselineCP * 0.3);
  
  return {
    level,
    stats,
    growthRates,
    contributions,
    growthBasedCP,
    baselineCP,
    finalCP,
    breakdown: {
      growthBased: Math.floor(growthBasedCP * 0.7),
      baseline: Math.floor(baselineCP * 0.3)
    }
  };
};

/**
 * Tính exp cần cho level
 */
petSchema.methods.calculateExpForLevel = async function(targetLevel) {
  await this.populate('rarity');
  
  const baseExp = targetLevel * 100; // Base exp formula (giảm từ 500 xuống 100)
  const expMultiplier = this.rarity?.expMultiplier || 1.0; // Rarity chỉ ảnh hưởng exp requirements
  
  return Math.floor(baseExp * expMultiplier);
};

/**
 * Kiểm tra có thể level up không
 */
petSchema.methods.canLevelUp = async function(currentLevel) {
  if (currentLevel >= this.levelCap) return false;
  
  return true;
};

/**
 * Tạo UserPet data với skill levels mặc định
 */
petSchema.methods.createUserPetData = function(userId) {
  return {
    user: userId,
    pet: this._id,
    level: 1,
    exp: 0,
    location: 'storage',
    evolutionStage: this.evolutionStage,
    _canEvolve: false,
    actualStats: {
      hp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
      criticalRate: 0
    },
    actualCombatPower: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    skillLevels: {
      normalSkill: 1,
      ultimateSkill: 1,
      passiveSkill: 1
    }
  };
};

// Pre-save middleware
petSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate statGrowth nếu có
  if (this.statGrowth) {
    const growthRates = Object.values(this.statGrowth);
    
    // Kiểm tra từng growth rate có trong range hợp lý không
    for (const [stat, rate] of Object.entries(this.statGrowth)) {
      if (rate < 0.3 || rate > 2.5) {
        console.warn(`Warning: ${stat} growth rate (${rate}) is outside recommended range [0.3, 2.5]`);
      }
    }
    
    // Kiểm tra tổng growth rates
    const totalGrowth = growthRates.reduce((sum, rate) => sum + rate, 0);
    if (totalGrowth < 4.0 || totalGrowth > 12.0) {
      console.warn(`Warning: Total growth rates (${totalGrowth}) is outside recommended range [4.0, 12.0]`);
    }
  }
  
  next();
});

// ==================== INDEXES ====================

// Index để tối ưu truy vấn
petSchema.index({ element: 1, rarity: 1 });
petSchema.index({ isActive: 1 });
petSchema.index({ isStarter: 1 });
petSchema.index({ evolutionStage: 1 });

module.exports = mongoose.model('Pet', petSchema); 