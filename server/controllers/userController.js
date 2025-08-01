const User = require('../models/User');
const UserStats = require('../models/UserStats');

class UserController {
  /**
   * Lấy thông tin profile của user hiện tại
   */
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Lấy thông tin đầy đủ với stats
      const fullUserInfo = await user.getFullInfo();

      res.json({
        success: true,
        data: fullUserInfo,
        message: 'Lấy thông tin profile thành công'
      });
    } catch (error) {
      console.error('Get profile error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin profile',
        error: error.message
      });
    }
  }

  /**
   * Cập nhật profile của user
   */
  static async updateProfile(req, res) {
    try {
      const { displayName, bio, avatar } = req.body;
      
      const updateData = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar !== undefined) updateData.avatar = avatar;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Lấy thông tin đầy đủ với stats
      const fullUserInfo = await user.getFullInfo();

      res.json({
        success: true,
        data: fullUserInfo,
        message: 'Cập nhật profile thành công'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật profile',
        error: error.message
      });
    }
  }

  /**
   * Cập nhật avatar
   */
  static async updateAvatar(req, res) {
    try {
      const { avatar } = req.body;

      if (!avatar) {
        return res.status(400).json({
          success: false,
          message: 'Avatar URL là bắt buộc'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatar },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Lấy thông tin đầy đủ với stats
      const fullUserInfo = await user.getFullInfo();

      res.json({
        success: true,
        data: fullUserInfo,
        message: 'Cập nhật avatar thành công'
      });
    } catch (error) {
      console.error('Update avatar error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật avatar',
        error: error.message
      });
    }
  }

  /**
   * Lấy UserStats của user hiện tại
   */
  static async getUserStats(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Lấy stats thông qua virtual field
      await user.populate('stats');
      
      // Nếu chưa có stats, tạo mới
      if (!user.stats) {
        const UserStats = require('../models/UserStats');
        user.stats = await UserStats.create({ user: user._id });
      }
      
      res.json({
        success: true,
        data: user.stats,
        message: 'Lấy UserStats thành công'
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy UserStats',
        error: error.message
      });
    }
  }

  /**
   * Thêm currency cho user
   */
  static async addCurrency(req, res) {
    try {
      const { type, amount } = req.body;

      if (!type || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Type và amount phải hợp lệ'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Lấy stats thông qua virtual field
      await user.populate('stats');
      
      // Nếu chưa có stats, tạo mới
      if (!user.stats) {
        const UserStats = require('../models/UserStats');
        user.stats = await UserStats.create({ user: user._id });
      }

      user.stats.addCurrency(type, amount);
      await user.stats.save();

      res.json({
        success: true,
        data: user.stats,
        message: `Đã thêm ${amount} ${type}`
      });
    } catch (error) {
      console.error('Add currency error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm currency',
        error: error.message
      });
    }
  }

  /**
   * Trừ currency của user
   */
  static async deductCurrency(req, res) {
    try {
      const { type, amount } = req.body;

      if (!type || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Type và amount phải hợp lệ'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Lấy stats thông qua virtual field
      await user.populate('stats');
      
      // Nếu chưa có stats, tạo mới
      if (!user.stats) {
        const UserStats = require('../models/UserStats');
        user.stats = await UserStats.create({ user: user._id });
      }

      user.stats.deductCurrency(type, amount);
      await user.stats.save();

      res.json({
        success: true,
        data: user.stats,
        message: `Đã trừ ${amount} ${type}`
      });
    } catch (error) {
      console.error('Deduct currency error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi trừ currency',
        error: error.message
      });
    }
  }

  /**
   * Cập nhật UserStats
   */
  static async updateUserStats(req, res) {
    try {
      const updateData = req.body;

      // Loại bỏ các trường không được phép cập nhật
      const allowedFields = ['score', 'rank', 'hasChosenStarterPet', 'tutorialCompleted'];
      const filteredData = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Lấy stats thông qua virtual field
      await user.populate('stats');
      
      // Nếu chưa có stats, tạo mới
      if (!user.stats) {
        const UserStats = require('../models/UserStats');
        user.stats = await UserStats.create({ user: user._id });
      }

      // Cập nhật stats
      Object.assign(user.stats, filteredData);
      await user.stats.save();

      res.json({
        success: true,
        data: user.stats,
        message: 'Cập nhật UserStats thành công'
      });
    } catch (error) {
      console.error('Update user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật UserStats',
        error: error.message
      });
    }
  }

  /**
   * Lấy thông tin user khác (hỗ trợ cả username và ObjectId)
   */
  static async getUserById(req, res) {
    try {
      const { userId } = req.params;

      let user;
      
      // Kiểm tra xem userId có phải là ObjectId hợp lệ không
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        // Nếu là ObjectId hợp lệ, tìm theo _id
        user = await User.findById(userId)
          .select('username displayName avatar bio score rank createdAt');
      } else {
        // Nếu không phải ObjectId, tìm theo username
        user = await User.findOne({ username: userId })
          .select('username displayName avatar bio score rank createdAt');
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      res.json({
        success: true,
        data: user,
        message: 'Lấy thông tin user thành công'
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin user',
        error: error.message
      });
    }
  }

  /**
   * Tìm kiếm user
   */
  static async searchUsers(req, res) {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Query tìm kiếm là bắt buộc'
        });
      }

      const skip = (page - 1) * limit;
      
      const users = await User.find({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { displayName: { $regex: q, $options: 'i' } }
        ],
        isActive: true,
        isBanned: false
      })
        .select('username displayName avatar score rank createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ score: -1 });

      const total = await User.countDocuments({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { displayName: { $regex: q, $options: 'i' } }
        ],
        isActive: true,
        isBanned: false
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Tìm kiếm user thành công'
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm kiếm user',
        error: error.message
      });
    }
  }

  /**
   * Lấy bảng xếp hạng
   */
  static async getLeaderboard(req, res) {
    try {
      const { type = 'score', page = 1, limit = 20 } = req.query;
      
      const skip = (page - 1) * limit;
      
      let sortField = 'score';
      if (type === 'golds') sortField = 'golds';
      if (type === 'diamonds') sortField = 'diamonds';

      const userStats = await UserStats.find()
        .populate('user', 'username displayName avatar isActive isBanned createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ [sortField]: -1 });

      // Lọc chỉ những user active và không bị ban
      const filteredStats = userStats.filter(stat => 
        stat.user && stat.user.isActive && !stat.user.isBanned
      );

      const total = await UserStats.countDocuments();

      res.json({
        success: true,
        data: {
          users: filteredStats.map(stat => ({
            _id: stat.user._id,
            username: stat.user.username,
            displayName: stat.user.displayName,
            avatar: stat.user.avatar,
            score: stat.score,
            rank: stat.rank,
            golds: stat.golds,
            diamonds: stat.diamonds,
            createdAt: stat.user.createdAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredStats.length,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Lấy bảng xếp hạng thành công'
      });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy bảng xếp hạng',
        error: error.message
      });
    }
  }

  /**
   * Lấy thống kê user
   */
  static async getUserStatistics(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Lấy stats thông qua virtual field
      await user.populate('stats');
      
      // Nếu chưa có stats, tạo mới
      if (!user.stats) {
        user.stats = await UserStats.create({ user: user._id });
      }

      const statistics = {
        basic: {
          score: user.stats.score,
          rank: user.stats.rank,
          golds: user.stats.golds,
          diamonds: user.stats.diamonds,
          standardFate: user.stats.standardFate,
          specialFate: user.stats.specialFate,
          MasterlessStarglitter: user.stats.MasterlessStarglitter,
          MasterlessStardust: user.stats.MasterlessStardust
        },
        progress: {
          hasChosenStarterPet: user.stats.hasChosenStarterPet,
          tutorialCompleted: user.stats.tutorialCompleted,
          isVerified: user.isVerified
        },
        account: {
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          isActive: user.isActive,
          isBanned: user.isBanned
        }
      };

      res.json({
        success: true,
        data: statistics,
        message: 'Lấy thống kê user thành công'
      });
    } catch (error) {
      console.error('Get user statistics error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê user',
        error: error.message
      });
    }
  }

  /**
   * Xóa tài khoản
   */
  static async deleteAccount(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password là bắt buộc để xác nhận xóa tài khoản'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Kiểm tra password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password không đúng'
        });
      }

      // TODO: Xóa tất cả dữ liệu liên quan (pets, inventory, battles, v.v.)
      // await UserPet.deleteMany({ user: req.user.id });
      // await UserInventory.deleteMany({ user: req.user.id });
      // await Formation.deleteMany({ user: req.user.id });
      // v.v.

      // Xóa user
      await User.findByIdAndDelete(req.user.id);

      res.json({
        success: true,
        message: 'Xóa tài khoản thành công'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa tài khoản',
        error: error.message
      });
    }
  }

  // ==================== ADMIN ROUTES ====================

  /**
   * Lấy danh sách tất cả user (admin)
   */
  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, role, status } = req.query;
      
      const skip = (page - 1) * limit;
      
      let query = {};
      
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (role) query.role = role;
      if (status === 'active') query.isActive = true;
      if (status === 'banned') query.isBanned = true;
      if (status === 'inactive') query.isActive = false;

      const users = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Lấy danh sách user thành công'
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách user',
        error: error.message
      });
    }
  }

  /**
   * Cập nhật user (admin)
   */
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      // Không cho phép cập nhật password qua API này
      delete updateData.password;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      res.json({
        success: true,
        data: user,
        message: 'Cập nhật user thành công'
      });
    } catch (error) {
      console.error('Update user error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật user',
        error: error.message
      });
    }
  }

  /**
   * Xóa user (admin)
   */
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // TODO: Xóa tất cả dữ liệu liên quan
      // await UserPet.deleteMany({ user: userId });
      // await UserInventory.deleteMany({ user: userId });
      // v.v.

      await User.findByIdAndDelete(userId);

      res.json({
        success: true,
        message: 'Xóa user thành công'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa user',
        error: error.message
      });
    }
  }

  /**
   * Cấm user (admin)
   */
  static async banUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason, duration } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      user.isBanned = true;
      user.banReason = reason || 'Vi phạm quy tắc cộng đồng';
      
      if (duration) {
        user.banExpiresAt = new Date(Date.now() + duration * 60 * 60 * 1000); // duration in hours
      }

      await user.save();

      res.json({
        success: true,
        data: user,
        message: 'Cấm user thành công'
      });
    } catch (error) {
      console.error('Ban user error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cấm user',
        error: error.message
      });
    }
  }

  /**
   * Bỏ cấm user (admin)
   */
  static async unbanUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      user.isBanned = false;
      user.banReason = null;
      user.banExpiresAt = null;

      await user.save();

      res.json({
        success: true,
        data: user,
        message: 'Bỏ cấm user thành công'
      });
    } catch (error) {
      console.error('Unban user error:', error);
      
      // Xử lý CastError (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID user không hợp lệ'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi bỏ cấm user',
        error: error.message
      });
    }
  }
}

module.exports = UserController; 