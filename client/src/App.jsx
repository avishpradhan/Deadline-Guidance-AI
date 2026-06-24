import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from './stores/authStore';

// Layout
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CreateGoalPage from './pages/CreateGoalPage';
import AIPlanPage from './pages/AIPlanPage';
import GoalDetailPage from './pages/GoalDetailPage';
import CheckinPage from './pages/CheckinPage';
import ReplanPage from './pages/ReplanPage';
import CompletionPage from './pages/CompletionPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateGoalPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/:id/analyze"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AIPlanPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GoalDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/:id/checkin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CheckinPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/:id/replan"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReplanPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/:id/complete"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CompletionPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
