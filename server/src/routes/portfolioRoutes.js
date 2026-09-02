const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const {
  createPortfolioController,
  listPortfoliosController,
  getPortfolioController,
  updatePortfolioController,
  updatePortfolioProjectsController,
  deletePortfolioController,
} = require('../controllers/portfolioController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listPortfoliosController);
router.post('/', createPortfolioController);
router.get('/:id', getPortfolioController);
router.patch('/:id', updatePortfolioController);
router.put('/:id/projects', updatePortfolioProjectsController);
router.delete('/:id', deletePortfolioController);

module.exports = router;
