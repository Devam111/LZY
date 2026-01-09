# Learnsy - Learning Management System Frontend

A modern React-based frontend for a learning management system. This project provides the user interface for both student and faculty roles with comprehensive course management, progress tracking, and learning tools.

## 🚀 Features

### For Students
- **Dashboard**: Track progress, view enrolled courses, and access learning materials
- **Progress Tracking**: Monitor completion rates and learning analytics
- **AI Tools**: Intelligent revision tools and personalized learning recommendations
- **Course Materials**: Access videos, notes, documentation, and learning roadmaps

### For Faculty
- **Course Management**: Create, edit, and organize courses with modules
- **Content Upload**: Upload various types of learning materials
- **Student Analytics**: Monitor student progress and engagement
- **Resource Management**: Organize and publish learning resources

### Technical Features
- **Modern UI**: Built with React 19 and Tailwind CSS
- **Responsive Design**: Mobile-first approach with beautiful UI components
- **State Management**: Efficient state management with React hooks
- **Routing**: Client-side routing with React Router
- **Component Library**: Reusable UI components for consistent design
- **Mock API**: Built-in mock API system for development without backend

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Linting**: ESLint

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd learnsy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173

## 🔌 Mock API System

This frontend includes a comprehensive mock API system that allows you to develop and test the application without a backend server. The mock API provides:

- **Authentication**: Mock login/register with predefined test accounts
- **Data Persistence**: In-memory data storage during the session
- **Realistic Responses**: Simulated API delays and proper error handling
- **Test Accounts**: Pre-configured student and faculty accounts

### Test Accounts

#### Student Account
- **Email**: john.doe@student.edu
- **Password**: student123

#### Faculty Account
- **Email**: sarah.johnson@university.edu
- **Password**: faculty123

### Mock Data
The system includes sample data for:
- Sample courses with modules
- Student enrollments
- Learning materials
- Progress tracking

## 🔧 Development

### Project Structure
```
learnsy/
├── src/
│   ├── api/
│   │   ├── index.js          # Main API configuration with mock system
│   │   ├── auth.js           # Authentication API functions
│   │   ├── faculty.js        # Faculty-related API functions
│   │   └── student.js        # Student-related API functions
│   ├── components/
│   │   ├── common/           # Shared components (Header, Footer, etc.)
│   │   ├── faculty/          # Faculty-specific components
│   │   └── student/          # Student-specific components
│   ├── pages/                # Page components
│   └── App.jsx               # Main application component
├── public/                   # Static assets
├── package.json
└── vite.config.js           # Vite configuration
```

### Available Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔌 Backend Integration

When you're ready to connect to a real backend:

1. **Replace Mock API**: Update `src/api/index.js` to use real HTTP requests
2. **Update API Configuration**: Modify the API base URL to point to your backend
3. **Update Endpoints**: Ensure API endpoints match your backend routes
4. **Environment Variables**: Set up environment variables for your backend URL

### Example Real API Configuration
```javascript
// In src/api/index.js
const API_BASE_URL = 'http://your-backend-url:port/api';

// Replace mockApiRequest with real fetch calls
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  return response.json();
};
```

## 🎯 Usage Guide

### For Students

1. **Registration**: Sign up as a student with your student ID
2. **Login**: Access your personalized dashboard
3. **Browse Courses**: View available courses and enroll
4. **Track Progress**: Monitor your learning progress
5. **Access Materials**: View videos, notes, and documentation
6. **Use AI Tools**: Leverage revision tools for better learning

### For Faculty

1. **Registration**: Sign up as faculty with your institution details
2. **Login**: Access the faculty dashboard
3. **Create Courses**: Build comprehensive courses with modules
4. **Upload Materials**: Add various types of learning resources
5. **Monitor Students**: Track student progress and engagement
6. **Manage Content**: Organize and publish learning materials

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change port in `vite.config.js` if needed
   - Kill existing processes using the port

2. **Build Errors**
   - Clear `node_modules` and reinstall dependencies
   - Check for syntax errors in components

3. **Mock API Issues**
   - Check browser console for error messages
   - Verify test account credentials
   - Clear browser localStorage if authentication issues persist

4. **Real Backend Connection Issues**
   - Verify backend is running and accessible
   - Check API URL configuration
   - Ensure CORS is properly configured on your backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the component documentation
- Open an issue on GitHub

---

**Happy Learning! 🎓**
