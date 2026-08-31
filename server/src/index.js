const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend Express is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.send('API server is ready');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
