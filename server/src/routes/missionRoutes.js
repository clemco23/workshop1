const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const {
  listMissionsController,
  getMissionController,
  createMissionController,
  updateMissionController,
  deleteMissionController,
} = require('../controllers/missionController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listMissionsController);
router.post('/', createMissionController);
router.get('/:id', getMissionController);
router.patch('/:id', updateMissionController);
router.delete('/:id', deleteMissionController);

module.exports = router;
