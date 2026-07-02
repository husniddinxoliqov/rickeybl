import { NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n';

export default function AdminMorePage() {
  const { t } = useI18n();

  const links = [
    { to: '/admin/badges', label: t('admin.badges.title') },
    { to: '/admin/groups', label: t('admin.groups.title') },
    { to: '/admin/announcements', label: t('admin.announcements.title') },
    { to: '/admin/audit', label: t('admin.audit.title') },
  ];

  return (
    <section>
      <h1>{t('nav.root.more')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={{
              display: 'block',
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              textDecoration: 'none',
              color: '#111827',
              fontWeight: 500,
            }}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </section>
  );
}
