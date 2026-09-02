const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middlewares/authMiddleware');
const {
  listProjectsController,
  getProjectController,
  createProjectController,
  updateProjectController,
  deleteProjectController,
} = require('../controllers/projectController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(requireAuth);
router.get('/', listProjectsController);
router.post('/', upload.single('file'), createProjectController);
router.get('/:id', getProjectController);
router.patch('/:id', upload.single('file'), updateProjectController);
router.delete('/:id', deleteProjectController);

module.exports = router;
