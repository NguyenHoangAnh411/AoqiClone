const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserStats = require('../models/UserStats');

class AuthController {
  /**
   * Đăng ký tài khoản mới
   */
  static async register(req, res) {
    try {
      const { username, email, password, displayName } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email và password là bắt buộc'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password phải có ít nhất 6 ký tự'
        });
      }

      // Kiểm tra username và email đã tồn tại
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username hoặc email đã tồn tại'
        });
      }

      // Tạo user mới
      const user = new User({
        username,
        email,
        password,
        displayName: displayName || username
      });

      // Lưu user
      await user.save();

      // Tạo token
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Lấy thông tin đầy đủ với stats
      const fullUserInfo = await user.getFullInfo();

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          user: fullUserInfo,
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng ký',
        error: error.message
      });
    }
  }

  /**
   * Đăng nhập
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username và password là bắt buộc'
        });
      }

      // Tìm user
      const user = await User.findOne({
        $or: [{ username }, { email: username }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username hoặc password không đúng'
        });
      }

      // Kiểm tra user có bị ban không
      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị cấm',
          banReason: user.banReason,
          banExpiresAt: user.banExpiresAt
        });
      }

      // Kiểm tra password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Username hoặc password không đúng'
        });
      }

      // Cập nhật lastLogin
      user.lastLogin = new Date();
      user.lastLoginIp = req.ip || req.connection.remoteAddress;
      await user.save();

      // Tạo JWT token
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Lấy thông tin đầy đủ với stats
      const fullUserInfo = await user.getFullInfo();

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: fullUserInfo,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng nhập',
        error: error.message
      });
    }
  }

  /**
   * Đăng xuất
   */
  static async logout(req, res) {
    try {
      // Trong thực tế, có thể lưu token vào blacklist
      // Hoặc sử dụng Redis để quản lý session
      res.json({
        success: true,
        message: 'Đăng xuất thành công'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng xuất',
        error: error.message
      });
    }
  }

  /**
   * Làm mới token
   */
  static async refreshToken(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Tạo token mới
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Làm mới token thành công',
        data: { token }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi làm mới token',
        error: error.message
      });
    }
  }

  /**
   * Đổi mật khẩu
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password và new password là bắt buộc'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password phải có ít nhất 6 ký tự'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Kiểm tra current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password không đúng'
        });
      }

      // Cập nhật password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đổi mật khẩu',
        error: error.message
      });
    }
  }

  /**
   * Quên mật khẩu - gửi email reset
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email là bắt buộc'
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Email không tồn tại trong hệ thống'
        });
      }

      // Tạo reset token (có thể sử dụng JWT với thời gian ngắn)
      const resetToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // TODO: Gửi email với reset link
      // Trong thực tế, sẽ gửi email với link reset password

      res.json({
        success: true,
        message: 'Email reset password đã được gửi'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý quên mật khẩu',
        error: error.message
      });
    }
  }

  /**
   * Đặt lại mật khẩu với token
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token và new password là bắt buộc'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password phải có ít nhất 6 ký tự'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Cập nhật password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đặt lại mật khẩu',
        error: error.message
      });
    }
  }

  /**
   * Xác thực email
   */
  static async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token là bắt buộc'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Cập nhật trạng thái verified
      user.isVerified = true;
      await user.save();

      res.json({
        success: true,
        message: 'Xác thực email thành công'
      });
    } catch (error) {
      console.error('Email verification error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác thực email',
        error: error.message
      });
    }
  }

  /**
   * Lấy thông tin profile của user hiện tại
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

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
   * Cập nhật profile của user hiện tại
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { displayName, bio, avatar } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // Cập nhật thông tin
      if (displayName !== undefined) user.displayName = displayName;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();

      res.json({
        success: true,
        data: user,
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
   * Gửi lại email xác thực
   */
  static async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email là bắt buộc'
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Email không tồn tại trong hệ thống'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được xác thực'
        });
      }

      // Tạo verification token
      const verificationToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // TODO: Gửi email xác thực
      // Trong thực tế, sẽ gửi email với link xác thực

      res.json({
        success: true,
        message: 'Email xác thực đã được gửi lại'
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi lại email xác thực',
        error: error.message
      });
    }
  }
}

module.exports = AuthController; 