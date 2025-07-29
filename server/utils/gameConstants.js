/**
 * Game Constants
 * Những data không thay đổi, lưu trong code để tối ưu performance
 */

// Level và Experience constants
const LEVEL_CONSTANTS = {
  MAX_LEVEL: 100,
  BASE_EXP_REQUIRED: 100,
  EXP_MULTIPLIER: 1.5,
  EXP_CAP: 1000000
};

// Pet constants
const PET_CONSTANTS = {
  MAX_EVOLUTION_STAGE: 3,
  MAX_AFFINITY: 100,
  MAX_BONDING_LEVEL: 10,
  BASE_STATS: {
    HP: 1000,
    ATTACK: 100,
    DEFENSE: 50,
    SPEED: 100,
    ACCURACY: 100,
    EVASION: 10,
    CRITICAL_RATE: 5
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
  MAX_PETS_IN_STORAGE: 50
};

// Skill constants
const SKILL_CONSTANTS = {
  MAX_SKILLS_PER_PET: 3,
  SKILL_TYPES: ['normal', 'ultimate', 'passive'],
  MAX_SKILL_POWER: 1000,
  MIN_SKILL_POWER: 10
};

// Element effectiveness multipliers
const ELEMENT_EFFECTIVENESS = {
  FIRE: {
    strong_against: ['grass', 'ice'],
    weak_against: ['water', 'rock'],
    multiplier: {
      strong: 1.5,
      weak: 0.7,
      normal: 1.0
    }
  },
  WATER: {
    strong_against: ['fire', 'rock'],
    weak_against: ['grass', 'electric'],
    multiplier: {
      strong: 1.5,
      weak: 0.7,
      normal: 1.0
    }
  },
  GRASS: {
    strong_against: ['water', 'rock'],
    weak_against: ['fire', 'ice'],
    multiplier: {
      strong: 1.5,
      weak: 0.7,
      normal: 1.0
    }
  },
  ELECTRIC: {
    strong_against: ['water', 'flying'],
    weak_against: ['grass', 'rock'],
    multiplier: {
      strong: 1.5,
      weak: 0.7,
      normal: 1.0
    }
  },
  ICE: {
    strong_against: ['grass', 'flying'],
    weak_against: ['fire', 'rock'],
    multiplier: {
      strong: 1.5,
      weak: 0.7,
      normal: 1.0
    }
  },
  ROCK: {
    strong_against: ['fire', 'ice', 'flying'],
    weak_against: ['water', 'grass'],
    multiplier: {
      strong: 1.5,
      weak: 0.7,
      normal: 1.0
    }
  },
  FLYING: {
    strong_against: ['grass'],
    weak_against: ['electric', 'rock'],
    multiplier: {
      strong: 1.5,
      weak: 0.7,
      normal: 1.0
    }
  }
};

// Rarity base multipliers (có thể override bởi database)
const RARITY_BASE_MULTIPLIERS = {
  common: {
    statMultiplier: 1.0,
    expMultiplier: 1.0,
    levelCap: 50,
    dropRate: 60
  },
  rare: {
    statMultiplier: 1.1,
    expMultiplier: 1.1,
    levelCap: 60,
    dropRate: 25
  },
  epic: {
    statMultiplier: 1.25,
    expMultiplier: 1.2,
    levelCap: 70,
    dropRate: 10
  },
  legendary: {
    statMultiplier: 1.5,
    expMultiplier: 1.3,
    levelCap: 100,
    dropRate: 5
  }
};

// Combat power calculation weights
const COMBAT_POWER_WEIGHTS = {
  hp: 0.2,
  attack: 2.5,
  defense: 1.8,
  speed: 1.2
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
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50,
  MIN_PET_NAME_LENGTH: 2,
  MAX_PET_NAME_LENGTH: 30
};

module.exports = {
  LEVEL_CONSTANTS,
  PET_CONSTANTS,
  BATTLE_CONSTANTS,
  FORMATION_CONSTANTS,
  SKILL_CONSTANTS,
  ELEMENT_EFFECTIVENESS,
  RARITY_BASE_MULTIPLIERS,
  COMBAT_POWER_WEIGHTS,
  ECONOMY_CONSTANTS,
  TIME_CONSTANTS,
  VALIDATION_CONSTANTS
}; 