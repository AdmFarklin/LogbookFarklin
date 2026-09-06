import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = ['Asesmen Baru', 'Asesmen Ulang', 'Pulang', 'Konfirmasi']

function emptyForm(tanggal) {
  return {
    tanggal,
    ward_id: '',
    nomor_kamar: '',
    nama_pasien: '',
    catatan_klinis: '',
    riwayat_alergi: '',
    riwayat_obat: '',
    drp_terkonfirmasi: '',
    feedback_usul: '',
    status: 'Asesmen Baru',
  }
}

/**
 * Komponen bersama untuk menampilkan logbook asesmen.
 * mode="mine" -> hanya menampilkan asesmen milik akun yang sedang login (bisa tambah baru).
 * mode="all"  -> menampilkan asesmen semua akun (read-focused, tanpa form tambah baru).
 */
export default function AssessmentsView({ mode = 'mine' }) {
  const { session, isAdmin } = useAuth()
  const todayStr = new Date().toISOString().slice(0, 10)
  const isMineMode = mode === 'mine'

  const [wards, setWards] = useState([])
  const [rows, setRows] = useState([])
  const [filterDate, setFilterDate] = useState(todayStr)
  const [filterWard, setFilterWard] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm(todayStr))
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

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
    setSelectedIds(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, filterWard, mode])

  async function loadRows() {
    setLoading(true)
    let query = supabase
      .from('assessments')
      .select('*, wards(name, level), profiles(full_name)')
      .eq('tanggal', filterDate)
      .order('created_at', { ascending: false })
    if (filterWard) query = query.eq('ward_id', Number(filterWard))
    if (isMineMode) query = query.eq('pharmacist_id', session.user.id)
    const { data, error } = await query
    if (!error) setRows(data || [])
    setLoading(false)
  }

  const visibleRows = rows.filter((row) =>
    row.nama_pasien.toLowerCase().includes(search.trim().toLowerCase())
  )

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelectedIds(new Set(visibleRows.map((r) => r.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function handlePrint() {
    window.print()
  }

  async function handleCopy(text, id) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedId(id)
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500)
    }
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
      nomor_kamar: row.nomor_kamar || '',
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
    <div className="page page--wide">
      <div className="page-header">
        <h1>{isMineMode ? 'Asesmen Pasien (Saya)' : 'Semua Asesmen Pasien'}</h1>
        <div className="page-header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Cari nama pasien…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)}>
            <option value="">Semua ruangan</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (Level {w.level})
              </option>
            ))}
          </select>
          {isMineMode && <button onClick={startNew}>+ Asesmen baru</button>}
        </div>
      </div>

      {!isMineMode && (
        <p className="section-note">
          Menampilkan asesmen dari semua akun apoteker. Untuk menambah catatan baru, gunakan menu
          Asesmen Pasien (Saya).
        </p>
      )}

      {!loading && visibleRows.length > 0 && (
        <div className="print-bar no-print">
          <span className="muted">
            {selectedIds.size > 0
              ? `${selectedIds.size} pasien dipilih untuk dicetak`
              : 'Pilih pasien untuk dicetak sebagai referensi visite'}
          </span>
          <span className="print-bar-actions">
            <button type="button" className="link-btn" onClick={selectAllVisible}>
              Pilih semua ({visibleRows.length})
            </button>
            {selectedIds.size > 0 && (
              <>
                <button type="button" className="link-btn" onClick={clearSelection}>
                  Batal pilihan
                </button>
                <button type="button" onClick={handlePrint}>
                  🖨️ Cetak {selectedIds.size} pasien
                </button>
              </>
            )}
          </span>
        </div>
      )}

      {showForm && (
        <form className="panel-form no-print" onSubmit={handleSubmit}>
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
              Nomor kamar
              <input
                value={form.nomor_kamar}
                onChange={(e) => setForm({ ...form, nomor_kamar: e.target.value })}
                placeholder="mis. 3B / Bed 2"
              />
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
      {!loading && visibleRows.length === 0 && (
        <p className="empty-note">
          {search
            ? 'Tidak ada pasien yang cocok dengan pencarian.'
            : isMineMode
            ? 'Belum ada asesmen yang kamu buat pada tanggal ini.'
            : 'Belum ada asesmen pada tanggal ini.'}
        </p>
      )}

      <div className="print-header">
        <strong>Logbook Asesmen Farmasi Klinis</strong> — {filterDate}
        {filterWard && wards.find((w) => w.id === Number(filterWard))
          ? ` — ${wards.find((w) => w.id === Number(filterWard)).name}`
          : ''}
      </div>

      <div className="assessment-list">
        {visibleRows.map((row) => {
          const isSelected = selectedIds.has(row.id)
          return (
            <div
              key={row.id}
              className={`assessment-card assessment-card--split ${
                isSelected ? 'is-selected-for-print' : ''
              }`}
            >
              <div className="assessment-card-identity">
                <label className="print-checkbox no-print">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(row.id)}
                  />
                  Cetak
                </label>
                <span
                  className={`status-pill status-pill--${row.status.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {row.status}
                </span>
                <strong className="patient-name">{row.nama_pasien}</strong>
                <span className="muted">{row.wards?.name} (Level {row.wards?.level})</span>
                {row.nomor_kamar && <span className="muted">Kamar {row.nomor_kamar}</span>}
                <span className="muted meta-date">{row.tanggal}</span>
                <span className="muted no-print">oleh {row.profiles?.full_name}</span>
                {(row.pharmacist_id === session.user.id || isAdmin) && (
                  <span className="row-actions no-print">
                    <button className="link-btn" onClick={() => startEdit(row)}>
                      Ubah
                    </button>
                    <button className="link-btn link-btn--danger" onClick={() => handleDelete(row.id)}>
                      Hapus
                    </button>
                  </span>
                )}
              </div>

              <div className="assessment-card-clinical">
                {row.catatan_klinis && (
                  <div>
                    <p
                      className="copyable-text"
                      role="button"
                      tabIndex={0}
                      title="Klik untuk menyalin diagnosa & terapi"
                      onClick={() => handleCopy(row.catatan_klinis, row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleCopy(row.catatan_klinis, row.id)
                        }
                      }}
                    >
                      <strong>Diagnosa &amp; terapi:</strong> {row.catatan_klinis}
                    </p>
                    <span className="copy-hint no-print">
                      {copiedId === row.id ? 'Tersalin!' : 'Klik teks untuk menyalin'}
                    </span>
                  </div>
                )}
                {row.riwayat_alergi && (
                  <p>
                    <strong>Alergi:</strong> {row.riwayat_alergi}
                  </p>
                )}
                {row.riwayat_obat && (
                  <p>
                    <strong>Riwayat obat:</strong> {row.riwayat_obat}
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
