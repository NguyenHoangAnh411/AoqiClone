// Level và Experience constants
const LEVEL_CONSTANTS = {
  MAX_LEVEL: 100,
  BASE_EXP_FORMULA: 100, // targetLevel * 100
  EXP_CAP: 1000000
};

// Pet constants
const PET_CONSTANTS = {
  MAX_EVOLUTION_STAGE: 3,
  MAX_AFFINITY: 100,
  MAX_BONDING_LEVEL: 10,
  
  // Base stats (default values)
  BASE_STATS: {
    HP: 1000,
    ATTACK: 100,
    DEFENSE: 50,
    SPEED: 100,
    ACCURACY: 100,
    EVASION: 10,
    CRITICAL_RATE: 5
  },
  
  // Stat Growth System
  STAT_GROWTH: {
    DEFAULT_RATE: 1.0,
    MIN_RATE: 0.3,
    MAX_RATE: 2.5,
    RECOMMENDED_TOTAL_MIN: 4.0,
    RECOMMENDED_TOTAL_MAX: 12.0
  },
  
  // Skill Levels
  SKILL_LEVELS: {
    MIN_LEVEL: 1,
    MAX_LEVEL: 10,
    DEFAULT_LEVEL: 1
  },
  
  // Team Buff
  TEAM_BUFF: {
    VALID_STATS: ['attack', 'defense', 'hp', 'speed'],
    VALID_TYPES: ['percent', 'flat'],
    VALID_REQUIREMENT_TYPES: ['element', 'species']
  }
};

// Battle constants
const BATTLE_CONSTANTS = {
  MAX_TURNS: 50,
  BASE_CRITICAL_DAMAGE: 1.5,
  BASE_DODGE_CHANCE: 0.05,
  BASE_ACCURACY: 0.95,
  MIN_DAMAGE: 1,
  MAX_DAMAGE_MULTIPLIER: 3.0
};

// Formation constants
const FORMATION_CONSTANTS = {
  MAX_PETS_IN_FORMATION: 5,
  MAX_PETS_IN_BAG: 10,
  MAX_PETS_IN_STORAGE: 50,
  
  // Formation types
  TYPES: ['pvp', 'pve', 'boss', 'arena', 'general'],
  
  // Position limits
  MIN_POSITION: 1,
  MAX_POSITION: 5,
  
  // Formation validation
  MAX_SLOTS: 5,
  MIN_SLOTS: 0
};

// Skill constants
const SKILL_CONSTANTS = {
  MAX_SKILLS_PER_PET: 3,
  SKILL_TYPES: ['normal', 'ultimate', 'passive'],
  MAX_SKILL_POWER: 1000,
  MIN_SKILL_POWER: 10
};

// Item constants
const ITEM_CONSTANTS = {
  // Item types
  TYPES: ['material', 'consumable', 'equipment', 'currency', 'quest', 'special'],
  
  // Sub-types
  SUB_TYPES: {
    MATERIAL: ['skill_material', 'evolution_material', 'crafting_material', 'enhancement_material'],
    CONSUMABLE: ['exp_item', 'heal_item', 'buff_item', 'revive_item', 'energy_item'],
    EQUIPMENT: ['weapon', 'armor', 'accessory', 'artifact'],
    CURRENCY: ['gold', 'diamond', 'fate', 'honor', 'guild_coin', 'arena_point'],
    QUEST: ['quest_item', 'collection_item', 'key_item', 'evidence_item'],
    SPECIAL: ['event_item', 'title_item', 'cosmetic_item', 'teleport_item']
  },
  
  // Stacking
  MAX_STACK: 999,
  MIN_STACK: 1,
  
  // Enhancement
  MAX_ENHANCEMENT_LEVEL: 10,
  ENHANCEMENT_SUCCESS_RATE: 100,
  ENHANCEMENT_MULTIPLIER: 0.1, // +10% mỗi level
  
  // Durability
  MAX_DURABILITY: 100,
  MIN_DURABILITY: 0,
  
  // Cooldown
  DEFAULT_COOLDOWN: 0,
  DEFAULT_GLOBAL_COOLDOWN: 0
};

// Inventory constants
const INVENTORY_CONSTANTS = {
  // Item sources
  SOURCES: ['drop', 'craft', 'quest', 'purchase', 'gift', 'event'],
  
  // Expiration
  DEFAULT_EXPIRATION: null,
  
  // Usage limits
  MAX_USAGE_PER_DAY: 10
};

// Equipment constants
const EQUIPMENT_CONSTANTS = {
  // Equipment slots
  SLOTS: ['weapon', 'armor', 'accessory1', 'accessory2', 'accessory3'],
  MAX_SLOTS_PER_PET: 5,
  
  // Enhancement
  ENHANCEMENT_MULTIPLIER: 0.1, // +10% mỗi level
  MAX_ENHANCEMENT_LEVEL: 10,
  
  // Durability
  REPAIR_AMOUNT: 100,
  MAX_DURABILITY: 100
};

// Bag constants
const BAG_CONSTANTS = {
  DEFAULT_MAX_SIZE: 20,
  MAX_BAG_SIZE: 20,
  MIN_BAG_SIZE: 1
};

// Currency constants
const CURRENCY_CONSTANTS = {
  // Starting currency
  STARTING_GOLD: 1000,
  STARTING_DIAMONDS: 50,
  STARTING_STANDARD_FATE: 0,
  STARTING_SPECIAL_FATE: 0,
  
  // Exchange rates
  GOLD_TO_DIAMOND_RATE: 1000,
  DIAMOND_TO_FATE_RATE: 1,
  
  // Limits
  MAX_GOLD: 999999999,
  MAX_DIAMONDS: 999999,
  MAX_FATE: 999999
};

// ==================== BASE ELEMENT EFFECTIVENESS (Fallback) ====================

// Base element effectiveness - Dùng làm fallback khi không có data từ database
const BASE_ELEMENT_EFFECTIVENESS = {
  fire: {
    fire: 1.0,
    water: 0.7,
    ice: 1.5,
    rock: 0.7,
    thunder: 1.0,
    wind: 1.0,
    grass: 1.5
  },
  water: {
    fire: 1.5,
    water: 1.0,
    ice: 1.0,
    rock: 1.5,
    thunder: 0.7,
    wind: 1.0,
    grass: 0.7
  },
  grass: {
    fire: 0.7,
    water: 1.5,
    ice: 1.0,
    rock: 1.5,
    thunder: 0.7,
    wind: 0.7,
    grass: 1.0
  },
  thunder: {
    fire: 1.0,
    water: 1.5,
    ice: 1.0,
    rock: 0.7,
    thunder: 1.0,
    wind: 1.5,
    grass: 0.7
  },
  ice: {
    fire: 0.7,
    water: 1.0,
    ice: 1.0,
    rock: 1.0,
    thunder: 1.0,
    wind: 1.5,
    grass: 1.5
  },
  rock: {
    fire: 1.5,
    water: 0.7,
    ice: 1.5,
    rock: 1.0,
    thunder: 1.0,
    wind: 1.5,
    grass: 0.7
  },
  wind: {
    fire: 1.0,
    water: 1.0,
    ice: 0.7,
    rock: 0.7,
    thunder: 0.7,
    wind: 1.0,
    grass: 1.5
  }
};

// ==================== BASE RARITY MULTIPLIERS (Fallback) ====================

// Base rarity multipliers - Dùng làm fallback khi không có data từ database
const BASE_RARITY_MULTIPLIERS = {
  common: {
    statMultiplier: 1.0,
    expMultiplier: 1.0,
    levelCap: 50,
    dropRate: 80
  },
  rare: {
    statMultiplier: 1.1,
    expMultiplier: 1.3,
    levelCap: 60,
    dropRate: 15
  },
  epic: {
    statMultiplier: 1.25,
    expMultiplier: 1.6,
    levelCap: 70,
    dropRate: 4
  },
  legendary: {
    statMultiplier: 1.5,
    expMultiplier: 2.0,
    levelCap: 100,
    dropRate: 1
  }
};

// ==================== GAME RULES (Static) ====================

// Combat power calculation weights
const COMBAT_POWER_WEIGHTS = {
  hp: 0.2,
  attack: 2.5,
  defense: 1.8,
  speed: 1.2,
  accuracy: 1.0,
  evasion: 1.0,
  criticalRate: 1.0
};

// Combat Power calculation constants
const COMBAT_POWER_CONSTANTS = {
  GROWTH_BASED_WEIGHT: 0.7, // 70% weight cho growth-based calculation
  BASELINE_WEIGHT: 0.3,     // 30% weight cho baseline calculation
  NORMALIZATION_FACTOR: 1.0
};

// Game economy constants
const ECONOMY_CONSTANTS = {
  BASE_GOLD_REWARD: 100,
  BASE_EXP_REWARD: 50,
  LEVEL_BONUS_MULTIPLIER: 1.1,
  RARITY_BONUS_MULTIPLIER: 1.2
};

// Time constants
const TIME_CONSTANTS = {
  DAY_IN_SECONDS: 86400,
  WEEK_IN_SECONDS: 604800,
  MONTH_IN_SECONDS: 2592000
};

// Validation constants
const VALIDATION_CONSTANTS = {
  // User validation
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50,
  MIN_PET_NAME_LENGTH: 2,
  MAX_PET_NAME_LENGTH: 30,
  
  // Profile validation
  MAX_DISPLAY_NAME_LENGTH: 30,
  MAX_BIO_LENGTH: 500,
  
  // Item validation
  MIN_ITEM_NAME_LENGTH: 1,
  MAX_ITEM_NAME_LENGTH: 50,
  MIN_ITEM_DESCRIPTION_LENGTH: 1,
  MAX_ITEM_DESCRIPTION_LENGTH: 1000,
  
  // Formation validation
  MAX_FORMATION_DESCRIPTION_LENGTH: 200
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Lấy element effectiveness multiplier (fallback function)
 * @param {string} attackerElement - Element của attacker
 * @param {string} defenderElement - Element của defender
 * @returns {number} - Multiplier value
 */
const getElementEffectiveness = (attackerElement, defenderElement) => {
  const elementData = BASE_ELEMENT_EFFECTIVENESS[attackerElement];
  if (!elementData) return 1.0;
  
  return elementData[defenderElement] || 1.0;
};

/**
 * Lấy rarity multiplier (fallback function)
 * @param {string} rarity - Rarity name
 * @param {string} statType - 'statMultiplier' | 'expMultiplier'
 * @returns {number} - Multiplier value
 */
const getRarityMultiplier = (rarity, statType = 'statMultiplier') => {
  const rarityData = BASE_RARITY_MULTIPLIERS[rarity];
  return rarityData ? rarityData[statType] : 1.0;
};

/**
 * Tính exp cần cho level (helper function)
 * @param {number} targetLevel - Level cần đạt
 * @param {number} expMultiplier - Exp multiplier từ rarity
 * @returns {number} - Exp cần thiết
 */
const calculateExpForLevel = (targetLevel, expMultiplier = 1.0) => {
  const baseExp = targetLevel * LEVEL_CONSTANTS.BASE_EXP_FORMULA;
  return Math.floor(baseExp * expMultiplier);
};

/**
 * Validate stat growth rates
 * @param {Object} statGrowth - Stat growth object
 * @returns {Object} - Validation result
 */
const validateStatGrowth = (statGrowth) => {
  const { STAT_GROWTH } = PET_CONSTANTS;
  const issues = [];
  
  // Check individual rates
  for (const [stat, rate] of Object.entries(statGrowth)) {
    if (rate < STAT_GROWTH.MIN_RATE || rate > STAT_GROWTH.MAX_RATE) {
      issues.push(`${stat} growth rate (${rate}) is outside recommended range [${STAT_GROWTH.MIN_RATE}, ${STAT_GROWTH.MAX_RATE}]`);
    }
  }
  
  // Check total growth rates
  const totalGrowth = Object.values(statGrowth).reduce((sum, rate) => sum + rate, 0);
  if (totalGrowth < STAT_GROWTH.RECOMMENDED_TOTAL_MIN || totalGrowth > STAT_GROWTH.RECOMMENDED_TOTAL_MAX) {
    issues.push(`Total growth rates (${totalGrowth}) is outside recommended range [${STAT_GROWTH.RECOMMENDED_TOTAL_MIN}, ${STAT_GROWTH.RECOMMENDED_TOTAL_MAX}]`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    totalGrowth
  };
};

module.exports = {
  // Static Constants
  LEVEL_CONSTANTS,
  PET_CONSTANTS,
  BATTLE_CONSTANTS,
  FORMATION_CONSTANTS,
  SKILL_CONSTANTS,
  ITEM_CONSTANTS,
  INVENTORY_CONSTANTS,
  EQUIPMENT_CONSTANTS,
  BAG_CONSTANTS,
  CURRENCY_CONSTANTS,
  COMBAT_POWER_WEIGHTS,
  COMBAT_POWER_CONSTANTS,
  ECONOMY_CONSTANTS,
  TIME_CONSTANTS,
  VALIDATION_CONSTANTS,
  
  // Base Data (Fallback)
  BASE_ELEMENT_EFFECTIVENESS,
  BASE_RARITY_MULTIPLIERS,
  
  // Helper Functions
  getElementEffectiveness,
  getRarityMultiplier,
  calculateExpForLevel,
  validateStatGrowth
}; 