const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../utils/auth');
const { isAdmin } = require('../utils/auth');

// ===== ADMIN DASHBOARD =====
router.get('/dashboard', auth, isAdmin, adminController.getDashboard);

// ===== ADMIN PET MANAGEMENT =====
router.get('/pets', auth, isAdmin, adminController.getPets);
router.get('/pets/stats', auth, isAdmin, adminController.getPetStats);
router.post('/pets', auth, isAdmin, adminController.createPet);
router.put('/pets/:id', auth, isAdmin, adminController.updatePet);
router.delete('/pets/:id', auth, isAdmin, adminController.deletePet);
router.get('/pets/:id', auth, isAdmin, adminController.getPet);

// ===== ADMIN PET STATS MANAGEMENT =====
router.post('/pets/preview-combat-power', auth, isAdmin, adminController.previewCombatPower);

// ===== ADMIN SKILL MANAGEMENT =====
router.get('/skills', auth, isAdmin, adminController.getSkills);
router.post('/skills/skill-set', auth, isAdmin, adminController.createSkillSet);
router.put('/skills/:id', auth, isAdmin, adminController.updateSkill);
router.delete('/skills/:id', auth, isAdmin, adminController.deleteSkill);
router.delete('/skills/pet/:petId/skill-set', auth, isAdmin, adminController.deletePetSkillSet);
router.get('/skills/pet/:petId/skill-set', auth, isAdmin, adminController.getPetSkillSet);

// ===== ADMIN USER MANAGEMENT =====
router.get('/users', auth, isAdmin, adminController.getUsers);

// ===== ADMIN BATTLE MANAGEMENT =====
router.get('/battles', auth, isAdmin, adminController.getBattles);

module.exports = router; 