/** 13 Ethiopian calendar months — data-driven, avoids hardcoding repetition */
export const ETHIOPIAN_MONTHS = [
  { key: 'ms', amharic: 'መስከረም', english: 'Meskerem',  urlField: 'msUrl' },
  { key: 'tk', amharic: 'ጥቅምት',  english: 'Tikimt',    urlField: 'tkUrl' },
  { key: 'hd', amharic: 'ኅዳር',   english: 'Hidar',     urlField: 'hdUrl' },
  { key: 'th', amharic: 'ታኅሣሥ',  english: 'Tahisas',   urlField: 'thUrl' },
  { key: 'tr', amharic: 'ጥር',    english: 'Tir',       urlField: 'trUrl' },
  { key: 'yk', amharic: 'የካቲት',  english: 'Yekatit',   urlField: 'ykUrl' },
  { key: 'mg', amharic: 'መጋቢት',  english: 'Megabit',   urlField: 'mgUrl' },
  { key: 'mz', amharic: 'ሚያዝያ',  english: 'Miyaziya',  urlField: 'mzUrl' },
  { key: 'gn', amharic: 'ግንቦት',  english: 'Ginbot',    urlField: 'gnUrl' },
  { key: 'sn', amharic: 'ሰኔ',    english: 'Sene',      urlField: 'snUrl' },
  { key: 'hm', amharic: 'ሐምሌ',   english: 'Hamle',     urlField: 'hmUrl' },
  { key: 'nh', amharic: 'ነሐሴ',   english: 'Nehassie',  urlField: 'nhUrl' },
  { key: 'pg', amharic: 'ጳጉሜ',   english: 'Puagme',    urlField: 'pgUrl' },
] as const;

export type MonthKey = typeof ETHIOPIAN_MONTHS[number]['key'];
export type MonthUrlField = typeof ETHIOPIAN_MONTHS[number]['urlField'];

/** Full Firestore document shape for a Month Image Collection */
export interface MonthImageCollection {
  id: string;
  thm: string;       // Theme name
  dsc: string;       // Description
  /** Status: 0 = New/Draft, 1 = Approved, 3 = Deleted */
  st: number;
  published: boolean;
  // Month image URLs — null means not uploaded
  msUrl: string | null;
  tkUrl: string | null;
  hdUrl: string | null;
  thUrl: string | null;
  trUrl: string | null;
  ykUrl: string | null;
  mgUrl: string | null;
  mzUrl: string | null;
  gnUrl: string | null;
  snUrl: string | null;
  hmUrl: string | null;
  nhUrl: string | null;
  pgUrl: string | null;
  // Audit stamps
  cb: string;
  cd: string;
  ub: string;
  ud: string;
  ab: string;
  ad: string | null;
  db: string;
  dd: string | null;
}

/** Input shape for create / update operations */
export interface MonthImageCreateInput {
  thm: string;
  dsc: string;
  msUrl?: string | null;
  tkUrl?: string | null;
  hdUrl?: string | null;
  thUrl?: string | null;
  trUrl?: string | null;
  ykUrl?: string | null;
  mgUrl?: string | null;
  mzUrl?: string | null;
  gnUrl?: string | null;
  snUrl?: string | null;
  hmUrl?: string | null;
  nhUrl?: string | null;
  pgUrl?: string | null;
}

/** Summary row used in the list view */
export interface MonthImageListItem {
  id: string;
  thm: string;
  dsc: string;
  st: number;
  published: boolean;
  cd: string;
  /** First available cover URL for card thumbnail */
  coverUrl: string | null;
  msUrl: string | null;
  tkUrl: string | null;
  hdUrl: string | null;
  thUrl: string | null;
  trUrl: string | null;
  ykUrl: string | null;
  mgUrl: string | null;
  mzUrl: string | null;
  gnUrl: string | null;
  snUrl: string | null;
  hmUrl: string | null;
  nhUrl: string | null;
  pgUrl: string | null;
}
