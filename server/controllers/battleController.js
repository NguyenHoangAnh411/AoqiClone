const Battle = require('../utils/battleEngine');
const Pet = require('../models/Pet');
const UserPet = require('../models/UserPet');
const Skill = require('../models/Skill');
const User = require('../models/User');

// Active battles storage (in production, use Redis)
const activeBattles = new Map();

// Start a new battle
const startBattle = async (req, res) => {
  try {
    const { playerPets, enemyPets, battleType = 'pvp' } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!playerPets || !enemyPets || playerPets.length === 0 || enemyPets.length === 0) {
      return res.status(400).json({ message: 'Invalid battle setup' });
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
        const fakeUserPet = {
          user: petData.userId || 'ai',
          pet: petData.petId,
          level: Math.floor(Math.random() * 50) + 20, // Level 20-70
          exp: 0,
          hp: 1000,
          attack: 100,
          defense: 50,
          speed: 100,
          accuracy: 100,
          evasion: 10,
          criticalRate: 5,
          isActive: false,
          createdAt: new Date()
        };

        return { pet, userPet: fakeUserPet, skills };
      })
    );

    // Create battle instance
    const battle = new Battle(playerPetsData, enemyPetsData, battleType);
    const battleState = battle.initialize();

    // Store battle
    activeBattles.set(battle.battleId, battle);

    res.json({
      success: true,
      battleId: battle.battleId,
      battleState: battleState
    });

  } catch (error) {
    console.error('Start battle error:', error);
    res.status(500).json({ message: 'Failed to start battle', error: error.message });
  }
};

// Get battle state
const getBattleState = async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    res.json({
      success: true,
      battleState: battle.getBattleState()
    });

  } catch (error) {
    console.error('Get battle state error:', error);
    res.status(500).json({ message: 'Failed to get battle state', error: error.message });
  }
};

// Select action for current turn
const selectAction = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { actionType, skillId, targetIndex } = req.body;
    const userId = req.user.id;

    const battle = activeBattles.get(battleId);
    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    // Validate that it's the user's turn
    const currentParticipant = battle.getCurrentParticipant();
    if (!currentParticipant) {
      return res.status(400).json({ message: 'No current participant' });
    }

    // Check if it's player's turn (simple check - in production, add more validation)
    const isPlayerTurn = battle.playerPets.includes(currentParticipant);
    if (!isPlayerTurn) {
      return res.status(400).json({ message: 'Not your turn' });
    }

    // Select action
    const result = battle.selectAction(actionType, skillId, targetIndex);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      success: true,
      battleState: battle.getBattleState()
    });

  } catch (error) {
    console.error('Select action error:', error);
    res.status(500).json({ message: 'Failed to select action', error: error.message });
  }
};

// Execute current action
const executeAction = async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    // Execute action
    const result = battle.executeAction();
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Move to next participant
    battle.nextParticipant();

    res.json({
      success: true,
      actionResult: result,
      battleState: battle.getBattleState()
    });

  } catch (error) {
    console.error('Execute action error:', error);
    res.status(500).json({ message: 'Failed to execute action', error: error.message });
  }
};

// AI turn (for enemy)
const executeAITurn = async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    const currentParticipant = battle.getCurrentParticipant();
    if (!currentParticipant) {
      return res.status(400).json({ message: 'No current participant' });
    }

    // Check if it's AI turn
    const isAITurn = battle.enemyPets.includes(currentParticipant);
    if (!isAITurn) {
      return res.status(400).json({ message: 'Not AI turn' });
    }

    // Simple AI logic
    const aiAction = generateAIAction(battle, currentParticipant);
    const selectResult = battle.selectAction(aiAction.type, aiAction.skillId, aiAction.targetIndex);
    
    if (selectResult.success) {
      const executeResult = battle.executeAction();
      battle.nextParticipant();

      res.json({
        success: true,
        aiAction: aiAction,
        actionResult: executeResult,
        battleState: battle.getBattleState()
      });
    } else {
      res.status(400).json({ message: selectResult.message });
    }

  } catch (error) {
    console.error('Execute AI turn error:', error);
    res.status(500).json({ message: 'Failed to execute AI turn', error: error.message });
  }
};

// Generate AI action
const generateAIAction = (battle, aiParticipant) => {
  // Simple AI: randomly choose between normal skill and ultimate skill
  const availableSkills = aiParticipant.skills.filter(skill => 
    skill.type === 'normal' || skill.type === 'ultimate'
  );

  if (availableSkills.length === 0) {
    return { type: 'defend' };
  }

  // Choose random skill
  const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
  
  // Choose random target (player pets)
  const alivePlayerPets = battle.playerPets.filter(p => p.currentHp > 0);
  if (alivePlayerPets.length === 0) {
    return { type: 'defend' };
  }

  const randomTarget = alivePlayerPets[Math.floor(Math.random() * alivePlayerPets.length)];
  const targetIndex = battle.allParticipants.indexOf(randomTarget);

  return {
    type: randomSkill.type === 'normal' ? 'normal_skill' : 'ultimate_skill',
    skillId: randomSkill._id,
    targetIndex: targetIndex
  };
};

// End battle
const endBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    // End battle
    const battleState = battle.endBattle('cancelled');
    
    // Remove from active battles
    activeBattles.delete(battleId);

    res.json({
      success: true,
      message: 'Battle ended',
      battleState: battleState
    });

  } catch (error) {
    console.error('End battle error:', error);
    res.status(500).json({ message: 'Failed to end battle', error: error.message });
  }
};

// Get battle history
const getBattleHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // In production, store battles in database
    // For now, return empty array
    res.json({
      success: true,
      battles: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Get battle history error:', error);
    res.status(500).json({ message: 'Failed to get battle history', error: error.message });
  }
};

// Get active battles for user
const getActiveBattles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find battles where user is participating
    const userBattles = Array.from(activeBattles.values()).filter(battle => {
      return battle.playerPets.some(pet => pet.userPet.user.toString() === userId);
    });

    res.json({
      success: true,
      battles: userBattles.map(battle => ({
        battleId: battle.battleId,
        battleType: battle.battleType,
        state: battle.state,
        turn: battle.currentTurn,
        participants: {
          player: battle.playerPets.length,
          enemy: battle.enemyPets.length
        }
      }))
    });

  } catch (error) {
    console.error('Get active battles error:', error);
    res.status(500).json({ message: 'Failed to get active battles', error: error.message });
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