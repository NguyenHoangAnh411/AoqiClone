const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
  sendErrorResponse, 
  sendSuccessResponse, 
  validateRequiredFields 
} = require('../utils/controllerUtils');

const SECRET = 'aoqi_secret_key';

exports.register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['username', 'password', 'email']);
    if (!validation.isValid) {
      return sendErrorResponse(res, 400, validation.error);
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return sendErrorResponse(res, 400, 'Tên tài khoản đã tồn tại');
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return sendErrorResponse(res, 400, 'Email đã tồn tại');
    }

    // Hash password
    const hash = bcrypt.hashSync(password, 8);
    
    // Create user (frontend registration always creates 'user' role)
    const userData = {
      username,
      password: hash,
      email,
      role: 'user' // Always user for frontend registration
    };
    
    const user = await User.create(userData);
    
    // Generate token for auto-login after registration
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      SECRET, 
      { expiresIn: '7d' }
    );
    
    sendSuccessResponse(res, 201, {
      token,
      username: user.username,
      userId: user._id,
      role: user.role,
      level: user.level,
      exp: user.exp,
      score: user.score,
      coins: user.coins,
      gems: user.gems
    });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi server: ' + err.message, err);
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['username', 'password']);
    if (!validation.isValid) {
      return sendErrorResponse(res, 400, validation.error);
    }

    const user = await User.findOne({ username });
    if (!user) {
      return sendErrorResponse(res, 400, 'Sai tài khoản hoặc mật khẩu');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return sendErrorResponse(res, 400, 'Sai tài khoản hoặc mật khẩu');
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      SECRET, 
      { expiresIn: '7d' }
    );

    sendSuccessResponse(res, 200, { 
      token,
      role: user.role
    });
  } catch (err) {
    sendErrorResponse(res, 500, 'Lỗi server: ' + err.message, err);
  }
}; 