// Skill Effects Utility Functions

// Status Effect Icons
const STATUS_ICONS = {
  stun: '💫',
  poison: '☠️',
  burn: '🔥',
  freeze: '❄️',
  paralyze: '⚡',
  sleep: '😴',
  confusion: '💫'
};

// Buff/Debuff Icons
const STAT_ICONS = {
  attack: '⚔️',
  defense: '🛡️',
  speed: '⚡',
  accuracy: '🎯',
  evasion: '👻',
  criticalRate: '💥'
};

// Special Effect Icons
const SPECIAL_ICONS = {
  heal: '💚',
  drain: '🩸',
  reflect: '🪞',
  counter: '↩️',
  priority: '⚡',
  multiHit: '🎯',
  recoil: '💥'
};

// Format skill effects for display
const formatSkillEffects = (effects) => {
  if (!effects) return null;

  const formatted = {
    status: [],
    buff: [],
    debuff: [],
    special: [],
    duration: {}
  };

  // Status Effects
  if (effects.status) {
    Object.entries(effects.status).forEach(([effect, active]) => {
      if (active) {
        formatted.status.push({
          name: effect,
          icon: STATUS_ICONS[effect],
          label: getStatusLabel(effect)
        });
      }
    });
  }

  // Buff Effects
  if (effects.buff) {
    Object.entries(effects.buff).forEach(([stat, level]) => {
      if (level > 0) {
        formatted.buff.push({
          name: stat,
          icon: STAT_ICONS[stat],
          level: level,
          label: getStatLabel(stat)
        });
      }
    });
  }

  // Debuff Effects
  if (effects.debuff) {
    Object.entries(effects.debuff).forEach(([stat, level]) => {
      if (level > 0) {
        formatted.debuff.push({
          name: stat,
          icon: STAT_ICONS[stat],
          level: level,
          label: getStatLabel(stat)
        });
      }
    });
  }

  // Special Effects
  if (effects.special) {
    Object.entries(effects.special).forEach(([effect, value]) => {
      if (value && value !== 0) {
        formatted.special.push({
          name: effect,
          icon: SPECIAL_ICONS[effect],
          value: value,
          label: getSpecialLabel(effect, value)
        });
      }
    });
  }

  // Duration
  if (effects.duration) {
    formatted.duration = effects.duration;
  }

  return formatted;
};

// Get status effect labels
const getStatusLabel = (status) => {
  const labels = {
    stun: 'Làm choáng',
    poison: 'Gây độc',
    burn: 'Gây cháy',
    freeze: 'Đóng băng',
    paralyze: 'Làm tê liệt',
    sleep: 'Làm ngủ',
    confusion: 'Làm lẫn lộn'
  };
  return labels[status] || status;
};

// Get stat labels
const getStatLabel = (stat) => {
  const labels = {
    attack: 'Tấn công',
    defense: 'Phòng thủ',
    speed: 'Tốc độ',
    accuracy: 'Độ chính xác',
    evasion: 'Né tránh',
    criticalRate: 'Chí mạng'
  };
  return labels[stat] || stat;
};

// Get special effect labels
const getSpecialLabel = (effect, value) => {
  const labels = {
    heal: `Hồi ${value}% HP`,
    drain: `Hút ${value}% damage`,
    reflect: 'Phản đòn',
    counter: 'Phản công',
    priority: `Độ ưu tiên ${value > 0 ? '+' : ''}${value}`,
    multiHit: `Đánh ${value} lần`,
    recoil: `Phản lại ${value}% damage`
  };
  return labels[effect] || effect;
};

// Calculate effect success rate
const calculateEffectChance = (baseChance, targetResistance, userAccuracy) => {
  const accuracy = userAccuracy || 100;
  const resistance = targetResistance || 0;
  return Math.max(0, Math.min(100, baseChance * (accuracy / 100) * (1 - resistance / 100)));
};

// Apply status effect
const applyStatusEffect = (target, status, duration) => {
  if (!target.statusEffects) target.statusEffects = {};
  
  target.statusEffects[status] = {
    active: true,
    duration: duration,
    remainingTurns: duration
  };
};

// Apply buff/debuff
const applyStatModifier = (target, stat, level, isBuff = true) => {
  if (!target.statModifiers) target.statModifiers = {};
  
  const modifier = isBuff ? 'buff' : 'debuff';
  if (!target.statModifiers[modifier]) target.statModifiers[modifier] = {};
  
  target.statModifiers[modifier][stat] = level;
};

// Remove expired effects
const removeExpiredEffects = (pet) => {
  if (pet.statusEffects) {
    Object.keys(pet.statusEffects).forEach(status => {
      if (pet.statusEffects[status].remainingTurns <= 0) {
        delete pet.statusEffects[status];
      }
    });
  }
};

module.exports = {
  formatSkillEffects,
  calculateEffectChance,
  applyStatusEffect,
  applyStatModifier,
  removeExpiredEffects,
  STATUS_ICONS,
  STAT_ICONS,
  SPECIAL_ICONS
}; 