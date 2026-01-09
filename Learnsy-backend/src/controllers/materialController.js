const Material = require('../models/Material');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const MaterialCompletion = require('../models/MaterialCompletion');

// Get materials for a course
const getCourseMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Check if student is enrolled in the course
    let enrollment = null;
    if (req.user.role === 'student') {
      enrollment = await Enrollment.findOne({
        studentId,
        courseId,
        status: 'active'
      });

      // Don't block access, just note that they're not enrolled
      // Materials will still be shown but checkboxes won't work
      if (!enrollment) {
        console.log(`Student ${studentId} is not enrolled in course ${courseId}, but allowing material view`);
      }
    }

    // Get course details
    const course = await Course.findById(courseId).populate('facultyId', 'name email');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get materials for the course - sort by order, then by newest first
    const materials = await Material.find({ 
      courseId, 
      isPublished: true 
    }).sort({ order: 1, createdAt: -1 });

    // Get completed materials for this student
    const completedMaterials = await MaterialCompletion.find({
      studentId,
      courseId
    }).select('materialId');

    const completedMaterialIds = new Set(
      completedMaterials.map(cm => cm.materialId.toString())
    );

    // Add fileUrl and completion status to materials
    const materialsWithUrls = materials.map(material => {
      const materialObj = material.toObject();
      if (materialObj.filePath) {
        const fileName = materialObj.filePath.split('/').pop();
        materialObj.fileUrl = `/uploads/materials/${fileName}`;
      }
      materialObj.isCompleted = completedMaterialIds.has(materialObj._id.toString());
      return materialObj;
    });

    // Get quizzes for the course
    const quizzes = await Quiz.find({ 
      courseId, 
      isPublished: true 
    }).sort({ order: 1 });

    // Get student progress if student
    let studentProgress = null;
    if (req.user.role === 'student') {
      studentProgress = await Progress.findOne({
        studentId,
        courseId
      });
    }

    // Return materials even if not enrolled (for viewing purposes)
    return res.json({
      success: true,
      materials: materialsWithUrls,
      quizzes: quizzes || [],
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        faculty: course.facultyId,
        modules: course.modules,
        totalLessons: course.totalLessons
      },
      progress: studentProgress ? {
        lessonsCompleted: studentProgress.lessonsCompleted,
        progressPercentage: studentProgress.progressPercentage,
        lastAccessed: studentProgress.lastAccessed
      } : null,
      isEnrolled: !!enrollment
    });

  } catch (error) {
    console.error('Get course materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course materials'
    });
  }
};

// Get material details
const getMaterialDetails = async (req, res) => {
  try {
    const { materialId } = req.params;
    const studentId = req.user.id;

    const material = await Material.findById(materialId)
      .populate('courseId', 'title')
      .populate('facultyId', 'name email');

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check enrollment for students
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId: material.courseId._id,
        status: 'active'
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to view this material'
        });
      }

      // Increment view count
      await material.incrementViews();
    }

    res.json({
      success: true,
      material
    });

  } catch (error) {
    console.error('Get material details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching material details'
    });
  }
};

// Mark material as completed (toggle - can mark/unmark)
const markMaterialCompleted = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { completed } = req.body; // true to mark as completed, false to unmark
    const studentId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can mark materials as completed'
      });
    }

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: material.courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course'
      });
    }

    // Check if already completed
    const existingCompletion = await MaterialCompletion.findOne({
      studentId,
      materialId
    });

    if (completed === false || completed === 'false') {
      // Unmark as completed
      if (existingCompletion) {
        await MaterialCompletion.findByIdAndDelete(existingCompletion._id);
        // Decrement material completion count if needed
        if (material.completions > 0) {
          material.completions -= 1;
          await material.save();
        }
      }
    } else {
      // Mark as completed
      if (!existingCompletion) {
        await MaterialCompletion.create({
          studentId,
          materialId,
          courseId: material.courseId
        });
        // Increment material completion count
        await material.incrementCompletions();
      }
    }

    // Update student progress based on completed materials count
    const totalMaterials = await Material.countDocuments({ 
      courseId: material.courseId, 
      isPublished: true 
    });
    
    const completedMaterialsCount = await MaterialCompletion.countDocuments({
      studentId,
      courseId: material.courseId
    });

    // Get or create progress record
    let progress = await Progress.findOne({
      studentId,
      courseId: material.courseId
    });

    if (!progress) {
      const course = await Course.findById(material.courseId);
      progress = new Progress({
        studentId,
        courseId: material.courseId,
        enrollmentId: enrollment._id,
        totalLessons: totalMaterials
      });
    }

    // Update progress
    progress.lessonsCompleted = completedMaterialsCount;
    progress.totalLessons = totalMaterials;
    progress.lastAccessed = new Date();
    
    // Calculate progress percentage
    const percentage = totalMaterials > 0 
      ? (completedMaterialsCount / totalMaterials) * 100 
      : 0;
    progress.progressPercentage = Math.min(Math.round(percentage), 100); // Cap at 100%
    
    await progress.save();

    // Update enrollment progress - ensure progress object exists
    if (!enrollment.progress) {
      enrollment.progress = {
        lessonsCompleted: 0,
        totalLessons: 0,
        percentage: 0,
        lastAccessed: new Date()
      };
    }
    enrollment.progress.percentage = progress.progressPercentage;
    enrollment.progress.lessonsCompleted = completedMaterialsCount;
    enrollment.progress.totalLessons = totalMaterials;
    enrollment.progress.lastAccessed = new Date();
    await enrollment.save();

    res.json({
      success: true,
      message: completed === false ? 'Material unmarked as completed' : 'Material marked as completed',
      completed: completed !== false,
      progress: {
        completedMaterials: completedMaterialsCount,
        totalMaterials: totalMaterials,
        percentage: progress.progressPercentage
      }
    });

  } catch (error) {
    console.error('Mark material completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking material as completed'
    });
  }
};

// Create material (for faculty)
const createMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can create materials'
      });
    }

    // Handle both 'course' and 'courseId' field names
    const courseId = req.body.courseId || req.body.course;
    const { courseId: _, course: __, ...materialData } = req.body;
    
    // Verify course exists and faculty owns it
    const course = await Course.findById(courseId);
    if (!course || course.facultyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Course not found or you do not have permission to add materials'
      });
    }

    // Handle file upload if present
    let filePath = null;
    let fileUrl = null;
    if (req.file) {
      filePath = req.file.path;
      // Generate file URL for accessing the file
      const fileName = req.file.filename;
      fileUrl = `/uploads/materials/${fileName}`;
    }

    const material = new Material({
      ...materialData,
      courseId,
      facultyId: req.user.id,
      filePath: filePath,
      url: fileUrl,
      isPublished: materialData.isPublished !== undefined ? materialData.isPublished : true // Default to published
    });

    await material.save();

    // Update course total lessons count
    const materialCount = await Material.countDocuments({ 
      courseId, 
      isPublished: true 
    });
    await Course.findByIdAndUpdate(courseId, { 
      totalLessons: materialCount 
    });

    // Return material with fileUrl
    const materialResponse = material.toObject();
    if (fileUrl) {
      materialResponse.fileUrl = fileUrl;
    }

    res.status(201).json({
      success: true,
      material: materialResponse
    });

  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating material'
    });
  }
};

// Update material (for faculty)
const updateMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can update materials'
      });
    }

    const { materialId } = req.params;
    const material = await Material.findById(materialId);

    if (!material || material.facultyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Material not found or you do not have permission to update it'
      });
    }

    const updatedMaterial = await Material.findByIdAndUpdate(
      materialId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      material: updatedMaterial
    });

  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating material'
    });
  }
};

// Delete material (for faculty)
const deleteMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can delete materials'
      });
    }

    const { materialId } = req.params;
    const material = await Material.findById(materialId);

    if (!material || material.facultyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Material not found or you do not have permission to delete it'
      });
    }

    await Material.findByIdAndDelete(materialId);

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });

  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting material'
    });
  }
};

// Get materials for faculty's course
const getFacultyCourseMaterials = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can access this endpoint'
      });
    }

    const { courseId } = req.params;
    
    // Verify course exists and faculty owns it
    const course = await Course.findById(courseId).populate('facultyId', 'name email');
    if (!course || course.facultyId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Course not found or you do not have permission to view its materials'
      });
    }

    // Get all materials for the course (including unpublished)
    const materials = await Material.find({ courseId }).sort({ order: 1 });

    // Add fileUrl to materials if filePath exists
    const materialsWithUrls = materials.map(material => {
      const materialObj = material.toObject();
      if (materialObj.filePath) {
        const fileName = materialObj.filePath.split('/').pop();
        materialObj.fileUrl = `/uploads/materials/${fileName}`;
      }
      return materialObj;
    });

    res.json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        faculty: course.facultyId
      },
      materials: materialsWithUrls
    });

  } catch (error) {
    console.error('Get faculty course materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course materials'
    });
  }
};

// Get completed materials for a student in a course
const getCompletedMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can access completed materials'
      });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course'
      });
    }

    // Get completed materials
    const completions = await MaterialCompletion.find({
      studentId,
      courseId
    }).populate('materialId', 'title type');

    res.json({
      success: true,
      completedMaterials: completions.map(c => c.materialId._id.toString())
    });

  } catch (error) {
    console.error('Get completed materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching completed materials'
    });
  }
};

module.exports = {
  getCourseMaterials,
  getMaterialDetails,
  markMaterialCompleted,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getFacultyCourseMaterials,
  getCompletedMaterials
};
