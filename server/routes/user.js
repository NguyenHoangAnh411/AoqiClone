const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../utils/auth');

// User profile routes
router.get('/profile', auth, userController.getUser);
router.get('/me', auth, userController.getUserByToken); // API mới để lấy user data từ token
router.put('/profile', auth, userController.updateUser);
router.get('/profile/:userId', userController.getUserProfile);
router.get('/stats', auth, userController.getUserStats);

// Currency management
router.post('/add-coins', auth, userController.addCoins);
router.post('/add-gems', auth, userController.addGems);

module.exports = router; 