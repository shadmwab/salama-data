import { useState } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!email) { setError('Email obligatoire'); return }
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API}/auth/forgot-password`, { email })
      setSent(true)
    } catch {
      setError('Erreur — réessayez plus tard')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', marginTop: '6px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '14px', outline: 'none', background: 'white',
    color: '#1a1a2e', fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: '#0D2E4E', borderRadius: '16px', padding: '1.5rem 2.5rem', marginBottom: '1rem' }}>
            <svg width="220" height="68" viewBox="0 0 280 88">
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
              <text x="92" y="38" fontFamily="Poppins, sans-serif" fontSize="22" fontWeight="700" fill="white">SALAMA</text>
              <text x="92" y="56" fontFamily="Poppins, sans-serif" fontSize="15" fontWeight="400" fill="#7FB3D3">DATA</text>
              <text x="92" y="72" fontFamily="Poppins, sans-serif" fontSize="9" fill="#5A8AA8">Plateforme humanitaire · RDC</text>
            </svg>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #DDE3EC', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Icon name="mail" size={26} color="#085041" />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0D2E4E', margin: '0 0 8px' }}>Email envoyé !</h2>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                Si cet email existe dans notre système, vous recevrez un lien de réinitialisation valable <strong>2 heures</strong>.
              </p>
              <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #FCD34D', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
                  Vérifiez aussi vos spams si vous ne recevez pas l'email.
                </p>
              </div>
              <button onClick={onBack} style={{ width: '100%', padding: '12px', background: '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Icon name="login" size={15} color="white" />
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Mot de passe oublié</h2>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
                  Entrez votre email et nous vous enverrons un lien de réinitialisation.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '2px' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Icon name="mail" size={15} color="#94A3B8" />
                  </div>
                  <input
                    style={{ ...inputStyle, paddingLeft: '38px' }}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="votre@email.org"
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', background: '#FCEBEB', color: '#A32D2D', fontSize: '13px', fontWeight: '500', border: '1px solid #F7C1C1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="alert" size={13} color="#A32D2D" />
                  {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Icon name={loading ? 'spinner' : 'send'} size={16} color="white" />
                {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>

              <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #DDE3EC' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#1A4B7A', fontWeight: '600', cursor: 'pointer', fontSize: '13px', fontFamily: "'Poppins', sans-serif", display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  ← Retour à la connexion
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>© 2026 Salama Data · Tous droits réservés</p>
          <p style={{ fontSize: '11px', color: '#B0BEC5', marginTop: '4px' }}>Umande Investment Limited · Goma, RDC</p>
        </div>
      </div>
    </div>
  )
}