import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { getSetting, setSetting, SETTINGS_KEYS } from '../lib/settings'
import { EVALUATION_THRESHOLD_DAYS } from '../lib/antibiotic'

const LEVEL_OPTIONS = [1, 2, 3]

function emptyWardForm() {
  return { name: '', level: 1 }
}

export default function Admin() {
  // --- Ruangan & level asesmen ---
  const [wards, setWards] = useState([])
  const [wardsLoading, setWardsLoading] = useState(true)
  const [editingWardId, setEditingWardId] = useState(null)
  const [wardEdits, setWardEdits] = useState({})
  const [newWard, setNewWard] = useState(emptyWardForm())
  const [wardSavingId, setWardSavingId] = useState(null)
  const [wardError, setWardError] = useState('')

  // --- Interval pemantauan antibiotik ---
  const [reviewDays, setReviewDays] = useState(String(EVALUATION_THRESHOLD_DAYS))
  const [reviewDaysLoading, setReviewDaysLoading] = useState(true)
  const [reviewDaysSaving, setReviewDaysSaving] = useState(false)
  const [reviewDaysSaved, setReviewDaysSaved] = useState(false)
  const [reviewDaysError, setReviewDaysError] = useState('')

  useEffect(() => {
    loadWards()
    loadReviewDays()
  }, [])

  async function loadWards() {
    setWardsLoading(true)
    const { data } = await supabase.from('wards').select('*').order('level').order('name')
    setWards(data || [])
    setWardsLoading(false)
  }

  async function loadReviewDays() {
    setReviewDaysLoading(true)
    const value = await getSetting(SETTINGS_KEYS.ANTIBIOTIC_REVIEW_DAYS)
    setReviewDays(String(value ?? EVALUATION_THRESHOLD_DAYS))
    setReviewDaysLoading(false)
  }

  function startEditWard(ward) {
    setEditingWardId(ward.id)
    setWardEdits({ name: ward.name, level: ward.level })
    setWardError('')
  }

  function cancelEditWard() {
    setEditingWardId(null)
    setWardEdits({})
    setWardError('')
  }

  async function saveWardEdit(id) {
    setWardSavingId(id)
    setWardError('')
    const { error } = await supabase
      .from('wards')
      .update({ name: wardEdits.name, level: Number(wardEdits.level) })
      .eq('id', id)
    setWardSavingId(null)
    if (error) {
      setWardError('Gagal menyimpan: ' + error.message)
      return
    }
    setEditingWardId(null)
    setWardEdits({})
    loadWards()
  }

  async function handleDeleteWard(id) {
    if (!confirm('Hapus ruangan ini? Ruangan yang masih dipakai di data asesmen/monitoring tidak bisa dihapus.'))
      return
    const { error } = await supabase.from('wards').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }
    loadWards()
  }

  async function handleAddWard(e) {
    e.preventDefault()
    setWardError('')
    if (!newWard.name.trim()) {
      setWardError('Nama ruangan wajib diisi.')
      return
    }
    setWardSavingId('new')
    const { error } = await supabase
      .from('wards')
      .insert({ name: newWard.name.trim(), level: Number(newWard.level) })
    setWardSavingId(null)
    if (error) {
      setWardError('Gagal menambah ruangan: ' + error.message)
      return
    }
    setNewWard(emptyWardForm())
    loadWards()
  }

  async function handleSaveReviewDays(e) {
    e.preventDefault()
    setReviewDaysError('')
    const numeric = Number(reviewDays)
    if (!Number.isInteger(numeric) || numeric < 1) {
      setReviewDaysError('Masukkan jumlah hari berupa bilangan bulat, minimal 1.')
      return
    }
    setReviewDaysSaving(true)
    const { error } = await setSetting(SETTINGS_KEYS.ANTIBIOTIC_REVIEW_DAYS, numeric)
    setReviewDaysSaving(false)
    if (error) {
      setReviewDaysError('Gagal menyimpan: ' + error.message)
      return
    }
    setReviewDaysSaved(true)
    setTimeout(() => setReviewDaysSaved(false), 2000)
  }

  return (
    <div className="page">
      <h1>Admin</h1>

      <section className="admin-section">
        <h2>Ruangan &amp; Level Asesmen</h2>
        <p className="section-note">
          Level menentukan ketentuan frekuensi asesmen sesuai JUKNIS (1, 2, atau 3).
        </p>

        {wardsLoading && <p>Memuat…</p>}

        {!wardsLoading && (
          <div className="ward-table">
            <div className="ward-table-head">
              <span>Nama ruangan</span>
              <span>Level</span>
              <span></span>
            </div>
            {wards.map((w) => (
              <div className="ward-table-row" key={w.id}>
                {editingWardId === w.id ? (
                  <>
                    <input
                      value={wardEdits.name}
                      onChange={(e) => setWardEdits({ ...wardEdits, name: e.target.value })}
                    />
                    <select
                      value={wardEdits.level}
                      onChange={(e) => setWardEdits({ ...wardEdits, level: e.target.value })}
                    >
                      {LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Level {lvl}
                        </option>
                      ))}
                    </select>
                    <span className="row-actions">
                      <button
                        type="button"
                        className="link-btn"
                        disabled={wardSavingId === w.id}
                        onClick={() => saveWardEdit(w.id)}
                      >
                        {wardSavingId === w.id ? 'Menyimpan…' : 'Simpan'}
                      </button>
                      <button type="button" className="link-btn" onClick={cancelEditWard}>
                        Batal
                      </button>
                    </span>
                  </>
                ) : (
                  <>
                    <span>{w.name}</span>
                    <span>Level {w.level}</span>
                    <span className="row-actions">
                      <button type="button" className="link-btn" onClick={() => startEditWard(w)}>
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        onClick={() => handleDeleteWard(w.id)}
                      >
                        Hapus
                      </button>
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {wardError && <p className="form-error">{wardError}</p>}

        <form className="ward-add-form" onSubmit={handleAddWard}>
          <input
            value={newWard.name}
            onChange={(e) => setNewWard({ ...newWard, name: e.target.value })}
            placeholder="Nama ruangan baru"
          />
          <select value={newWard.level} onChange={(e) => setNewWard({ ...newWard, level: e.target.value })}>
            {LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>
                Level {lvl}
              </option>
            ))}
          </select>
          <button type="submit" disabled={wardSavingId === 'new'}>
            {wardSavingId === 'new' ? 'Menambah…' : '+ Tambah ruangan'}
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Interval Pemantauan Antibiotik</h2>
        <p className="section-note">
          Jumlah hari penggunaan antibiotik sebelum ditandai perlu evaluasi di menu Monitoring
          Antibiotik &amp; Dashboard.
        </p>

        {reviewDaysLoading ? (
          <p>Memuat…</p>
        ) : (
          <form className="review-days-form" onSubmit={handleSaveReviewDays}>
            <label>
              Tandai perlu evaluasi setelah
              <input
                type="number"
                min="1"
                value={reviewDays}
                onChange={(e) => setReviewDays(e.target.value)}
              />
            </label>
            <span className="muted">hari penggunaan</span>
            <button type="submit" disabled={reviewDaysSaving}>
              {reviewDaysSaving ? 'Menyimpan…' : 'Simpan'}
            </button>
            {reviewDaysSaved && <span className="save-confirm">Tersimpan!</span>}
          </form>
        )}
        {reviewDaysError && <p className="form-error">{reviewDaysError}</p>}
      </section>
    </div>
  )
}
