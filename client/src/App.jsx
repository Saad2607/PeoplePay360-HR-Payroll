import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ContractsPage } from './pages/ContractsPage';
import { AttendancePage } from './pages/AttendancePage';
import { TimeOffPage } from './pages/TimeOffPage';
import { PayrollPage } from './pages/PayrollPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen label="Verifying session authorization..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen label="Checking admin authorization..." />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { role, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen label="Checking role permissions..." />;
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedLayout>
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              </ProtectedLayout>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedLayout>
                <RoleRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']}>
                  <EmployeesPage />
                </RoleRoute>
              </ProtectedLayout>
            }
          />
          <Route
            path="/contracts"
            element={
              <ProtectedLayout>
                <RoleRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']}>
                  <ContractsPage />
                </RoleRoute>
              </ProtectedLayout>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedLayout>
                <AttendancePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/timeoff"
            element={
              <ProtectedLayout>
                <TimeOffPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedLayout>
                <PayrollPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedLayout>
                <ReportsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="*"
            element={
              <ProtectedLayout>
                <NotFoundPage />
              </ProtectedLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
