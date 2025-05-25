import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import React, { lazy, useEffect, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { initializeDatabase } from './utils/initializeDatabase';
import './App.css';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback: React.ReactNode }, 
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error loading component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Improved lazy loading with retries
const retryLazy = (importFn: () => Promise<{ default: React.ComponentType }>, retries = 3, interval = 1000) => {
  return new Promise<{ default: React.ComponentType }>((resolve, reject) => {
    const retry = (count: number) => {
      importFn()
        .then(resolve)
        .catch((error) => {
          console.warn(`Failed to load module, retries left: ${count}`, error);
          if (count > 0) {
            setTimeout(() => retry(count - 1), interval);
          } else {
            reject(error);
          }
        });
    };
    retry(retries);
  });
};

// Lazy load components with retry
const Login = lazy(() => retryLazy(() => import('./components/auth/Login')));
const Register = lazy(() => retryLazy(() => import('./components/auth/Register')));
const StudentDashboard = lazy(() => retryLazy(() => import('./components/student/StudentDashboard')));
const TeacherDashboard = lazy(() => retryLazy(() => import('./components/teacher/TeacherDashboard')));
const AdvancedManagement = lazy(() => retryLazy(() => import('./components/teacher/AdvancedManagement')));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

// Error fallback component
const ErrorFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <h3 className="text-xl text-red-600 mb-4">Failed to load the application</h3>
    <p className="mb-4">There was an error loading this page.</p>
    <button 
      onClick={() => window.location.reload()} 
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Reload Page
    </button>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// App Routes Component (inside AuthProvider)
const AppRoutes = () => {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Student Routes */}
            <Route 
              path="/student/*" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Teacher Routes */}
            <Route 
              path="/teacher/*" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Advanced Management Route */}
            <Route 
              path="/teacher/advanced" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <AdvancedManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
