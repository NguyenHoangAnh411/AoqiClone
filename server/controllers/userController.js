const User = require('../models/User');
const UserPet = require('../models/UserPet');
const { 
  sendErrorResponse, 
  sendSuccessResponse, 
  userPopulateOptions,
  validateObjectOwnership
} = require('../utils/controllerUtils');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate(userPopulateOptions);
    
    if (!user) {
      return sendErrorResponse(res, 404, 'Không tìm thấy user');
    }
    
    sendSuccessResponse(res, 200, { user });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải thông tin user', err);
  }
};

// API mới để load user data từ token
exports.getUserByToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate(userPopulateOptions);
    
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return sendErrorResponse(res, 404, 'Không tìm thấy user');
    }
    
    console.log('User found:', {
      id: user._id,
      username: user.username,
      role: user.role,
      coins: user.coins,
      gems: user.gems
    });
    
    sendSuccessResponse(res, 200, { user });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải thông tin user', err);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, email, bio, avatar, settings } = req.body;
    const updateData = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (settings) updateData.settings = settings;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return sendErrorResponse(res, 404, 'Không tìm thấy user');
    }
    
    sendSuccessResponse(res, 200, { user }, 'Cập nhật thông tin thành công');
  } catch (err) {
    sendErrorResponse(res, 400, 'Lỗi khi cập nhật thông tin user', err);
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('username score avatar bio createdAt')
      .populate({
        path: 'pets',
        match: { isActive: true },
        populate: {
          path: 'pet',
          select: 'name img element rarity'
        }
      });
    
    if (!user) {
      return sendErrorResponse(res, 404, 'Không tìm thấy user');
    }
    
    sendSuccessResponse(res, 200, { user });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải profile user', err);
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('level exp score coins gems');
    
    if (!user) {
      return sendErrorResponse(res, 404, 'Không tìm thấy user');
    }
    
    // Tính toán thống kê bổ sung
    const stats = {
      level: user.level,
      exp: user.exp,
      score: user.score,
      coins: user.coins,
      gems: user.gems,
      // Có thể thêm các thống kê khác ở đây
    };
    
    sendSuccessResponse(res, 200, { stats });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi khi tải thống kê user', err);
  }
};

exports.addCoins = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Số tiền không hợp lệ' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { coins: amount } },
      { new: true }
    ).select('coins');
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addGems = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Số đá quý không hợp lệ' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { gems: amount } },
      { new: true }
    ).select('gems');
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

