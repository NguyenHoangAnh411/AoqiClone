const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../utils/auth');

// Inventory management
router.get('/', auth, inventoryController.getInventory);
router.post('/add', auth, inventoryController.addItem);
router.post('/remove', auth, inventoryController.removeItem);
router.put('/:inventoryId', auth, inventoryController.updateItem);

// Equipment management
router.post('/equip/:inventoryId', auth, inventoryController.equipItem);
router.post('/unequip/:inventoryId', auth, inventoryController.unequipItem);
router.get('/equipped', auth, inventoryController.getEquippedItems);

// Item usage
router.post('/use/:inventoryId', auth, inventoryController.useItem);

module.exports = router; 