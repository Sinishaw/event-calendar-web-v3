import 'server-only';
import { adminDb as db } from '@/lib/firebase-admin';
import { getCompanyConfig, updateCompanyConfig, getGeneralConfig, updateGeneralConfig } from './remote-config.service';
import { TermsAndPolicies, TermsCreateInput } from '@/types/terms';

const COL = 'TermsAndPolicies';

function requestCode(): string {
  const now = new Date();
  const shortYear = now.getFullYear() % 100;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const hour  = String(now.getHours()).padStart(2, '0');
  const min   = String(now.getMinutes()).padStart(2, '0');
  const sec   = String(now.getSeconds()).padStart(2, '0');
  return `${shortYear}${month}${day}${hour}${min}${sec}`;
}

function toISO(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  return new Date(ts).toISOString();
}

function mapToTerms(doc: any): TermsAndPolicies {
  const data = doc.data();
  return {
    id: doc.id,
    description: data.description || '',
    terms: data.terms || '',
    version: data.version ?? 1,
    wUrl: data.wUrl || '',
    published: !!data.published,
    st: data.st ?? 0,
    cb: data.cb || '',
    cd: toISO(data.cd),
    ub: data.ub || '',
    ud: toISO(data.ud),
    ab: data.ab || '',
    ad: data.ad ? toISO(data.ad) : null,
    db: data.db || '',
    dd: data.dd ? toISO(data.dd) : null,
    appVersionNumber: data.appVersionNumber || '',
    appVersionName: data.appVersionName || '',
    appVersionSummary: data.appVersionSummary || '',
  };
}

/** Get all terms records for a company or "general" */
export async function getTermsRecords(companyId: string): Promise<TermsAndPolicies[]> {
  try {
    const snap = await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .get();
    
    const records: TermsAndPolicies[] = [];
    snap.forEach((doc) => {
      records.push(mapToTerms(doc));
    });

    // Sort by version descending
    return records.sort((a, b) => b.version - a.version);
  } catch (err) {
    console.error('getTermsRecords error:', err);
    return [];
  }
}

/** Get a single terms record by ID */
export async function getTermDocument(
  companyId: string,
  docId: string
): Promise<TermsAndPolicies | null> {
  try {
    const doc = await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .doc(docId)
      .get();
    if (!doc.exists) return null;
    return mapToTerms(doc);
  } catch (err) {
    console.error('getTermDocument error:', err);
    return null;
  }
}

/** Returns the currently-published terms document, or null if none */
export async function getPublishedTerms(
  companyId: string
): Promise<{ id: string; description: string; version: number } | null> {
  try {
    const snap = await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .where('published', '==', true)
      .limit(1)
      .get();

    if (snap.empty) return null;
    const d = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      description: d.description || 'Untitled',
      version: d.version ?? 1,
    };
  } catch (err) {
    console.error('getPublishedTerms error:', err);
    return null;
  }
}

/** Save a new terms version (Draft st = 0) with auto-calculated version */
export async function saveTermRecord(
  companyId: string,
  input: TermsCreateInput,
  creatorEmail = ''
): Promise<string> {
  try {
    const id = requestCode();
    const now = new Date();
    
    // Auto-calculate version (find max non-deleted version and increment)
    const records = await getTermsRecords(companyId);
    const nonDeleted = records.filter(r => r.st !== 2); // st: 2 is deleted
    const maxVersion = nonDeleted.reduce((max, r) => (r.version > max ? r.version : max), 0);
    const nextVersion = maxVersion + 1;

    const payload: any = {
      id,
      description: input.description,
      terms: input.terms,
      version: nextVersion,
      wUrl: input.wUrl || '',
      published: false,
      st: 0,
      cb: creatorEmail,
      cd: now,
      ub: creatorEmail,
      ud: now,
    };

    if (companyId === 'general') {
      payload.appVersionNumber = input.appVersionNumber || '';
      payload.appVersionName = input.appVersionName || '';
      payload.appVersionSummary = input.appVersionSummary || '';
    }

    await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .doc(id)
      .set(payload);

    return id;
  } catch (err) {
    console.error('saveTermRecord error:', err);
    throw err;
  }
}

/** Edit draft terms */
export async function editTermRecord(
  companyId: string,
  docId: string,
  input: Partial<TermsCreateInput>,
  updaterEmail = ''
): Promise<void> {
  try {
    const now = new Date();
    const payload: any = {
      ub: updaterEmail,
      ud: now,
      published: false, // updates reset published status
    };

    if (input.description !== undefined) payload.description = input.description;
    if (input.terms !== undefined) payload.terms = input.terms;
    if (input.wUrl !== undefined) payload.wUrl = input.wUrl;

    if (companyId === 'general') {
      if (input.appVersionNumber !== undefined) payload.appVersionNumber = input.appVersionNumber;
      if (input.appVersionName !== undefined) payload.appVersionName = input.appVersionName;
      if (input.appVersionSummary !== undefined) payload.appVersionSummary = input.appVersionSummary;
    }

    await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .doc(docId)
      .update(payload);
  } catch (err) {
    console.error('editTermRecord error:', err);
    throw err;
  }
}

/** Approve draft (st = 0 -> st = 1) */
export async function approveTermRecord(
  companyId: string,
  docId: string,
  approverEmail = ''
): Promise<void> {
  try {
    const doc = await getTermDocument(companyId, docId);
    if (!doc) throw new Error('Document not found');
    if (doc.st !== 0) {
      throw new Error(doc.st === 1 ? 'This terms version is already approved.' : 'Only Draft terms can be approved.');
    }

    await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .doc(docId)
      .update({
        st: 1,
        ab: approverEmail,
        ad: new Date(),
        ud: new Date(),
      });
  } catch (err) {
    console.error('approveTermRecord error:', err);
    throw err;
  }
}

/** Delete terms version (st = 2) */
export async function deleteTermRecord(
  companyId: string,
  docId: string,
  deleterEmail = ''
): Promise<void> {
  try {
    const doc = await getTermDocument(companyId, docId);
    if (!doc) throw new Error('Document not found');

    // If it was published, we must unpublish it from Remote Config first
    if (doc.published) {
      const unpubResult = await unpublishTermRecord(companyId, docId);
      if (!unpubResult.ok) {
        throw new Error(`Failed to unpublish terms before deleting: ${unpubResult.error}`);
      }
    }

    await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .doc(docId)
      .update({
        st: 2,
        db: deleterEmail,
        dd: new Date(),
        ud: new Date(),
      });
  } catch (err) {
    console.error('deleteTermRecord error:', err);
    throw err;
  }
}

export type PublishResult =
  | { ok: true }
  | { ok: false; conflict: true; conflictId: string; conflictDescription: string }
  | { ok: false; conflict?: false; error: string };

export type UnpublishResult =
  | { ok: true }
  | { ok: false; error: string };

/** Publish approved terms, resolving conflict if override is specified */
export async function publishTermRecord(
  companyId: string,
  docId: string,
  publisherEmail = '',
  override = false
): Promise<PublishResult> {
  try {
    // ── Validate document
    const doc = await getTermDocument(companyId, docId);
    if (!doc) return { ok: false, error: 'Document not found' };

    if (doc.st !== 1) {
      return {
        ok: false,
        error: doc.st === 0
          ? 'This terms document is still a Draft. Please approve it first.'
          : 'Only Approved documents can be published.',
      };
    }
    if (doc.published) return { ok: false, error: 'This terms document is already published.' };

    // ── Check conflict
    const existing = await getPublishedTerms(companyId);
    if (existing && existing.id !== docId) {
      if (!override) {
        return { ok: false, conflict: true, conflictId: existing.id, conflictDescription: existing.description };
      }
      // Override: unpublish existing
      const unpubRes = await unpublishTermRecord(companyId, existing.id);
      if (!unpubRes.ok) {
        return { ok: false, error: `Failed to unpublish conflicting terms: ${unpubRes.error}` };
      }
    }

    // Prepare content payload for Remote Config (similar to initViewModel / initViewModelGeneral)
    const termsPayload = {
      id: parseInt(doc.id, 10) || 0,
      description: doc.description,
      terms: doc.terms,
      version: doc.version,
      wUrl: doc.wUrl,
      published: true,
      st: doc.st,
      appVersionNumber: doc.appVersionNumber || '',
      appVersionName: doc.appVersionName || '',
      appVersionSummary: doc.appVersionSummary || '',
    };

    // ── Sync to Remote Config
    if (companyId === 'general') {
      const generalData = {
        termsAndPolicies: termsPayload,
      };
      const rcSuccess = await updateGeneralConfig(generalData);
      if (!rcSuccess) {
        return { ok: false, error: 'Failed to update Remote Config parameters.' };
      }
    } else {
      const { config } = await getCompanyConfig(companyId);
      if (!config) {
        return { ok: false, error: `Remote Config not found for company "${companyId}"` };
      }
      config.termsAndPolicies = termsPayload;
      const rcSuccess = await updateCompanyConfig(companyId, config);
      if (!rcSuccess) {
        return { ok: false, error: 'Failed to update Remote Config parameters.' };
      }
    }

    // ── Update Firestore flag only after Remote Config succeeds
    await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .doc(docId)
      .update({
        published: true,
        ud: new Date(),
      });

    return { ok: true };
  } catch (err: any) {
    console.error('publishTermRecord error:', err);
    return { ok: false, error: err.message || 'Publish operation failed' };
  }
}

/** Unpublish terms, removing from Remote Config */
export async function unpublishTermRecord(
  companyId: string,
  docId: string
): Promise<UnpublishResult> {
  try {
    const doc = await getTermDocument(companyId, docId);
    if (!doc) return { ok: false, error: 'Document not found' };

    // ── Sync to Remote Config
    if (companyId === 'general') {
      // In general config, we reset to empty object/delete termsAndPolicies key
      const rcSuccess = await updateGeneralConfig({});
      if (!rcSuccess) {
        return { ok: false, error: 'Failed to update Remote Config parameters.' };
      }
    } else {
      const { config } = await getCompanyConfig(companyId);
      if (!config) {
        return { ok: false, error: `Remote Config not found for company "${companyId}"` };
      }
      delete config.termsAndPolicies;
      const rcSuccess = await updateCompanyConfig(companyId, config);
      if (!rcSuccess) {
        return { ok: false, error: 'Failed to update Remote Config parameters.' };
      }
    }

    // ── Update Firestore
    await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .doc(docId)
      .update({
        published: false,
        ud: new Date(),
      });

    return { ok: true };
  } catch (err: any) {
    console.error('unpublishTermRecord error:', err);
    return { ok: false, error: err.message || 'Unpublish operation failed' };
  }
}
