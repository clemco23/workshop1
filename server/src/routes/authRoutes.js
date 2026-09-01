const express = require('express');
const { requestCodeController, verifyCodeController, meController } = require('../controllers/authController');

const router = express.Router();

router.post('/request-code', requestCodeController);
router.post('/verify-code', verifyCodeController);
router.get('/me', meController);

module.exports = router;
