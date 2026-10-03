import { requireClient } from '../lib/supabase';
import type { ContactSettings } from '../types/report';

interface SettingsRow {
  organization_name: string;
  pickup_location: string;
  phone_number: string;
  facebook_page_name: string;
  facebook_page_url: string;
  office_hours: string;
  additional_instructions: string;
  updated_at: string;
}

const FALLBACK_SETTINGS: ContactSettings = {
  organizationName: 'FindBack – Dalaguete Public Market',
  pickupLocation: 'Dalaguete Public Market Administration Office',
  phoneNumber: '+63 900 000 0000',
  facebookPageName: 'FindBack – Dalaguete Public Market',
  facebookPageUrl: 'https://facebook.com/',
  officeHours: '8:00 AM – 5:00 PM',
  additionalInstructions: '',
  updatedAt: '',
};

function mapSettings(row: SettingsRow): ContactSettings {
  return {
    organizationName: row.organization_name,
    pickupLocation: row.pickup_location,
    phoneNumber: row.phone_number,
    facebookPageName: row.facebook_page_name,
    facebookPageUrl: row.facebook_page_url,
    officeHours: row.office_hours,
    additionalInstructions: row.additional_instructions,
    updatedAt: row.updated_at,
  };
}

export async function loadContactSettings(): Promise<ContactSettings> {
  const { data, error } = await requireClient()
    .from('system_settings')
    .select('*')
    .eq('id', true)
    .single();
  if (error || !data) return FALLBACK_SETTINGS;
  return mapSettings(data as SettingsRow);
}

export async function updateContactSettings(settings: Omit<ContactSettings, 'updatedAt'>): Promise<void> {
  const { error } = await requireClient().rpc('admin_update_settings', {
    p_organization_name: settings.organizationName,
    p_pickup_location: settings.pickupLocation,
    p_phone_number: settings.phoneNumber,
    p_facebook_page_name: settings.facebookPageName,
    p_facebook_page_url: settings.facebookPageUrl,
    p_office_hours: settings.officeHours,
    p_additional_instructions: settings.additionalInstructions,
  });
  if (error) throw error;
}
