import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const SPECIALITES = [
  'Médecin généraliste', 'Pédiatre', 'Chirurgien',
  'Infirmier', 'Sage-femme', 'Psychologue',
  'Nutritionniste', 'Urgentiste', 'Autre'
]

export default function Personnel({ token }) {
  const [list, setList] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterDispo, setFilterDispo] = useState(null)
  const [filterSpec, setFilterSpec] = useState('')
  const [form, setForm] = useState({
    nom: '', prenom: '', specialite: 'Médecin généraliste',
    telephone: '', email: '', zone: '',
    disponibilite: true, statut: 'actif'
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = `${API}/personnel?`
      if (filterDispo !== null) url += `disponible=${filterDispo}&`
      if (filterSpec) url += `specialite=${filterSpec}`
      const [listRes, statsRes] = await Promise.all([
        axios.get(url, { headers }),
        axios.get(`${API}/personnel/stats`, { headers })
      ])
      setList(listRes.data)
      setStats(statsRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [filterDispo, filterSpec])

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom) {
      setMsg({ type: 'error', text: 'Nom et prénom sont obligatoires' })
      return
    }
    setSaving(true)
    try {
      await axios.post(`${API}/personnel`, form, { headers })
      setMsg({ type: 'success', text: `${form.prenom} ${form.nom} ajouté avec succès !` })
      setForm({ nom: '', prenom: '', specialite: 'Médecin généraliste', telephone: '', email: '', zone: '', disponibilite: true, statut: 'actif' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de l\'ajout' })
    }
    setSaving(false)
  }

  const toggleDispo = async (id, current) => {
    try {
      await axios.put(`${API}/personnel/${id}`, { disponibilite: !current }, { headers })
      fetchData()
    } catch {}
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', marginTop: '5px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '13px', outline: 'none', background: 'white',
    fontFamily: "'Poppins', sans-serif", color: '#1a1a2e'
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block'
  }

  const statCard = (num, label, color, bg) => (
    <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: '28px', fontWeight: '700', color, margin: 0 }}>{num}</p>
      <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{label}</p>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>RESSOURCES HUMAINES</p>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Personnel de Santé</h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Gestion du personnel médical et humanitaire</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '10px 20px', background: showForm ? '#64748B' : '#1D9E75',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          fontFamily: "'Poppins', sans-serif"
        }}>
          {showForm ? '✕ Annuler' : '+ Ajouter personnel'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {statCard(stats?.total ?? '...', 'Total personnel', '#1A4B7A', '#E6F4FB')}
        {statCard(stats?.disponibles ?? '...', 'Disponibles', '#085041', '#E1F5EE')}
        {statCard(stats?.indisponibles ?? '...', 'Indisponibles', '#A32D2D', '#FCEBEB')}
        {statCard(Object.keys(stats?.par_specialite || {}).length, 'Spécialités', '#BA7517', '#FAEEDA')}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid #DDE3EC', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #DDE3EC' }}>
            <div style={{ width: '4px', height: '20px', background: '#1D9E75', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Nouveau personnel</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Kavira" />
            </div>
            <div>
              <label style={labelStyle}>Prénom *</label>
              <input style={inputStyle} value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Ex: Marie" />
            </div>
            <div>
              <label style={labelStyle}>Spécialité</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })}>
                {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Zone d'affectation</label>
              <input style={inputStyle} value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="Ex: Masisi" />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+243..." />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@org.org" />
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option value="actif">Actif</option>
                <option value="retraite">Retraité</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '1.5rem' }}>
              <input type="checkbox" checked={form.disponibilite} onChange={e => setForm({ ...form, disponibilite: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Disponible immédiatement</label>
            </div>
          </div>

          {msg && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginTop: '1rem',
              background: msg.type === 'success' ? '#E1F5EE' : '#FCEBEB',
              color: msg.type === 'success' ? '#085041' : '#A32D2D',
              fontSize: '13px', fontWeight: '500',
              border: `1px solid ${msg.type === 'success' ? '#9FE1CB' : '#F7C1C1'}`
            }}>{msg.text}</div>
          )}

          <button onClick={handleSubmit} disabled={saving} style={{
            marginTop: '1rem', padding: '11px 24px',
            background: saving ? '#64748B' : '#1D9E75',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Poppins', sans-serif"
          }}>
            {saving ? '⏳ Enregistrement...' : '✓ Enregistrer'}
          </button>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[null, true, false].map((v, i) => (
          <button key={i} onClick={() => setFilterDispo(v)} style={{
            padding: '6px 14px', border: '1px solid #DDE3EC', borderRadius: '20px',
            background: filterDispo === v ? '#1A4B7A' : 'white',
            color: filterDispo === v ? 'white' : '#64748B',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif"
          }}>
            {i === 0 ? 'Tous' : i === 1 ? '🟢 Disponibles' : '🔴 Indisponibles'}
          </button>
        ))}
        <select onChange={e => setFilterSpec(e.target.value)} style={{
          padding: '6px 14px', border: '1px solid #DDE3EC', borderRadius: '20px',
          background: 'white', color: '#64748B', fontSize: '12px',
          cursor: 'pointer', fontFamily: "'Poppins', sans-serif", outline: 'none'
        }}>
          <option value="">Toutes spécialités</option>
          {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Liste */}
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Nom complet', 'Spécialité', 'Zone', 'Contact', 'Statut', 'Disponibilité'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Chargement...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>Aucun personnel enregistré.</td></tr>
            ) : list.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#1A4B7A', flexShrink: 0 }}>
                      {p.prenom?.[0]}{p.nom?.[0]}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0D2E4E' }}>{p.prenom} {p.nom}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>#{p.id}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#E6F4FB', color: '#185FA5', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>{p.specialite}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{p.zone || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                  {p.telephone && <p style={{ margin: 0 }}>{p.telephone}</p>}
                  {p.email && <p style={{ margin: 0 }}>{p.email}</p>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: p.statut === 'actif' ? '#E1F5EE' : '#FAEEDA',
                    color: p.statut === 'actif' ? '#085041' : '#BA7517',
                    padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600'
                  }}>{p.statut === 'actif' ? 'Actif' : 'Retraité'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => toggleDispo(p.id, p.disponibilite)} style={{
                    padding: '5px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                    background: p.disponibilite ? '#E1F5EE' : '#FCEBEB',
                    color: p.disponibilite ? '#085041' : '#A32D2D',
                    fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif"
                  }}>
                    {p.disponibilite ? '🟢 Disponible' : '🔴 Indisponible'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
