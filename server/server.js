require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const { logRequests, errorHandler } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 9000;

connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use(logRequests);

// Rate limiting - tạm thời comment out để test
// app.use(rateLimit(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/gamedata', require('./routes/gameData'));
app.use('/api/pets', require('./routes/pet'));
app.use('/api/userpets', require('./routes/userPet'));
// TODO: Add other routes as they are created
// app.use('/api/inventory', require('./routes/inventory'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 