import 'server-only';
import { adminApp } from '@/lib/firebase-admin';
import { getRemoteConfig } from 'firebase-admin/remote-config';
import { Company } from '@/types/company';
import { getCompany } from '@/services/company.service';

/** Gets the Remote Config interface */
function getConfig() {
  return getRemoteConfig(adminApp);
}

export interface CompanyThemeConfig {
  name: string;
  company: string;
  topic?: string[];
  category?: string;
  logo: string;
  menuHeaderImage: string;
  primaryColorLight: string;
  accentColorLight: string;
  primaryColorDark: string;
  accentColorDark: string;
  defaultTheme: string;
  defaultLanguage: string;
  NumberFormat: string;
  menuBackgroundOpacity: number;
  subscriptionPackage: string;
  expirationDate: string;
  leftMenu: boolean;
  showBottomMenu: boolean;
  reverseAdsAnimation: boolean;
  verticalAxisAdsAnimation: boolean;
  logoLocation?: string;
  adsScreenLocation?: string;
  monthImages?: any;
  termsAndPolicies?: any;
  profile?: any;
}

/** Maps a Company object to the Remote Config profile parameter schema */
function mapCompanyToProfile(profile: Company) {
  return {
    id: profile.id,
    company: profile.company,
    name: profile.name,
    category: profile.category || '',
    description: profile.description || '',
    established: profile.established || '',
    address: profile.address || '',
    phone: profile.phone || '',
    pobox: profile.pobox || '',
    website: profile.website || '',
    email: profile.email || '',
    vUrl: profile.vUrl || '',
    wUrl: profile.wUrl || '',
    mission: profile.mission || '',
    vision: profile.vision || '',
    iUrl: profile.iUrl || '',
    st: profile.st,
    facebook: profile.facebook || '',
    twitter: profile.twitter || '',
    youtube: profile.youtube || '',
    instagram: profile.instagram || '',
  };
}

/** Creates a default CompanyThemeConfig populated with Company profile details */
function createDefaultCompanyConfig(profile: Company): CompanyThemeConfig {
  return {
    name: profile.name,
    company: profile.company,
    topic: [],
    category: profile.category || '',
    logo: profile.iUrl || '',
    menuHeaderImage: '',
    primaryColorLight: '#ffffff',
    accentColorLight: '#d97706',
    primaryColorDark: '#1c1917',
    accentColorDark: '#f59e0b',
    defaultTheme: 'dark',
    defaultLanguage: 'am',
    NumberFormat: 'english',
    menuBackgroundOpacity: 1,
    subscriptionPackage: 'trial',
    expirationDate: profile.established || '',
    leftMenu: false,
    showBottomMenu: true,
    reverseAdsAnimation: false,
    verticalAxisAdsAnimation: true,
    monthImages: null,
    termsAndPolicies: null,
    profile: mapCompanyToProfile(profile)
  };
}

/** Fetches configuration for a specific company and global params (languages, topics) */
export async function getCompanyConfig(company: string): Promise<{
  config: CompanyThemeConfig | null;
  languages: string[];
  topics: string[];
}> {
  try {
    const rc = getConfig();
    const template = await rc.getTemplate();

    let companyConfig: CompanyThemeConfig | null = null;
    if (template.parameters[company]) {
      const parameterValue = template.parameters[company].defaultValue as { value: string };
      if (parameterValue && parameterValue.value) {
        companyConfig = JSON.parse(parameterValue.value);
      }
    }

    // Fallback if config parameters are missing in Remote Config
    if (!companyConfig) {
      const companyProfile = await getCompany(company);
      if (companyProfile) {
        companyConfig = createDefaultCompanyConfig(companyProfile);
      }
    }

    let languages: string[] = [];
    if (template.parameters['Languages']) {
      const parameterValue = template.parameters['Languages'].defaultValue as { value: string };
      if (parameterValue && parameterValue.value) {
        languages = JSON.parse(parameterValue.value);
      }
    }

    let topics: string[] = [];
    if (template.parameters['Topics']) {
      const parameterValue = template.parameters['Topics'].defaultValue as { value: string };
      if (parameterValue && parameterValue.value) {
        topics = JSON.parse(parameterValue.value);
      }
    }

    return { config: companyConfig, languages, topics };
  } catch (error) {
    console.error(`Error getting Remote Config for company ${company}:`, error);
    // Return empty fallback values to prevent system crashes
    return { config: null, languages: [], topics: [] };
  }
}

/** Synchronizes the company profile metadata with its Remote Config template parameter */
export async function syncCompanyProfileToRemoteConfig(
  companyId: string,
  companyProfile: Company
): Promise<boolean> {
  try {
    const rc = getConfig();
    const template = await rc.getTemplate();

    let companyConfig: CompanyThemeConfig;

    if (template.parameters[companyId]) {
      const parameterValue = template.parameters[companyId].defaultValue as { value: string };
      if (parameterValue && parameterValue.value) {
        companyConfig = JSON.parse(parameterValue.value);
        // Merge updated profile details
        companyConfig.name = companyProfile.name;
        companyConfig.category = companyProfile.category || '';
        if (companyProfile.iUrl) {
          companyConfig.logo = companyProfile.iUrl;
        }
        companyConfig.profile = mapCompanyToProfile(companyProfile);
      } else {
        companyConfig = createDefaultCompanyConfig(companyProfile);
      }
    } else {
      companyConfig = createDefaultCompanyConfig(companyProfile);
    }

    template.parameters[companyId] = {
      defaultValue: {
        value: JSON.stringify(companyConfig),
      },
      valueType: 'STRING',
    };

    // Validate the updated template
    await rc.validateTemplate(template);

    // Publish the updated template
    const updated = await rc.publishTemplate(template);
    console.log(`Remote Config automatically synchronized profile for ${companyId}. Etag: ${updated.etag}`);
    return true;
  } catch (error) {
    console.error(`Error syncing Remote Config for company ${companyId}:`, error);
    return false;
  }
}

/** Updates Remote Config template for a company */
export async function updateCompanyConfig(company: string, data: CompanyThemeConfig): Promise<boolean> {
  try {
    const rc = getConfig();
    const template = await rc.getTemplate();

    template.parameters[company] = {
      defaultValue: {
        value: JSON.stringify(data),
      },
      valueType: 'STRING',
    };

    // Validate the updated template
    await rc.validateTemplate(template);

    // Publish the updated template
    const updated = await rc.publishTemplate(template);
    console.log(`Remote Config published. Etag: ${updated.etag}`);
    return true;
  } catch (error) {
    console.error(`Error updating Remote Config for company ${company}:`, error);
    return false;
  }
}

export interface TopicOption {
  name: string;
  value: string;
}

/** Gets only the global topics list */
export async function getTopics(): Promise<TopicOption[]> {
  try {
    const rc = getConfig();
    const template = await rc.getTemplate();
    if (template.parameters['Topics']) {
      const parameterValue = template.parameters['Topics'].defaultValue as { value: string };
      if (parameterValue && parameterValue.value) {
        return JSON.parse(parameterValue.value);
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching Remote Config Topics:', error);
    return [];
  }
}

export interface CategoryOption {
  name: string;
  value: string;
}

/** Gets the ContentCategory parameter list */
export async function getContentCategories(): Promise<CategoryOption[]> {
  try {
    const rc = getConfig();
    const template = await rc.getTemplate();
    if (template.parameters['ContentCategory']) {
      const parameterValue = template.parameters['ContentCategory'].defaultValue as { value: string };
      if (parameterValue && parameterValue.value) {
        return JSON.parse(parameterValue.value);
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching Remote Config Content Categories:', error);
    return [];
  }
}

/** Fetches the global "General" Remote Config parameter */
export async function getGeneralConfig(): Promise<any> {
  try {
    const rc = getConfig();
    const template = await rc.getTemplate();
    if (template.parameters['General']) {
      const parameterValue = template.parameters['General'].defaultValue as { value: string };
      if (parameterValue && parameterValue.value) {
        return JSON.parse(parameterValue.value);
      }
    }
    return {};
  } catch (error) {
    console.error('Error fetching Remote Config General:', error);
    return {};
  }
}

/** Updates and publishes the global "General" Remote Config parameter */
export async function updateGeneralConfig(data: any): Promise<boolean> {
  try {
    const rc = getConfig();
    const template = await rc.getTemplate();

    template.parameters['General'] = {
      defaultValue: {
        value: JSON.stringify(data),
      },
      valueType: 'STRING',
    };

    // Validate the updated template
    await rc.validateTemplate(template);

    // Publish the updated template
    const updated = await rc.publishTemplate(template);
    console.log(`Remote Config published for General parameter. Etag: ${updated.etag}`);
    return true;
  } catch (error) {
    console.error('Error updating Remote Config General parameter:', error);
    return false;
  }
}


