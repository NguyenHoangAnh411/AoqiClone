const express = require('express');
const router = express.Router();
const GameDataController = require('../controllers/gameDataController');

// ==================== ELEMENTS ====================

/**
 * GET /api/gamedata/elements
 * Lấy danh sách tất cả elements
 */
router.get('/elements', GameDataController.getElements);

/**
 * GET /api/gamedata/elements/:elementId
 * Lấy chi tiết element theo ID
 */
router.get('/elements/:elementId', GameDataController.getElementById);

/**
 * GET /api/gamedata/elements/:element1Id/effectiveness/:element2Id
 * Lấy thông tin element effectiveness giữa 2 elements
 */
router.get('/elements/:element1Id/effectiveness/:element2Id', GameDataController.getElementEffectivenessBetween);

// ==================== RARITIES ====================

/**
 * GET /api/gamedata/rarities
 * Lấy danh sách tất cả rarities
 */
router.get('/rarities', GameDataController.getRarities);

/**
 * GET /api/gamedata/rarities/:rarityId
 * Lấy chi tiết rarity theo ID
 */
router.get('/rarities/:rarityId', GameDataController.getRarityById);

// ==================== SKILLS ====================

/**
 * GET /api/gamedata/skills
 * Lấy danh sách skills
 */
router.get('/skills', GameDataController.getSkills);

/**
 * GET /api/gamedata/skills/:skillId
 * Lấy chi tiết skill theo ID
 */
router.get('/skills/:skillId', GameDataController.getSkillById);

/**
 * GET /api/gamedata/skill-types
 * Lấy danh sách skill types
 */
router.get('/skill-types', GameDataController.getSkillTypes);

// ==================== EFFECTS ====================

/**
 * GET /api/gamedata/effects
 * Lấy danh sách effects
 */
router.get('/effects', GameDataController.getEffects);

/**
 * GET /api/gamedata/effects/:effectId
 * Lấy chi tiết effect theo ID
 */
router.get('/effects/:effectId', GameDataController.getEffectById);

/**
 * GET /api/gamedata/effect-types
 * Lấy danh sách effect types
 */
router.get('/effect-types', GameDataController.getEffectTypes);

/**
 * GET /api/gamedata/effect-categories
 * Lấy danh sách effect categories
 */
router.get('/effect-categories', GameDataController.getEffectCategories);

// ==================== CONSTANTS ====================

/**
 * GET /api/gamedata/constants
 * Lấy tất cả game constants
 */
router.get('/constants', GameDataController.getGameConstants);

/**
 * GET /api/gamedata/element-effectiveness
 * Lấy element effectiveness matrix
 */
router.get('/element-effectiveness', GameDataController.getElementEffectiveness);

// ==================== ALL GAME DATA ====================

/**
 * GET /api/gamedata/all
 * Lấy tất cả dữ liệu game cơ bản (elements, rarities, constants)
 */
router.get('/all', GameDataController.getAllGameData);

module.exports = router; 