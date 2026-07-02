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
    { to: '/staff/badges', labelKey: 'nav.staff.badges' },
    { to: '/staff/events', labelKey: 'nav.staff.events' },
    { to: '/staff/orders', labelKey: 'nav.staff.orders' },
  ],
  ROOT: [
    { to: '/admin', labelKey: 'nav.root.overview' },
    { to: '/admin/users', labelKey: 'nav.root.users' },
    { to: '/admin/shop', labelKey: 'nav.root.shop' },
    { to: '/admin/events', labelKey: 'nav.root.events' },
    { to: '/admin/more', labelKey: 'nav.root.more' },
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
            fontSize: 12,
          })}
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
