import 'server-only';
import { adminDb as db, adminApp } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { CompanyContent, ContentCreateInput, ContentUpdateInput } from '@/types/content';

function getRequestCode(): string {
  const now = new Date();
  const shortYear = now.getFullYear() % 100;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${shortYear - 10}${month}${day}${hour}${minute}${second}`;
}

function mapDocToContent(doc: any): CompanyContent {
  const data = doc.data();
  
  // Convert Firestore Timestamps to ISO strings
  const toISO = (ts: any) => {
    if (!ts) return '';
    if (ts.toDate) return ts.toDate().toISOString();
    if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
    return new Date(ts).toISOString();
  };

  return {
    id: doc.id,
    title: data.title || '',
    body: data.body || '',
    category: data.category || '',
    nationalDay: data.nationalDay || '',
    description: data.description || '',
    topic: data.topic || '',
    iUrl: data.iUrl || null,
    vUrl: data.vUrl || '',
    wUrl: data.wUrl || '',
    frD: toISO(data.frD),
    toD: toISO(data.toD),
    ageRestriction: String(data.ageRestriction || '0'),
    notifyUser: !!data.notifyUser,
    markOnCalendar: !!data.markOnCalendar,
    markDate: toISO(data.markDate),
    fetchExpirationDate: toISO(data.fetchExpirationDate),
    tagColor: data.tagColor || '#000000',
    notified: !!data.notified,
    successCount: data.successCount ?? -1,
    failureCount: data.failureCount ?? -1,
    source: 'Company',
    companyName: data.companyName || '',
    logoUrl: data.logoUrl || '',
    st: data.st ?? 0,
  };
}

export async function getCompanyContents(companyId: string): Promise<CompanyContent[]> {
  try {
    const snapshot = await db
      .collection('Companies')
      .doc(companyId)
      .collection('Contents')
      .get();

    const contents: CompanyContent[] = [];
    snapshot.forEach((doc) => {
      contents.push(mapDocToContent(doc));
    });
    return contents;
  } catch (error) {
    console.error(`Error fetching contents for company ${companyId}:`, error);
    return [];
  }
}

export async function getContent(companyId: string, contentId: string): Promise<CompanyContent | null> {
  try {
    const doc = await db
      .collection('Companies')
      .doc(companyId)
      .collection('Contents')
      .doc(contentId)
      .get();

    if (!doc.exists) return null;
    return mapDocToContent(doc);
  } catch (error) {
    console.error(`Error fetching content ${contentId} for company ${companyId}:`, error);
    return null;
  }
}

export async function createContent(
  companyId: string,
  input: ContentCreateInput,
  companyLogo: string,
  creatorEmail = ''
): Promise<string> {
  try {
    const contentId = getRequestCode();
    const docRef = db
      .collection('Companies')
      .doc(companyId)
      .collection('Contents')
      .doc(contentId);

    const timestamp = new Date();

    const data = {
      id: contentId,
      title: input.title,
      body: input.body,
      category: input.category,
      nationalDay: input.nationalDay || '',
      description: input.description,
      topic: companyId, // The topic is mapped to company ID
      iUrl: input.iUrl || null,
      vUrl: input.vUrl || '',
      wUrl: input.wUrl || '',
      frD: input.frD,
      toD: input.toD,
      ageRestriction: input.ageRestriction,
      notifyUser: input.notifyUser,
      markOnCalendar: input.markOnCalendar,
      markDate: input.markOnCalendar ? input.markDate : input.frD,
      fetchExpirationDate: input.fetchExpirationDate,
      tagColor: input.tagColor,
      notified: false,
      successCount: -1,
      failureCount: -1,
      source: 'Company',
      companyName: input.companyName,
      logoUrl: companyLogo,
      st: 0, // 0 = New
      // Audit Stamping
      cb: creatorEmail,
      cd: timestamp,
      ub: creatorEmail,
      ud: timestamp,
      ab: '',
      ad: null,
      db: '',
      dd: null,
    };

    await docRef.set(data);
    return contentId;
  } catch (error) {
    console.error('Error creating company content:', error);
    throw error;
  }
}

export async function updateContent(
  companyId: string,
  contentId: string,
  input: Partial<ContentCreateInput>,
  companyLogo: string,
  updaterEmail = ''
): Promise<CompanyContent> {
  try {
    const docRef = db
      .collection('Companies')
      .doc(companyId)
      .collection('Contents')
      .doc(contentId);

    const doc = await docRef.get();
    if (!doc.exists) throw new Error(`Content "${contentId}" not found`);

    const updatePayload: any = {
      title: input.title,
      body: input.body,
      category: input.category,
      nationalDay: input.nationalDay,
      description: input.description,
      vUrl: input.vUrl,
      wUrl: input.wUrl,
      frD: input.frD,
      toD: input.toD,
      ageRestriction: input.ageRestriction,
      notifyUser: input.notifyUser,
      markOnCalendar: input.markOnCalendar,
      markDate: input.markOnCalendar ? input.markDate : input.frD,
      fetchExpirationDate: input.fetchExpirationDate,
      tagColor: input.tagColor,
      companyName: input.companyName,
      logoUrl: companyLogo,
      // Audit Stamping
      ub: updaterEmail,
      ud: new Date(),
    };

    if (input.iUrl !== undefined) {
      updatePayload.iUrl = input.iUrl;
    }

    await docRef.update(updatePayload);
    const updatedDoc = await docRef.get();
    return mapDocToContent(updatedDoc);
  } catch (error) {
    console.error(`Error updating content ${contentId}:`, error);
    throw error;
  }
}

export async function approveContent(companyId: string, contentId: string, approverEmail = ''): Promise<void> {
  try {
    const docRef = db
      .collection('Companies')
      .doc(companyId)
      .collection('Contents')
      .doc(contentId);

    const timestamp = new Date();
    await docRef.update({
      st: 1, // 1 = Published / Approved
      ab: approverEmail,
      ad: timestamp,
      ud: timestamp,
    });
  } catch (error) {
    console.error(`Error approving content ${contentId}:`, error);
    throw error;
  }
}

export async function unpublishContent(companyId: string, contentId: string, updaterEmail = ''): Promise<void> {
  try {
    const docRef = db
      .collection('Companies')
      .doc(companyId)
      .collection('Contents')
      .doc(contentId);

    const timestamp = new Date();
    await docRef.update({
      st: 0, // 0 = Draft / Reverted
      ub: updaterEmail,
      ud: timestamp,
    });
  } catch (error) {
    console.error(`Error unpublishing content ${contentId}:`, error);
    throw error;
  }
}


export async function deleteContent(companyId: string, contentId: string, deleterEmail = ''): Promise<void> {
  try {
    const docRef = db
      .collection('Companies')
      .doc(companyId)
      .collection('Contents')
      .doc(contentId);

    const timestamp = new Date();
    await docRef.update({
      st: 2, // 2 = Deleted
      db: deleterEmail,
      dd: timestamp,
      ud: timestamp,
    });
  } catch (error) {
    console.error(`Error deleting content ${contentId}:`, error);
    throw error;
  }
}

export async function notifyContent(companyId: string, contentId: string, companyLogo: string): Promise<string> {
  try {
    const docRef = db
      .collection('Companies')
      .doc(companyId)
      .collection('Contents')
      .doc(contentId);

    const doc = await docRef.get();
    if (!doc.exists) throw new Error(`Content "${contentId}" not found`);
    const content = mapDocToContent(doc);

    // Prepare standard FCM multi-tenant topic payload
    // Note: All keys and values in the message data object must be strings.
    const messagePayload = {
      data: {
        id: String(content.id),
        title: String(content.title),
        body: String(content.body),
        description: String(content.description),
        iUrl: String(content.iUrl || ''),
        vUrl: String(content.vUrl || ''),
        wUrl: String(content.wUrl || ''),
        frD: new Date(content.frD).toISOString(),
        toD: new Date(content.toD).toISOString(),
        category: String(content.category),
        nationalDay: String(content.nationalDay || ''),
        ageRestriction: String(content.ageRestriction),
        notifyUser: String(content.notifyUser),
        markOnCalendar: String(content.markOnCalendar),
        markDate: new Date(content.markDate).toISOString(),
        tagColor: String(content.tagColor),
        repeatOption: 'noRecurrence',
        contentSource: 'CompanyEvent',
        topic: String(content.topic),
        logo: String(companyLogo || ''),
        companyName: String(content.companyName),
      },
      topic: content.topic,
    };

    console.log(`Sending FCM notification to topic: ${content.topic}`);
    const messageId = await getMessaging(adminApp).send(messagePayload);
    console.log(`FCM sent successfully. Message ID: ${messageId}`);

    // Update status in Firestore
    await docRef.update({
      messageId: messageId,
      notified: true,
      notifiedDate: new Date(),
    });

    return messageId;
  } catch (error) {
    console.error(`Error sending FCM notification for content ${contentId}:`, error);
    throw error;
  }
}
