import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Institutions from './pages/Institutions';
import EvaluationPage from './pages/Evaluation';
import CompliancePage from './pages/Compliance';
import Reports from './pages/Reports';
import Improvements from './pages/Improvements';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { UiProvider, useUi } from './contexts/UiContext';

// Protected Route Component handling Auth and Role Check
const ProtectedRoute: React.FC<{ children: React.ReactNode, requiredRole?: 'admin' | 'user' }> = ({ children, requiredRole }) => {
    const { isAuthenticated, role } = useUi();
    
    if (!isAuthenticated) {
        return <Login />;
    }

    // If route requires admin but user is not admin
    if (requiredRole === 'admin' && role !== 'admin') {
        return <Navigate to="/institutions" replace />;
    }

    return <>{children}</>;
};

// Root Redirect based on Role
const HomeRedirect: React.FC = () => {
    const { isAuthenticated, role } = useUi();
    
    if (!isAuthenticated) return <Login />;
    
    // Admin goes to Strategic Dashboard
    if (role === 'admin') return <Dashboard />;
    
    // User goes to their Institution Data
    return <Navigate to="/institutions" replace />;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          
          {/* Admin Only Routes */}
          <Route path="/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>} />

          {/* Shared Routes (Admin & User) */}
          <Route path="/institutions" element={<ProtectedRoute><Institutions /></ProtectedRoute>} />
          <Route path="/evaluation" element={<ProtectedRoute><EvaluationPage /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
          <Route path="/improvements" element={<ProtectedRoute><Improvements /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <UiProvider>
        <Router>
          <Layout>
            <AppRoutes />
          </Layout>
        </Router>
    </UiProvider>
  );
};

export default App;