const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin like mobile apps or curl
      if (!origin) return callback(null, true);

      const allowedOrigins = new Set([
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
      ]);

      const isLocalhostDynamicPort = /^http:\/\/localhost:\d+$/.test(origin);
      const isLocalNetwork = /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/.test(origin);

      if (allowedOrigins.has(origin) || isLocalhostDynamicPort || isLocalNetwork) {
        return callback(null, true);
      }
      return callback(new Error(`CORS not allowed from origin: ${origin}`));
    },
    credentials: true,
  })
);

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Learnsy API is running',
    timestamp: new Date().toISOString(),
    database: 'Connected to MongoDB'
  });
});

// Main Routes - only include working routes
app.use('/api/auth', require('./routes/auth'));

// Dedicated Signup Routes
app.use('/api/signup', require('./routes/signupRoutes'));

// Basic routes with placeholder content
app.use('/api/courses', require('./routes/courses'));
app.use('/api/materials', require('./routes/materials'));

// Student Dashboard Routes
try {
  app.use('/api/student-dashboard', require('./routes/studentDashboardRoutes'));
} catch (error) {
  console.log('Student dashboard routes not available');
}

// Student Routes
try {
  app.use('/api/student', require('./routes/studentRoutes'));
} catch (error) {
  console.log('Student routes not available');
}

// Progress Routes
try {
  app.use('/api/progress', require('./routes/progress'));
} catch (error) {
  console.log('Progress routes not available');
}

// New Progress Routes
try {
  app.use('/api/progress', require('./routes/progressRoutes'));
} catch (error) {
  console.log('New progress routes not available');
}

// Study Session Routes
try {
  app.use('/api/study-sessions', require('./routes/studySessionRoutes'));
} catch (error) {
  console.log('Study session routes not available');
}

// Enrollments Routes
try {
  app.use('/api/enrollments', require('./routes/enrollments'));
} catch (error) {
  console.log('Enrollments routes not available');
}

// AI Tools Routes
try {
  app.use('/api/ai-tools', require('./routes/aiToolsRoutes'));
} catch (error) {
  console.log('AI Tools routes not available');
}

// Faculty Routes
try {
  app.use('/api/faculty', require('./routes/facultyRoutes'));
} catch (error) {
  console.log('Faculty routes not available');
}

// Faculty Dashboard Routes
try {
  app.use('/api/faculty-dashboard', require('./routes/facultyDashboardRoutes'));
} catch (error) {
  console.log('Faculty dashboard routes not available');
}

// Additional routes (check if they exist and have content)
try {
  app.use('/api/contact', require('./routes/contact'));
} catch (error) {
  console.log('Contact routes not available');
}

try {
  app.use('/api/feedback', require('./routes/feedback'));
} catch (error) {
  console.log('Feedback routes not available');
}

try {
  app.use('/api/pricing', require('./routes/pricing'));
} catch (error) {
  console.log('Pricing routes not available');
}

// Subscription Routes
try {
  app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
} catch (error) {
  console.log('Subscription routes not available');
}

// QR Code Routes
try {
  app.use('/api/qr', require('./routes/qrRoutes'));
} catch (error) {
  console.log('QR routes not available');
}

// Payment Verification Routes
try {
  app.use('/api/payment-verification', require('./routes/paymentVerificationRoutes'));
} catch (error) {
  console.log('Payment verification routes not available');
}

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

// MongoDB Connection
connectDb()
  .then((connection) => {
    const dbName = connection.connection.name;
    const host = connection.connection.host;
    const port = connection.connection.port;
    console.log(`✅ MongoDB connected successfully to: ${host}:${port}/${dbName}`);
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.error('💡 Make sure MongoDB is running on your system');
    process.exit(1);
  });

module.exports = app;

