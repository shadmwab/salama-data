import { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const CRITICITE_CONFIG = {
  stable:   { color: '#085041', bg: '#E1F5EE', border: '#9FE1CB', label: 'Stable',   dot: '#1D9E75' },
  tension:  { color: '#92400E', bg: '#FEF3C7', border: '#FCD34D', label: 'Tension',  dot: '#F59E0B' },
  critique: { color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1', label: 'Critique', dot: '#DC2626' },
}

function Criticitebadge({ niveau }) {
  const c = CRITICITE_CONFIG[niveau] || CRITICITE_CONFIG.stable
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: c.bg, color: c.color,
      padding: '4px 12px', borderRadius: '20px',
      fontSize: '12px', fontWeight: '700',
      border: `1px solid ${c.border}`
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  )
}

function RatioBar({ ratio, criticite }) {
  const max = 2000
  const pct = Math.min((ratio / max) * 100, 100)
  const color = criticite === 'critique' ? '#DC2626' : criticite === 'tension' ? '#F59E0B' : '#1D9E75'
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#64748B' }}>Ratio déplacés/personnel</span>
        <span style={{ fontSize: '11px', fontWeight: '700', color }}>{ratio}</span>
      </div>
      <div style={{ background: '#F1F5F9', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export default function Zones({ token }) {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editZone, setEditZone] = useState(null)
  const [form, setForm] = useState({ nom: '', nb_deplaces: 0, latitude: '', longitude: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchZones = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API}/zones`, { headers })
      setZones(r.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchZones() }, [token])

  const openEdit = (z) => {
    setEditZone(z)
    setForm({ nom: z.nom, nb_deplaces: z.nb_deplaces, latitude: z.latitude || '', longitude: z.longitude || '', description: z.description || '' })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditZone(null)
    setForm({ nom: '', nb_deplaces: 0, latitude: '', longitude: '', description: '' })
    setMsg(null)
  }

  const handleSubmit = async () => {
    if (!form.nom) {
      setMsg({ type: 'error', text: 'Le nom de la zone est obligatoire' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        nom: form.nom,
        nb_deplaces: parseInt(form.nb_deplaces) || 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        description: form.description || null
      }
      if (editZone) {
        await axios.put(`${API}/zones/${editZone.id}`, payload, { headers })
        setMsg({ type: 'success', text: `Zone ${form.nom} mise à jour !` })
      } else {
        await axios.post(`${API}/zones`, payload, { headers })
        setMsg({ type: 'success', text: `Zone ${form.nom} créée !` })
      }
      fetchZones()
      setTimeout(resetForm, 1500)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de l\'enregistrement' })
    }
    setSaving(false)
  }

  const supprimerZone = async (id) => {
    try {
      await axios.delete(`${API}/zones/${id}`, { headers })
      fetchZones()
    } catch {}
  }

  const total_deplaces = zones.reduce((s, z) => s + z.nb_deplaces, 0)
  const total_personnel = zones.reduce((s, z) => s + z.nb_personnel, 0)
  const critiques = zones.filter(z => z.criticite === 'critique').length
  const tensions = zones.filter(z => z.criticite === 'tension').length

  const inputStyle = {
    width: '100%', padding: '9px 12px', marginTop: '5px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '13px', outline: 'none', background: 'white',
    fontFamily: "'Poppins', sans-serif", color: '#1a1a2e', boxSizing: 'border-box'
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
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>CARTOGRAPHIE</p>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Zones & Criticité</h1>
          <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>Suivi de la pression humanitaire par zone</p>
        </div>
        <button onClick={() => showForm && !editZone ? resetForm() : setShowForm(true)} style={{
          padding: '10px 20px', background: showForm ? '#64748B' : '#1A4B7A',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          fontFamily: "'Poppins', sans-serif",
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Icon name={showForm ? 'close' : 'add'} size={16} color="white" />
          {showForm ? 'Annuler' : 'Ajouter une zone'}
        </button>
      </div>

      {/* KPIs minimalistes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { value: zones.length,    label: 'Zones suivies',       sub: 'total',           color: '#1A4B7A', accent: '#E6F4FB', icon: 'location' },
          { value: total_deplaces.toLocaleString(), label: 'Déplacés suivis', sub: 'personnes enregistrées', color: '#085041', accent: '#E1F5EE', icon: 'people' },
          { value: total_personnel, label: 'Personnel déployé',   sub: 'agents sur terrain', color: '#92400E', accent: '#FEF3C7', icon: 'health' },
          { value: critiques,       label: 'Zones critiques',     sub: `${tensions} en tension`, color: '#A32D2D', accent: '#FCEBEB', icon: 'alert' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: kpi.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={kpi.icon} size={17} color={kpi.color} />
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: kpi.color, margin: 0, lineHeight: 1 }}>{kpi.value}</p>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#0D2E4E', margin: '5px 0 2px' }}>{kpi.label}</p>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Légende criticité */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', marginRight: '4px' }}>Criticité :</span>
        {Object.entries(CRITICITE_CONFIG).map(([key, c]) => (
          <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: c.bg, color: c.color, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: `1px solid ${c.border}` }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot }} />
            {c.label}
            {key === 'stable' && <span style={{ opacity: 0.7 }}>— ratio &lt; 500</span>}
            {key === 'tension' && <span style={{ opacity: 0.7 }}>— ratio 500–1000</span>}
            {key === 'critique' && <span style={{ opacity: 0.7 }}>— ratio &gt; 1000</span>}
          </span>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid #DDE3EC', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #DDE3EC' }}>
            <div style={{ width: '4px', height: '20px', background: '#1A4B7A', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>
              {editZone ? `Modifier — ${editZone.nom}` : 'Nouvelle zone'}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Nom de la zone *</label>
              <input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Masisi" />
            </div>
            <div>
              <label style={labelStyle}>Nombre de déplacés</label>
              <input style={inputStyle} type="number" value={form.nb_deplaces} onChange={e => setForm({ ...form, nb_deplaces: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Latitude (GPS)</label>
              <input style={inputStyle} type="number" step="0.0001" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="Ex: -1.6789" />
            </div>
            <div>
              <label style={labelStyle}>Longitude (GPS)</label>
              <input style={inputStyle} type="number" step="0.0001" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="Ex: 29.2345" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: '65px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contexte, accès, notes..." />
            </div>
          </div>

          {msg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginTop: '1rem', background: msg.type === 'success' ? '#E1F5EE' : '#FCEBEB', color: msg.type === 'success' ? '#085041' : '#A32D2D', fontSize: '13px', fontWeight: '500', border: `1px solid ${msg.type === 'success' ? '#9FE1CB' : '#F7C1C1'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name={msg.type === 'success' ? 'check' : 'alert'} size={14} color={msg.type === 'success' ? '#085041' : '#A32D2D'} />
              {msg.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button onClick={resetForm} style={{ padding: '10px 20px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={saving} style={{ padding: '10px 24px', background: saving ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name={saving ? 'spinner' : 'check'} size={15} color="white" />
              {saving ? 'Enregistrement...' : editZone ? 'Mettre à jour' : 'Créer la zone'}
            </button>
          </div>
        </div>
      )}

      {/* Grille zones */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
          <Icon name="spinner" size={28} color="#DDE3EC" />
          <p style={{ marginTop: '1rem', fontSize: '14px' }}>Chargement des zones...</p>
        </div>
      ) : zones.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '10px', padding: '3rem', textAlign: 'center', border: '1px solid #DDE3EC' }}>
          <Icon name="location" size={36} color="#DDE3EC" />
          <p style={{ color: '#94A3B8', marginTop: '1rem', fontSize: '14px', fontWeight: '500' }}>Aucune zone enregistrée.</p>
          <p style={{ color: '#B0BEC5', fontSize: '13px' }}>Ajoutez une zone pour commencer le suivi de criticité.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {zones.map(z => {
            const c = CRITICITE_CONFIG[z.criticite]
            return (
              <div key={z.id} style={{ background: 'white', borderRadius: '10px', border: `1px solid ${c.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}>

                {/* Card header */}
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="location" size={15} color={c.color} />
                    <p style={{ fontWeight: '700', fontSize: '15px', color: c.color, margin: 0 }}>{z.nom}</p>
                  </div>
                  <Criticitebadge niveau={z.criticite} />
                </div>

                {/* Card body */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    {[
                      { label: 'Déplacés', value: z.nb_deplaces.toLocaleString(), icon: 'people', color: '#1A4B7A' },
                      { label: 'Personnel', value: z.nb_personnel, icon: 'health', color: '#085041' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Icon name={item.icon} size={12} color={item.color} />
                          <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                        </div>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: item.color, margin: 0 }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <RatioBar ratio={z.ratio} criticite={z.criticite} />

                  {z.description && (
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '10px', fontStyle: 'italic', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                      {z.description}
                    </p>
                  )}

                  {z.latitude && z.longitude && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
                      <Icon name="location" size={11} color="#94A3B8" />
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{z.latitude.toFixed(4)}, {z.longitude.toFixed(4)}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                    <button onClick={() => openEdit(z)} style={{ flex: 1, padding: '7px', background: '#F8FAFC', color: '#374151', border: '1px solid #DDE3EC', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <Icon name="edit" size={12} color="#374151" />
                      Modifier
                    </button>
                    <button onClick={() => supprimerZone(z.id)} style={{ padding: '7px 14px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon name="trash" size={12} color="#A32D2D" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
