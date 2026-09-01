const express = require('express');
const { prisma } = require('../config/prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;

    return res.status(200).json({
      success: true,
      message: 'Backend Express is running',
      database: 'connected',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

module.exports = router;
