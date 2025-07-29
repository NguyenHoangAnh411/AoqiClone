const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { auth, isAdmin } = require('../utils/auth');

// ==================== PUBLIC ROUTES ====================

// Get all pets (public)
router.get('/', petController.getAllPets);

// Get starter pets (public)
router.get('/starter', petController.getStarterPets);

// Get pets by element (public)
router.get('/element/:elementId', petController.getPetsByElement);

// Get pets by rarity (public)
router.get('/rarity/:rarityId', petController.getPetsByRarity);

// Search pets (public)
router.get('/search', petController.searchPets);

// Get pet statistics (public)
router.get('/stats', petController.getPetStats);

// Get pet stat growth info (public)
router.get('/:id/stat-growth', petController.getPetStatGrowth);

// Get pet combat power breakdown (public)
router.get('/:id/combat-power', petController.getPetCombatPower);

// Get pet by ID (public) - MUST BE LAST to avoid conflicts
router.get('/:id', petController.getPetById);

// ==================== ADMIN ROUTES ====================

// Create pet (admin only)
router.post('/', petController.createPet);

// Update pet (admin only)
router.put('/:id', auth, isAdmin, petController.updatePet);

// Delete pet (admin only)
router.delete('/:id', auth, isAdmin, petController.deletePet);

// Create skill for pet (admin only)
router.post('/:petId/skills', auth, isAdmin, petController.createSkill);

// ==================== SKILL ROUTES ====================

// Update skill (admin only)
router.put('/skills/:id', auth, isAdmin, petController.updateSkill);

// Delete skill (admin only)
router.delete('/skills/:id', auth, isAdmin, petController.deleteSkill);



module.exports = router; 