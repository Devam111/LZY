const mongoose = require('mongoose');

const aiSummarySchema = new mongoose.Schema(
  {
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'SignupUser', 
      required: true 
    },
    fileName: { 
      type: String, 
      required: true 
    },
    originalFileName: { 
      type: String, 
      required: true 
    },
    fileType: { 
      type: String, 
      enum: ['video', 'pdf', 'ppt'], 
      required: true 
    },
    fileSize: { 
      type: Number, 
      required: true 
    },
    fileUrl: { 
      type: String, 
      required: true 
    },
    summary: { 
      type: String, 
      required: true 
    },
    keyPoints: [String],
    duration: { 
      type: String 
    }, // For video files
    pageCount: { 
      type: Number 
    }, // For PDF files
    slideCount: { 
      type: Number 
    }, // For PPT files
    processingStatus: { 
      type: String, 
      enum: ['processing', 'completed', 'failed'], 
      default: 'processing' 
    },
    processingError: { 
      type: String 
    },
    tags: [String],
    isPublic: { 
      type: Boolean, 
      default: false 
    },
    downloadCount: { 
      type: Number, 
      default: 0 
    }
  },
  { timestamps: true }
);

// Index for efficient queries
aiSummarySchema.index({ studentId: 1, fileType: 1 });
aiSummarySchema.index({ createdAt: -1 });
aiSummarySchema.index({ processingStatus: 1 });

// Virtual for file size in human readable format
aiSummarySchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to update processing status
aiSummarySchema.methods.updateStatus = function(status, error = null) {
  this.processingStatus = status;
  if (error) {
    this.processingError = error;
  }
  return this.save();
};

// Method to increment download count
aiSummarySchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

module.exports = mongoose.model('AISummary', aiSummarySchema);
