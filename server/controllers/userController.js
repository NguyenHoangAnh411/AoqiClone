const User = require('../models/User');
const UserPet = require('../models/UserPet');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'pets',
        populate: {
          path: 'pet',
          select: 'name img element rarity'
        }
      });
    
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// API mới để load user data từ token
exports.getUserByToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'pets',
        populate: {
          path: 'pet',
          select: 'name img element rarity'
        }
      });
    
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }
    
    console.log('User found:', {
      id: user._id,
      username: user.username,
      role: user.role,
      coins: user.coins,
      gems: user.gems
    });
    
    res.json(user);
  } catch (err) {
    console.error('Error in getUserByToken:', err);
    res.status(500).json({ error: err.message });
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
    
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
    
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('score coins gems');
    const petCount = await UserPet.countDocuments({ user: req.user.id });
    const activePet = await UserPet.findOne({ user: req.user.id, isActive: true })
      .populate('pet', 'name img element');
    
    res.json({
      user,
      petCount,
      activePet
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

