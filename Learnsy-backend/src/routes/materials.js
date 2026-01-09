const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getCourseMaterials,
  getMaterialDetails,
  markMaterialCompleted,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getFacultyCourseMaterials,
  getCompletedMaterials
} = require('../controllers/materialController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/materials/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|mp4|avi|mov|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, videos, and archives are allowed.'));
    }
  }
});

// GET /api/materials/course/:courseId - Get all materials for a course (students)
router.get('/course/:courseId', auth(), getCourseMaterials);

// GET /api/materials/faculty/course/:courseId - Get all materials for a course (faculty)
router.get('/faculty/course/:courseId', auth(), getFacultyCourseMaterials);

// GET /api/materials/:materialId - Get material details
router.get('/:materialId', auth(), getMaterialDetails);

// POST /api/materials/:materialId/complete - Mark material as completed (toggle)
// Body: { completed: true/false }
router.post('/:materialId/complete', auth(), markMaterialCompleted);

// GET /api/materials/course/:courseId/completed - Get completed materials for a course
router.get('/course/:courseId/completed', auth(), getCompletedMaterials);

// POST /api/materials - Create new material (faculty only) with file upload
router.post('/', auth(), upload.single('file'), createMaterial);

// PUT /api/materials/:materialId - Update material (faculty only) with file upload
router.put('/:materialId', auth(), upload.single('file'), updateMaterial);

// DELETE /api/materials/:materialId - Delete material (faculty only)
router.delete('/:materialId', auth(), deleteMaterial);

module.exports = router;