import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { WeeklyPlannerPage } from '@/pages/WeeklyPlannerPage';
import { ReconciliationPage } from '@/pages/ReconciliationPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ManagerDashboardPage } from '@/pages/ManagerDashboardPage';
import { RCDOAdminPage } from '@/pages/RCDOAdminPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route
              element={
                <ProtectedRoute allowedRoles={['MEMBER', 'MANAGER', 'ADMIN']}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<WeeklyPlannerPage />} />
              <Route path="reconcile" element={<ReconciliationPage />} />
              <Route path="history" element={<HistoryPage />} />
            </Route>

            <Route
              path="team"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<ManagerDashboardPage />} />
            </Route>

            <Route
              path="admin/rcdo"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<RCDOAdminPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
