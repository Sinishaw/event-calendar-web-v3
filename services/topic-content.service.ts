import 'server-only';
import { adminDb as db, adminApp } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { CompanyContent } from '@/types/content';

// Reuse the CompanyContent type for TopicContent, setting source to 'Topic'
export interface TopicContent extends Omit<CompanyContent, 'source'> {
  source: 'Topic';
}

export interface TopicContentCreateInput {
  topic: string; // Target topic ID
  companyName: string;
  logoUrl: string; // Custom icon URL
  title: string;
  body: string;
  category: string;
  nationalDay?: string;
  description: string;
  iUrl?: string | null;
  vUrl?: string;
  wUrl?: string;
  frD: Date;
  toD: Date;
  ageRestriction: string;
  notifyUser: boolean;
  markOnCalendar: boolean;
  markDate: Date;
  fetchExpirationDate: Date;
  tagColor: string;
}

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

function mapDocToTopicContent(doc: any): TopicContent {
  const data = doc.data();
  
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
    source: 'Topic',
    companyName: data.companyName || '',
    logoUrl: data.logoUrl || '',
    st: data.st ?? 0,
    cb: data.cb || '',
    cd: toISO(data.cd),
    ub: data.ub || '',
    ud: toISO(data.ud),
  };
}

export async function getTopicContents(topicId?: string): Promise<TopicContent[]> {
  try {
    if (topicId && topicId !== 'all') {
      const snapshot = await db
        .collection('Topics')
        .doc(topicId)
        .collection('Contents')
        .get();

      const contents: TopicContent[] = [];
      snapshot.forEach((doc) => {
        contents.push(mapDocToTopicContent(doc));
      });
      return contents;
    } else {
      // Fetch grouped topics contents across all topics
      const snapshot = await db
        .collectionGroup('Contents')
        .where('source', '==', 'Topic')
        .get();

      const contents: TopicContent[] = [];
      snapshot.forEach((doc) => {
        contents.push(mapDocToTopicContent(doc));
      });
      return contents;
    }
  } catch (error) {
    console.error(`Error fetching topic contents for topic ${topicId || 'all'}:`, error);
    return [];
  }
}

export async function getTopicContent(topicId: string, contentId: string): Promise<TopicContent | null> {
  try {
    const doc = await db
      .collection('Topics')
      .doc(topicId)
      .collection('Contents')
      .doc(contentId)
      .get();

    if (!doc.exists) return null;
    return mapDocToTopicContent(doc);
  } catch (error) {
    console.error(`Error fetching topic content ${contentId} for topic ${topicId}:`, error);
    return null;
  }
}

export async function createTopicContent(
  input: TopicContentCreateInput,
  creatorEmail = ''
): Promise<{ id: string; topic: string }> {
  try {
    const contentId = getRequestCode();
    const docRef = db
      .collection('Topics')
      .doc(input.topic)
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
      topic: input.topic,
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
      source: 'Topic',
      companyName: input.companyName,
      logoUrl: input.logoUrl,
      st: 0, // 0 = New/Draft
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
    return { id: contentId, topic: input.topic };
  } catch (error) {
    console.error('Error creating topic content:', error);
    throw error;
  }
}

export async function updateTopicContent(
  topicId: string,
  contentId: string,
  input: Partial<TopicContentCreateInput>,
  updaterEmail = ''
): Promise<TopicContent> {
  try {
    const docRef = db
      .collection('Topics')
      .doc(topicId)
      .collection('Contents')
      .doc(contentId);

    const doc = await docRef.get();
    if (!doc.exists) throw new Error(`Topic Content "${contentId}" not found`);

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
      logoUrl: input.logoUrl,
      ub: updaterEmail,
      ud: new Date(),
    };

    if (input.iUrl !== undefined) {
      updatePayload.iUrl = input.iUrl;
    }

    // Handle topic changes (moving document to another topic subcollection if changed)
    if (input.topic && input.topic !== topicId) {
      // Create under new topic
      const newDocRef = db
        .collection('Topics')
        .doc(input.topic)
        .collection('Contents')
        .doc(contentId);

      const currentData = doc.data() || {};
      const mergedData = {
        ...currentData,
        ...updatePayload,
        topic: input.topic,
      };

      await newDocRef.set(mergedData);
      await docRef.delete(); // Delete old one
      
      const newDoc = await newDocRef.get();
      return mapDocToTopicContent(newDoc);
    }

    await docRef.update(updatePayload);
    const updatedDoc = await docRef.get();
    return mapDocToTopicContent(updatedDoc);
  } catch (error) {
    console.error(`Error updating topic content ${contentId}:`, error);
    throw error;
  }
}

export async function approveTopicContent(topicId: string, contentId: string, approverEmail = ''): Promise<void> {
  try {
    const docRef = db
      .collection('Topics')
      .doc(topicId)
      .collection('Contents')
      .doc(contentId);

    const timestamp = new Date();
    await docRef.update({
      st: 1, // 1 = Published
      ab: approverEmail,
      ad: timestamp,
      ud: timestamp,
    });
  } catch (error) {
    console.error(`Error approving topic content ${contentId}:`, error);
    throw error;
  }
}

export async function unpublishTopicContent(topicId: string, contentId: string, updaterEmail = ''): Promise<void> {
  try {
    const docRef = db
      .collection('Topics')
      .doc(topicId)
      .collection('Contents')
      .doc(contentId);

    const timestamp = new Date();
    await docRef.update({
      st: 0, // 0 = Draft
      ub: updaterEmail,
      ud: timestamp,
    });
  } catch (error) {
    console.error(`Error unpublishing topic content ${contentId}:`, error);
    throw error;
  }
}

export async function deleteTopicContent(topicId: string, contentId: string, deleterEmail = ''): Promise<void> {
  try {
    const docRef = db
      .collection('Topics')
      .doc(topicId)
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
    console.error(`Error deleting topic content ${contentId}:`, error);
    throw error;
  }
}

export async function notifyTopicContent(topicId: string, contentId: string): Promise<string> {
  try {
    const docRef = db
      .collection('Topics')
      .doc(topicId)
      .collection('Contents')
      .doc(contentId);

    const doc = await docRef.get();
    if (!doc.exists) throw new Error(`Topic Content "${contentId}" not found`);
    const content = mapDocToTopicContent(doc);

    // Construct FCM payload where all values are string type
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
        notifyUser: 'true',
        markOnCalendar: String(content.markOnCalendar),
        markDate: new Date(content.markDate).toISOString(),
        tagColor: String(content.tagColor),
        repeatOption: 'noRecurrence',
        contentSource: 'TopicEvent', // Critical for Topic content mobile actions!
        topic: String(content.topic),
        logo: String(content.logoUrl || ''),
        companyName: String(content.companyName),
      },
      topic: content.topic,
    };

    console.log(`Sending Topic FCM notification to subscribers of topic: ${content.topic}`);
    const messageId = await getMessaging(adminApp).send(messagePayload);
    console.log(`Topic FCM sent successfully. Message ID: ${messageId}`);

    // Update status in Firestore
    const nextSuccessCount = content.successCount < 0 ? 1 : content.successCount + 1;
    await docRef.update({
      messageId: messageId,
      notified: true,
      notifiedDate: new Date(),
      notifyUser: true,
      successCount: nextSuccessCount,
    });

    return messageId;
  } catch (error) {
    console.error(`Error sending FCM notification for topic content ${contentId}:`, error);
    throw error;
  }
}
