// Hari review sesuai kesepakatan: hari ke-5, 7, 10, dan 14
export const REVIEW_DAYS = [5, 7, 10, 14]

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
 * level: 'normal' | 'review' | 'lanjut'
 */
export function statusReview(hariKe) {
  if (hariKe > 14) {
    return { level: 'lanjut', label: `Hari ke-${hariKe} — evaluasi terapi lanjutan` }
  }
  if (REVIEW_DAYS.includes(hariKe)) {
    return { level: 'review', label: `Hari ke-${hariKe} — waktunya review` }
  }
  return { level: 'normal', label: `Hari ke-${hariKe}` }
}
