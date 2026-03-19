import { useState } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Login({ onLogin, onJoinRequest }) {
  const { lang, setLang } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email et mot de passe requis')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      form.append('grant_type', 'password')

      const res = await axios.post(`${API}/auth/login`, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })

      localStorage.setItem('salama_token', res.data.access_token)
      localStorage.setItem('salama_user', JSON.stringify(res.data.user))
      onLogin(res.data.user, res.data.access_token)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de connexion')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', marginTop: '0',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '14px', outline: 'none', background: 'white',
    color: '#1a1a2e', fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box'
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: '6px'
  }

  const EyeIcon = ({ open }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      )}
    </svg>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#EEF2F7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Poppins', sans-serif", padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', background: '#0D2E4E',
            borderRadius: '16px', padding: '1.75rem 2.5rem',
            marginBottom: '1rem'
          }}>
            <svg width="260" height="80" viewBox="0 0 280 88">
              <rect width="64" height="64" rx="12" fill="#1A4B7A" x="12" y="12"/>
              <circle cx="44" cy="36" r="14" fill="none" stroke="#009EDB" strokeWidth="1.8"/>
              <circle cx="44" cy="36" r="5" fill="#1D9E75"/>
              <circle cx="44" cy="36" r="2.5" fill="#9FE1CB"/>
              <path d="M44 50 L44 58" stroke="#9FE1CB" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <path d="M37 55 L44 58 L51 55" stroke="#9FE1CB" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="26" cy="57" r="3.5" fill="#009EDB" opacity="0.8"/>
              <circle cx="62" cy="57" r="3.5" fill="#009EDB" opacity="0.8"/>
              <line x1="29.5" y1="57" x2="40" y2="58" stroke="#009EDB" strokeWidth="1.2" opacity="0.7"/>
              <line x1="58.5" y1="57" x2="48" y2="58" stroke="#009EDB" strokeWidth="1.2" opacity="0.7"/>
              <circle cx="66" cy="26" r="8" fill="#085041" stroke="#9FE1CB" strokeWidth="1"/>
              <path d="M62 26 L65 29 L70 23" stroke="#9FE1CB" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="92" y="38" fontFamily="Poppins, Segoe UI, sans-serif" fontSize="24" fontWeight="700" fill="white">SALAMA</text>
              <text x="92" y="58" fontFamily="Poppins, Segoe UI, sans-serif" fontSize="17" fontWeight="400" fill="#7FB3D3">DATA</text>
              <text x="92" y="74" fontFamily="Poppins, Segoe UI, sans-serif" fontSize="10" fontWeight="400" fill="#5A8AA8">Plateforme humanitaire · RDC</text>
            </svg>
          </div>
        </div>

        {/* Card login */}
        <div style={{
          background: 'white', borderRadius: '12px', padding: '2rem',
          border: '1px solid #DDE3EC', boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>
              Connexion
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', marginBottom: 0 }}>
              Entrez vos identifiants pour accéder à Salama Data
            </p>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Email</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingLeft: '40px' }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="votre@email.org"
              />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '44px' }}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
              />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem',
              background: '#FCEBEB', color: '#A32D2D', fontSize: '13px',
              fontWeight: '500', border: '1px solid #F7C1C1',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Bouton connexion */}
          <button onClick={handleLogin} disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? '#64748B' : '#1A4B7A',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="2" x2="12" y2="6"/>
                  <line x1="12" y1="18" x2="12" y2="22"/>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                  <line x1="2" y1="12" x2="6" y2="12"/>
                  <line x1="18" y1="12" x2="22" y2="12"/>
                </svg>
                Connexion en cours...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Se connecter
              </>
            )}
          </button>

          {/* Lien rejoindre */}
          <div style={{
            textAlign: 'center', marginTop: '1rem',
            paddingTop: '1rem', borderTop: '1px solid #DDE3EC'
          }}>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              Votre organisation n'a pas encore accès ?{' '}
              <button onClick={onJoinRequest} style={{
                background: 'none', border: 'none', color: '#1A4B7A',
                fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                fontFamily: "'Poppins', sans-serif", textDecoration: 'underline',
                padding: 0
              }}>
                Faire une demande d'accès
              </button>
            </p>
          </div>
        </div>

        {/* Langue selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1.5rem' }}>
          {[
            { code: 'fr', label: 'FR' },
            { code: 'en', label: 'EN' },
            { code: 'sw', label: 'SW' },
            { code: 'ln', label: 'LN' },
          ].map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} style={{
              background: lang === l.code ? '#1A4B7A' : 'white',
              color: lang === l.code ? 'white' : '#64748B',
              fontSize: '11px', padding: '5px 12px', borderRadius: '6px',
              fontWeight: '600', border: '1px solid #DDE3EC',
              cursor: 'pointer', fontFamily: "'Poppins', sans-serif"
            }}>{l.label}</button>
          ))}
        </div>

        {/* Copyright */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
            © 2026 Salama Data · Tous droits réservés
          </p>
          <p style={{ fontSize: '11px', color: '#B0BEC5', marginTop: '4px' }}>
            Développé par UMANDE INVESTMENT LIMITED · Goma, RDC
          </p>
          <p style={{ fontSize: '11px', color: '#B0BEC5', marginTop: '2px' }}>
            Plateforme humanitaire de protection des données · v2.0
          </p>
        </div>

      </div>
    </div>
  )
}