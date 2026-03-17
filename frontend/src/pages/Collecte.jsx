import { useState } from 'react'
import axios from 'axios'
import { savePending } from '../offline'
import { useLang } from '../LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Collecte({ token, user }) {
  const { t } = useLang()
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [age, setAge] = useState('')
  const [sexe, setSexe] = useState('F')
  const [zone_origine, setZoneOrigine] = useState('')
  const [site_deplacement, setSiteDeplacement] = useState('')
  const [nb_dependants, setNbDependants] = useState(0)
  const [agent_id, setAgentId] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!nom || !prenom) {
      setStatus({ type: 'error', msg: t('collecte_error') })
      return
    }
    setLoading(true)
    const data = {
      nom, prenom,
      age: parseInt(age) || null,
      sexe, zone_origine, site_deplacement,
      nb_dependants: parseInt(nb_dependants) || 0,
      agent_id
    }

    try {
      await axios.post(`${API}/beneficiaires`, data, {
  headers: { Authorization: `Bearer ${token}` }
})
      setStatus({ type: 'success', msg: `✓ ${prenom} ${nom} ${t('collecte_success')}` })
    } catch {
      await savePending(data)
      setStatus({ type: 'offline', msg: `📴 ${t('collecte_offline')}` })
    }

    setNom(''); setPrenom(''); setAge(''); setSexe('F')
    setZoneOrigine(''); setSiteDeplacement('')
    setNbDependants(0); setAgentId('')
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', marginTop: '6px',
    border: '1.5px solid var(--border)', borderRadius: '8px',
    fontSize: '14px', outline: 'none', background: 'white',
    color: '#1a1a2e', fontFamily: "'Poppins', sans-serif"
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '700', color: 'var(--gray)',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block'
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>FORMULAIRE TERRAIN</p>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E' }}>{t('collecte_title')}</h1>
        <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{t('collecte_subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '10px', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '4px', height: '20px', background: 'var(--green)', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E' }}>{t('collecte_section')}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('collecte_nom')} *</label>
              <input style={inputStyle} value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Kavira" />
            </div>
            <div>
              <label style={labelStyle}>{t('collecte_prenom')} *</label>
              <input style={inputStyle} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Ex: Marie" />
            </div>
            <div>
              <label style={labelStyle}>{t('collecte_age')}</label>
              <input style={inputStyle} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Ex: 34" />
            </div>
            <div>
              <label style={labelStyle}>{t('collecte_sexe')}</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={sexe} onChange={e => setSexe(e.target.value)}>
                <option value="F">{t('collecte_femme')}</option>
                <option value="M">{t('collecte_homme')}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('collecte_zone')}</label>
              <input style={inputStyle} value={zone_origine} onChange={e => setZoneOrigine(e.target.value)} placeholder="Ex: Masisi" />
            </div>
            <div>
              <label style={labelStyle}>{t('collecte_site')}</label>
              <input style={inputStyle} value={site_deplacement} onChange={e => setSiteDeplacement(e.target.value)} placeholder="Ex: Camp Bulengo" />
            </div>
            <div>
              <label style={labelStyle}>{t('collecte_dependants')}</label>
              <input style={inputStyle} type="number" value={nb_dependants} onChange={e => setNbDependants(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>{t('collecte_agent')}</label>
              <input style={inputStyle} value={agent_id} onChange={e => setAgentId(e.target.value)} placeholder="Ex: agent.goma" />
            </div>
          </div>

          {status && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginTop: '1.5rem',
              background: status.type === 'success' ? 'var(--green-light)' : status.type === 'offline' ? 'var(--amber-light)' : 'var(--red-light)',
              color: status.type === 'success' ? 'var(--green-dark)' : status.type === 'offline' ? 'var(--amber)' : 'var(--red)',
              fontSize: '14px', fontWeight: '500',
              border: `1px solid ${status.type === 'success' ? '#9FE1CB' : status.type === 'offline' ? '#FFD49A' : '#F7C1C1'}`
            }}>
              {status.msg}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? 'var(--gray)' : 'var(--green)',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '1.5rem', letterSpacing: '0.02em',
            fontFamily: "'Poppins', sans-serif"
          }}>
            {loading ? `⏳ ${t('collecte_loading')}` : `✓ ${t('collecte_btn')}`}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--blue-dark)', borderRadius: '10px', padding: '1.5rem', color: 'white' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '1rem', color: '#7FB3D3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('collecte_guide_title')}
            </h3>
            {[
              t('collecte_guide1'),
              t('collecte_guide2'),
              t('collecte_guide3'),
              t('collecte_guide4'),
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span style={{ color: 'var(--green)', fontSize: '12px', marginTop: '2px' }}>★</span>
                <p style={{ fontSize: '13px', color: '#A8C8E0', lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '1rem', color: '#0D2E4E' }}>
              {t('collecte_statut')}
            </h3>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px', borderRadius: '8px',
              background: navigator.onLine ? 'var(--green-light)' : 'var(--amber-light)'
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: navigator.onLine ? 'var(--green)' : 'var(--amber)'
              }} />
              <span style={{
                fontSize: '13px', fontWeight: '600',
                color: navigator.onLine ? 'var(--green-dark)' : 'var(--amber)'
              }}>
                {navigator.onLine ? t('collecte_online') : t('collecte_offline_status')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}