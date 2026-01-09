const AISummary = require('../models/AISummary');
const AISummaryService = require('../utils/aiSummaryService');
const path = require('path');
const fs = require('fs');

// Upload and process file for AI summary
const uploadAndProcessFile = async (req, res) => {
  try {
    const { fileType } = req.body;
    const studentId = req.user.id;

    console.log('Upload request:', {
      fileType: fileType,
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!fileType) {
      // Delete uploaded file if no fileType
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File type is required'
      });
    }

    // Validate file type
    if (!AISummaryService.validateFileType(req.file.originalname, fileType)) {
      // Delete uploaded file if invalid
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: `Invalid file type for ${fileType}. Please upload a valid file.`
      });
    }

    // Create AI summary record
    const aiSummary = new AISummary({
      studentId,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      fileUrl: req.file.path,
      processingStatus: 'processing'
    });

    await aiSummary.save();

    // Process file asynchronously
    processFileAsync(aiSummary._id, req.file.path, fileType, req.file.originalname);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully. Processing started.',
      summaryId: aiSummary._id,
      processingStatus: 'processing'
    });

  } catch (error) {
    console.error('Upload and process error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading and processing file'
    });
  }
};

// Process file asynchronously
const processFileAsync = async (summaryId, filePath, fileType, fileName) => {
  try {
    const aiSummary = await AISummary.findById(summaryId);
    if (!aiSummary) {
      throw new Error('AI Summary not found');
    }

    let result;
    
    // Process based on file type
    switch (fileType) {
      case 'video':
        result = await AISummaryService.generateVideoSummary(filePath, fileName);
        break;
      case 'pdf':
        result = await AISummaryService.generatePDFSummary(filePath, fileName);
        break;
      case 'ppt':
        result = await AISummaryService.generatePPTSummary(filePath, fileName);
        break;
      default:
        throw new Error('Unsupported file type');
    }

    // Update AI summary with results
    aiSummary.summary = result.summary;
    aiSummary.keyPoints = result.keyPoints;
    aiSummary.tags = result.tags;
    aiSummary.processingStatus = 'completed';

    // Add type-specific fields
    if (fileType === 'video' && result.duration) {
      aiSummary.duration = result.duration;
    }
    if (fileType === 'pdf' && result.pageCount) {
      aiSummary.pageCount = result.pageCount;
    }
    if (fileType === 'ppt' && result.slideCount) {
      aiSummary.slideCount = result.slideCount;
    }

    await aiSummary.save();

  } catch (error) {
    console.error('Async processing error:', error);
    
    // Update status to failed
    try {
      const aiSummary = await AISummary.findById(summaryId);
      if (aiSummary) {
        aiSummary.processingStatus = 'failed';
        aiSummary.processingError = error.message;
        await aiSummary.save();
      }
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }
  }
};

// Get all AI summaries for a student
const getMySummaries = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { fileType, status } = req.query;

    let query = { studentId };
    
    if (fileType) {
      query.fileType = fileType;
    }
    
    if (status) {
      query.processingStatus = status;
    }

    const summaries = await AISummary.find(query)
      .sort({ createdAt: -1 })
      .select('-fileUrl'); // Don't include file path for security

    res.json({
      success: true,
      summaries,
      count: summaries.length
    });

  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching summaries'
    });
  }
};

// Get specific AI summary
const getSummaryById = async (req, res) => {
  try {
    const { summaryId } = req.params;
    const studentId = req.user.id;

    const summary = await AISummary.findOne({
      _id: summaryId,
      studentId
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found'
      });
    }

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching summary'
    });
  }
};

// Download original file
const downloadFile = async (req, res) => {
  try {
    const { summaryId } = req.params;
    const studentId = req.user.id;

    const summary = await AISummary.findOne({
      _id: summaryId,
      studentId
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(summary.fileUrl)) {
      return res.status(404).json({
        success: false,
        message: 'File no longer exists on server'
      });
    }

    // Increment download count
    await summary.incrementDownload();

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${summary.originalFileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream file to client
    const fileStream = fs.createReadStream(summary.fileUrl);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
};

// Delete AI summary
const deleteSummary = async (req, res) => {
  try {
    const { summaryId } = req.params;
    const studentId = req.user.id;

    const summary = await AISummary.findOne({
      _id: summaryId,
      studentId
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(summary.fileUrl)) {
      fs.unlinkSync(summary.fileUrl);
    }

    // Delete from database
    await AISummary.findByIdAndDelete(summaryId);

    res.json({
      success: true,
      message: 'Summary deleted successfully'
    });

  } catch (error) {
    console.error('Delete summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting summary'
    });
  }
};

// Get AI tools statistics
const getAIStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    const stats = await AISummary.aggregate([
      { $match: { studentId: new require('mongoose').Types.ObjectId(studentId) } },
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          completed: {
            $sum: { $cond: [{ $eq: ['$processingStatus', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const totalSummaries = await AISummary.countDocuments({ studentId });
    const completedSummaries = await AISummary.countDocuments({ 
      studentId, 
      processingStatus: 'completed' 
    });

    res.json({
      success: true,
      stats: {
        totalSummaries,
        completedSummaries,
        byType: stats,
        completionRate: totalSummaries > 0 ? (completedSummaries / totalSummaries * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get AI stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI statistics'
    });
  }
};

module.exports = {
  uploadAndProcessFile,
  getMySummaries,
  getSummaryById,
  downloadFile,
  deleteSummary,
  getAIStats
};
