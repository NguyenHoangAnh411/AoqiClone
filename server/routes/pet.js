const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { authenticateToken, requireAdmin, requireRole } = require('../utils/auth');
// ==================== PET BASE DATA ROUTES ====================
// Public routes - không cần authentication

/**
 * @route   GET /api/pets
 * @desc    Lấy danh sách tất cả pet gốc
 * @access  Public
 */
router.get('/', petController.getAllPets);

/**
 * @route   GET /api/pets/search
 * @desc    Tìm kiếm pet
 * @access  Public
 */
router.get('/search', petController.searchPets);

/**
 * @route   GET /api/pets/starters
 * @desc    Lấy danh sách starter pets
 * @access  Public
 */
router.get('/starters', petController.getStarterPets);

/**
 * @route   GET /api/pets/elements
 * @desc    Lấy danh sách elements có pet
 * @access  Public
 */
router.get('/elements', petController.getPetElements);

/**
 * @route   GET /api/pets/elements/:elementId
 * @desc    Lấy danh sách pet theo element
 * @access  Public
 */
router.get('/elements/:elementId', petController.getPetsByElement);

/**
 * @route   GET /api/pets/rarities
 * @desc    Lấy danh sách rarities có pet
 * @access  Public
 */
router.get('/rarities', petController.getPetRarities);

/**
 * @route   GET /api/pets/rarities/:rarityId
 * @desc    Lấy danh sách pet theo rarity
 * @access  Public
 */
router.get('/rarities/:rarityId', petController.getPetsByRarity);

/**
 * @route   GET /api/pets/:petId
 * @desc    Lấy chi tiết pet gốc theo ID
 * @access  Public
 */
router.get('/:petId', petController.getPetById);

/**
 * @route   GET /api/pets/:petId/evolution
 * @desc    Lấy thông tin evolution chain của pet
 * @access  Public
 */
router.get('/:petId/evolution', petController.getPetEvolution);

/**
 * @route   GET /api/pets/:petId/skills
 * @desc    Lấy thông tin skills của pet
 * @access  Public
 */
router.get('/:petId/skills', petController.getPetSkills);

/**
 * @route   GET /api/pets/:petId/stats
 * @desc    Lấy thông tin stat growth của pet
 * @access  Public
 */
router.get('/:petId/stats', petController.getPetStats);

// ==================== ADMIN ROUTES ====================
// Admin routes - cần authentication và admin role


/**
 * @route   POST /api/pets/
 * @desc    Tạo pet mới (Admin)
 * @access  Admin
 */
router.post('/', petController.createPet);

/**
 * @route   PUT /api/pets/:petId
 * @desc    Cập nhật pet (Admin)
 * @access  Admin
 */
router.put('/:petId', petController.updatePet);

/**
 * @route   DELETE /api/pets/:petId
 * @desc    Xóa pet (Admin)
 * @access  Admin
 */
router.delete('/:petId', petController.deletePet);

module.exports = router; 