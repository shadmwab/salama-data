import { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const NIVEAU_CONFIG = {
  critique: { color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1', dot: '#DC2626', label: 'Critique' },
  warning:  { color: '#92400E', bg: '#FEF3C7', border: '#FCD34D', dot: '#F59E0B', label: 'Attention' },
  info:     { color: '#185FA5', bg: '#E6F4FB', border: '#B5D4F4', dot: '#3B82F6', label: 'Info' },
}

const TYPE_ICON = {
  doublon:       'duplicate',
  sante:         'health',
  eau:           'sync',
  alimentation:  'report',
  zone_critique: 'location',
  vulnerable:    'alert',
  verification:  'check',
}

export default function Notifications({ token }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API}/notifications`, { headers })
      setNotifications(r.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchNotifications() }, [token])

  const generer = async () => {
    setGenerating(true)
    setMsg(null)
    try {
      const r = await axios.post(`${API}/notifications/generer`, {}, { headers })
      setMsg({ type: 'success', text: `${r.data.generated} notification(s) générée(s) avec succès` })
      fetchNotifications()
    } catch {
      setMsg({ type: 'error', text: 'Erreur lors de la génération' })
    }
    setGenerating(false)
  }

  const marquerLu = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/lire`, {}, { headers })
      setNotifications(notifications.map(n => n.id === id ? { ...n, lu: true } : n))
    } catch {}
  }

  const effacer = async () => {
    if (!window.confirm('Effacer toutes les notifications ?')) return
    try {
      await axios.delete(`${API}/notifications/effacer`, { headers })
      setNotifications([])
    } catch {}
  }

  const nonLues = notifications.filter(n => !n.lu).length
  const critiques = notifications.filter(n => n.niveau === 'critique').length
  const warnings = notifications.filter(n => n.niveau === 'warning').length

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>INTELLIGENCE ARTIFICIELLE</p>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Notifications IA</h1>
          <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>Alertes intelligentes basées sur l'analyse des données terrain</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {notifications.length > 0 && (
            <button onClick={effacer} style={{
              padding: '10px 16px', background: 'white', color: '#64748B',
              border: '1px solid #DDE3EC', borderRadius: '8px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <Icon name="trash" size={14} color="#64748B" />
              Effacer tout
            </button>
          )}
          <button onClick={generer} disabled={generating} style={{
            padding: '10px 20px',
            background: generating ? '#64748B' : '#1A4B7A',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '600', cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Icon name={generating ? 'spinner' : 'agent_ai'} size={16} color="white" />
            {generating ? 'Analyse en cours...' : 'Analyser les données'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { value: notifications.length, label: 'Total alertes',    sub: 'générées',          color: '#1A4B7A', bg: '#E6F4FB', icon: 'agent_ai' },
          { value: nonLues,              label: 'Non lues',          sub: 'à traiter',          color: '#92400E', bg: '#FEF3C7', icon: 'alert' },
          { value: critiques,            label: 'Critiques',         sub: 'action immédiate',   color: '#A32D2D', bg: '#FCEBEB', icon: 'alert' },
          { value: warnings,             label: 'Avertissements',    sub: 'à planifier',        color: '#085041', bg: '#E1F5EE', icon: 'check' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <Icon name={kpi.icon} size={17} color={kpi.color} />
            </div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: kpi.color, margin: 0, lineHeight: 1 }}>{kpi.value}</p>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#0D2E4E', margin: '5px 0 2px' }}>{kpi.label}</p>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Message feedback */}
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '1rem',
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

      {/* Liste notifications */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
          <Icon name="spinner" size={28} color="#DDE3EC" />
          <p style={{ marginTop: '1rem', fontSize: '14px' }}>Chargement...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '10px', padding: '4rem', textAlign: 'center', border: '1px solid #DDE3EC' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Icon name="agent_ai" size={28} color="#1A4B7A" />
          </div>
          <p style={{ color: '#0D2E4E', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Aucune notification</p>
          <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 1.5rem' }}>
            Cliquez sur "Analyser les données" pour générer des alertes intelligentes basées sur vos données terrain.
          </p>
          <button onClick={generer} disabled={generating} style={{
            padding: '10px 24px', background: '#1A4B7A', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '14px',
            fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
            display: 'inline-flex', alignItems: 'center', gap: '8px'
          }}>
            <Icon name="agent_ai" size={15} color="white" />
            Analyser les données
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Filtres rapides */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {['critique', 'warning', 'info'].map(niveau => {
              const c = NIVEAU_CONFIG[niveau]
              const count = notifications.filter(n => n.niveau === niveau).length
              return count > 0 ? (
                <span key={niveau} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: c.bg, color: c.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: `1px solid ${c.border}` }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot }} />
                  {c.label} · {count}
                </span>
              ) : null
            })}
          </div>

          {notifications.map(n => {
            const c = NIVEAU_CONFIG[n.niveau] || NIVEAU_CONFIG.info
            const iconName = TYPE_ICON[n.type] || 'alert'
            return (
              <div key={n.id} style={{
                background: 'white', borderRadius: '10px',
                border: `1px solid ${n.lu ? '#DDE3EC' : c.border}`,
                boxShadow: n.lu ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden', opacity: n.lu ? 0.7 : 1,
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
                  {/* Barre couleur gauche */}
                  <div style={{ width: '4px', background: n.lu ? '#DDE3EC' : c.dot, alignSelf: 'stretch', flexShrink: 0 }} />

                  {/* Icône */}
                  <div style={{ padding: '1.1rem', flexShrink: 0 }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: n.lu ? '#F8FAFC' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={iconName} size={18} color={n.lu ? '#94A3B8' : c.color} />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, padding: '1rem 1rem 1rem 0', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: n.lu ? '#64748B' : '#0D2E4E' }}>{n.titre}</p>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: n.lu ? '#F8FAFC' : c.bg, color: n.lu ? '#94A3B8' : c.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: `1px solid ${n.lu ? '#DDE3EC' : c.border}`, whiteSpace: 'nowrap' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: n.lu ? '#CBD5E1' : c.dot }} />
                          {c.label}
                        </span>
                        {!n.lu && (
                          <span style={{ background: '#1A4B7A', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>NOUVEAU</span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(n.date_creation).toLocaleDateString('fr-FR')} {new Date(n.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: n.lu ? '#94A3B8' : '#374151', lineHeight: 1.6 }}>{n.message}</p>
                    {!n.lu && (
                      <button onClick={() => marquerLu(n.id)} style={{
                        padding: '5px 14px', background: 'white', color: '#64748B',
                        border: '1px solid #DDE3EC', borderRadius: '6px',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                        fontFamily: "'Poppins', sans-serif",
                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                      }}>
                        <Icon name="check" size={11} color="#64748B" />
                        Marquer comme lu
                      </button>
                    )}
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