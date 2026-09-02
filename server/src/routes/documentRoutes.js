const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middlewares/authMiddleware');
const {
  listDocumentsController,
  getDocumentController,
  createDocumentController,
  updateDocumentController,
  getDocumentUrlController,
  deleteDocumentController,
} = require('../controllers/documentController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(requireAuth);
router.get('/', listDocumentsController);
router.post('/', upload.single('file'), createDocumentController);
router.get('/:id', getDocumentController);
router.get('/:id/url', getDocumentUrlController);
router.patch('/:id', upload.single('file'), updateDocumentController);
router.delete('/:id', deleteDocumentController);

module.exports = router;
