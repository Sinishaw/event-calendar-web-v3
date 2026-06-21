import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getCompany } from '@/services/company.service';
import { getCompanyConfig, updateCompanyConfig, CompanyThemeConfig } from '@/services/remote-config.service';
import { uploadToGCS } from '@/lib/upload';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const roles = getRoles(session);

  // If creator, must match their company
  if (roles.isCreater && !roles.isAdmin && roles.company !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await getCompanyConfig(id);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error(`API GET theme company ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch theme configuration' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const roles = getRoles(session);

  // Authorization check: Admin or Company Creator
  if (!roles.isAdmin && (!roles.isCreater || roles.company !== id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    
    // 1. Fetch current Remote Config to preserve fields
    const { config: existingConfig } = await getCompanyConfig(id);
    
    // 2. Fetch company profile details to embed
    const companyProfile = await getCompany(id);
    if (!companyProfile) {
      return NextResponse.json({ error: `Company profile "${id}" not found.` }, { status: 404 });
    }

    // 3. Process new images
    const logoFile = formData.get('logo') as File | null;
    const menuHeaderFile = formData.get('menuHeaderImage') as File | null;

    let logoURL = formData.get('currentLogo') as string || existingConfig?.logo || '';
    let menuHeaderURL = formData.get('currentMenuHeaderImage') as string || existingConfig?.menuHeaderImage || '';

    // Upload Logo
    if (logoFile && logoFile.size > 0) {
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = logoFile.name.split('.').pop() || 'png';
      const destinationPath = `CompanyImages/${id}/Images/${id}_logo_theme_${Date.now()}.${ext}`;
      logoURL = await uploadToGCS(buffer, destinationPath, logoFile.type);
    }

    // Upload Menu Header Image
    if (menuHeaderFile && menuHeaderFile.size > 0) {
      const bytes = await menuHeaderFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = menuHeaderFile.name.split('.').pop() || 'png';
      const destinationPath = `CompanyImages/${id}/Images/${id}_menuheader_${Date.now()}.${ext}`;
      menuHeaderURL = await uploadToGCS(buffer, destinationPath, menuHeaderFile.type);
    }

    // 4. Construct theme payload
    const payload: CompanyThemeConfig = {
      name: companyProfile.name,
      company: id,
      logo: logoURL,
      menuHeaderImage: menuHeaderURL,
      primaryColorLight: (formData.get('primaryColorLight') as string) || '#ffffff',
      accentColorLight: (formData.get('accentColorLight') as string) || '#000000',
      holidayColorLight: (formData.get('holidayColorLight') as string) || '#FF5252',
      primaryColorDark: (formData.get('primaryColorDark') as string) || '#000000',
      accentColorDark: (formData.get('accentColorDark') as string) || '#ffffff',
      holidayColorDark: (formData.get('holidayColorDark') as string) || '#FF5252',
      defaultTheme: (formData.get('defaultTheme') as string) || 'dark',
      defaultLanguage: (formData.get('defaultLanguage') as string) || 'am',
      NumberFormat: (formData.get('NumberFormat') as string) || 'english',
      menuBackgroundOpacity: parseFloat((formData.get('menuBackgroundOpacity') as string) || '1'),
      subscriptionPackage: (formData.get('subscriptionPackage') as string) || 'trial',
      expirationDate: (formData.get('expirationDate') as string) || companyProfile.established || '',
      
      leftMenu: formData.get('leftMenu') === 'true',
      showBottomMenu: formData.get('showBottomMenu') !== 'false', // default to true
      reverseAdsAnimation: formData.get('reverseAdsAnimation') === 'true',
      verticalAxisAdsAnimation: formData.get('verticalAxisAdsAnimation') !== 'false', // default to true
      logoLocation: (formData.get('logoLocation') as string) || 'topright',
      adsScreenLocation: (formData.get('adsScreenLocation') as string) || 'left',

      profile: {
        id: companyProfile.id,
        company: companyProfile.company,
        name: companyProfile.name,
        category: companyProfile.category || '',
        description: companyProfile.description || '',
        established: companyProfile.established || '',
        address: companyProfile.address || '',
        phone: companyProfile.phone || '',
        pobox: companyProfile.pobox || '',
        website: companyProfile.website || '',
        email: companyProfile.email || '',
        vUrl: companyProfile.vUrl || '',
        wUrl: companyProfile.wUrl || '',
        mission: companyProfile.mission || '',
        vision: companyProfile.vision || '',
        iUrl: companyProfile.iUrl || '',
        st: companyProfile.st,
        facebook: companyProfile.facebook || '',
        twitter: companyProfile.twitter || '',
        youtube: companyProfile.youtube || '',
        instagram: companyProfile.instagram || '',
      },
      
      // Preserve existing metadata parameters (like published months images and terms)
      monthImages: existingConfig?.monthImages || null,
      termsAndPolicies: existingConfig?.termsAndPolicies || null,
    };

    // Parse topics (if sent from client as JSON or comma separated string)
    const topicsVal = formData.get('topics') as string | null;
    if (topicsVal) {
      try {
        payload.topic = JSON.parse(topicsVal);
      } catch {
        payload.topic = topicsVal.split(',').map(t => t.trim());
      }
    } else if (existingConfig?.topic) {
      payload.topic = existingConfig.topic;
    }

    // 5. Update Remote Config Template
    const success = await updateCompanyConfig(id, payload);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update Remote Config template' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error: any) {
    console.error(`API POST theme company ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to save theme configuration' }, { status: 500 });
  }
}
