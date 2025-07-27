const express = require('express');
const router = express.Router();
const formationController = require('../controllers/formationController');
const auth = require('../utils/auth');

// ===== FORMATION ROUTES (Authenticated users) =====
router.get('/', auth, formationController.getUserFormations);
router.get('/:id', auth, formationController.getFormation);
router.post('/', auth, formationController.createFormation);
router.put('/:id', auth, formationController.updateFormation);
router.delete('/:id', auth, formationController.deleteFormation);

// ===== FORMATION MANAGEMENT ROUTES =====
router.post('/:id/set-active', auth, formationController.setActiveFormation);
router.post('/:id/add-pet', auth, formationController.addPetToFormation);
router.delete('/:formationId/remove-pet/:position', auth, formationController.removePetFromFormation);
router.post('/:id/move-pet', auth, formationController.movePetInFormation);
router.get('/:id/available-pets', auth, formationController.getAvailablePets);
router.post('/recalculate-combat-power', auth, formationController.recalculateAllFormations);

module.exports = router; 