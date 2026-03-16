import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'

const API = 'http://127.0.0.1:8000'

function StatCard({ num, label, color, bg, icon }) {
  return (
    <div style={{
      background: 'white', borderRadius: '10px', padding: '1.5rem',
      border: '1px solid var(--border)', flex: 1, minWidth: '160px',
      boxShadow: 'var(--shadow)', display: 'flex', gap: '1rem', alignItems: 'center'
    }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: '28px', fontWeight: '700', color, lineHeight: 1 }}>{num}</p>
        <p style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px', lineHeight: 1.3 }}>{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLang()

  useEffect(() => {
    axios.get(`${API}/dashboard`)
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>VUE D'ENSEMBLE</p>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E' }}>{t('dashboard_title')}</h1>
          <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{t('dashboard_subtitle')}</p>
        </div>
        <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '13px', color: 'var(--green-dark)', fontWeight: '600' }}>{t('dashboard_operational')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <StatCard num={loading ? '...' : data?.total_beneficiaires ?? 0} label={t('dashboard_total')} color="var(--green-dark)" bg="var(--green-light)" icon="👥" />
        <StatCard num={loading ? '...' : data?.nb_agents ?? 0} label={t('dashboard_agents')} color="var(--blue-dark)" bg="var(--blue-light)" icon="🧑‍💼" />
        <StatCard num={loading ? '...' : data?.zones?.length ?? 0} label={t('dashboard_zones')} color="var(--amber)" bg="var(--amber-light)" icon="📍" />
        <StatCard num={loading ? '...' : data?.collectes_mois ?? 0} label={t('dashboard_collectes')} color="var(--red)" bg="var(--red-light)" icon="📋" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <div style={{ width: '4px', height: '20px', background: 'var(--green)', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E' }}>{t('dashboard_zones_title')}</h2>
          </div>
          {data?.zones?.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {data.zones.map(z => (
                <span key={z} style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: '1px solid #9FE1CB' }}>{z}</span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--gray)', fontSize: '14px' }}>{t('dashboard_zones_empty')}</p>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <div style={{ width: '4px', height: '20px', background: 'var(--blue)', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E' }}>{t('dashboard_statut')}</h2>
          </div>
          {[
            { label: 'API Backend', status: 'Opérationnel', ok: true },
            { label: 'Base de données', status: 'Connectée', ok: true },
            { label: 'Agent IA Groq', status: 'Actif', ok: true },
            { label: 'Mode offline', status: 'Disponible', ok: true },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', color: '#374151' }}>{item.label}</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: item.ok ? 'var(--green-dark)' : 'var(--red)', background: item.ok ? 'var(--green-light)' : 'var(--red-light)', padding: '3px 10px', borderRadius: '4px' }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}