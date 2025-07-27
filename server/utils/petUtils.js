/**
 * Utility functions cho Pet system - Tính toán động giống Aoqi Legend
 */

// Hệ số nhân theo rarity (phẩm chất) - giống Aoqi Legend
const RARITY_MULTIPLIERS = {
  common: 1.0,
  rare: 1.5,
  epic: 2.2,
  legendary: 3.0
};

// Hệ số nhân theo element (thuộc tính) - hệ thống mới của bạn
const ELEMENT_MULTIPLIERS = {
  water: 1.0,   // Thủy - cân bằng, phòng thủ tốt
  fire: 1.15,   // Hỏa - tấn công cao, tốc độ nhanh
  ice: 1.1,     // Băng - phòng thủ cao, chậm
  thunder: 1.2, // Lôi - tấn công rất cao, tốc độ cao
  rock: 1.25,   // Nham - phòng thủ rất cao, chậm
  wind: 1.05,   // Phong - tốc độ rất cao, tấn công thấp
  grass: 1.08   // Thảo - cân bằng, hồi phục tốt
};

// Hệ số nhân exp theo rarity (phẩm chất) - pet hiếm cần nhiều exp hơn
const RARITY_EXP_MULTIPLIERS = {
  common: 1.0,      // 100% exp - bình thường
  rare: 1.3,        // 130% exp - hiếm hơn
  epic: 1.6,        // 160% exp - hiếm
  legendary: 2.0    // 200% exp - rất hiếm
};

// Công thức tính lực chiến động giống Aoqi Legend
const calculateCombatPower = (hp, attack, defense, speed, rarity = 'common', element = 'water') => {
  // Công thức cơ bản - trọng số khác nhau cho từng thuộc tính
  let baseCombatPower;
  
  switch(element) {
    case 'fire':
      // Hỏa: trọng tấn công và tốc độ
      baseCombatPower = (hp * 0.15) + (attack * 3.0) + (defense * 1.2) + (speed * 1.8);
      break;
    case 'ice':
      // Băng: trọng phòng thủ và HP
      baseCombatPower = (hp * 0.3) + (attack * 1.5) + (defense * 2.5) + (speed * 0.8);
      break;
    case 'thunder':
      // Lôi: trọng tấn công và tốc độ
      baseCombatPower = (hp * 0.1) + (attack * 3.2) + (defense * 1.0) + (speed * 2.0);
      break;
    case 'rock':
      // Nham: trọng phòng thủ và HP
      baseCombatPower = (hp * 0.35) + (attack * 1.2) + (defense * 3.0) + (speed * 0.6);
      break;
    case 'wind':
      // Phong: trọng tốc độ và tấn công
      baseCombatPower = (hp * 0.08) + (attack * 2.0) + (defense * 0.8) + (speed * 2.5);
      break;
    case 'grass':
      // Thảo: cân bằng
      baseCombatPower = (hp * 0.25) + (attack * 2.2) + (defense * 1.8) + (speed * 1.2);
      break;
    default: // water
      // Thủy: cân bằng
      baseCombatPower = (hp * 0.2) + (attack * 2.5) + (defense * 1.8) + (speed * 1.2);
  }
  
  // KHÔNG áp dụng multiplier nữa vì đã được áp dụng trong calculateStats
  return Math.floor(baseCombatPower);
};

// Tính chỉ số thực tế dựa trên base stats và level (cải tiến)
const calculateStats = (baseStats, level, rarity = 'common', element = 'water') => {
  // Hệ số tăng trưởng theo level (không tuyến tính) - giống Aoqi Legend
  const levelMultiplier = 1 + Math.pow(level - 1, 0.8) * 0.15; // Tăng chậm hơn ở level cao
  
  // Hệ số nhân theo rarity
  const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1.0;
  const elementMultiplier = ELEMENT_MULTIPLIERS[element] || 1.0;
  
  const baseMultiplier = levelMultiplier * rarityMultiplier * elementMultiplier;
  
  return {
    hp: Math.floor(baseStats.baseHp * baseMultiplier),
    attack: Math.floor(baseStats.baseAttack * baseMultiplier),
    defense: Math.floor(baseStats.baseDefense * baseMultiplier),
    speed: Math.floor(baseStats.baseSpeed * baseMultiplier),
    accuracy: Math.floor((baseStats.baseAccuracy || 100) * baseMultiplier),
    evasion: Math.floor((baseStats.baseEvasion || 10) * baseMultiplier),
    criticalRate: Math.floor((baseStats.baseCriticalRate || 5) * baseMultiplier)
  };
};

// Tính lực chiến thực tế - hoàn toàn động
const calculateActualCombatPower = (baseStats, level, rarity = 'common', element = 'water') => {
  const stats = calculateStats(baseStats, level, rarity, element);
  return calculateCombatPower(stats.hp, stats.attack, stats.defense, stats.speed, rarity, element);
};

// Tính lực chiến căn bản (level 1) - giống Aoqi Legend
const calculateBaseCombatPower = (baseStats, rarity = 'common', element = 'water') => {
  return calculateActualCombatPower(baseStats, 1, rarity, element);
};

// Cập nhật chỉ số cho UserPet dựa trên level
const updateUserPetStats = async (userPet, petTemplate) => {
  const stats = calculateStats(petTemplate, userPet.level, petTemplate.rarity, petTemplate.element);
  
  return {
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    accuracy: stats.accuracy,
    evasion: stats.evasion,
    criticalRate: stats.criticalRate
  };
};

// Kiểm tra xem có thể level up không
const canLevelUp = (currentLevel, currentExp, rarity = 'common') => {
  if (currentLevel >= 100) return false;
  
  // Công thức exp cần để level up (tăng theo cấp số nhân) - giống Aoqi Legend
  const expNeeded = getExpNeededForNextLevel(currentLevel, rarity);
  return currentExp >= expNeeded;
};

// Tính exp cần để level up
const getExpNeededForNextLevel = (currentLevel, rarity = 'common') => {
  if (currentLevel >= 100) return 0;
  const rarityMultiplier = RARITY_EXP_MULTIPLIERS[rarity] || 1.0;
  return Math.floor(currentLevel * 100 * Math.pow(1.1, currentLevel - 1) * rarityMultiplier);
};

// Tính điểm mạnh yếu của pet (để so sánh) - giống Aoqi Legend
const calculatePetRating = (pet) => {
  const totalStats = pet.hp + pet.attack + pet.defense + pet.speed;
  const avgStats = totalStats / 4;
  
  // Đánh giá dựa trên độ cân bằng và tổng chỉ số
  let rating = 0;
  
  // Điểm cho tổng chỉ số (0-50 điểm)
  rating += Math.min(Math.floor(totalStats / 1000) * 10, 50);
  
  // Điểm cho độ cân bằng (0-50 điểm) - chênh lệch ít = tốt
  const maxStat = Math.max(pet.hp, pet.attack, pet.defense, pet.speed);
  const minStat = Math.min(pet.hp, pet.attack, pet.defense, pet.speed);
  const balance = (maxStat - minStat) / avgStats;
  
  // Công thức mới: balance càng thấp thì điểm càng cao
  const balanceScore = Math.max(0, 50 - Math.floor(balance * 25));
  rating += balanceScore;
  
  return Math.min(Math.max(rating, 0), 100); // Đảm bảo từ 0-100 điểm
};

// Tính class của pet dựa trên lực chiến - giống Aoqi Legend
const getPetClass = (combatPower) => {
  if (combatPower >= 10000) return 'LEGENDARY';
  if (combatPower >= 7000) return 'EPIC';
  if (combatPower >= 4000) return 'RARE';
  if (combatPower >= 2000) return 'UNCOMMON';
  return 'COMMON';
};

// Tính hiệu quả tương khắc thuộc tính (bonus damage)
const getElementalEffectiveness = (attackerElement, defenderElement) => {
  const effectiveness = {
    // Thủy > Hỏa > Băng > Thủy
    water: { fire: 1.5, ice: 0.7, thunder: 1.0, rock: 1.0, wind: 1.0, grass: 1.0 },
    fire: { water: 0.7, ice: 1.5, thunder: 1.0, rock: 1.0, wind: 1.0, grass: 1.5 },
    ice: { water: 1.5, fire: 0.7, thunder: 1.0, rock: 1.0, wind: 1.0, grass: 1.0 },
    // Lôi > Thủy, Phong > Thảo
    thunder: { water: 1.5, fire: 1.0, ice: 1.0, rock: 0.7, wind: 1.0, grass: 1.0 },
    rock: { water: 1.0, fire: 1.0, ice: 1.0, thunder: 1.5, wind: 0.7, grass: 0.7 },
    wind: { water: 1.0, fire: 1.0, ice: 1.0, thunder: 1.0, rock: 1.5, grass: 1.5 },
    grass: { water: 1.0, fire: 0.7, ice: 1.0, thunder: 1.0, rock: 1.5, wind: 0.7 }
  };
  
  return effectiveness[attackerElement]?.[defenderElement] || 1.0;
};

module.exports = {
  calculateCombatPower,
  calculateStats,
  calculateActualCombatPower,
  calculateBaseCombatPower,
  updateUserPetStats,
  canLevelUp,
  getExpNeededForNextLevel,
  calculatePetRating,
  getPetClass,
  getElementalEffectiveness,
  RARITY_MULTIPLIERS,
  ELEMENT_MULTIPLIERS,
  RARITY_EXP_MULTIPLIERS
}; 