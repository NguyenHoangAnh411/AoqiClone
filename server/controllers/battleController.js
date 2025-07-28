const Battle = require('../utils/battleEngine');
const Pet = require('../models/Pet');
const UserPet = require('../models/UserPet');
const Skill = require('../models/Skill');
const User = require('../models/User');
const { 
  sendErrorResponse, 
  sendSuccessResponse, 
  validateRequiredFields,
  createFakeUserPet,
  singleUserPetPopulateOptions
} = require('../utils/controllerUtils');

// Active battles storage (in production, use Redis)
const activeBattles = new Map();

// Start a new battle
const startBattle = async (req, res) => {
  try {
    const { playerPets, enemyPets, battleType = 'pvp' } = req.body;
    const userId = req.user.id;

    // Validate input
    const validation = validateRequiredFields(req.body, ['playerPets', 'enemyPets']);
    if (!validation.isValid) {
      return sendErrorResponse(res, 400, validation.error);
    }

    if (playerPets.length === 0 || enemyPets.length === 0) {
      return sendErrorResponse(res, 400, 'Invalid battle setup');
    }

    // Load player pets with skills
    const playerPetsData = await Promise.all(
      playerPets.map(async (petData) => {
        const pet = await Pet.findById(petData.petId);
        const userPet = await UserPet.findOne({ user: userId, pet: petData.petId });
        const skills = await Skill.find({ petId: petData.petId, isActive: true });
        
        if (!pet || !userPet) {
          throw new Error(`Pet not found: ${petData.petId}`);
        }

        return { pet, userPet, skills };
      })
    );

    // Load enemy pets with skills
    const enemyPetsData = await Promise.all(
      enemyPets.map(async (petData) => {
        const pet = await Pet.findById(petData.petId);
        const skills = await Skill.find({ petId: petData.petId, isActive: true });
        
        if (!pet) {
          throw new Error(`Enemy pet not found: ${petData.petId}`);
        }

        // Tạo fake UserPet cho AI opponents
        const fakeUserPet = createFakeUserPet(petData);

        return { pet, userPet: fakeUserPet, skills };
      })
    );

    // Create battle instance
    const battle = new Battle(playerPetsData, enemyPetsData, battleType);
    const battleState = battle.initialize();

    // Store battle
    activeBattles.set(battle.battleId, battle);

    sendSuccessResponse(res, 200, {
      battleId: battle.battleId,
      battleState: battleState
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to start battle', error);
  }
};

// Get battle state
const getBattleState = async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return sendErrorResponse(res, 404, 'Battle not found');
    }

    sendSuccessResponse(res, 200, {
      battleState: battle.getBattleState()
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to get battle state', error);
  }
};

// Select action for a participant
const selectAction = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { participantId, action, targetId } = req.body;

    const battle = activeBattles.get(battleId);
    if (!battle) {
      return sendErrorResponse(res, 404, 'Battle not found');
    }

    const result = battle.selectAction(participantId, action, targetId);
    
    sendSuccessResponse(res, 200, { result });
  } catch (error) {
    sendErrorResponse(res, 400, 'Failed to select action', error);
  }
};

// Execute action
const executeAction = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { participantId } = req.body;

    const battle = activeBattles.get(battleId);
    if (!battle) {
      return sendErrorResponse(res, 404, 'Battle not found');
    }

    const result = battle.executeAction(participantId);
    
    sendSuccessResponse(res, 200, { result });
  } catch (error) {
    sendErrorResponse(res, 400, 'Failed to execute action', error);
  }
};

// Execute AI turn
const executeAITurn = async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return sendErrorResponse(res, 404, 'Battle not found');
    }

    // Get AI participants
    const aiParticipants = battle.getParticipants().filter(p => p.type === 'ai');
    
    const results = [];
    for (const aiParticipant of aiParticipants) {
      const action = generateAIAction(battle, aiParticipant);
      const result = battle.executeAction(aiParticipant.id, action);
      results.push(result);
    }

    sendSuccessResponse(res, 200, { results });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to execute AI turn', error);
  }
};

// Generate AI action
const generateAIAction = (battle, aiParticipant) => {
  // Simple AI logic - can be enhanced
  const availableActions = ['attack', 'skill'];
  const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
  
  return {
    type: randomAction,
    targetId: battle.getRandomTarget(aiParticipant.id)
  };
};

// End battle
const endBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return sendErrorResponse(res, 404, 'Battle not found');
    }

    const result = battle.endBattle();
    activeBattles.delete(battleId);

    sendSuccessResponse(res, 200, { result });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to end battle', error);
  }
};

// Get battle history
const getBattleHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // This would typically query a BattleHistory model
    // For now, return empty array
    const battles = [];
    const total = 0;

    sendSuccessResponse(res, 200, {
      battles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to get battle history', error);
  }
};

// Get active battles
const getActiveBattles = async (req, res) => {
  try {
    const userId = req.user.id;
    const userBattles = [];

    // Find battles where user is a participant
    for (const [battleId, battle] of activeBattles) {
      const participants = battle.getParticipants();
      const userParticipant = participants.find(p => p.userId === userId);
      
      if (userParticipant) {
        userBattles.push({
          battleId,
          battleState: battle.getBattleState(),
          participant: userParticipant
        });
      }
    }

    sendSuccessResponse(res, 200, { battles: userBattles });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to get active battles', error);
  }
};

module.exports = {
  startBattle,
  getBattleState,
  selectAction,
  executeAction,
  executeAITurn,
  endBattle,
  getBattleHistory,
  getActiveBattles
}; 