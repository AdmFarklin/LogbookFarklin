import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hitungHariKe, statusReview } from '../lib/antibiotic'

const todayStr = new Date().toISOString().slice(0, 10)

const emptyForm = {
  nama_pasien: '',
  ward_id: '',
  nama_antibiotik: '',
  tanggal_mulai: todayStr,
  catatan: '',
}

export default function Antibiotics() {
  const { session, isAdmin } = useAuth()

  const [wards, setWards] = useState([])
  const [rows, setRows] = useState([])
  const [showInactive, setShowInactive] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('wards')
      .select('*')
      .order('name')
      .then(({ data }) => setWards(data || []))
  }, [])

  useEffect(() => {
    loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive])

  async function loadRows() {
    setLoading(true)
    let query = supabase
      .from('antibiotic_monitoring')
      .select('*, wards(name)')
      .order('tanggal_mulai', { ascending: false })
    if (!showInactive) query = query.eq('is_active', true)
    const { data, error } = await query
    if (!error) setRows(data || [])
    setLoading(false)
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm({
      nama_pasien: row.nama_pasien,
      ward_id: row.ward_id || '',
      nama_antibiotik: row.nama_antibiotik,
      tanggal_mulai: row.tanggal_mulai,
      catatan: row.catatan || '',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = { ...form, ward_id: form.ward_id ? Number(form.ward_id) : null }

    const result = editingId
      ? await supabase.from('antibiotic_monitoring').update(payload).eq('id', editingId)
      : await supabase.from('antibiotic_monitoring').insert({ ...payload, created_by: session.user.id })

    setSaving(false)
    if (result.error) {
      setError('Gagal menyimpan: ' + result.error.message)
      return
    }
    setShowForm(false)
    loadRows()
  }

  async function toggleActive(row) {
    await supabase.from('antibiotic_monitoring').update({ is_active: !row.is_active }).eq('id', row.id)
    loadRows()
  }

  async function handleDelete(id) {
    if (!confirm('Hapus catatan monitoring ini?')) return
    const { error } = await supabase.from('antibiotic_monitoring').delete().eq('id', id)
    if (error) alert('Gagal menghapus: ' + error.message)
    else loadRows()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Monitoring Antibiotik</h1>
        <div className="page-header-actions">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Tampilkan yang sudah selesai
          </label>
          <button onClick={startNew}>+ Tambah pasien</button>
        </div>
      </div>

      <p className="section-note">
        Review otomatis ditandai pada hari ke-5, 7, 10, dan 14 penggunaan antibiotik.
      </p>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Nama pasien
              <input
                value={form.nama_pasien}
                onChange={(e) => setForm({ ...form, nama_pasien: e.target.value })}
                required
              />
            </label>
            <label>
              Ruangan (opsional)
              <select value={form.ward_id} onChange={(e) => setForm({ ...form, ward_id: e.target.value })}>
                <option value="">—</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nama antibiotik
              <input
                value={form.nama_antibiotik}
                onChange={(e) => setForm({ ...form, nama_antibiotik: e.target.value })}
                required
              />
            </label>
            <label>
              Tanggal mulai
              <input
                type="date"
                value={form.tanggal_mulai}
                onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                required
              />
            </label>
          </div>
          <label>
            Catatan (opsional)
            <textarea rows={2} value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Batal
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {loading && <p>Memuat…</p>}
      {!loading && rows.length === 0 && <p className="empty-note">Belum ada data monitoring antibiotik.</p>}

      <div className="antibiotic-list">
        {rows.map((row) => {
          const hariKe = hitungHariKe(row.tanggal_mulai)
          const status = statusReview(hariKe)
          const level = row.is_active ? status.level : 'selesai'
          return (
            <div key={row.id} className={`antibiotic-row antibiotic-row--${level}`}>
              <div className="antibiotic-row-main">
                <strong>{row.nama_pasien}</strong>
                <span className="muted">
                  {' '}
                  · {row.nama_antibiotik}
                  {row.wards?.name ? ` · ${row.wards.name}` : ''}
                </span>
                {row.catatan && <p className="muted">{row.catatan}</p>}
              </div>
              <div className="antibiotic-row-side">
                <span className="badge">{row.is_active ? status.label : 'Selesai'}</span>
                {(row.created_by === session.user.id || isAdmin) && (
                  <span className="row-actions">
                    <button className="link-btn" onClick={() => startEdit(row)}>
                      Ubah
                    </button>
                    <button className="link-btn" onClick={() => toggleActive(row)}>
                      {row.is_active ? 'Tandai selesai' : 'Aktifkan lagi'}
                    </button>
                    <button className="link-btn link-btn--danger" onClick={() => handleDelete(row.id)}>
                      Hapus
                    </button>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
