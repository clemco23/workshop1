const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const { getDashboardController } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/', requireAuth, getDashboardController);

module.exports = router;
