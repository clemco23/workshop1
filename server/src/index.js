const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars BEFORE importing anything that needs them
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API server is ready');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Global error handler
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
