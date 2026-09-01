const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const { getSettingsController, updateSettingsController } = require('../controllers/settingsController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getSettingsController);
router.put('/', updateSettingsController);

module.exports = router;
