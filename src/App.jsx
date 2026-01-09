import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { GoogleOAuthProvider } from "@react-oauth/google";
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import FacultyDashboardPage from './pages/FacultyDashboardPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import ForgotPassword from "./pages/ForgotPassword";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermOfService';
import CookiePolicy from './pages/CookiePolicy';
import FeaturesPage from './pages/FeaturesPage';
import ScrollToTop from './components/common/ScrollToTop';
import { AuthProvider } from './context/AuthContext';



function App() {
  return (
  // <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 to-indigo-100">
          <ScrollToTop />
          <Routes>
          
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/student-dashboard" element={<StudentDashboardPage />} />
            <Route path="/faculty-dashboard" element={<FacultyDashboardPage />} />
            <Route path="/course/:id" element={<CourseDetailsPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/features" element={<FeaturesPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  // </GoogleOAuthProvider>
  );
}

export default App;
