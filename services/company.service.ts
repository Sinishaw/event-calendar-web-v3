import 'server-only';
import { adminDb as db } from '@/lib/firebase-admin';
import { Company } from '@/types/company';

function getRequestCode(): number {
  const now = new Date();
  const shortYear = now.getFullYear() % 100;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const codeStr = `${shortYear - 10}${month}${day}${hour}${minute}`;
  return parseInt(codeStr, 10);
}

function mapDocToCompany(doc: any): Company {
  const data = doc.data();
  return {
    id: data.id,
    company: doc.id,
    name: data.name || doc.id,
    category: data.category,
    description: data.description,
    established: data.established,
    address: data.address,
    phone: data.phone,
    pobox: data.pobox,
    website: data.website,
    email: data.email,
    vUrl: data.vUrl,
    wUrl: data.wUrl,
    mission: data.mission,
    vision: data.vision,
    facebook: data.facebook,
    twitter: data.twitter,
    youtube: data.youtube,
    instagram: data.instagram,
    iUrl: data.iUrl,
    st: data.st ?? 0,
  };
}

export async function getAllCompanies(): Promise<Company[]> {
  try {
    const snapshot = await db.collection('Companies').get();
    const companies: Company[] = [];
    snapshot.forEach((doc) => {
      companies.push(mapDocToCompany(doc));
    });
    return companies;
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}

export async function getCompany(companyId: string): Promise<Company | null> {
  try {
    const doc = await db.collection('Companies').doc(companyId).get();
    if (!doc.exists) return null;
    return mapDocToCompany(doc);
  } catch (error) {
    console.error(`Error fetching company ${companyId}:`, error);
    return null;
  }
}

export async function createCompany(input: Partial<Company>, creatorEmail = ''): Promise<string> {
  try {
    const companyId = input.company?.trim().toLowerCase();
    if (!companyId) throw new Error('Company ID is required');

    const docRef = db.collection('Companies').doc(companyId);
    const doc = await docRef.get();
    if (doc.exists) {
      throw new Error(`Company with ID "${companyId}" already exists.`);
    }

    const numericId = getRequestCode();
    const timestamp = new Date();

    const data = {
      id: numericId,
      company: companyId,
      name: input.name,
      category: input.category || '',
      description: input.description || '',
      established: input.established || '',
      address: input.address || '',
      phone: input.phone || '',
      pobox: input.pobox || '',
      website: input.website || '',
      email: input.email || '',
      vUrl: input.vUrl || '',
      wUrl: input.wUrl || '',
      mission: input.mission || '',
      vision: input.vision || '',
      facebook: input.facebook || '',
      twitter: input.twitter || '',
      youtube: input.youtube || '',
      instagram: input.instagram || '',
      iUrl: input.iUrl || null,
      // Audit stamp logs
      cb: creatorEmail,
      cd: timestamp,
      ub: creatorEmail,
      ud: timestamp,
      ab: '',
      ad: null,
      db: '',
      dd: null,
      st: 0, // 0 = New
    };

    await docRef.set(data);
    return companyId;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

export async function updateCompany(companyId: string, input: Partial<Company>, updaterEmail = ''): Promise<Company> {
  try {
    const docRef = db.collection('Companies').doc(companyId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error(`Company "${companyId}" not found`);

    const updatePayload: any = {
      name: input.name,
      category: input.category,
      description: input.description,
      established: input.established,
      address: input.address,
      phone: input.phone,
      pobox: input.pobox,
      website: input.website,
      email: input.email,
      vUrl: input.vUrl,
      wUrl: input.wUrl,
      mission: input.mission,
      vision: input.vision,
      facebook: input.facebook,
      twitter: input.twitter,
      youtube: input.youtube,
      instagram: input.instagram,
      // Audit stamp updates
      ub: updaterEmail,
      ud: new Date(),
    };

    if (input.iUrl !== undefined) {
      updatePayload.iUrl = input.iUrl;
    }

    await docRef.update(updatePayload);
    const updatedDoc = await docRef.get();
    return mapDocToCompany(updatedDoc);
  } catch (error) {
    console.error(`Error updating company ${companyId}:`, error);
    throw error;
  }
}

export async function approveCompany(companyId: string, approverEmail = ''): Promise<void> {
  try {
    const docRef = db.collection('Companies').doc(companyId);
    const timestamp = new Date();
    await docRef.update({
      st: 1, // 1 = Published / Approved
      ab: approverEmail,
      ad: timestamp,
      ud: timestamp,
    });
  } catch (error) {
    console.error(`Error approving company ${companyId}:`, error);
    throw error;
  }
}

export async function deleteCompany(companyId: string, deleterEmail = ''): Promise<void> {
  try {
    const docRef = db.collection('Companies').doc(companyId);
    const timestamp = new Date();
    await docRef.update({
      st: 2, // 2 = Deleted
      db: deleterEmail,
      dd: timestamp,
      ud: timestamp,
    });
  } catch (error) {
    console.error(`Error deleting company ${companyId}:`, error);
    throw error;
  }
}
