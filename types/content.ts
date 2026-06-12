export interface CompanyContent {
  id: string; // Document ID
  title: string;
  body: string;
  category: string;
  nationalDay?: string;
  description: string;
  topic: string; // Holds company identifier
  iUrl?: string | null; // Image URL
  vUrl?: string; // Video URL
  wUrl?: string; // Weather URL
  frD: string; // From Date-Time ISO string (or Date format on write)
  toD: string; // To Date-Time ISO string
  ageRestriction: string;
  notifyUser: boolean;
  markOnCalendar: boolean;
  markDate: string; // Mark Date-Time ISO string
  fetchExpirationDate: string; // Fetch Expiration Date-Time ISO string
  tagColor: string;
  notified: boolean;
  successCount: number;
  failureCount: number;
  source: 'Company';
  companyName: string;
  logoUrl?: string; // Logo image URL of company
  st: number; // 0 = New, 1 = Published, 2 = Deleted
  stString?: string;
  cb?: string; // Created By
  cd?: string; // Created Date
  ub?: string; // Updated By
  ud?: string; // Updated Date
}

export interface ContentCreateInput {
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
  companyName: string;
}

export interface ContentUpdateInput extends Partial<ContentCreateInput> {
  notified?: boolean;
  messageId?: string;
}
