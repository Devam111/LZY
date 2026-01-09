const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const {
  uploadAndProcessFile,
  getMySummaries,
  getSummaryById,
  downloadFile,
  deleteSummary,
  getAIStats
} = require('../controllers/aiToolsController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/ai-files');
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    video: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/webm'],
    pdf: ['application/pdf'],
    ppt: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
  };

  const fileType = req.body.fileType;
  
  console.log('File filter check:', {
    fileType: fileType,
    mimetype: file.mimetype,
    originalname: file.originalname
  });
  
  if (!fileType) {
    return cb(new Error('File type is required'), false);
  }
  
  if (allowedTypes[fileType] && allowedTypes[fileType].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${fileType}. Expected: ${allowedTypes[fileType]?.join(', ') || 'unknown'}, Got: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 100MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Apply authentication middleware to all routes
router.use(auth());

// POST /api/ai-tools/upload - Upload and process file for AI summary
router.post('/upload', upload.single('file'), handleMulterError, uploadAndProcessFile);

// GET /api/ai-tools/summaries - Get all AI summaries for student
router.get('/summaries', getMySummaries);

// GET /api/ai-tools/summaries/:summaryId - Get specific AI summary
router.get('/summaries/:summaryId', getSummaryById);

// GET /api/ai-tools/download/:summaryId - Download original file
router.get('/download/:summaryId', downloadFile);

// DELETE /api/ai-tools/summaries/:summaryId - Delete AI summary
router.delete('/summaries/:summaryId', deleteSummary);

// GET /api/ai-tools/stats - Get AI tools statistics
router.get('/stats', getAIStats);

module.exports = router;
