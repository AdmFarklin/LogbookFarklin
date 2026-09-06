import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = ['Asesmen Baru', 'Asesmen Ulang', 'Pulang', 'Konfirmasi']

function emptyForm(tanggal) {
  return {
    tanggal,
    ward_id: '',
    nama_pasien: '',
    catatan_klinis: '',
    riwayat_alergi: '',
    riwayat_obat: '',
    drp_terkonfirmasi: '',
    feedback_usul: '',
    status: 'Asesmen Baru',
  }
}

export default function Assessments() {
  const { session, isAdmin } = useAuth()
  const todayStr = new Date().toISOString().slice(0, 10)

  const [wards, setWards] = useState([])
  const [rows, setRows] = useState([])
  const [filterDate, setFilterDate] = useState(todayStr)
  const [form, setForm] = useState(emptyForm(todayStr))
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('wards')
      .select('*')
      .order('level')
      .order('name')
      .then(({ data }) => setWards(data || []))
  }, [])

  useEffect(() => {
    loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate])

  async function loadRows() {
    setLoading(true)
    const { data, error } = await supabase
      .from('assessments')
      .select('*, wards(name, level), profiles(full_name)')
      .eq('tanggal', filterDate)
      .order('created_at', { ascending: false })
    if (!error) setRows(data || [])
    setLoading(false)
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm(filterDate))
    setError('')
    setShowForm(true)
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm({
      tanggal: row.tanggal,
      ward_id: row.ward_id,
      nama_pasien: row.nama_pasien,
      catatan_klinis: row.catatan_klinis || '',
      riwayat_alergi: row.riwayat_alergi || '',
      riwayat_obat: row.riwayat_obat || '',
      drp_terkonfirmasi: row.drp_terkonfirmasi || '',
      feedback_usul: row.feedback_usul || '',
      status: row.status,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = { ...form, ward_id: Number(form.ward_id) }

    const result = editingId
      ? await supabase.from('assessments').update(payload).eq('id', editingId)
      : await supabase.from('assessments').insert({ ...payload, pharmacist_id: session.user.id })

    setSaving(false)
    if (result.error) {
      setError('Gagal menyimpan: ' + result.error.message)
      return
    }
    setShowForm(false)
    loadRows()
  }

  async function handleDelete(id) {
    if (!confirm('Hapus catatan asesmen ini?')) return
    const { error } = await supabase.from('assessments').delete().eq('id', id)
    if (error) alert('Gagal menghapus: ' + error.message)
    else loadRows()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Asesmen Pasien</h1>
        <div className="page-header-actions">
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          <button onClick={startNew}>+ Asesmen baru</button>
        </div>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Tanggal
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                required
              />
            </label>
            <label>
              Ruangan
              <select
                value={form.ward_id}
                onChange={(e) => setForm({ ...form, ward_id: e.target.value })}
                required
              >
                <option value="">Pilih ruangan…</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Level {w.level})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nama pasien
              <input
                value={form.nama_pasien}
                onChange={(e) => setForm({ ...form, nama_pasien: e.target.value })}
                required
              />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Diagnosa, DPJP &amp; terapi terkini
            <textarea
              rows={4}
              value={form.catatan_klinis}
              onChange={(e) => setForm({ ...form, catatan_klinis: e.target.value })}
            />
          </label>

          <div className="form-grid">
            <label>
              Riwayat alergi
              <textarea
                rows={2}
                value={form.riwayat_alergi}
                onChange={(e) => setForm({ ...form, riwayat_alergi: e.target.value })}
              />
            </label>
            <label>
              Riwayat penggunaan obat
              <textarea
                rows={2}
                value={form.riwayat_obat}
                onChange={(e) => setForm({ ...form, riwayat_obat: e.target.value })}
              />
            </label>
          </div>

          <label>
            DRP terkonfirmasi
            <textarea
              rows={2}
              value={form.drp_terkonfirmasi}
              onChange={(e) => setForm({ ...form, drp_terkonfirmasi: e.target.value })}
            />
          </label>
          <label>
            Feedback / usul
            <textarea
              rows={2}
              value={form.feedback_usul}
              onChange={(e) => setForm({ ...form, feedback_usul: e.target.value })}
            />
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
      {!loading && rows.length === 0 && <p className="empty-note">Belum ada asesmen pada tanggal ini.</p>}

      <div className="assessment-list">
        {rows.map((row) => (
          <div key={row.id} className="assessment-card">
            <div className="assessment-card-head">
              <div>
                <strong>{row.nama_pasien}</strong>
                <span className="muted">
                  {' '}
                  · {row.wards?.name} (Level {row.wards?.level})
                </span>
              </div>
              <span
                className={`status-pill status-pill--${row.status.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {row.status}
              </span>
            </div>
            {row.catatan_klinis && <p>{row.catatan_klinis}</p>}
            {row.riwayat_alergi && (
              <p>
                <strong>Alergi:</strong> {row.riwayat_alergi}
              </p>
            )}
            {row.drp_terkonfirmasi && (
              <p>
                <strong>DRP:</strong> {row.drp_terkonfirmasi}
              </p>
            )}
            {row.feedback_usul && (
              <p>
                <strong>Feedback:</strong> {row.feedback_usul}
              </p>
            )}
            <div className="assessment-card-foot">
              <span className="muted">oleh {row.profiles?.full_name}</span>
              {(row.pharmacist_id === session.user.id || isAdmin) && (
                <span className="row-actions">
                  <button className="link-btn" onClick={() => startEdit(row)}>
                    Ubah
                  </button>
                  <button className="link-btn link-btn--danger" onClick={() => handleDelete(row.id)}>
                    Hapus
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
