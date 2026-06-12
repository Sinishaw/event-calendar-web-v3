'use client';

import { useRouter } from 'next/navigation';
import styles from './Topbar.module.css';

interface TopbarProps {
  user: {
    displayName: string;
    email: string;
    uid: string;
    isAdmin: boolean;
    company?: string;
  };
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Topbar({ user }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/session-logout');
    router.push('/login');
    router.refresh();
  }

  return (
    <header className={styles.topbar}>
      {/* Breadcrumb placeholder — real breadcrumbs come from page */}
      <div className={styles.topbarLeft}>
        <span className={styles.companyTag}>
          {user.company ? (
            <>
              <span className={styles.companyDot} aria-hidden />
              {user.company}
            </>
          ) : (
            <span className={styles.companyDot} style={{ background: 'var(--success)' }} />
          )}
          {user.isAdmin && (
            <span className="badge badge-accent" style={{ marginLeft: '0.5rem' }}>Admin</span>
          )}
        </span>
      </div>

      <div className={styles.topbarRight}>
        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          className={`btn btn-icon btn-ghost ${styles.topbarBtn}`}
          onClick={() => {
            const html = document.documentElement;
            html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light';
          }}
          aria-label="Toggle color theme"
          title="Toggle theme"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>

        {/* User menu */}
        <div className={styles.userMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.displayName}</span>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
          <div className="avatar" aria-hidden>
            {getInitials(user.displayName)}
          </div>
          <button
            id="logout-btn"
            className={`btn btn-icon btn-ghost ${styles.topbarBtn}`}
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
