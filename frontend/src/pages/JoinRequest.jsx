import { useState } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function JoinRequest({ onBack }) {
  const { lang, setLang } = useLang()
  const [form, setForm] = useState({
    org_name: '', contact_name: '', email: '',
    phone: '', type_org: 'ONG', message: ''
  })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.org_name || !form.contact_name || !form.email) {
      setStatus({ type: 'error', msg: 'Nom organisation, contact et email sont obligatoires' })
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API}/public/org-request`, form)
      setStatus({ type: 'success', msg: 'Demande envoyée avec succès ! Vous recevrez une réponse sous 48h.' })
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Erreur lors de l\'envoi' })
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', marginTop: '6px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '14px', outline: 'none', background: 'white',
    color: '#1a1a2e', fontFamily: "'Poppins', sans-serif"
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block'
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#EEF2F7',
      fontFamily: "'Poppins', sans-serif", padding: '2rem'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: '#0D2E4E', borderRadius: '12px', padding: '1rem 2rem', marginBottom: '1rem' }}>
            <svg width="180" height="56" viewBox="0 0 280 88">
              <rect width="64" height="64" rx="12" fill="#1A4B7A" x="12" y="12"/>
              <circle cx="44" cy="36" r="14" fill="none" stroke="#009EDB" strokeWidth="1.8"/>
              <circle cx="44" cy="36" r="5" fill="#1D9E75"/>
              <circle cx="44" cy="36" r="2.5" fill="#9FE1CB"/>
              <path d="M44 50 L44 58" stroke="#9FE1CB" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <path d="M37 55 L44 58 L51 55" stroke="#9FE1CB" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="26" cy="57" r="3.5" fill="#009EDB" opacity="0.8"/>
              <circle cx="62" cy="57" r="3.5" fill="#009EDB" opacity="0.8"/>
              <circle cx="66" cy="26" r="8" fill="#085041" stroke="#9FE1CB" strokeWidth="1"/>
              <path d="M62 26 L65 29 L70 23" stroke="#9FE1CB" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="92" y="38" fontFamily="Poppins, sans-serif" fontSize="20" fontWeight="700" fill="white">SALAMA</text>
              <text x="92" y="56" fontFamily="Poppins, sans-serif" fontSize="14" fontWeight="400" fill="#7FB3D3">DATA</text>
              <text x="92" y="72" fontFamily="Poppins, sans-serif" fontSize="9" fill="#5A8AA8">Plateforme humanitaire · RDC</text>
            </svg>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0D2E4E' }}>
            Rejoindre Salama Data
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>
            Remplissez ce formulaire pour demander l'accès à la plateforme
          </p>
        </div>

        {/* Formulaire */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #DDE3EC', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>

          {status?.type === 'success' ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>✓</div>
              <h2 style={{ color: '#085041', fontSize: '18px', marginBottom: '8px' }}>Demande envoyée !</h2>
              <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>{status.msg}</p>
              <button onClick={onBack} style={{
                marginTop: '1.5rem', padding: '10px 24px',
                background: '#1A4B7A', color: 'white', border: 'none',
                borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: "'Poppins', sans-serif"
              }}>← Retour à la connexion</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #DDE3EC' }}>
                <div style={{ width: '4px', height: '20px', background: '#1D9E75', borderRadius: '2px' }} />
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E' }}>Informations de l'organisation</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Nom de l'organisation *</label>
                  <input style={inputStyle} value={form.org_name} onChange={e => setForm({ ...form, org_name: e.target.value })} placeholder="Ex: UNHCR Goma, Médecins Sans Frontières..." />
                </div>
                <div>
                  <label style={labelStyle}>Type d'organisation</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.type_org} onChange={e => setForm({ ...form, type_org: e.target.value })}>
                    <option value="ONG">ONG</option>
                    <option value="UN">Agence UN</option>
                    <option value="Gouvernement">Gouvernement</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+243..." />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '1.5rem 0 1rem', paddingTop: '1rem', borderTop: '1px solid #DDE3EC' }}>
                <div style={{ width: '4px', height: '20px', background: '#1A4B7A', borderRadius: '2px' }} />
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E' }}>Contact principal</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Nom complet *</label>
                  <input style={inputStyle} value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Ex: Jean Mutombo" />
                </div>
                <div>
                  <label style={labelStyle}>Email professionnel *</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@organisation.org" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Message (optionnel)</label>
                  <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Décrivez brièvement vos besoins et votre zone d'intervention..." />
                </div>
              </div>

              {status?.type === 'error' && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', background: '#FCEBEB', color: '#A32D2D', fontSize: '13px', fontWeight: '500', border: '1px solid #F7C1C1' }}>
                  ✗ {status.msg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                <button onClick={onBack} style={{
                  padding: '12px 20px', background: 'white', color: '#64748B',
                  border: '1px solid #DDE3EC', borderRadius: '8px', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif"
                }}>← Retour</button>
                <button onClick={handleSubmit} disabled={loading} style={{
                  flex: 1, padding: '12px',
                  background: loading ? '#64748B' : '#1D9E75',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '15px', fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins', sans-serif"
                }}>
                  {loading ? '⏳ Envoi en cours...' : '✓ Envoyer la demande'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Copyright */}
        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '11px', marginTop: '1.5rem' }}>
          © 2026 Salama Data · Développé par Shadrack N'Sapu Mwabilwa · Goma, RDC
        </p>
      </div>
    </div>
  )
}