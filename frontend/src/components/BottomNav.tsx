import { NavLink } from 'react-router-dom';
import { UserRole } from '../types';

interface BottomNavProps {
  role: UserRole;
}

const navItems: Record<UserRole, Array<{ to: string; label: string }>> = {
  STUDENT: [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/shop', label: 'Shop' },
    { to: '/notifications', label: 'Alerts' },
  ],
  STAFF: [
    { to: '/staff', label: 'Overview' },
    { to: '/staff/approvals', label: 'Approvals' },
    { to: '/staff/orders', label: 'Orders' },
  ],
  ROOT: [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/audit', label: 'Audit' },
  ],
};

export function BottomNav({ role }: BottomNavProps) {
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
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
