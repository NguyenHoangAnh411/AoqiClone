const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken, requireAdmin, requireRole } = require('../utils/auth');

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/users/search
 * Tìm kiếm user (public)
 */
router.get('/search', UserController.searchUsers);

/**
 * GET /api/users/leaderboard
 * Lấy bảng xếp hạng (public)
 */
router.get('/leaderboard', UserController.getLeaderboard);

// ==================== AUTHENTICATED ROUTES ====================

/**
 * GET /api/users/profile
 * Lấy thông tin profile của user hiện tại
 */
router.get('/profile', authenticateToken, UserController.getProfile);

/**
 * PUT /api/users/profile
 * Cập nhật profile của user
 */
router.put('/profile', authenticateToken, UserController.updateProfile);

/**
 * PUT /api/users/avatar
 * Cập nhật avatar
 */
router.put('/avatar', authenticateToken, UserController.updateAvatar);

/**
 * GET /api/users/statistics
 * Lấy thống kê user
 */
router.get('/statistics', authenticateToken, UserController.getUserStatistics);

/**
 * DELETE /api/users/account
 * Xóa tài khoản
 */
router.delete('/account', authenticateToken, UserController.deleteAccount);

// ==================== USERSTATS ROUTES ====================

/**
 * GET /api/users/stats
 * Lấy UserStats của user hiện tại
 */
router.get('/stats', authenticateToken, UserController.getUserStats);

/**
 * POST /api/users/stats/currency/add
 * Thêm currency cho user
 */
router.post('/stats/currency/add', authenticateToken, UserController.addCurrency);

/**
 * POST /api/users/stats/currency/deduct
 * Trừ currency của user
 */
router.post('/stats/currency/deduct', authenticateToken, UserController.deductCurrency);

/**
 * PUT /api/users/stats
 * Cập nhật UserStats
 */
router.put('/stats', authenticateToken, UserController.updateUserStats);

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/users/admin/list
 * Lấy danh sách tất cả user (admin)
 */
router.get('/admin/list', requireAdmin, UserController.getAllUsers);

/**
 * PUT /api/users/admin/:userId
 * Cập nhật user (admin)
 */
router.put('/admin/:userId', requireAdmin, UserController.updateUser);

/**
 * DELETE /api/users/admin/:userId
 * Xóa user (admin)
 */
router.delete('/admin/:userId', requireAdmin, UserController.deleteUser);

/**
 * POST /api/users/admin/ban
 * Cấm user (admin)
 */
router.post('/admin/ban/:userId', requireAdmin, UserController.banUser);

/**
 * POST /api/users/admin/unban
 * Bỏ cấm user (admin)
 */
router.post('/admin/unban/:userId', requireAdmin, UserController.unbanUser);

/**
 * GET /api/users/:userId
 * Lấy thông tin user khác (public) - Đặt cuối cùng để tránh conflict
 */
router.get('/:userId', UserController.getUserById);

module.exports = router; 