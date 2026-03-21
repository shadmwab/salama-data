import { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Historique({ token, user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(null)
  const [msg, setMsg] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API}/import/historique`, { headers })
      setData(r.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [token])

  const handleDelete = async (type) => {
    setConfirming(null)
    try {
      const url = type === 'beneficiaires'
        ? `${API}/import/tout/beneficiaires`
        : `${API}/import/tout/personnel`
      const r = await axios.delete(url, { headers })
      setMsg({ type: 'success', text: r.data.message })
      fetchData()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la suppression' })
    }
  }

  const ACTION_CONFIG = {
    IMPORT_CSV: { label: 'Import bénéficiaires', color: '#085041', bg: '#E1F5EE', icon: 'people' },
    IMPORT_PERSONNEL: { label: 'Import personnel', color: '#185FA5', bg: '#E6F4FB', icon: 'health' },
    DELETE_ALL_BENEFICIAIRES: { label: 'Suppression bénéficiaires', color: '#A32D2D', bg: '#FCEBEB', icon: 'trash' },
    DELETE_ALL_PERSONNEL: { label: 'Suppression personnel', color: '#A32D2D', bg: '#FCEBEB', icon: 'trash' },
    BENEFICIAIRE_DELETED: { label: 'Bénéficiaire supprimé', color: '#92400E', bg: '#FEF3C7', icon: 'trash' },
    ORG_APPROVED: { label: 'Organisation approuvée', color: '#085041', bg: '#E1F5EE', icon: 'check' },
    NOTIFICATIONS_GENERATED: { label: 'Notifications générées', color: '#185FA5', bg: '#E6F4FB', icon: 'agent_ai' },
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>GESTION DES DONNÉES</p>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Historique & Suppressions</h1>
        <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>Gérez vos données et consultez l'historique des opérations</p>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '1rem', background: msg.type === 'success' ? '#E1F5EE' : '#FCEBEB', color: msg.type === 'success' ? '#085041' : '#A32D2D', fontSize: '13px', fontWeight: '500', border: `1px solid ${msg.type === 'success' ? '#9FE1CB' : '#F7C1C1'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name={msg.type === 'success' ? 'check' : 'alert'} size={14} color={msg.type === 'success' ? '#085041' : '#A32D2D'} />
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="close" size={14} color={msg.type === 'success' ? '#085041' : '#A32D2D'} />
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Icon name="spinner" size={28} color="#94A3B8" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>

          {/* Panneau gauche — Stats + Suppressions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Stats */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingBottom: '10px', borderBottom: '1px solid #DDE3EC' }}>
                <div style={{ width: '4px', height: '18px', background: '#1A4B7A', borderRadius: '2px' }} />
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Vue d'ensemble</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Total bénéficiaires', value: data?.stats?.total_beneficiaires ?? 0, sub: `dont ${data?.stats?.beneficiaires_importes ?? 0} importés · ${data?.stats?.beneficiaires_terrain ?? 0} terrain`, color: '#085041', bg: '#E1F5EE', icon: 'people' },
                  { label: 'Personnel de santé', value: data?.stats?.total_personnel ?? 0, sub: 'enregistrés dans le système', color: '#185FA5', bg: '#E6F4FB', icon: 'health' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: s.bg, borderRadius: '8px', border: `1px solid ${i === 0 ? '#9FE1CB' : '#B5D4F4'}` }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name={s.icon} size={18} color={s.color} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: s.color }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: s.color, opacity: 0.7 }}>{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suppressions */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #F7C1C1', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingBottom: '10px', borderBottom: '1px solid #F7C1C1' }}>
                <div style={{ width: '4px', height: '18px', background: '#A32D2D', borderRadius: '2px' }} />
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#A32D2D', margin: 0 }}>Zone de danger</h2>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '1rem', lineHeight: 1.5 }}>
                Ces actions sont <strong>irréversibles</strong>. Toutes les données de votre organisation seront définitivement supprimées.
              </p>

              {/* Supprimer bénéficiaires */}
              {confirming === 'beneficiaires' ? (
                <div style={{ padding: '12px', background: '#FCEBEB', borderRadius: '8px', border: '1px solid #F7C1C1', marginBottom: '10px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#A32D2D', margin: '0 0 10px' }}>
                    Supprimer les {data?.stats?.total_beneficiaires} bénéficiaires ?
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setConfirming(null)} style={{ flex: 1, padding: '8px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>Annuler</button>
                    <button onClick={() => handleDelete('beneficiaires')} style={{ flex: 1, padding: '8px', background: '#A32D2D', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'Poppins', sans-serif" }}>Confirmer</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirming('beneficiaires')} style={{ width: '100%', padding: '10px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Icon name="trash" size={14} color="#A32D2D" />
                  Supprimer tous les bénéficiaires ({data?.stats?.total_beneficiaires ?? 0})
                </button>
              )}

              {/* Supprimer personnel */}
              {confirming === 'personnel' ? (
                <div style={{ padding: '12px', background: '#FCEBEB', borderRadius: '8px', border: '1px solid #F7C1C1' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#A32D2D', margin: '0 0 10px' }}>
                    Supprimer les {data?.stats?.total_personnel} personnels ?
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setConfirming(null)} style={{ flex: 1, padding: '8px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>Annuler</button>
                    <button onClick={() => handleDelete('personnel')} style={{ flex: 1, padding: '8px', background: '#A32D2D', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'Poppins', sans-serif" }}>Confirmer</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirming('personnel')} style={{ width: '100%', padding: '10px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icon name="trash" size={14} color="#A32D2D" />
                  Supprimer tout le personnel ({data?.stats?.total_personnel ?? 0})
                </button>
              )}
            </div>
          </div>

          {/* Panneau droit — Historique */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #DDE3EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '18px', background: '#1A4B7A', borderRadius: '2px' }} />
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Historique des opérations</h2>
              </div>
              <button onClick={fetchData} style={{ padding: '5px 10px', background: '#F8FAFC', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon name="refresh" size={12} color="#64748B" />
                Actualiser
              </button>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {data?.historique?.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <Icon name="report" size={32} color="#DDE3EC" />
                  <p style={{ color: '#94A3B8', marginTop: '1rem', fontSize: '14px' }}>Aucune opération enregistrée.</p>
                </div>
              ) : (
                data?.historique?.map((log, i) => {
                  const config = ACTION_CONFIG[log.action] || { label: log.action, color: '#64748B', bg: '#F8FAFC', icon: 'report' }
                  return (
                    <div key={log.id} style={{ padding: '12px 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={config.icon} size={15} color={config.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0D2E4E' }}>{config.label}</p>
                          <span style={{ fontSize: '10px', color: '#94A3B8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleDateString('fr-FR') + ' ' + new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{log.details}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Par {log.user_email}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}