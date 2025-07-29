const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['normal', 'ultimate', 'passive'], required: true }, // loại skill
  energyCost: { type: Number, default: 0 }, // chi phí năng lượng (chỉ ultimate skills)
  energyGeneration: { type: Number, default: 0 }, // năng lượng tạo ra (normal skills)
  
  // Damage Scaling - Scale damage dựa trên stats của pet
  damageScaling: {
    attack: { type: Number, default: 0 },      // Scale theo % baseAttack
    defense: { type: Number, default: 0 },     // Scale theo % baseDefense  
    speed: { type: Number, default: 0 },       // Scale theo % baseSpeed
    hp: { type: Number, default: 0 },          // Scale theo % baseHp
    accuracy: { type: Number, default: 0 },    // Scale theo % baseAccuracy
    evasion: { type: Number, default: 0 },     // Scale theo % baseEvasion
    criticalRate: { type: Number, default: 0 } // Scale theo % baseCriticalRate
  },
  
  // Skill Level System - Scaling tự động theo công thức
  levelScaling: {
    maxLevel: { type: Number, default: 10 }, // Level tối đa
    
    // Base scaling cho level 1
    baseScaling: {
      attack: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      hp: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      evasion: { type: Number, default: 0 },
      criticalRate: { type: Number, default: 0 }
    },
    
    // Phần trăm tăng cho mỗi level
    scalingIncrease: {
      attack: { type: Number, default: 0 },      // % tăng attack mỗi level
      defense: { type: Number, default: 0 },     // % tăng defense mỗi level
      speed: { type: Number, default: 0 },       // % tăng speed mỗi level
      hp: { type: Number, default: 0 },          // % tăng hp mỗi level
      accuracy: { type: Number, default: 0 },    // % tăng accuracy mỗi level
      evasion: { type: Number, default: 0 },     // % tăng evasion mỗi level
      criticalRate: { type: Number, default: 0 } // % tăng criticalRate mỗi level
    },
    
    // Yêu cầu nâng cấp (cố định cho tất cả levels)
    upgradeRequirements: {
      // Nguyên liệu cố định (luôn là hoa tử linh)
      materials: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        baseQuantity: { type: Number, default: 12 }, // Số lượng cơ bản cho level 2
        quantityScale: { type: Number, default: 4 }   // Tăng bao nhiêu mỗi level
      }],
      gold: { type: Number, default: 1000 }, // Gold cố định
      petLevel: { type: Number, default: 5 }  // Pet level cố định
    }
  },
  
  // Target và Range
  targetType: { 
    type: String, 
    enum: ['single', 'all_enemies', 'all_allies', 'self', 'random_enemy', 'random_ally'], 
    default: 'single' 
  }, // Loại mục tiêu
  range: { type: Number, default: 1 }, // Phạm vi tấn công (1 = adjacent, 2 = 2 tiles, etc.)
  
  // Defense Reduction - Giảm damage dựa trên target defense
  defenseReduction: {
    enabled: { type: Boolean, default: true }, // Có áp dụng defense reduction không
    formula: { 
      type: String, 
      enum: ['linear', 'percentage', 'diminishing'], 
      default: 'linear' 
    }, // Công thức tính defense reduction
    effectiveness: { type: Number, default: 1.0 } // Hiệu quả của defense (1.0 = 100%)
  },
  
  // Effects - Using references to Effect model
  effects: [{
    effect: { type: mongoose.Schema.Types.ObjectId, ref: 'Effect', required: true },
    value: { type: Number, default: 0 }, // Custom value override
    duration: { type: Number, default: 0 }, // Custom duration override
    chance: { type: Number, default: 100 }, // Custom chance override
    target: { 
      type: String, 
      enum: ['self', 'target', 'all_enemies', 'all_allies'], 
      default: 'target' 
    }
  }],
  
  // Conditional Effects (Hiệu ứng có điều kiện)
  conditions: {
    lowHp: { type: Number, default: 0 }, // Kích hoạt khi HP < X%
    highHp: { type: Number, default: 0 }, // Kích hoạt khi HP > X%
    lowEnergy: { type: Number, default: 0 }, // Kích hoạt khi Energy < X
    highEnergy: { type: Number, default: 0 }, // Kích hoạt khi Energy > X
    elementAdvantage: { type: Boolean, default: false }, // Kích hoạt khi có ưu thế element
    formationPosition: { type: Number, default: 0 }, // Kích hoạt ở vị trí X
    comboCount: { type: Number, default: 0 } // Kích hoạt khi combo >= X
  },
  
  // Thông tin liên kết với pet
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }, // Pet sở hữu skill này
  skillSetId: { type: String }, // ID để nhóm các skill của cùng 1 pet
  isActive: { type: Boolean, default: true },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ==================== METHODS ====================

/**
 * Tính toán scaling cho level cụ thể
 */
skillSchema.methods.calculateScalingForLevel = function(level) {
  if (!this.levelScaling || level < 1 || level > this.levelScaling.maxLevel) {
    return this.damageScaling; // Fallback về base scaling
  }
  
  const baseScaling = this.levelScaling.baseScaling;
  const scalingIncrease = this.levelScaling.scalingIncrease;
  
  // Công thức: baseScaling + (scalingIncrease * (level - 1))
  const calculatedScaling = {
    attack: baseScaling.attack + (scalingIncrease.attack * (level - 1)),
    defense: baseScaling.defense + (scalingIncrease.defense * (level - 1)),
    speed: baseScaling.speed + (scalingIncrease.speed * (level - 1)),
    hp: baseScaling.hp + (scalingIncrease.hp * (level - 1)),
    accuracy: baseScaling.accuracy + (scalingIncrease.accuracy * (level - 1)),
    evasion: baseScaling.evasion + (scalingIncrease.evasion * (level - 1)),
    criticalRate: baseScaling.criticalRate + (scalingIncrease.criticalRate * (level - 1))
  };
  
  return calculatedScaling;
};

/**
 * Lấy thông tin scaling cho tất cả levels
 */
skillSchema.methods.getAllLevelScaling = function() {
  if (!this.levelScaling) {
    return null;
  }
  
  const levels = [];
  for (let level = 1; level <= this.levelScaling.maxLevel; level++) {
    levels.push({
      level: level,
      scaling: this.calculateScalingForLevel(level),
      upgradeRequirements: this.levelScaling.upgradeRequirements
    });
  }
  
  return levels;
};

/**
 * Tính toán requirements cho level cụ thể
 */
skillSchema.methods.calculateRequirementsForLevel = function(targetLevel) {
  if (!this.levelScaling || !this.levelScaling.upgradeRequirements) {
    return null;
  }
  
  const requirements = this.levelScaling.upgradeRequirements;
  
  // Tính toán materials với scale
  const materials = requirements.materials.map(material => {
    // Công thức: baseQuantity + (quantityScale * (targetLevel - 2))
    // Level 2: baseQuantity + (quantityScale * 0) = baseQuantity
    // Level 3: baseQuantity + (quantityScale * 1) = baseQuantity + quantityScale
    // Level 4: baseQuantity + (quantityScale * 2) = baseQuantity + (quantityScale * 2)
    const quantity = material.baseQuantity + (material.quantityScale * (targetLevel - 2));
    
    return {
      itemId: material.itemId,
      quantity: Math.max(1, quantity) // Đảm bảo ít nhất là 1
    };
  });
  
  return {
    materials: materials,
    gold: requirements.gold,
    petLevel: requirements.petLevel
  };
};

/**
 * Lấy thông tin nâng cấp cho level tiếp theo
 */
skillSchema.methods.getNextLevelInfo = function(currentLevel) {
  if (!this.levelScaling || currentLevel >= this.levelScaling.maxLevel) {
    return null;
  }
  
  const nextLevel = currentLevel + 1;
  
  // Tính toán requirements cho level tiếp theo
  const requirements = this.calculateRequirementsForLevel(nextLevel);
  
  return {
    currentLevel: currentLevel,
    nextLevel: nextLevel,
    currentScaling: this.calculateScalingForLevel(currentLevel),
    nextScaling: this.calculateScalingForLevel(nextLevel),
    upgradeRequirements: requirements
  };
};

/**
 * Lấy tất cả requirements cho tất cả levels
 */
skillSchema.methods.getAllUpgradeRequirements = function() {
  if (!this.levelScaling) {
    return null;
  }
  
  const requirements = [];
  for (let level = 2; level <= this.levelScaling.maxLevel; level++) {
    requirements.push({
      level: level,
      requirements: this.calculateRequirementsForLevel(level),
      scaling: this.calculateScalingForLevel(level)
    });
  }
  
  return requirements;
};

/**
 * Kiểm tra skill có thể nâng cấp không
 */
skillSchema.methods.canUpgrade = function(currentLevel, userPetLevel, userGold, userInventory) {
  if (!this.levelScaling || currentLevel >= this.levelScaling.maxLevel) {
    return { canUpgrade: false, reason: 'Đã đạt level tối đa' };
  }
  
  const nextLevel = currentLevel + 1;
  const requirements = this.calculateRequirementsForLevel(nextLevel);
  
  if (!requirements) {
    return { canUpgrade: false, reason: 'Không tìm thấy requirements' };
  }
  
  // Kiểm tra pet level
  if (userPetLevel < requirements.petLevel) {
    return { 
      canUpgrade: false, 
      reason: `Pet cần level ${requirements.petLevel} (hiện tại: ${userPetLevel})` 
    };
  }
  
  // Kiểm tra gold
  if (userGold < requirements.gold) {
    return { 
      canUpgrade: false, 
      reason: `Cần ${requirements.gold} gold (hiện tại: ${userGold})` 
    };
  }
  
  // Kiểm tra materials
  for (const material of requirements.materials) {
    const userItem = userInventory.find(item => item.itemId.toString() === material.itemId.toString());
    if (!userItem || userItem.quantity < material.quantity) {
      return { 
        canUpgrade: false, 
        reason: `Thiếu ${material.quantity} ${material.itemId}` 
      };
    }
  }
  
  return { canUpgrade: true, requirements: requirements };
};

/**
 * Lấy tất cả effects của skill với populate
 */
skillSchema.methods.getAllEffects = async function() {
  await this.populate('effects.effect');
  return this.effects;
};

/**
 * Lấy effects theo type
 */
skillSchema.methods.getEffectsByType = async function(effectType) {
  await this.populate('effects.effect');
  return this.effects.filter(effectObj => effectObj.effect.type === effectType);
};

/**
 * Lấy effects theo category
 */
skillSchema.methods.getEffectsByCategory = async function(category) {
  await this.populate('effects.effect');
  return this.effects.filter(effectObj => effectObj.effect.category === category);
};

/**
 * Kiểm tra skill có effect nào đó không
 */
skillSchema.methods.hasEffect = async function(effectName) {
  await this.populate('effects.effect');
  return this.effects.some(effectObj => effectObj.effect.name === effectName);
};

/**
 * Kiểm tra skill có effect type nào đó không
 */
skillSchema.methods.hasEffectType = async function(effectType) {
  await this.populate('effects.effect');
  return this.effects.some(effectObj => effectObj.effect.type === effectType);
};

/**
 * Lấy effects có thể áp dụng cho target
 */
skillSchema.methods.getApplicableEffects = async function(target, attacker = null) {
  await this.populate('effects.effect');
  
  return this.effects.filter(effectObj => {
    // Kiểm tra effect có thể áp dụng không
    if (!effectObj.effect.canApplyTo(target, attacker)) {
      return false;
    }
    
    // Kiểm tra conditions của effect
    if (!effectObj.effect.checkConditions(target, attacker)) {
      return false;
    }
    
    // Kiểm tra conditions của skill (ưu tiên skill conditions)
    if (!this.checkSkillConditions(target, attacker)) {
      return false;
    }
    
    return true;
  });
};

/**
 * Kiểm tra conditions của skill
 */
skillSchema.methods.checkSkillConditions = function(target, attacker = null) {
  const conditions = this.conditions;
  
  // HP conditions
  if (conditions.lowHp > 0 && target.currentHp && target.maxHp) {
    const hpPercentage = (target.currentHp / target.maxHp) * 100;
    if (hpPercentage >= conditions.lowHp) return false;
  }
  
  if (conditions.highHp > 0 && target.currentHp && target.maxHp) {
    const hpPercentage = (target.currentHp / target.maxHp) * 100;
    if (hpPercentage <= conditions.highHp) return false;
  }
  
  // Energy conditions
  if (conditions.lowEnergy > 0 && target.energy !== undefined) {
    if (target.energy >= conditions.lowEnergy) return false;
  }
  
  if (conditions.highEnergy > 0 && target.energy !== undefined) {
    if (target.energy <= conditions.highEnergy) return false;
  }
  
  // Element advantage condition
  if (conditions.elementAdvantage && attacker && target) {
    // Cần implement logic kiểm tra element advantage
    // Tạm thời return true
  }
  
  // Formation position condition
  if (conditions.formationPosition > 0 && target.position !== undefined) {
    if (target.position !== conditions.formationPosition) return false;
  }
  
  // Combo count condition
  if (conditions.comboCount > 0 && attacker && attacker.comboCount !== undefined) {
    if (attacker.comboCount < conditions.comboCount) return false;
  }
  
  return true;
};


skillSchema.methods.calculateDamage = function(attackerElement, targetElement, attackerPet = null, skillLevel = 1, targetPet = null) {
  let damage = 0;
  
  // Calculate scaling based on skill level
  const scaling = this.calculateScalingForLevel(skillLevel);
  
  // Apply stat scaling if attacker pet is provided
  if (attackerPet && scaling) {
    // Calculate scaled damage from each stat
    if (scaling.attack > 0 && attackerPet.baseAttack) {
      damage += (attackerPet.baseAttack * scaling.attack) / 100;
    }
    
    if (scaling.defense > 0 && attackerPet.baseDefense) {
      damage += (attackerPet.baseDefense * scaling.defense) / 100;
    }
    
    if (scaling.speed > 0 && attackerPet.baseSpeed) {
      damage += (attackerPet.baseSpeed * scaling.speed) / 100;
    }
    
    if (scaling.hp > 0 && attackerPet.baseHp) {
      damage += (attackerPet.baseHp * scaling.hp) / 100;
    }
    
    if (scaling.accuracy > 0 && attackerPet.baseAccuracy) {
      damage += (attackerPet.baseAccuracy * scaling.accuracy) / 100;
    }
    
    if (scaling.evasion > 0 && attackerPet.baseEvasion) {
      damage += (attackerPet.baseEvasion * scaling.evasion) / 100;
    }
    
    if (scaling.criticalRate > 0 && attackerPet.baseCriticalRate) {
      damage += (attackerPet.baseCriticalRate * scaling.criticalRate) / 100;
    }
    
    damage = Math.floor(damage);
  }
  
  // Apply element effectiveness if both elements exist
  if (attackerElement && targetElement) {
    try {
      // Handle both string and object inputs
      let attackerElementName, targetElementName;
      
      if (typeof attackerElement === 'string') {
        attackerElementName = attackerElement;
      } else if (attackerElement && attackerElement.name) {
        attackerElementName = attackerElement.name;
      }
      
      if (typeof targetElement === 'string') {
        targetElementName = targetElement;
      } else if (targetElement && targetElement.name) {
        targetElementName = targetElement.name;
      }
      
      if (attackerElementName && targetElementName) {
        // Get effectiveness multiplier from attacker element
        const effectiveness = attackerElement.getEffectivenessMultiplier(targetElementName);
        damage = Math.floor(damage * effectiveness);
      }
    } catch (error) {
      console.error('Error calculating element effectiveness:', error);
      // Continue with base damage if calculation fails
    }
  }
  
  // Apply defense reduction if enabled and target pet is provided
  if (this.defenseReduction.enabled && targetPet && targetPet.baseDefense) {
    damage = this.applyDefenseReduction(damage, targetPet.baseDefense);
  }
  
  return Math.max(1, damage);
};

/**
 * Tính toán Critical Hit
 */
skillSchema.methods.calculateCriticalHit = function(attackerPet, targetPet = null) {
  if (!attackerPet || !attackerPet.baseCriticalRate) {
    return {
      isCritical: false,
      criticalRate: 0,
      criticalMultiplier: 1.0,
      finalDamage: 0
    };
  }
  
  // Lấy critical rate từ pet
  const criticalRate = attackerPet.baseCriticalRate;
  
  // Random số từ 1-100
  const randomRoll = Math.floor(Math.random() * 100) + 1;
  
  // Kiểm tra có crit không
  const isCritical = randomRoll <= criticalRate;
  
  // Critical multiplier (có thể thay đổi theo rarity hoặc level)
  const criticalMultiplier = isCritical ? 2.0 : 1.0;
  
  return {
    isCritical,
    criticalRate,
    randomRoll,
    criticalMultiplier,
    threshold: criticalRate
  };
};

/**
 * Tính toán damage với Critical Hit
 */
skillSchema.methods.calculateDamageWithCrit = function(attackerElement, targetElement, attackerPet = null, skillLevel = 1, targetPet = null) {
  // Tính base damage
  const baseDamage = this.calculateDamage(attackerElement, targetElement, attackerPet, skillLevel, targetPet);
  
  // Tính critical hit
  const critResult = this.calculateCriticalHit(attackerPet, targetPet);
  
  // Tính final damage
  const finalDamage = Math.floor(baseDamage * critResult.criticalMultiplier);
  
  return {
    baseDamage,
    finalDamage,
    critical: critResult,
    breakdown: {
      baseDamage,
      criticalMultiplier: critResult.criticalMultiplier,
      finalDamage
    }
  };
};


skillSchema.methods.calculateDamageBreakdown = function(attackerElement, targetElement, attackerPet = null, skillLevel = 1, targetPet = null) {
  let damage = 0;
  const breakdown = {
    statScaling: {},
    scaledDamage: 0,
    elementMultiplier: 1.0,
    finalDamage: 0
  };
  
  // Calculate scaling based on skill level
  const scaling = this.calculateScalingForLevel(skillLevel);
  
  // Apply stat scaling if attacker pet is provided
  if (attackerPet && scaling) {
    let totalScaledDamage = 0;
    
    // Calculate scaled damage from each stat
    if (scaling.attack > 0 && attackerPet.baseAttack) {
      const attackScaling = Math.floor((attackerPet.baseAttack * scaling.attack) / 100);
      breakdown.statScaling.attack = {
        baseStat: attackerPet.baseAttack,
        scalingPercent: scaling.attack,
        scaledValue: attackScaling
      };
      totalScaledDamage += attackScaling;
    }
    
    if (scaling.defense > 0 && attackerPet.baseDefense) {
      const defenseScaling = Math.floor((attackerPet.baseDefense * scaling.defense) / 100);
      breakdown.statScaling.defense = {
        baseStat: attackerPet.baseDefense,
        scalingPercent: scaling.defense,
        scaledValue: defenseScaling
      };
      totalScaledDamage += defenseScaling;
    }
    
    if (scaling.speed > 0 && attackerPet.baseSpeed) {
      const speedScaling = Math.floor((attackerPet.baseSpeed * scaling.speed) / 100);
      breakdown.statScaling.speed = {
        baseStat: attackerPet.baseSpeed,
        scalingPercent: scaling.speed,
        scaledValue: speedScaling
      };
      totalScaledDamage += speedScaling;
    }
    
    if (scaling.hp > 0 && attackerPet.baseHp) {
      const hpScaling = Math.floor((attackerPet.baseHp * scaling.hp) / 100);
      breakdown.statScaling.hp = {
        baseStat: attackerPet.baseHp,
        scalingPercent: scaling.hp,
        scaledValue: hpScaling
      };
      totalScaledDamage += hpScaling;
    }
    
    if (scaling.accuracy > 0 && attackerPet.baseAccuracy) {
      const accuracyScaling = Math.floor((attackerPet.baseAccuracy * scaling.accuracy) / 100);
      breakdown.statScaling.accuracy = {
        baseStat: attackerPet.baseAccuracy,
        scalingPercent: scaling.accuracy,
        scaledValue: accuracyScaling
      };
      totalScaledDamage += accuracyScaling;
    }
    
    if (scaling.evasion > 0 && attackerPet.baseEvasion) {
      const evasionScaling = Math.floor((attackerPet.baseEvasion * scaling.evasion) / 100);
      breakdown.statScaling.evasion = {
        baseStat: attackerPet.baseEvasion,
        scalingPercent: scaling.evasion,
        scaledValue: evasionScaling
      };
      totalScaledDamage += evasionScaling;
    }
    
    if (scaling.criticalRate > 0 && attackerPet.baseCriticalRate) {
      const criticalScaling = Math.floor((attackerPet.baseCriticalRate * scaling.criticalRate) / 100);
      breakdown.statScaling.criticalRate = {
        baseStat: attackerPet.baseCriticalRate,
        scalingPercent: scaling.criticalRate,
        scaledValue: criticalScaling
      };
      totalScaledDamage += criticalScaling;
    }
    
    breakdown.scaledDamage = totalScaledDamage;
    damage += totalScaledDamage;
  }
  
  // Apply element effectiveness if both elements exist
  if (attackerElement && targetElement) {
    try {
      // Handle both string and object inputs
      let attackerElementName, targetElementName;
      
      if (typeof attackerElement === 'string') {
        attackerElementName = attackerElement;
      } else if (attackerElement && attackerElement.name) {
        attackerElementName = attackerElement.name;
      }
      
      if (typeof targetElement === 'string') {
        targetElementName = targetElement;
      } else if (targetElement && targetElement.name) {
        targetElementName = targetElement.name;
      }
      
      if (attackerElementName && targetElementName) {
        // Get effectiveness multiplier from attacker element
        const effectiveness = attackerElement.getEffectivenessMultiplier(targetElementName);
        breakdown.elementMultiplier = effectiveness;
        damage = Math.floor(damage * effectiveness);
      }
    } catch (error) {
      console.error('Error calculating element effectiveness:', error);
      // Continue with base damage if calculation fails
    }
  }
  
  // Apply defense reduction if enabled and target pet is provided
  if (this.defenseReduction.enabled && targetPet && targetPet.baseDefense) {
    const originalDamage = damage;
    damage = this.applyDefenseReduction(damage, targetPet.baseDefense);
    
    breakdown.defenseReduction = {
      targetDefense: targetPet.baseDefense,
      formula: this.defenseReduction.formula,
      effectiveness: this.defenseReduction.effectiveness,
      damageReduced: originalDamage - damage,
      finalDamageAfterDefense: damage
    };
  }
  
  breakdown.finalDamage = Math.max(1, damage);
  
  // Add critical hit calculation
  if (attackerPet && attackerPet.baseCriticalRate) {
    const critResult = this.calculateCriticalHit(attackerPet, targetPet);
    breakdown.critical = critResult;
    
    if (critResult.isCritical) {
      breakdown.finalDamage = Math.floor(breakdown.finalDamage * critResult.criticalMultiplier);
    }
  }
  
  return breakdown;
};

/**
 * Áp dụng defense reduction
 */
skillSchema.methods.applyDefenseReduction = function(damage, targetDefense) {
  if (!this.defenseReduction.enabled) {
    return damage;
  }
  
  const effectiveness = this.defenseReduction.effectiveness;
  let reducedDamage = damage;
  
  switch (this.defenseReduction.formula) {
    case 'linear':
      // Linear reduction: damage - (defense * effectiveness)
      reducedDamage = Math.max(1, damage - (targetDefense * effectiveness));
      break;
      
    case 'percentage':
      // Percentage reduction: damage * (1 - defense/1000 * effectiveness)
      const reductionPercent = Math.min(0.8, (targetDefense / 1000) * effectiveness);
      reducedDamage = Math.floor(damage * (1 - reductionPercent));
      break;
      
    case 'diminishing':
      // Diminishing returns: damage / (1 + defense/100 * effectiveness)
      reducedDamage = Math.floor(damage / (1 + (targetDefense / 100) * effectiveness));
      break;
      
    default:
      // Default to linear
      reducedDamage = Math.max(1, damage - (targetDefense * effectiveness));
  }
  
  return Math.max(1, reducedDamage);
};

/**
 * Kiểm tra skill có thể sử dụng không
 */
skillSchema.methods.canUse = function(userPet, targetPet = null) {
  // Check if skill is active
  if (!this.isActive) return false;
  
  // Check energy cost for ultimate skills
  if (this.type === 'ultimate' && this.energyCost > 0) {
    // This would need to be implemented with energy system
    // For now, assume always available
  }
  
  return true;
};

/**
 * Lấy thông tin đầy đủ của skill
 */
skillSchema.methods.getFullInfo = async function() {
  await this.populate('effects.effect');
  
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    type: this.type,
    energyCost: this.energyCost,
    energyGeneration: this.energyGeneration,
    damageScaling: this.damageScaling,
    levelScaling: this.levelScaling,
    targetType: this.targetType,
    range: this.range,
    effects: this.effects,
    conditions: this.conditions,
    petId: this.petId,
    skillSetId: this.skillSetId,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Lấy thông tin hiển thị của skill
 */
skillSchema.methods.getDisplayInfo = async function() {
  await this.populate('effects.effect');
  
  const effectsInfo = this.effects.map(effectObj => ({
    effect: effectObj.effect.getSkillInfo(),
    value: effectObj.value,
    duration: effectObj.duration,
    chance: effectObj.chance,
    target: effectObj.target
  }));
  
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    type: this.type,
    energyCost: this.energyCost,
    energyGeneration: this.energyGeneration,
    damageScaling: this.damageScaling,
    levelScaling: this.levelScaling,
    targetType: this.targetType,
    range: this.range,
    effects: effectsInfo,
    conditions: this.conditions,
    isActive: this.isActive
  };
};

/**
 * Lấy thông tin ngắn gọn cho battle
 */
skillSchema.methods.getBattleInfo = async function() {
  await this.populate('effects.effect');
  
  return {
    _id: this._id,
    name: this.name,
    type: this.type,
    energyCost: this.energyCost,
    targetType: this.targetType,
    range: this.range,
    effects: this.effects.map(effectObj => ({
      effectId: effectObj.effect._id,
      effectName: effectObj.effect.name,
      effectType: effectObj.effect.type,
      effectCategory: effectObj.effect.category,
      value: effectObj.value,
      duration: effectObj.duration,
      chance: effectObj.chance,
      target: effectObj.target
    }))
  };
};

// Pre-save middleware
skillSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate defenseReduction if exists
  if (this.defenseReduction) {
    if (this.defenseReduction.effectiveness < 0) {
      this.defenseReduction.effectiveness = 0;
    }
    if (this.defenseReduction.effectiveness > 2) {
      this.defenseReduction.effectiveness = 2;
    }
  }
  
  // Validate levelScaling if exists
  if (this.levelScaling) {
    // Ensure maxLevel is valid
    if (this.levelScaling.maxLevel < 1) {
      this.levelScaling.maxLevel = 10;
    }
    
    // Ensure upgradeRequirements is valid
    if (this.levelScaling.upgradeRequirements) {
      const req = this.levelScaling.upgradeRequirements;
      
      // Ensure materials array exists
      if (!req.materials || !Array.isArray(req.materials)) {
        req.materials = [];
      }
      
      // Validate each material
      req.materials.forEach(material => {
        if (!material.itemId) {
          throw new Error('Material itemId is required');
        }
        if (material.baseQuantity < 1) {
          material.baseQuantity = 1;
        }
        if (material.quantityScale < 0) {
          material.quantityScale = 0;
        }
      });
      
      // Ensure gold and petLevel are valid
      if (req.gold < 0) req.gold = 0;
      if (req.petLevel < 1) req.petLevel = 1;
    }
  }
  
  next();
});

// Index để tối ưu truy vấn
skillSchema.index({ petId: 1, type: 1 });
skillSchema.index({ skillSetId: 1 });
skillSchema.index({ isActive: 1 });

module.exports = mongoose.model('Skill', skillSchema); 