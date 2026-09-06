import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { hitungHariKe, statusReview } from '../lib/antibiotic'

export default function Dashboard() {
  const [todayCount, setTodayCount] = useState(null)
  const [reviewList, setReviewList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)

    const { count } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .eq('tanggal', today)

    const { data: antibiotics } = await supabase
      .from('antibiotic_monitoring')
      .select('*')
      .eq('is_active', true)

    const withStatus = (antibiotics || [])
      .map((a) => {
        const hariKe = hitungHariKe(a.tanggal_mulai)
        return { ...a, hariKe, status: statusReview(hariKe) }
      })
      .filter((a) => a.status.level !== 'normal')
      .sort((a, b) => b.hariKe - a.hariKe)

    setTodayCount(count ?? 0)
    setReviewList(withStatus)
    setLoading(false)
  }

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-number">{loading ? '—' : todayCount}</span>
          <span className="stat-label">Asesmen hari ini</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{loading ? '—' : reviewList.length}</span>
          <span className="stat-label">Antibiotik perlu perhatian</span>
        </div>
      </div>

      <section>
        <h2>Perlu review hari ini</h2>
        {loading && <p>Memuat…</p>}
        {!loading && reviewList.length === 0 && (
          <p className="empty-note">Tidak ada pasien dengan antibiotik yang perlu direview hari ini.</p>
        )}
        <div className="antibiotic-list">
          {reviewList.map((a) => (
            <div key={a.id} className={`antibiotic-row antibiotic-row--${a.status.level}`}>
              <div className="antibiotic-row-main">
                <strong>{a.nama_pasien}</strong>
                <span className="muted"> · {a.nama_antibiotik}</span>
              </div>
              <span className="badge">{a.status.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="quick-links">
        <Link to="/assessments">+ Tambah asesmen</Link>
        <Link to="/antibiotics">+ Tambah antibiotik</Link>
      </div>
    </div>
  )
}
