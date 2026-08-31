const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;

    res.status(200).json({
      success: true,
      message: 'Backend Express is running',
      database: 'connected',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.send('API server is ready');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
