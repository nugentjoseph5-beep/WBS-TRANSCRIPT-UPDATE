import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { initializeMsal, handleMsalRedirect, getAccount } from "@/lib/msalConfig";
import { authAPI } from "@/lib/api";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import ServiceSelection from "@/pages/student/ServiceSelection";
import NewRequest from "@/pages/student/NewRequest";
import NewRecommendation from "@/pages/student/NewRecommendation";
import EditRecommendation from "@/pages/student/EditRecommendation";
import RequestDetail from "@/pages/student/RequestDetail";
import RecommendationDetail from "@/pages/student/RecommendationDetail";
import EditRequest from "@/pages/student/EditRequest";
import StudentNotifications from "@/pages/student/StudentNotifications";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminRequests from "@/pages/admin/AdminRequests";
import AdminRequestDetail from "@/pages/admin/AdminRequestDetail";
import AdminRecommendations from "@/pages/admin/AdminRecommendations";
import AdminRecommendationDetail from "@/pages/admin/AdminRecommendationDetail";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import StaffDashboard from "@/pages/staff/StaffDashboard";
import StaffRequestDetail from "@/pages/staff/StaffRequestDetail";
import StaffRecommendationDetail from "@/pages/staff/StaffRecommendationDetail";
import StaffNotifications from "@/pages/staff/StaffNotifications";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'staff') return <Navigate to="/staff" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route - redirect if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'staff') return <Navigate to="/staff" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/select-service" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ServiceSelection />
        </ProtectedRoute>
      } />
      <Route path="/student/new-request" element={
        <ProtectedRoute allowedRoles={['student']}>
          <NewRequest />
        </ProtectedRoute>
      } />
      <Route path="/student/new-recommendation" element={
        <ProtectedRoute allowedRoles={['student']}>
          <NewRecommendation />
        </ProtectedRoute>
      } />
      <Route path="/student/request/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <RequestDetail />
        </ProtectedRoute>
      } />
      <Route path="/student/recommendation/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <RecommendationDetail />
        </ProtectedRoute>
      } />
      <Route path="/student/recommendation/:id/edit" element={
        <ProtectedRoute allowedRoles={['student']}>
          <EditRecommendation />
        </ProtectedRoute>
      } />
      <Route path="/student/request/:id/edit" element={
        <ProtectedRoute allowedRoles={['student']}>
          <EditRequest />
        </ProtectedRoute>
      } />
      <Route path="/student/notifications" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentNotifications />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/requests" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminRequests />
        </ProtectedRoute>
      } />
      <Route path="/admin/request/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminRequestDetail />
        </ProtectedRoute>
      } />
      <Route path="/admin/recommendations" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminRecommendations />
        </ProtectedRoute>
      } />
      <Route path="/admin/recommendation/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminRecommendationDetail />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/admin/notifications" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminNotifications />
        </ProtectedRoute>
      } />

      {/* Staff Routes */}
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['staff']}>
          <StaffDashboard />
        </ProtectedRoute>
      } />
      <Route path="/staff/request/:id" element={
        <ProtectedRoute allowedRoles={['staff']}>
          <StaffRequestDetail />
        </ProtectedRoute>
      } />
      <Route path="/staff/recommendation/:id" element={
        <ProtectedRoute allowedRoles={['staff']}>
          <StaffRecommendationDetail />
        </ProtectedRoute>
      } />
      <Route path="/staff/notifications" element={
        <ProtectedRoute allowedRoles={['staff']}>
          <StaffNotifications />
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [msalUser, setMsalUser] = useState(null);

  useEffect(() => {
    // Handle Microsoft redirect response on app startup
    const handleAuth = async () => {
      try {
        await initializeMsal();
        const response = await handleMsalRedirect();
        
        if (response && response.account) {
          // User just came back from Microsoft login
          const account = response.account;
          const email = account.username;
          
          // Validate domain
          const domain = email.split('@')[1]?.toLowerCase();
          if (domain !== 'wolmers.org') {
            console.error('Invalid domain:', domain);
            setLoading(false);
            return;
          }
          
          // Authenticate with backend
          try {
            const backendRes = await authAPI.microsoftAuth({
              email: email,
              name: account.name || email.split('@')[0],
              microsoft_id: account.localAccountId || account.homeAccountId,
              id_token: response.idToken,
            });
            
            if (backendRes.data.access_token && backendRes.data.user) {
              localStorage.setItem('token', backendRes.data.access_token);
              localStorage.setItem('user', JSON.stringify(backendRes.data.user));
              setMsalUser(backendRes.data.user);
            }
          } catch (err) {
            console.error('Backend auth error:', err);
          }
        }
      } catch (error) {
        console.error('MSAL error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    handleAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-500"></div>
      </div>
    );
  }

  return (
    <AuthProvider msalUser={msalUser}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
