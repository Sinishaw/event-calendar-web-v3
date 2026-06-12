import { redirect } from 'next/navigation';
import { verifySession, getRoles } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import './dashboard.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  const user = {
    displayName: session.name as string ?? 'User',
    email:       session.email as string ?? '',
    uid:         session.uid,
    ...roles,
  };

  return (
    <div className="dashboard-root">
      <Sidebar roles={roles} />
      <div className="dashboard-main">
        <Topbar user={user} />
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
