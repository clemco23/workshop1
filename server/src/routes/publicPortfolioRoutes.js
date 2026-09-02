const express = require('express');
const { getPublicPortfolioController } = require('../controllers/portfolioController');

const router = express.Router();

router.get('/portfolio/:slug', getPublicPortfolioController);

module.exports = router;
