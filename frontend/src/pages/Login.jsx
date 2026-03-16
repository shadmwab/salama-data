import { useState } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'
import { LogoHorizontal } from '../components/Logo'

const API = 'http://127.0.0.1:8000'

export default function Login({ onLogin }) {
  const { t, lang, setLang } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    width: '100%', padding: '12px 14px', marginTop: '6px',
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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Poppins', sans-serif", padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo agrandi */}
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0D2E4E' }}>
              Connexion
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Entrez vos identifiants pour accéder à Salama Data
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="votre@email.org"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Mot de passe</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem',
              background: '#FCEBEB', color: '#A32D2D', fontSize: '13px',
              fontWeight: '500', border: '1px solid #F7C1C1'
            }}>
              ✗ {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? '#64748B' : '#1A4B7A',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Poppins', sans-serif"
          }}>
            {loading ? '⏳ Connexion...' : '→ Se connecter'}
          </button>
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
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            © 2026 Salama Data · Tous droits réservés
          </p>
          <p style={{ fontSize: '11px', color: '#B0BEC5', marginTop: '4px' }}>
            Développé par Shadrack N'Sapu Mwabilwa · Goma, RDC
          </p>
          <p style={{ fontSize: '11px', color: '#B0BEC5', marginTop: '2px' }}>
            Plateforme humanitaire de protection des données · v1.0
          </p>
        </div>

      </div>
    </div>
  )
}