import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import UserHome from './pages/UserHome';
import History from './pages/History';
import Requests from './pages/Requests';
import Payslip from './pages/Payslip';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminShifts from './pages/AdminShifts';
import AdminPolicy from './pages/AdminPolicy';
import AdminApprovals from './pages/AdminApprovals';
import AdminReports from './pages/AdminReports';
import SecureCheckin from './pages/SecureCheckin';
import SecureAdmin from './pages/SecureAdmin';

const canAdmin = (u) => u && ['super_admin', 'hr', 'leader'].includes(u.role);

function Guard({ children, admin }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (admin && !canAdmin(currentUser)) return <Navigate to="/user" replace />;
  return children;
}

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/secure" element={<SecureCheckin />} />
        <Route path="/secure-admin" element={<SecureAdmin />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/user"
          element={
            <Guard>
              <Layout mode="user" />
            </Guard>
          }
        >
          <Route index element={<UserHome />} />
          <Route path="history" element={<History />} />
          <Route path="requests" element={<Requests />} />
          <Route path="payslip" element={<Payslip />} />
        </Route>
        <Route
          path="/admin"
          element={
            <Guard admin>
              <Layout mode="admin" />
            </Guard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="shifts" element={<AdminShifts />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="policy" element={<AdminPolicy />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}