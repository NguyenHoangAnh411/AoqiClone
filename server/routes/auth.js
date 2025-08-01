const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../utils/auth');

// ==================== REGISTRATION & LOGIN ====================

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới
 */
router.post('/register', AuthController.register);

/**
 * POST /api/auth/login
 * Đăng nhập
 */
router.post('/login', AuthController.login);

/**
 * POST /api/auth/logout
 * Đăng xuất
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * POST /api/auth/refresh
 * Làm mới token
 */
router.post('/refresh', authenticateToken, AuthController.refreshToken);

/**
 * GET /api/auth/profile
 * Lấy thông tin profile của user hiện tại
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * PUT /api/auth/profile
 * Cập nhật profile của user hiện tại
 */
router.put('/profile', authenticateToken, AuthController.updateProfile);

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu
 */
router.post('/change-password', authenticateToken, AuthController.changePassword);

/**
 * POST /api/auth/forgot-password
 * Quên mật khẩu - gửi email reset
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Đặt lại mật khẩu với token
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * GET /api/auth/verify-email
 * Xác thực email
 */
router.get('/verify-email', AuthController.verifyEmail);

/**
 * POST /api/auth/resend-verification
 * Gửi lại email xác thực
 */
router.post('/resend-verification', AuthController.resendVerification);

module.exports = router; 