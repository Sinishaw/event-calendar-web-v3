import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTermDocument } from '@/services/terms.service';
import TermsForm from '../../TermsForm';
import Link from 'next/link';

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scope?: string; company?: string }>;
};

export default async function EditTermsPage(props: Params) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const scope = (searchParams.scope === 'general') ? 'general' : 'company';
  const queryCompany = searchParams.company;

  const roles = getRoles(session);
  if (scope === 'general' && !roles.isAdmin) {
    redirect('/dashboard');
  }

  const companyId = scope === 'general' ? 'general' : (roles.isAdmin && queryCompany ? queryCompany : roles.company);
  if (!companyId) redirect('/dashboard/terms');

  const term = await getTermDocument(companyId, id);
  if (!term) {
    return (
      <div className="alert alert-danger" role="alert">
        Terms version not found.
      </div>
    );
  }

  // Edits are only permitted on Draft versions
  if (term.st !== 0) {
    return (
      <div className="card">
        <div className="alert alert-warning" role="alert">
          🔐 This terms version has already been approved or archived. Edits are locked. Please create a new draft version.
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link href={`/dashboard/terms/${term.id}?scope=${scope}${queryCompany ? `&company=${queryCompany}` : ''}`} className="btn btn-secondary">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Edit Draft Terms</h1>
          <p className="page-subtitle">
            Modify the draft contents. Saving changes will automatically require new approval before publishing.
          </p>
        </div>
        <div className="page-actions">
          <Link
            href={`/dashboard/terms/${id}?scope=${scope}${queryCompany ? `&company=${queryCompany}` : ''}`}
            className="btn btn-secondary"
          >
            ← Back to Details
          </Link>
        </div>
      </div>

      <TermsForm
        mode="edit"
        scope={scope}
        companyId={companyId}
        term={term}
        isAdmin={roles.isAdmin}
      />
    </div>
  );
}
