// Ambang evaluasi: antibiotik yang sudah digunakan 7 hari atau lebih
// wajib dievaluasi ulang (efektivitas, de-eskalasi, durasi, dsb.)
export const EVALUATION_THRESHOLD_DAYS = 7

export const EVALUATION_NOTE =
  'Sudah digunakan \u22657 hari \u2014 perlu evaluasi antibiotik: tinjau hasil kultur/sensitivitas dan ' +
  'respons klinis, pertimbangkan de-eskalasi atau switch IV ke oral, konfirmasi durasi terapi ' +
  'yang masih dibutuhkan, dan hentikan bila indikasi sudah tidak ada.'

/**
 * Menghitung antibiotik sudah berjalan hari ke berapa.
 * Tanggal mulai dihitung sebagai hari ke-1.
 */
export function hitungHariKe(tanggalMulai) {
  const start = new Date(tanggalMulai + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

/**
 * Menentukan level status untuk styling + label yang ditampilkan.
 * Penandaan hanya diberikan untuk penggunaan 7 hari atau lebih.
 * level: 'normal' | 'review'
 */
export function statusReview(hariKe) {
  if (hariKe >= EVALUATION_THRESHOLD_DAYS) {
    return {
      level: 'review',
      label: `Hari ke-${hariKe} \u2014 Perlu Evaluasi`,
      keterangan: EVALUATION_NOTE,
    }
  }
  return { level: 'normal', label: `Hari ke-${hariKe}`, keterangan: '' }
}
