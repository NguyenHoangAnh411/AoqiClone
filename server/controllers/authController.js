const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET = 'aoqi_secret_key';

exports.register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    // Validate required fields
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Thiếu thông tin username, password hoặc email' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Tên tài khoản đã tồn tại' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
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
    
    res.status(201).json({ 
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
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin username hoặc password' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      role: user.role
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
}; 