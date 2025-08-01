const mongoose = require('mongoose');

/**
 * UserQuest Model - Theo dõi tiến độ nhiệm vụ của user
 * Lưu trữ trạng thái, tiến độ, và lịch sử nhiệm vụ của từng user
 */
const userQuestSchema = new mongoose.Schema({
  // References
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  quest: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quest', 
    required: true 
  },
  
  // Trạng thái nhiệm vụ
  status: { 
    type: String, 
    enum: ['active', 'completed', 'failed', 'expired', 'claimed'],
    default: 'active' 
  },
  
  // Tiến độ hiện tại
  currentProgress: { 
    type: Number, 
    default: 0 
  },
  
  // Thông tin thời gian
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date 
  },
  claimedAt: { 
    type: Date 
  },
  
  // Thông tin lặp lại (cho daily/weekly quests)
  repeatInfo: {
    cycleNumber: { 
      type: Number, 
      default: 1 
    }, // Số lần đã lặp lại
    lastResetDate: { 
      type: Date 
    }, // Ngày reset gần nhất
    nextResetDate: { 
      type: Date 
    } // Ngày reset tiếp theo
  },
  
  // Lịch sử hoạt động (để track progress)
  activityLog: [{
    action: { 
      type: String, 
      required: true 
    }, // Loại hành động
    actionData: { 
      type: mongoose.Schema.Types.Mixed 
    }, // Dữ liệu hành động
    progressBefore: { 
      type: Number, 
      default: 0 
    },
    progressAfter: { 
      type: Number, 
      default: 0 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // Thông tin phần thưởng đã nhận
  rewardsClaimed: {
    gold: { 
      type: Number, 
      default: 0 
    },
    diamonds: { 
      type: Number, 
      default: 0 
    },
    standardFate: { 
      type: Number, 
      default: 0 
    },
    specialFate: { 
      type: Number, 
      default: 0 
    },
    exp: { 
      type: Number, 
      default: 0 
    },
    items: [{
      itemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Item' 
      },
      quantity: { 
        type: Number, 
        default: 0 
      },
      claimedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    pets: [{
      petId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Pet' 
      },
      level: { 
        type: Number, 
        default: 1 
      },
      claimedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    specialRewards: [{
      type: { 
        type: String, 
        enum: ['title', 'avatar', 'achievement'] 
      },
      value: { 
        type: String 
      },
      claimedAt: { 
        type: Date, 
        default: Date.now 
      }
    }]
  },
  
  // Metadata
  notes: { 
    type: String 
  }, // Ghi chú của user (nếu có)
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ==================== INDEXES ====================

userQuestSchema.index({ user: 1, quest: 1 }, { unique: true });
userQuestSchema.index({ user: 1, status: 1 });
userQuestSchema.index({ user: 1, 'repeatInfo.nextResetDate': 1 });
userQuestSchema.index({ status: 1, 'repeatInfo.nextResetDate': 1 });

// ==================== METHODS ====================

/**
 * Cập nhật tiến độ nhiệm vụ
 */
userQuestSchema.methods.updateProgress = function(action, actionData, newProgress) {
  // Log activity
  this.activityLog.push({
    action,
    actionData,
    progressBefore: this.currentProgress,
    progressAfter: newProgress,
    timestamp: new Date()
  });
  
  this.currentProgress = newProgress;
  this.updatedAt = new Date();
  
  // Kiểm tra xem có hoàn thành không
  if (newProgress >= this.quest.requirements.target) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

/**
 * Nhận phần thưởng nhiệm vụ
 */
userQuestSchema.methods.claimRewards = async function() {
  if (this.status !== 'completed') {
    throw new Error('Nhiệm vụ chưa hoàn thành');
  }
  
  if (this.status === 'claimed') {
    throw new Error('Đã nhận phần thưởng rồi');
  }
  
  const quest = await this.populate('quest');
  const user = await this.populate('user');
  
  // Cập nhật currency cho user
  if (quest.rewards.gold > 0) {
    user.golds += quest.rewards.gold;
    this.rewardsClaimed.gold = quest.rewards.gold;
  }
  
  if (quest.rewards.diamonds > 0) {
    user.diamonds += quest.rewards.diamonds;
    this.rewardsClaimed.diamonds = quest.rewards.diamonds;
  }
  
  if (quest.rewards.standardFate > 0) {
    user.standardFate += quest.rewards.standardFate;
    this.rewardsClaimed.standardFate = quest.rewards.standardFate;
  }
  
  if (quest.rewards.specialFate > 0) {
    user.specialFate += quest.rewards.specialFate;
    this.rewardsClaimed.specialFate = quest.rewards.specialFate;
  }
  
  // Cập nhật exp cho user
  if (quest.rewards.exp > 0) {
    user.score += quest.rewards.exp; // Giả sử score = exp
    this.rewardsClaimed.exp = quest.rewards.exp;
  }
  
  // Lưu user
  await user.save();
  
  // Cập nhật trạng thái
  this.status = 'claimed';
  this.claimedAt = new Date();
  this.updatedAt = new Date();
  
  return this.save();
};

/**
 * Reset nhiệm vụ (cho daily/weekly)
 */
userQuestSchema.methods.resetQuest = function() {
  this.currentProgress = 0;
  this.status = 'active';
  this.completedAt = null;
  this.claimedAt = null;
  this.activityLog = [];
  this.rewardsClaimed = {
    gold: 0,
    diamonds: 0,
    standardFate: 0,
    specialFate: 0,
    exp: 0,
    items: [],
    pets: [],
    specialRewards: []
  };
  
  // Cập nhật thông tin lặp lại
  this.repeatInfo.cycleNumber += 1;
  this.repeatInfo.lastResetDate = new Date();
  
  // Tính ngày reset tiếp theo
  const quest = this.quest;
  if (quest.type === 'daily') {
    this.repeatInfo.nextResetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else if (quest.type === 'weekly') {
    this.repeatInfo.nextResetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  this.updatedAt = new Date();
  
  return this.save();
};

/**
 * Kiểm tra xem có thể reset không
 */
userQuestSchema.methods.canReset = function() {
  if (!this.quest.isRepeatable) {
    return false;
  }
  
  if (!this.repeatInfo.nextResetDate) {
    return true;
  }
  
  return new Date() >= this.repeatInfo.nextResetDate;
};

// ==================== MIDDLEWARE ====================

userQuestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ==================== STATIC METHODS ====================

/**
 * Tạo hoặc lấy user quest
 */
userQuestSchema.statics.getOrCreateUserQuest = async function(userId, questId) {
  let userQuest = await this.findOne({ user: userId, quest: questId });
  
  if (!userQuest) {
    const Quest = require('./Quest');
    const quest = await Quest.findOne({ questId });
    
    if (!quest) {
      throw new Error('Quest không tồn tại');
    }
    
    userQuest = new this({
      user: userId,
      quest: quest._id,
      status: 'active',
      currentProgress: 0
    });
    
    await userQuest.save();
  }
  
  return userQuest;
};

/**
 * Lấy danh sách nhiệm vụ của user
 */
userQuestSchema.statics.getUserQuests = function(userId, status = null) {
  const query = { user: userId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('quest')
    .sort({ 'quest.order': 1, createdAt: -1 });
};

/**
 * Lấy nhiệm vụ cần reset (daily/weekly)
 */
userQuestSchema.statics.getQuestsToReset = function() {
  const now = new Date();
  
  return this.find({
    'repeatInfo.nextResetDate': { $lte: now },
    status: { $in: ['completed', 'claimed'] }
  }).populate('quest');
};

/**
 * Xử lý hành động game và cập nhật tiến độ nhiệm vụ
 */
userQuestSchema.statics.processGameAction = async function(userId, action, actionData) {
  const Quest = require('./Quest');
  
  // Lấy tất cả nhiệm vụ active của user
  const userQuests = await this.find({ 
    user: userId, 
    status: 'active' 
  }).populate('quest');
  
  const updatedQuests = [];
  
  for (const userQuest of userQuests) {
    const quest = userQuest.quest;
    
    // Kiểm tra xem hành động có liên quan đến nhiệm vụ không
    if (quest.category === action) {
      // Kiểm tra điều kiện hoàn thành
      const result = quest.checkCompletion(userQuest.currentProgress, actionData);
      
      if (result.progress !== userQuest.currentProgress) {
        await userQuest.updateProgress(action, actionData, result.progress);
        updatedQuests.push(userQuest);
      }
    }
  }
  
  return updatedQuests;
};

module.exports = mongoose.model('UserQuest', userQuestSchema); 