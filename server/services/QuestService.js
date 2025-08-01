const Quest = require('../models/Quest');
const UserQuest = require('../models/UserQuest');
const User = require('../models/User');
const UserPet = require('../models/UserPet');
const UserInventory = require('../models/UserInventory');

/**
 * Quest Service - Xử lý logic nghiệp vụ của hệ thống nhiệm vụ
 */
class QuestService {
  
  /**
   * Khởi tạo nhiệm vụ cho user mới
   */
  static async initializeUserQuests(userId) {
    try {
      // Lấy tất cả nhiệm vụ tutorial và story có thể làm
      const availableQuests = await Quest.find({
        isActive: true,
        type: { $in: ['tutorial', 'story'] },
        'requirements.conditions.minLevel': { $lte: 1 }
      }).sort({ order: 1 });
      
      const userQuests = [];
      
      for (const quest of availableQuests) {
        const userQuest = await UserQuest.getOrCreateUserQuest(userId, quest.questId);
        userQuests.push(userQuest);
      }
      
      return userQuests;
    } catch (error) {
      console.error('Error initializing user quests:', error);
      throw error;
    }
  }
  
  /**
   * Lấy danh sách nhiệm vụ của user
   */
  static async getUserQuests(userId, type = null, status = null) {
    try {
      let query = { user: userId };
      
      if (status) {
        query.status = status;
      }
      
      const userQuests = await UserQuest.find(query)
        .populate({
          path: 'quest',
          match: type ? { type } : {}
        })
        .sort({ 'quest.order': 1, createdAt: -1 });
      
      // Filter out quests that don't match type (due to populate match)
      return userQuests.filter(uq => uq.quest);
    } catch (error) {
      console.error('Error getting user quests:', error);
      throw error;
    }
  }
  
  /**
   * Lấy nhiệm vụ daily/weekly có thể làm
   */
  static async getAvailableQuests(userId, userLevel) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User không tồn tại');
      }
      
      // Lấy nhiệm vụ có thể kích hoạt
      const availableQuests = await Quest.getAvailableQuests(userId, userLevel);
      
      const result = [];
      
      for (const quest of availableQuests) {
        // Kiểm tra xem user có thể kích hoạt nhiệm vụ không
        const canActivate = quest.canActivate(userLevel);
        
        if (canActivate.canActivate) {
          // Lấy hoặc tạo user quest
          const userQuest = await UserQuest.getOrCreateUserQuest(userId, quest.questId);
          
          result.push({
            quest: quest,
            userQuest: userQuest,
            canActivate: true
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting available quests:', error);
      throw error;
    }
  }
  
  /**
   * Xử lý hành động game và cập nhật tiến độ nhiệm vụ
   */
  static async processGameAction(userId, action, actionData) {
    try {
      const updatedQuests = await UserQuest.processGameAction(userId, action, actionData);
      
      // Trả về thông tin cập nhật
      const result = [];
      
      for (const userQuest of updatedQuests) {
        await userQuest.populate('quest');
        
        result.push({
          questId: userQuest.quest.questId,
          questName: userQuest.quest.name,
          oldProgress: userQuest.activityLog[userQuest.activityLog.length - 2]?.progressAfter || 0,
          newProgress: userQuest.currentProgress,
          target: userQuest.quest.requirements.target,
          completed: userQuest.status === 'completed',
          status: userQuest.status
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error processing game action:', error);
      throw error;
    }
  }
  
  /**
   * Nhận phần thưởng nhiệm vụ
   */
  static async claimQuestRewards(userId, questId) {
    try {
      const userQuest = await UserQuest.findOne({ 
        user: userId, 
        quest: questId 
      }).populate('quest');
      
      if (!userQuest) {
        throw new Error('Nhiệm vụ không tồn tại');
      }
      
      if (userQuest.status !== 'completed') {
        throw new Error('Nhiệm vụ chưa hoàn thành');
      }
      
      if (userQuest.status === 'claimed') {
        throw new Error('Đã nhận phần thưởng rồi');
      }
      
      // Nhận phần thưởng
      await userQuest.claimRewards();
      
      // Xử lý phần thưởng items
      const quest = userQuest.quest;
      const claimedItems = [];
      
      for (const itemReward of quest.rewards.items) {
        if (Math.random() * 100 <= itemReward.chance) {
          // Thêm item vào inventory
          await UserInventory.addItem(userId, itemReward.itemId, itemReward.quantity);
          
          claimedItems.push({
            itemId: itemReward.itemId,
            quantity: itemReward.quantity
          });
        }
      }
      
      // Xử lý phần thưởng pets
      const claimedPets = [];
      
      for (const petReward of quest.rewards.pets) {
        if (Math.random() * 100 <= petReward.chance) {
          // Tạo pet cho user
          const userPet = new UserPet({
            user: userId,
            pet: petReward.petId,
            level: petReward.level,
            location: 'storage'
          });
          
          await userPet.save();
          
          claimedPets.push({
            petId: petReward.petId,
            level: petReward.level
          });
        }
      }
      
      return {
        success: true,
        questId: quest.questId,
        questName: quest.name,
        rewards: {
          gold: quest.rewards.gold,
          diamonds: quest.rewards.diamonds,
          standardFate: quest.rewards.standardFate,
          specialFate: quest.rewards.specialFate,
          exp: quest.rewards.exp,
          items: claimedItems,
          pets: claimedPets,
          title: quest.rewards.title,
          avatar: quest.rewards.avatar,
          achievement: quest.rewards.achievement
        }
      };
    } catch (error) {
      console.error('Error claiming quest rewards:', error);
      throw error;
    }
  }
  
  /**
   * Reset nhiệm vụ daily/weekly
   */
  static async resetDailyWeeklyQuests() {
    try {
      const questsToReset = await UserQuest.getQuestsToReset();
      
      const resetResults = [];
      
      for (const userQuest of questsToReset) {
        if (userQuest.canReset()) {
          await userQuest.resetQuest();
          
          resetResults.push({
            userId: userQuest.user,
            questId: userQuest.quest.questId,
            questName: userQuest.quest.name,
            resetAt: new Date()
          });
        }
      }
      
      return resetResults;
    } catch (error) {
      console.error('Error resetting daily/weekly quests:', error);
      throw error;
    }
  }
  
  /**
   * Tạo nhiệm vụ mới (cho admin)
   */
  static async createQuest(questData) {
    try {
      const quest = new Quest(questData);
      await quest.save();
      
      return quest;
    } catch (error) {
      console.error('Error creating quest:', error);
      throw error;
    }
  }
  
  /**
   * Cập nhật nhiệm vụ
   */
  static async updateQuest(questId, updateData) {
    try {
      const quest = await Quest.findOneAndUpdate(
        { questId },
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!quest) {
        throw new Error('Quest không tồn tại');
      }
      
      return quest;
    } catch (error) {
      console.error('Error updating quest:', error);
      throw error;
    }
  }
  
  /**
   * Xóa nhiệm vụ
   */
  static async deleteQuest(questId) {
    try {
      const quest = await Quest.findOneAndDelete({ questId });
      
      if (!quest) {
        throw new Error('Quest không tồn tại');
      }
      
      // Xóa tất cả user quests liên quan
      await UserQuest.deleteMany({ quest: quest._id });
      
      return { success: true, message: 'Quest đã được xóa' };
    } catch (error) {
      console.error('Error deleting quest:', error);
      throw error;
    }
  }
  
  /**
   * Lấy thống kê nhiệm vụ
   */
  static async getQuestStatistics(userId) {
    try {
      const userQuests = await UserQuest.find({ user: userId }).populate('quest');
      
      const stats = {
        total: userQuests.length,
        active: 0,
        completed: 0,
        claimed: 0,
        failed: 0,
        byType: {
          daily: { total: 0, completed: 0 },
          weekly: { total: 0, completed: 0 },
          achievement: { total: 0, completed: 0 },
          story: { total: 0, completed: 0 },
          event: { total: 0, completed: 0 },
          tutorial: { total: 0, completed: 0 }
        },
        byCategory: {},
        totalRewards: {
          gold: 0,
          diamonds: 0,
          standardFate: 0,
          specialFate: 0,
          exp: 0
        }
      };
      
      for (const userQuest of userQuests) {
        const quest = userQuest.quest;
        
        // Đếm theo status
        stats[userQuest.status]++;
        
        // Đếm theo type
        if (stats.byType[quest.type]) {
          stats.byType[quest.type].total++;
          if (userQuest.status === 'completed' || userQuest.status === 'claimed') {
            stats.byType[quest.type].completed++;
          }
        }
        
        // Đếm theo category
        if (!stats.byCategory[quest.category]) {
          stats.byCategory[quest.category] = { total: 0, completed: 0 };
        }
        stats.byCategory[quest.category].total++;
        if (userQuest.status === 'completed' || userQuest.status === 'claimed') {
          stats.byCategory[quest.category].completed++;
        }
        
        // Tính tổng phần thưởng đã nhận
        if (userQuest.status === 'claimed') {
          stats.totalRewards.gold += userQuest.rewardsClaimed.gold;
          stats.totalRewards.diamonds += userQuest.rewardsClaimed.diamonds;
          stats.totalRewards.standardFate += userQuest.rewardsClaimed.standardFate;
          stats.totalRewards.specialFate += userQuest.rewardsClaimed.specialFate;
          stats.totalRewards.exp += userQuest.rewardsClaimed.exp;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting quest statistics:', error);
      throw error;
    }
  }
  
  /**
   * Tìm kiếm nhiệm vụ
   */
  static async searchQuests(userId, searchParams) {
    try {
      const { type, category, status, difficulty, keyword } = searchParams;
      
      let query = { user: userId };
      
      if (status) {
        query.status = status;
      }
      
      const userQuests = await UserQuest.find(query)
        .populate({
          path: 'quest',
          match: {
            ...(type && { type }),
            ...(category && { category }),
            ...(difficulty && { difficulty }),
            ...(keyword && {
              $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
              ]
            })
          }
        })
        .sort({ 'quest.order': 1, createdAt: -1 });
      
      // Filter out quests that don't match criteria
      return userQuests.filter(uq => uq.quest);
    } catch (error) {
      console.error('Error searching quests:', error);
      throw error;
    }
  }
}

module.exports = QuestService; 