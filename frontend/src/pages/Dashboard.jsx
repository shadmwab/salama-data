import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'
import { Icon } from '../components/Icons'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import 'leaflet/dist/leaflet.css'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const NIVEAU_CONFIG = {
  critique: { color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1', dot: '#DC2626', label: 'Critique' },
  warning:  { color: '#92400E', bg: '#FEF3C7', border: '#FCD34D', dot: '#F59E0B', label: 'Attention' },
  info:     { color: '#185FA5', bg: '#E6F4FB', border: '#B5D4F4', dot: '#3B82F6', label: 'Info' },
}

const TYPE_ICON = {
  doublon: 'duplicate', sante: 'health', eau: 'sync',
  alimentation: 'report', zone_critique: 'location',
  vulnerable: 'alert', verification: 'check',
}

function StatCard({ num, label, color, bg, icon }) {
  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid var(--border)', flex: 1, minWidth: '160px', boxShadow: 'var(--shadow)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '28px', fontWeight: '700', color, lineHeight: 1, margin: 0 }}>{num}</p>
        <p style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px', margin: 0 }}>{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState([])
  const [notifications, setNotifications] = useState([])
  const [generating, setGenerating] = useState(false)
  const [notifMsg, setNotifMsg] = useState(null)
  const { t } = useLang()
  const [ressources, setRessources] = useState({})
  const [showRessourcesForm, setShowRessourcesForm] = useState(false)
  const [savingRessources, setSavingRessources] = useState(false)
  const [ressourcesForm, setRessourcesForm] = useState({
  personnel_medical: '', eau_potable: '', nourriture: '', abris: '', ecoles: ''
})
  const headers = { Authorization: `Bearer ${token}` }

  const ressourcesData = [
    { resource: 'Personnel médical', value: 72 },
    { resource: 'Eau potable', value: 45 },
    { resource: 'Nourriture', value: 58 },
    { resource: 'Abris', value: 33 },
    { resource: 'Écoles', value: 61 },
  ]

  useEffect(() => {
    axios.get(`${API}/dashboard`, { headers })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
    axios.get(`${API}/notifications`, { headers })
      .then(r => setNotifications(r.data))
      .catch(() => {})
    axios.get(`${API}/zones`, { headers })
      .then(r => setZones(r.data))
      .catch(() => {})
  axios.get(`${API}/ressources`, { headers })
  .then(r => {
    setRessources(r.data)
    setRessourcesForm({
      personnel_medical: r.data.personnel_medical?.valeur ?? '',
      eau_potable:       r.data.eau_potable?.valeur ?? '',
      nourriture:        r.data.nourriture?.valeur ?? '',
      abris:             r.data.abris?.valeur ?? '',
      ecoles:            r.data.ecoles?.valeur ?? '',
    })
  })
  .catch(() => {})
    }, [token])

  const generer = async () => {
    setGenerating(true)
    setNotifMsg(null)
    try {
      const r = await axios.post(`${API}/notifications/generer`, {}, { headers })
      setNotifMsg({ type: 'success', text: `${r.data.generated} ${t('notif_generated')}` })
      const r2 = await axios.get(`${API}/notifications`, { headers })
      setNotifications(r2.data)
    } catch {
      setNotifMsg({ type: 'error', text: 'Erreur' })
    }
    setGenerating(false)
  }

  const marquerLu = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/lire`, {}, { headers })
      setNotifications(notifications.map(n => n.id === id ? { ...n, lu: true } : n))
    } catch {}
  }

  const nonLues = notifications.filter(n => !n.lu).length
  const zonesAvecGPS = zones.filter(z => z.latitude && z.longitude)
  const centreGoma = [-1.6790, 29.2285]

  const getCriticiteColor = (criticite) => {
    if (criticite === 'critique') return '#DC2626'
    if (criticite === 'tension') return '#F59E0B'
    return '#1D9E75'
  }
  
  const ressourcesChartData = [
  { resource: 'Personnel', value: ressources.personnel_medical?.valeur ?? 0 },
  { resource: 'Eau',       value: ressources.eau_potable?.valeur ?? 0 },
  { resource: 'Nourriture',value: ressources.nourriture?.valeur ?? 0 },
  { resource: 'Abris',     value: ressources.abris?.valeur ?? 0 },
  { resource: 'Écoles',    value: ressources.ecoles?.valeur ?? 0 },
]

const saveRessources = async () => {
  setSavingRessources(true)
  try {
    await axios.put(`${API}/ressources`, {
      personnel_medical: parseFloat(ressourcesForm.personnel_medical) || null,
      eau_potable:       parseFloat(ressourcesForm.eau_potable) || null,
      nourriture:        parseFloat(ressourcesForm.nourriture) || null,
      abris:             parseFloat(ressourcesForm.abris) || null,
      ecoles:            parseFloat(ressourcesForm.ecoles) || null,
    }, { headers })
    const r = await axios.get(`${API}/ressources`, { headers })
    setRessources(r.data)
    setShowRessourcesForm(false)
  } catch {}
  setSavingRessources(false)
}

const resetRessources = async () => {
  try {
    await axios.delete(`${API}/ressources/reset`, { headers })
    const r = await axios.get(`${API}/ressources`, { headers })
    setRessources(r.data)
    setRessourcesForm({
      personnel_medical: r.data.personnel_medical?.valeur ?? '',
      eau_potable:       r.data.eau_potable?.valeur ?? '',
      nourriture:        r.data.nourriture?.valeur ?? '',
      abris:             r.data.abris?.valeur ?? '',
      ecoles:            r.data.ecoles?.valeur ?? '',
    })
  } catch {}
}
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>VUE D'ENSEMBLE</p>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('dashboard_title')}</h1>
          <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{t('dashboard_subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {nonLues > 0 && (
            <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }} />
              <span style={{ fontSize: '13px', color: '#A32D2D', fontWeight: '600' }}>{nonLues} {t('notif_non_lues')}</span>
            </div>
          )}
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="check" size={14} color="#1D9E75" />
            <span style={{ fontSize: '13px', color: 'var(--green-dark)', fontWeight: '600' }}>{t('dashboard_operational')}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard num={loading ? '...' : data?.total_beneficiaires ?? 0} label={t('dashboard_total')} color="var(--green-dark)" bg="var(--green-light)" icon={<Icon name="people" size={22} color="#085041" />} />
        <StatCard num={loading ? '...' : data?.nb_agents ?? 0} label={t('dashboard_agents')} color="var(--blue-dark)" bg="var(--blue-light)" icon={<Icon name="collect" size={22} color="#1A4B7A" />} />
        <StatCard num={loading ? '...' : data?.zones?.length ?? 0} label={t('dashboard_zones')} color="var(--amber)" bg="var(--amber-light)" icon={<Icon name="location" size={22} color="#BA7517" />} />
        <StatCard num={loading ? '...' : data?.collectes_mois ?? 0} label={t('dashboard_collectes')} color="var(--red)" bg="var(--red-light)" icon={<Icon name="report" size={22} color="#A32D2D" />} />
      </div>

      {/* Ligne 1 — Carte + Graphique radar ressources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Carte Leaflet */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #DDE3EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '20px', background: '#1A4B7A', borderRadius: '2px' }} />
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('dashboard_zones_title')}</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: t('zones_stable'),   color: '#1D9E75', bg: '#E1F5EE' },
                { label: t('zones_tension'),  color: '#F59E0B', bg: '#FEF3C7' },
                { label: t('zones_critique'), color: '#DC2626', bg: '#FCEBEB' },
              ].map((l, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: l.bg, color: l.color, padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <MapContainer center={centreGoma} zoom={8} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {zonesAvecGPS.map(z => (
                <CircleMarker key={z.id} center={[z.latitude, z.longitude]} radius={Math.max(10, Math.min(30, z.nb_deplaces / 100))} fillColor={getCriticiteColor(z.criticite)} color={getCriticiteColor(z.criticite)} weight={2} opacity={0.9} fillOpacity={0.4}>
                  <Popup>
                    <div style={{ fontFamily: "'Poppins', sans-serif", minWidth: '160px' }}>
                      <p style={{ fontWeight: '700', color: '#0D2E4E', margin: '0 0 6px', fontSize: '14px' }}>{z.nom}</p>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#374151' }}>{t('zones_deplaces_label')} : <strong>{z.nb_deplaces.toLocaleString()}</strong></p>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#374151' }}>{t('zones_personnel_label')} : <strong>{z.nb_personnel}</strong></p>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#374151' }}>{t('zones_ratio')} : <strong>{z.ratio}</strong></p>
                      <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: getCriticiteColor(z.criticite) + '20', color: getCriticiteColor(z.criticite) }}>
                        {z.criticite === 'critique' ? t('zones_critique') : z.criticite === 'tension' ? t('zones_tension') : t('zones_stable')}
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Graphique Radar Ressources */}
<div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '4px', height: '20px', background: '#1D9E75', borderRadius: '2px' }} />
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Ressources locales</h2>
        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>Compétences & mécanismes de survie</p>
      </div>
    </div>
    <button
      onClick={() => setShowRessourcesForm(!showRessourcesForm)}
      style={{ padding: '5px 10px', background: showRessourcesForm ? '#64748B' : '#E6F4FB', color: showRessourcesForm ? 'white' : '#1A4B7A', border: `1px solid ${showRessourcesForm ? '#64748B' : '#B5D4F4'}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}
    >
      <Icon name="sliders" size={12} color={showRessourcesForm ? 'white' : '#1A4B7A'} />
      {showRessourcesForm ? 'Fermer' : 'Ajuster'}
    </button>
  </div>

  {/* Formulaire correction manuelle */}
  {showRessourcesForm && (
    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '1px solid #DDE3EC' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Correction manuelle (%)</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        {[
          { key: 'personnel_medical', label: 'Personnel médical', icon: 'medical' },
          { key: 'eau_potable',       label: 'Eau potable',       icon: 'water' },
          { key: 'nourriture',        label: 'Nourriture',        icon: 'food' },
          { key: 'abris',             label: 'Abris',             icon: 'shelter' },
          { key: 'ecoles',            label: 'Écoles',            icon: 'school' },
        ].map(r => (
          <div key={r.key}>
            <label style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
              <Icon name={r.icon} size={11} color="#64748B" />
              {r.label}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="number" min="0" max="100"
                value={ressourcesForm[r.key]}
                onChange={e => setRessourcesForm(prev => ({ ...prev, [r.key]: e.target.value }))}
                style={{ width: '60px', padding: '5px 8px', border: '1px solid #DDE3EC', borderRadius: '6px', fontSize: '12px', fontFamily: "'Poppins', sans-serif", outline: 'none' }}
              />
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>%</span>
              <span style={{ fontSize: '10px', color: '#B0BEC5' }}>auto: {ressources[r.key]?.auto ?? '—'}%</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={saveRessources} disabled={savingRessources} style={{ flex: 1, padding: '7px', background: savingRessources ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Icon name="save" size={12} color="white" />
          {savingRessources ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button onClick={resetRessources} style={{ padding: '7px 12px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Icon name="refresh" size={12} color="#64748B" />
          Auto
        </button>
      </div>
    </div>
  )}

  <ResponsiveContainer width="100%" height={180}>
    <RadarChart data={ressourcesChartData}>
      <PolarGrid stroke="#F1F5F9" />
      <PolarAngleAxis dataKey="resource" tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Poppins' }} />
      <Radar name="Disponibilité" dataKey="value" stroke="#1A4B7A" fill="#1A4B7A" fillOpacity={0.25} strokeWidth={2} />
      <Tooltip contentStyle={{ fontFamily: 'Poppins', fontSize: '12px', border: '1px solid #DDE3EC', borderRadius: '8px' }} formatter={(value) => [`${value}%`, 'Disponibilité']} />
    </RadarChart>
  </ResponsiveContainer>

  {/* Barres avec nouvelles icônes */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
    {[
      { label: 'Personnel médical', key: 'personnel_medical', color: '#1A4B7A', icon: 'medical' },
      { label: 'Eau potable',       key: 'eau_potable',       color: '#085041', icon: 'water' },
      { label: 'Nourriture',        key: 'nourriture',        color: '#BA7517', icon: 'food' },
      { label: 'Abris',             key: 'abris',             color: '#92400E', icon: 'shelter' },
      { label: 'Écoles',            key: 'ecoles',            color: '#185FA5', icon: 'school' },
    ].map((r, i) => {
      const val = ressources[r.key]?.valeur ?? 0
      const isManuel = ressources[r.key]?.manuel !== null && ressources[r.key]?.manuel !== undefined
      return (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name={r.icon} size={13} color={r.color} />
              <span style={{ fontSize: '11px', color: '#374151' }}>{r.label}</span>
              {isManuel && <span style={{ fontSize: '9px', background: '#E6F4FB', color: '#185FA5', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>Manuel</span>}
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: r.color }}>{val}%</span>
          </div>
          <div style={{ background: '#F1F5F9', borderRadius: '3px', height: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${val}%`, height: '100%', background: r.color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )
    })}
  </div>
</div>
      </div>

      {/* Ligne 2 — Zones actives + Notifications IA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>

        {/* Zones actives */}
        <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <div style={{ width: '4px', height: '20px', background: 'var(--green)', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('dashboard_zones_title')}</h2>
          </div>
          {data?.zones?.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {data.zones.map(z => (
                <span key={z} style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: '1px solid #9FE1CB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="location" size={12} color="#085041" />
                  {z}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--gray)', fontSize: '14px' }}>{t('dashboard_zones_empty')}</p>
          )}
        </div>

        {/* Notifications IA */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #DDE3EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '20px', background: '#1A4B7A', borderRadius: '2px' }} />
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('dashboard_notif_title')}</h2>
              {nonLues > 0 && (
                <span style={{ background: '#A32D2D', color: 'white', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>{nonLues}</span>
              )}
            </div>
            <button onClick={generer} disabled={generating} style={{ padding: '7px 14px', background: generating ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: generating ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name={generating ? 'spinner' : 'agent_ai'} size={13} color="white" />
              {generating ? t('dashboard_notif_analyse') : t('dashboard_notif_analyser')}
            </button>
          </div>

          {notifMsg && (
            <div style={{ padding: '8px 1.5rem', background: notifMsg.type === 'success' ? '#E1F5EE' : '#FCEBEB', borderBottom: '1px solid #DDE3EC', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name={notifMsg.type === 'success' ? 'check' : 'alert'} size={13} color={notifMsg.type === 'success' ? '#085041' : '#A32D2D'} />
              <span style={{ fontSize: '12px', fontWeight: '600', color: notifMsg.type === 'success' ? '#085041' : '#A32D2D' }}>{notifMsg.text}</span>
            </div>
          )}

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Icon name="agent_ai" size={22} color="#1A4B7A" />
                </div>
                <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>{t('dashboard_notif_empty')}</p>
              </div>
            ) : notifications.slice(0, 6).map(n => {
              const c = NIVEAU_CONFIG[n.niveau] || NIVEAU_CONFIG.info
              const iconName = TYPE_ICON[n.type] || 'alert'
              return (
                <div key={n.id} style={{ padding: '12px 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px', alignItems: 'flex-start', opacity: n.lu ? 0.6 : 1, background: n.lu ? 'white' : '#FAFAFA' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: n.lu ? '#F8FAFC' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={iconName} size={16} color={n.lu ? '#94A3B8' : c.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: n.lu ? '#64748B' : '#0D2E4E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.titre}</p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: n.lu ? '#F8FAFC' : c.bg, color: n.lu ? '#94A3B8' : c.color, padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', border: `1px solid ${n.lu ? '#DDE3EC' : c.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: n.lu ? '#CBD5E1' : c.dot }} />
                        {c.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</p>
                    {!n.lu && (
                      <button onClick={() => marquerLu(n.id)} style={{ marginTop: '5px', padding: '3px 10px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '5px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="check" size={10} color="#64748B" />
                        {t('notif_lu')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {notifications.length > 6 && (
            <div style={{ padding: '10px 1.5rem', borderTop: '1px solid #DDE3EC', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#1A4B7A', fontWeight: '600' }}>
                {t('dashboard_notif_voir')} ({notifications.length})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}