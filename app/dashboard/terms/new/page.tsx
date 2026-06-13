import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TermsForm from '../TermsForm';
import Link from 'next/link';

type Params = {
  searchParams: Promise<{ scope?: string; company?: string }>;
};

export default async function NewTermsPage(props: Params) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  const searchParams = await props.searchParams;
  const scope = (searchParams.scope === 'general') ? 'general' : 'company';
  const queryCompany = searchParams.company;

  if (scope === 'general' && !roles.isAdmin) {
    redirect('/dashboard');
  }

  const companyId = roles.isAdmin && queryCompany ? queryCompany : roles.company;

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Create New Version</h1>
          <p className="page-subtitle">
            Create a new draft version of terms and policies. The previous version will remain active until you approve and publish this version.
          </p>
        </div>
        <div className="page-actions">
          <Link
            href={`/dashboard/terms?scope=${scope}${queryCompany ? `&company=${queryCompany}` : ''}`}
            className="btn btn-secondary"
          >
            ← Back to List
          </Link>
        </div>
      </div>

      <TermsForm
        mode="create"
        scope={scope}
        companyId={companyId}
        isAdmin={roles.isAdmin}
      />
    </div>
  );
}
