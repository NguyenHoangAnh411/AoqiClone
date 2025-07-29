const jwt = require('jsonwebtoken');
const SECRET = 'aoqi_secret_key';

// Middleware xác thực user
const auth = function (req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Middleware kiểm tra quyền admin
const isAdmin = function (req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Bạn không có quyền admin' });
};

module.exports = { auth, isAdmin }; 