const express = require('express');
const router = express.Router();
const gameDataController = require('../controllers/gameDataController');
const { auth, isAdmin } = require('../utils/auth');

// ==================== ELEMENT ROUTES ====================

// Tạo element mới (Admin only)
router.post('/elements', gameDataController.createElement); // tạm thời bỏ authentication

// Lấy tất cả elements (Public)
router.get('/elements', gameDataController.getAllElements);

// Lấy element theo ID (Public)
router.get('/elements/:id', gameDataController.getElementById);

// Cập nhật element (Admin only)
router.put('/elements/:id', auth, isAdmin, gameDataController.updateElement);

// Xóa element (Admin only)
router.delete('/elements/:id', auth, isAdmin, gameDataController.deleteElement);

// Tạo nhiều elements cùng lúc (Admin only)
router.post('/elements/bulk', gameDataController.createMultipleElements); // tạm thời bỏ authentication

// ==================== RARITY ROUTES ====================

// Tạo rarity mới (Admin only)
router.post('/rarities', auth, isAdmin, gameDataController.createRarity);

// Lấy tất cả rarities (Public)
router.get('/rarities', gameDataController.getAllRarities);

// Lấy rarity theo ID (Public)
router.get('/rarities/:id', gameDataController.getRarityById);

// Cập nhật rarity (Admin only)
router.put('/rarities/:id', gameDataController.updateRarity); // tạm thời bỏ authentication

// Xóa rarity (Admin only)
router.delete('/rarities/:id', gameDataController.deleteRarity); // tạm thời bỏ authentication

// Tạo nhiều rarities cùng lúc (Admin only)
router.post('/rarities/bulk', gameDataController.createMultipleRarities); // tạm thời bỏ authentication

// Import rarities từ JSON (Admin only)
router.post('/rarities/import', gameDataController.importRaritiesFromJson); // tạm thời bỏ authentication

// ==================== EFFECT ROUTES ====================

// Tạo effect mới (Admin only)
router.post('/effects', gameDataController.createEffect); // tạm thời bỏ authentication

// Lấy tất cả effects (Public)
router.get('/effects', gameDataController.getAllEffects);

// Lấy effect theo ID (Public)
router.get('/effects/:id', gameDataController.getEffectById);

// Cập nhật effect (Admin only)
router.put('/effects/:id', gameDataController.updateEffect); // tạm thời bỏ authentication

// Xóa effect (Admin only)
router.delete('/effects/:id', gameDataController.deleteEffect); // tạm thời bỏ authentication

// Lấy effects theo type (Public)
router.get('/effects/type/:type', gameDataController.getEffectsByType);

// Lấy effects theo category (Public)
router.get('/effects/category/:category', gameDataController.getEffectsByCategory);

// Tìm kiếm effects (Public)
router.get('/effects/search', gameDataController.searchEffects);

// Lấy thống kê effects (Public)
router.get('/effects/stats', gameDataController.getEffectStats);

// Tạo nhiều effects cùng lúc (Admin only)
router.post('/effects/bulk', gameDataController.createMultipleEffects); // tạm thời bỏ authentication

// Cập nhật nhiều effects cùng lúc (Admin only)
router.put('/effects/bulk', gameDataController.updateMultipleEffects); // tạm thời bỏ authentication

// Import effects từ JSON (Admin only)
router.post('/effects/import', gameDataController.importEffectsFromJson); // tạm thời bỏ authentication

module.exports = router; 