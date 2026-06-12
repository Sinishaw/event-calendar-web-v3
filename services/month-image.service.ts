import 'server-only';
import { adminDb as db } from '@/lib/firebase-admin';
import { getCompanyConfig, updateCompanyConfig } from './remote-config.service';
import {
  MonthImageCollection,
  MonthImageCreateInput,
  MonthImageListItem,
  ETHIOPIAN_MONTHS,
} from '@/types/month-image';

const COL = 'MonthImages';

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

function urlFields(data: any): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const m of ETHIOPIAN_MONTHS) {
    out[m.urlField] = data[m.urlField] ?? null;
  }
  return out;
}

function firstCover(data: any): string | null {
  for (const m of ETHIOPIAN_MONTHS) {
    if (data[m.urlField]) return data[m.urlField];
  }
  return null;
}

function buildUrlMap(input: Partial<MonthImageCreateInput>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const m of ETHIOPIAN_MONTHS) {
    out[m.urlField] = (input as any)[m.urlField] ?? null;
  }
  return out;
}

function mapToCollection(doc: FirebaseFirestore.DocumentSnapshot): MonthImageCollection {
  const d = doc.data()!;
  return {
    id: doc.id,
    thm: d.thm || '',
    dsc: d.dsc || '',
    st: d.st ?? 0,
    published: !!d.published,
    ...urlFields(d),
    cb: d.cb || '',
    cd: toISO(d.cd),
    ub: d.ub || '',
    ud: toISO(d.ud),
    ab: d.ab || '',
    ad: d.ad ? toISO(d.ad) : null,
    db: d.db || '',
    dd: d.dd ? toISO(d.dd) : null,
  } as MonthImageCollection;
}

function mapToListItem(doc: FirebaseFirestore.DocumentSnapshot): MonthImageListItem {
  const d = doc.data()!;
  const urls = urlFields(d) as any;
  return {
    id: doc.id,
    thm: d.thm || '',
    dsc: d.dsc || '',
    st: d.st ?? 0,
    published: !!d.published,
    cd: toISO(d.cd),
    coverUrl: firstCover(d),
    ...urls,
  };
}

// ─── READ ───────────────────────────────────────────────────────────────────

export async function getCollections(companyId: string): Promise<MonthImageListItem[]> {
  try {
    const snap = await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .orderBy('cd', 'desc')
      .get();
    return snap.docs.map(mapToListItem);
  } catch (err) {
    console.error('getCollections error:', err);
    return [];
  }
}

export async function getCollection(
  companyId: string,
  docId: string
): Promise<MonthImageCollection | null> {
  try {
    const doc = await db
      .collection('Companies')
      .doc(companyId)
      .collection(COL)
      .doc(docId)
      .get();
    if (!doc.exists) return null;
    return mapToCollection(doc);
  } catch (err) {
    console.error('getCollection error:', err);
    return null;
  }
}

/**
 * Returns the currently-published collection for a company, or null if none.
 * There should be at most one at any time — enforced by the publish flow.
 */
export async function getPublishedCollection(
  companyId: string
): Promise<{ id: string; thm: string } | null> {
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
    return { id: snap.docs[0].id, thm: d.thm || 'Untitled' };
  } catch (err) {
    console.error('getPublishedCollection error:', err);
    return null;
  }
}

// ─── WRITE ──────────────────────────────────────────────────────────────────

export async function createCollection(
  companyId: string,
  input: MonthImageCreateInput,
  creatorEmail = ''
): Promise<string> {
  const id = requestCode();
  const now = new Date();
  await db
    .collection('Companies')
    .doc(companyId)
    .collection(COL)
    .doc(id)
    .set({
      id,
      thm: input.thm,
      dsc: input.dsc,
      st: 0,
      published: false,
      ...buildUrlMap(input),
      cb: creatorEmail,
      cd: now,
      ub: creatorEmail,
      ud: now,
      ab: '',
      ad: null,
      db: '',
      dd: null,
    });
  return id;
}

export async function updateCollection(
  companyId: string,
  docId: string,
  input: Partial<MonthImageCreateInput>,
  updaterEmail = ''
): Promise<void> {
  const now = new Date();
  const payload: any = { ub: updaterEmail, ud: now };
  if (input.thm !== undefined) payload.thm = input.thm;
  if (input.dsc !== undefined) payload.dsc = input.dsc;
  for (const m of ETHIOPIAN_MONTHS) {
    const val = (input as any)[m.urlField];
    if (val !== undefined) payload[m.urlField] = val;
  }
  await db
    .collection('Companies')
    .doc(companyId)
    .collection(COL)
    .doc(docId)
    .update(payload);
}

/**
 * Approve — only allowed when status is Draft (st === 0).
 * Throws a descriptive error if the precondition is not met.
 */
export async function approveCollection(
  companyId: string,
  docId: string,
  approverEmail = ''
): Promise<void> {
  const col = await getCollection(companyId, docId);
  if (!col) throw new Error('Collection not found');
  if (col.st !== 0) {
    throw new Error(
      col.st === 1
        ? 'This collection is already approved'
        : 'Only Draft collections can be approved'
    );
  }
  await db
    .collection('Companies')
    .doc(companyId)
    .collection(COL)
    .doc(docId)
    .update({ st: 1, ab: approverEmail, ad: new Date() });
}

export async function deleteCollection(
  companyId: string,
  docId: string,
  deleterEmail = ''
): Promise<void> {
  await db
    .collection('Companies')
    .doc(companyId)
    .collection(COL)
    .doc(docId)
    .update({ st: 3, db: deleterEmail, dd: new Date() });
}

// ─── PUBLISH / UNPUBLISH ─────────────────────────────────────────────────────

/**
 * Structured result so callers can handle success, conflict, and technical failure distinctly.
 */
export type PublishResult =
  | { ok: true }
  | { ok: false; conflict: true; conflictId: string; conflictThm: string }
  | { ok: false; conflict?: false; error: string };

/**
 * Publish a collection to Remote Config under the company's `monthImages` key.
 *
 * SAFETY NOTES — Remote Config is a shared, multi-tenant resource:
 *   ONE template holds keys for ALL companies. Modifying one company's key
 *   must never corrupt another's. The READ → MERGE → WRITE pattern below
 *   guarantees this — we fetch the full template, update only this company's
 *   `monthImages` sub-key, then publish back.
 *
 * Enforcement order:
 *   1. Collection must exist and be Approved (st === 1)
 *   2. Only one collection may be published per company at a time
 *   3. Remote Config is updated FIRST — Firestore flag is set only on success
 */
export async function publishCollection(
  companyId: string,
  docId: string
): Promise<PublishResult> {
  // ── Step 1: Validate collection status ──────────────────────────────────────
  const col = await getCollection(companyId, docId);
  if (!col) return { ok: false, error: 'Collection not found' };

  if (col.st !== 1) {
    return {
      ok: false,
      error: col.st === 0
        ? 'This collection is still a Draft. Please Approve it first before publishing.'
        : 'Only Approved collections can be published.',
    };
  }
  if (col.published) return { ok: false, error: 'This collection is already published.' };

  // ── Step 2: Check for existing published collection ──────────────────────────
  const existing = await getPublishedCollection(companyId);
  if (existing && existing.id !== docId) {
    // Return conflict info so the API can send a 409 with actionable details
    return { ok: false, conflict: true, conflictId: existing.id, conflictThm: existing.thm };
  }

  // ── Step 3: READ company Remote Config ──────────────────────────────────────
  const { config } = await getCompanyConfig(companyId);
  if (!config) {
    return {
      ok: false,
      error: `Remote Config not found for company "${companyId}". Contact your administrator.`,
    };
  }

  // ── Step 4: MERGE — inject only monthImages, keep everything else intact ────
  config.monthImages = col;

  // ── Step 5: WRITE back to Remote Config ────────────────────────────────────
  const rcOk = await updateCompanyConfig(companyId, config);
  if (!rcOk) {
    return { ok: false, error: 'Remote Config update failed. No changes were applied.' };
  }

  // ── Step 6: Update Firestore flag ONLY after RC succeeds ───────────────────
  await db
    .collection('Companies')
    .doc(companyId)
    .collection(COL)
    .doc(docId)
    .update({ published: true });

  return { ok: true };
}

/**
 * Unpublish — removes `monthImages` from this company's Remote Config key.
 *
 * Same READ → MERGE → WRITE safety pattern.
 * Firestore flag is cleared only after Remote Config update succeeds.
 */
export async function unpublishCollection(
  companyId: string,
  docId: string
): Promise<{ ok: boolean; error?: string }> {
  // ── Verify this is the actually-published collection ────────────────────────
  const col = await getCollection(companyId, docId);
  if (!col) return { ok: false, error: 'Collection not found' };
  if (!col.published) {
    return { ok: false, error: 'This collection is not currently published.' };
  }

  // ── READ → MERGE → WRITE ───────────────────────────────────────────────────
  const { config } = await getCompanyConfig(companyId);
  if (!config) {
    return { ok: false, error: `Remote Config not found for company "${companyId}".` };
  }

  // Remove ONLY the monthImages key — all other company config is preserved
  delete config.monthImages;

  const rcOk = await updateCompanyConfig(companyId, config);
  if (!rcOk) {
    return { ok: false, error: 'Remote Config update failed. No changes were applied.' };
  }

  // Update Firestore only after RC success
  await db
    .collection('Companies')
    .doc(companyId)
    .collection(COL)
    .doc(docId)
    .update({ published: false });

  return { ok: true };
}
