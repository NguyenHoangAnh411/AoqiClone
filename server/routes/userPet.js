const express = require('express');
const router = express.Router();
const userPetController = require('../controllers/userPetController');
const { authenticateToken, requireAdmin, requireRole } = require('../utils/auth');

// ==================== PRIVATE ROUTES ====================
// Tất cả routes đều cần authentication

/**
 * @route   GET /api/userpets
 * @desc    Lấy danh sách pets của user
 * @access  Private
 */
router.get('/', authenticateToken, userPetController.getUserPets);

/**
 * @route   GET /api/userpets/:userPetId
 * @desc    Lấy chi tiết pet của user
 * @access  Private
 */
router.get('/:userPetId', authenticateToken, userPetController.getUserPetDetail);

/**
 * @route   POST /api/userpets
 * @desc    Tạo pet mới cho user (từ pet template)
 * @access  Private
 */
router.post('/', authenticateToken, userPetController.createUserPet);

/**
 * @route   PUT /api/userpets/:userPetId/move
 * @desc    Di chuyển pet giữa bag và storage
 * @access  Private
 */
router.put('/:userPetId/move', authenticateToken, userPetController.moveUserPet);

/**
 * @route   POST /api/userpets/:userPetId/levelup
 * @desc    Level up pet
 * @access  Private
 */
router.post('/:userPetId/levelup', authenticateToken, userPetController.levelUpUserPet);

/**
 * @route   POST /api/userpets/:userPetId/evolve
 * @desc    Evolve pet
 * @access  Private
 */
router.post('/:userPetId/evolve', authenticateToken, userPetController.evolveUserPet);

/**
 * @route   GET /api/userpets/:userPetId/skills
 * @desc    Lấy thông tin skills của pet
 * @access  Private
 */
router.get('/:userPetId/skills', authenticateToken, userPetController.getUserPetSkills);

/**
 * @route   POST /api/userpets/:userPetId/skills/:skillType/upgrade
 * @desc    Nâng cấp skill của pet
 * @access  Private
 */
router.post('/:userPetId/skills/:skillType/upgrade', authenticateToken, userPetController.upgradeUserPetSkill);

/**
 * @route   GET /api/userpets/:userPetId/equipment
 * @desc    Lấy thông tin equipment của pet
 * @access  Private
 */
router.get('/:userPetId/equipment', authenticateToken, userPetController.getUserPetEquipment);

/**
 * @route   POST /api/userpets/:userPetId/equipment/equip
 * @desc    Trang bị item cho pet
 * @access  Private
 */
router.post('/:userPetId/equipment/equip', authenticateToken, userPetController.equipItemToUserPet);

/**
 * @route   POST /api/userpets/:userPetId/equipment/unequip
 * @desc    Tháo equipment khỏi pet
 * @access  Private
 */
router.post('/:userPetId/equipment/unequip', authenticateToken, userPetController.unequipItemFromUserPet);

module.exports = router; 