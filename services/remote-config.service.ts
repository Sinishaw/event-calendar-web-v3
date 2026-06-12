import 'server-only';
import { adminApp } from '@/lib/firebase-admin';
import { getRemoteConfig } from 'firebase-admin/remote-config';

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

/** Gets only the global topics list */
export async function getTopics(): Promise<string[]> {
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


