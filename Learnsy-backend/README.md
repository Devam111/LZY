# Learnsy Backend

A comprehensive learning management system backend with real-time student progress tracking.

## Features

### Live Student Dashboard
- **Real-time Course Enrollment Count**: Shows current number of enrolled courses
- **Live Average Progress**: Calculates percentage completion across all courses
- **Active Study Time Tracking**: Monitors actual time spent on the website
- **Completed Materials Counter**: Tracks total lectures/videos completed

### Study Session Tracking
- Automatically starts when student visits dashboard
- Tracks browsing, watching, reading, and quiz activities
- Records session duration and course-specific activity
- Provides accurate study time analytics

### Progress Monitoring
- Real-time progress updates across all enrolled courses
- Material completion tracking
- Quiz and assessment progress
- Learning streak and achievement system

## API Endpoints

### Student Dashboard
- `GET /api/student/dashboard` - Get live dashboard stats
- `GET /api/student/enrollments` - Get enrolled courses
- `GET /api/student/materials/:courseId` - Get course materials

### Study Sessions
- `POST /api/study-sessions/start` - Start new study session
- `POST /api/study-sessions/end` - End current session

### Progress Tracking
- `GET /api/progress/student/overview` - Get student progress overview
- `GET /api/progress/instructor/overview` - Get instructor analytics

## Models

### StudySession
- Tracks student activity time
- Records course-specific sessions
- Monitors different activity types
- Provides accurate duration calculation

### Progress
- Course completion tracking
- Lesson and quiz progress
- Study time aggregation
- Achievement tracking

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables
3. Connect to MongoDB
4. Start server: `npm start`

## Real-time Features

The dashboard automatically refreshes every 30 seconds to provide live updates. Study sessions are tracked from the moment a student visits the dashboard until they leave, ensuring accurate time measurement.

