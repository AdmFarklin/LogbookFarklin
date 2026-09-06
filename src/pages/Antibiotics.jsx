// Ambang evaluasi default (hari). Nilai aktual dapat diubah admin lewat
// menu Admin > Interval Pemantauan, tersimpan di tabel app_settings
// (key: antibiotic_review_days).
export const EVALUATION_THRESHOLD_DAYS = 7

export function evaluationNote(thresholdDays = EVALUATION_THRESHOLD_DAYS) {
  return (
    `Sudah digunakan \u2265${thresholdDays} hari \u2014 perlu evaluasi antibiotik: tinjau hasil ` +
    'kultur/sensitivitas dan respons klinis, pertimbangkan de-eskalasi atau switch IV ke oral, ' +
    'konfirmasi durasi terapi yang masih dibutuhkan, dan hentikan bila indikasi sudah tidak ada.'
  )
}

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
 * Penandaan hanya diberikan untuk penggunaan >= thresholdDays (default 7 hari,
 * bisa diubah lewat menu Admin).
 * level: 'normal' | 'review'
 */
export function statusReview(hariKe, thresholdDays = EVALUATION_THRESHOLD_DAYS) {
  if (hariKe >= thresholdDays) {
    return {
      level: 'review',
      label: `Hari ke-${hariKe} \u2014 Perlu Evaluasi`,
      keterangan: evaluationNote(thresholdDays),
    }
  }
  return { level: 'normal', label: `Hari ke-${hariKe}`, keterangan: '' }
}
