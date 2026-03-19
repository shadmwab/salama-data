import { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const ZONES_SUGGERES = ['Masisi', 'Rutshuru', 'Sake', 'Bulengo', 'Kiwanja', 'Minova', 'Goma Centre']

export default function Affectations({ token }) {
  const [affectations, setAffectations] = useState([])
  const [parZone, setParZone] = useState({})
  const [personnel, setPersonnel] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ personnel_id: '', zone: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [view, setView] = useState('zone')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [affRes, zoneRes, persRes] = await Promise.all([
        axios.get(`${API}/affectations`, { headers }),
        axios.get(`${API}/affectations/par-zone`, { headers }),
        axios.get(`${API}/personnel?disponible=true`, { headers })
      ])
      setAffectations(affRes.data)
      setParZone(zoneRes.data)
      setPersonnel(persRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [token])

  const handleSubmit = async () => {
    if (!form.personnel_id || !form.zone) {
      setMsg({ type: 'error', text: 'Personnel et zone sont obligatoires' })
      return
    }
    setSaving(true)
    try {
      const r = await axios.post(`${API}/affectations`, {
        personnel_id: parseInt(form.personnel_id),
        zone: form.zone,
        notes: form.notes || null
      }, { headers })
      setMsg({ type: 'success', text: r.data.message })
      setForm({ personnel_id: '', zone: '', notes: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de l\'affectation' })
    }
    setSaving(false)
  }

  const terminer = async (id) => {
    try {
      await axios.delete(`${API}/affectations/${id}`, { headers })
      fetchData()
    } catch {}
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', marginTop: '5px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '13px', outline: 'none', background: 'white',
    fontFamily: "'Poppins', sans-serif", color: '#1a1a2e',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block'
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>COORDINATION</p>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Système d'affectation</h1>
          <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>Gérez le déploiement du personnel par zone</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '10px 20px', background: showForm ? '#64748B' : '#1D9E75',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          fontFamily: "'Poppins', sans-serif",
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Icon name={showForm ? 'close' : 'add'} size={16} color="white" />
          {showForm ? 'Annuler' : 'Nouvelle affectation'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { num: affectations.length, label: 'Affectations actives', color: '#1A4B7A', bg: '#E6F4FB', icon: 'people' },
          { num: Object.keys(parZone).length, label: 'Zones couvertes', color: '#085041', bg: '#E1F5EE', icon: 'location' },
          { num: personnel.length, label: 'Personnel disponible', color: '#BA7517', bg: '#FAEEDA', icon: 'health' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', flex: 1, border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={s.icon} size={20} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0, lineHeight: 1 }}>{s.num}</p>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0, marginTop: '3px' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid #DDE3EC', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #DDE3EC' }}>
            <div style={{ width: '4px', height: '20px', background: '#1D9E75', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Nouvelle affectation</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Personnel disponible *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.personnel_id}
                onChange={e => setForm({ ...form, personnel_id: e.target.value })}>
                <option value="">Sélectionner un agent...</option>
                {personnel.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom} — {p.specialite}
                  </option>
                ))}
              </select>
              {personnel.length === 0 && (
                <p style={{ fontSize: '11px', color: '#BA7517', marginTop: '4px' }}>
                  Aucun personnel disponible actuellement
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Zone d'affectation *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.zone}
                onChange={e => setForm({ ...form, zone: e.target.value })}>
                <option value="">Sélectionner une zone...</option>
                {ZONES_SUGGERES.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notes (optionnel)</label>
              <textarea
                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Instructions spéciales, durée prévue..."
              />
            </div>
          </div>

          {msg && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginTop: '1rem',
              background: msg.type === 'success' ? '#E1F5EE' : '#FCEBEB',
              color: msg.type === 'success' ? '#085041' : '#A32D2D',
              fontSize: '13px', fontWeight: '500',
              border: `1px solid ${msg.type === 'success' ? '#9FE1CB' : '#F7C1C1'}`,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Icon name={msg.type === 'success' ? 'check' : 'alert'} size={14} color={msg.type === 'success' ? '#085041' : '#A32D2D'} />
              {msg.text}
            </div>
          )}

          <button onClick={handleSubmit} disabled={saving} style={{
            marginTop: '1rem', padding: '11px 24px',
            background: saving ? '#64748B' : '#1A4B7A',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Icon name={saving ? 'spinner' : 'send'} size={15} color="white" />
            {saving ? 'Affectation en cours...' : 'Confirmer l\'affectation'}
          </button>
        </div>
      )}

      {/* Toggle vue */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        {[
          { id: 'zone', label: 'Vue par zone', icon: 'location' },
          { id: 'liste', label: 'Vue liste', icon: 'chart' },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: '7px 16px', border: '1px solid #DDE3EC', borderRadius: '8px',
            background: view === v.id ? '#1A4B7A' : 'white',
            color: view === v.id ? 'white' : '#64748B',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Icon name={v.icon} size={14} color={view === v.id ? 'white' : '#64748B'} />
            {v.label}
          </button>
        ))}
      </div>

      {/* Vue par zone */}
      {view === 'zone' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              <Icon name="spinner" size={24} color="#94A3B8" />
            </div>
          ) : Object.keys(parZone).length === 0 ? (
            <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '10px', padding: '3rem', textAlign: 'center', border: '1px solid #DDE3EC' }}>
              <Icon name="location" size={32} color="#DDE3EC" />
              <p style={{ color: '#94A3B8', marginTop: '1rem', fontSize: '14px' }}>Aucune affectation active pour le moment.</p>
              <p style={{ color: '#B0BEC5', fontSize: '13px' }}>Créez une affectation pour déployer du personnel.</p>
            </div>
          ) : Object.entries(parZone).map(([zone, membres]) => (
            <div key={zone} style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ background: '#0D2E4E', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="location" size={14} color="#9FE1CB" />
                  <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>{zone}</p>
                </div>
                <span style={{ background: 'rgba(29,158,117,0.3)', color: '#9FE1CB', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                  {membres.length} agent{membres.length > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ padding: '12px' }}>
                {membres.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < membres.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#1A4B7A', flexShrink: 0 }}>
                        {m.nom.split(' ')[0]?.[0]}{m.nom.split(' ')[1]?.[0]}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0D2E4E' }}>{m.nom}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>{m.specialite}</p>
                      </div>
                    </div>
                    <button onClick={() => terminer(m.affectation_id)} style={{
                      background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1',
                      borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: '600', fontFamily: "'Poppins', sans-serif",
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Icon name="close" size={11} color="#A32D2D" />
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vue liste */}
      {view === 'liste' && (
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Personnel', 'Spécialité', 'Zone', 'Téléphone', 'Date début', 'Action'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Chargement...</td></tr>
              ) : affectations.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>Aucune affectation active.</td></tr>
              ) : affectations.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#1A4B7A', flexShrink: 0 }}>
                        {a.personnel.prenom?.[0]}{a.personnel.nom?.[0]}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0D2E4E' }}>
                        {a.personnel.prenom} {a.personnel.nom}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: '#E6F4FB', color: '#185FA5', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500' }}>
                      {a.personnel.specialite}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: '#E1F5EE', color: '#085041', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      <Icon name="location" size={11} color="#085041" />
                      {a.zone}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B' }}>
                    {a.personnel.telephone || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B' }}>
                    {a.date_debut ? new Date(a.date_debut).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => terminer(a.id)} style={{
                      background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1',
                      borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: '600', fontFamily: "'Poppins', sans-serif",
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Icon name="close" size={11} color="#A32D2D" />
                      Terminer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}