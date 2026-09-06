import { supabase } from '../supabaseClient'

// Kunci-kunci pengaturan aplikasi yang tersimpan di tabel app_settings
export const SETTINGS_KEYS = {
  ANTIBIOTIC_REVIEW_DAYS: 'antibiotic_review_days',
}

export const SETTINGS_DEFAULTS = {
  [SETTINGS_KEYS.ANTIBIOTIC_REVIEW_DAYS]: '7',
}

/**
 * Mengambil satu nilai pengaturan dari tabel app_settings.
 * Mengembalikan nilai default (dari SETTINGS_DEFAULTS atau parameter fallback)
 * jika baris belum ada atau terjadi error, supaya aplikasi tetap berjalan
 * meski migrasi tabel app_settings belum dijalankan.
 */
export async function getSetting(key, fallback = SETTINGS_DEFAULTS[key]) {
  try {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle()
    if (error || !data) return fallback
    return data.value
  } catch {
    return fallback
  }
}

/**
 * Menyimpan satu nilai pengaturan (khusus admin, sesuai RLS policy).
 */
export async function setSetting(key, value) {
  return supabase.from('app_settings').upsert({ key, value: String(value) })
}
