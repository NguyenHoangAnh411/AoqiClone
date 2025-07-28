require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

const app = express();
const PORT = 9000;

connectDB();

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/battle', require('./routes/battle'));
app.use('/api/userpets', require('./routes/userPet'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/formations', require('./routes/formation'));
app.use('/api/admin', require('./routes/admin'));

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
}); 