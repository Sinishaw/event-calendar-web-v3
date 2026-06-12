export interface Company {
  id: number;
  company: string; // unique string identifier, e.g. 'mmcy'
  name: string;
  category?: string;
  description?: string;
  established?: string;
  address?: string;
  phone?: string;
  pobox?: string;
  website?: string;
  email?: string;
  vUrl?: string;
  wUrl?: string;
  mission?: string;
  vision?: string;
  iUrl?: string | null; // logo/profile image
  st: number; // 0 = New, 1 = Published, 2 = Deleted
  stString?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  instagram?: string;
}
