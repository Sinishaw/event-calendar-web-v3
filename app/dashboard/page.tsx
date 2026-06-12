import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import './dashboard.css';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await verifySession();
  if (!session) redirect('/login');
  const roles = getRoles(session);

  const greeting = getGreeting();

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{greeting}, {session.name as string ?? 'there'} 👋</h1>
          <p className="page-subtitle">
            Here's what's happening on your platform today.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="📅" label="Month Images" value="—" />
        <StatCard icon="📝" label="Content Articles" value="—" />
        <StatCard icon="💬" label="Topic Content" value="—" />
        <StatCard icon="🏢" label={roles.company ? 'Your Company' : 'Companies'} value={roles.company ?? '—'} />
      </div>

      {/* Quick Links */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-title">Quick Actions</p>
            <p className="card-subtitle">Jump straight to what you need</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <QuickLink href="/dashboard/month-images" label="Manage Month Images" emoji="📅" />
          <QuickLink href="/dashboard/content" label="Create Content" emoji="✏️" />
          <QuickLink href="/dashboard/topics" label="Browse Topics" emoji="🔍" />
          <QuickLink href="/dashboard/terms" label="Terms & Policies" emoji="📋" />
          {roles.isAdmin && <QuickLink href="/dashboard/company" label="Companies" emoji="🏢" />}
          {roles.isAdmin && <QuickLink href="/dashboard/admin/users" label="User Management" emoji="👥" />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ fontSize: '1.25rem' }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function QuickLink({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <Link href={href} className="quick-link">
      <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
      {label}
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

