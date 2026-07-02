import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { TestModeBanner } from './components/TestModeBanner';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import BadgesPage from './pages/student/BadgesPage';
import DashboardPage from './pages/student/DashboardPage';
import AnnouncementsPage from './pages/student/AnnouncementsPage';
import EventsPage from './pages/student/EventsPage';
import HistoryPage from './pages/student/HistoryPage';
import NotificationsPage from './pages/student/NotificationsPage';
import ShopPage from './pages/student/ShopPage';
import ApprovalsPage from './pages/staff/ApprovalsPage';
import StaffAnnouncementsPage from './pages/staff/StaffAnnouncementsPage';
import StaffAuditPage from './pages/staff/StaffAuditPage';
import OrdersPage from './pages/staff/OrdersPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import AdminAnnouncementsPage from './pages/root/AdminAnnouncementsPage';
import AdminAuditPage from './pages/root/AdminAuditPage';
import AdminDashboardPage from './pages/root/AdminDashboardPage';
import AdminUsersPage from './pages/root/AdminUsersPage';

function AppShell({ role, children }: { role: 'STUDENT' | 'STAFF' | 'ROOT'; children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', color: '#111827' }}>
      <TestModeBanner />
      <main style={{ padding: '88px 16px 96px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <LanguageSwitcher />
        </div>
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  );
}

export default function App() {
  const { user, isLoading, error, studentStatus, loginWithCredentials, loginWithTelegram } = useAuth();

  if (isLoading || !user) {
    return (
      <LoginPage
        isLoading={isLoading}
        error={error}
        onCredentialLogin={loginWithCredentials}
        onTelegramLogin={loginWithTelegram}
      />
    );
  }

  if (user.role === 'STUDENT' && studentStatus !== 'ACTIVE') {
    return <PendingApprovalPage hasProfile={Boolean(user.studentProfile)} />;
  }

  if (user.role === 'ROOT') {
    return (
      <AppShell role="ROOT">
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AppShell>
    );
  }

  if (user.role === 'STAFF') {
    return (
      <AppShell role="STAFF">
        <Routes>
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/staff/approvals" element={<ApprovalsPage />} />
          <Route path="/staff/orders" element={<OrdersPage />} />
          <Route path="/staff/announcements" element={<StaffAnnouncementsPage />} />
          <Route path="/staff/audit" element={<StaffAuditPage />} />
          <Route path="*" element={<Navigate to="/staff" replace />} />
        </Routes>
      </AppShell>
    );
  }

  return (
    <AppShell role="STUDENT">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
