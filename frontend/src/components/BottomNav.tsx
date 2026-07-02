import { NavLink } from 'react-router-dom';
import { UserRole } from '../types';
import { useI18n } from '../i18n';

interface BottomNavProps {
  role: UserRole;
}

const navItems: Record<UserRole, Array<{ to: string; labelKey: string }>> = {
  STUDENT: [
    { to: '/', labelKey: 'nav.student.home' },
    { to: '/events', labelKey: 'nav.student.events' },
    { to: '/announcements', labelKey: 'nav.student.announcements' },
    { to: '/shop', labelKey: 'nav.student.shop' },
    { to: '/notifications', labelKey: 'nav.student.alerts' },
  ],
  STAFF: [
    { to: '/staff', labelKey: 'nav.staff.overview' },
    { to: '/staff/approvals', labelKey: 'nav.staff.approvals' },
    { to: '/staff/orders', labelKey: 'nav.staff.orders' },
    { to: '/staff/announcements', labelKey: 'nav.staff.announcements' },
    { to: '/staff/audit', labelKey: 'nav.staff.audit' },
  ],
  ROOT: [
    { to: '/admin', labelKey: 'nav.root.overview' },
    { to: '/admin/users', labelKey: 'nav.root.users' },
    { to: '/admin/announcements', labelKey: 'nav.root.announcements' },
    { to: '/admin/audit', labelKey: 'nav.root.audit' },
  ],
};

export function BottomNav({ role }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 8px calc(12px + env(safe-area-inset-bottom))',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
      }}
    >
      {navItems[role].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            color: isActive ? '#0f766e' : '#6b7280',
            textDecoration: 'none',
            fontWeight: isActive ? 700 : 500,
          })}
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
