export interface TermsAndPolicies {
  id: string; // Document ID (string representation of number)
  description: string;
  terms: string;
  version: number;
  wUrl?: string;
  published: boolean;
  st: number; // 0 = Draft, 1 = Approved, 2 = Deleted
  stString?: string;
  
  // Audit stamps
  cb: string; // created by (email)
  cd: string; // created date (ISO string)
  ub: string; // updated by (email)
  ud: string; // updated date (ISO string)
  ab?: string; // approved by (email)
  ad?: string | null; // approved date (ISO string)
  db?: string; // deleted by (email)
  dd?: string | null; // deleted date (ISO string)

  // Only for General Terms
  appVersionNumber?: string;
  appVersionName?: string;
  appVersionSummary?: string;
}

export interface TermsCreateInput {
  description: string;
  terms: string;
  wUrl?: string;
  // For general terms
  appVersionNumber?: string;
  appVersionName?: string;
  appVersionSummary?: string;
}
