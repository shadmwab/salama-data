import { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function ResetPassword({ onSuccess }) {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) setToken(t)
    else setError('Lien invalide — demandez un nouveau lien de réinitialisation.')
  }, [])

  const handleSubmit = async () => {
    if (!password) { setError('Mot de passe obligatoire'); return }
    if (password.length < 8) { setError('Minimum 8 caractères'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API}/auth/reset-password`, { token, new_password: password })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Lien expiré ou invalide — demandez un nouveau lien.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px 12px 40px', marginTop: '6px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '14px', outline: 'none', background: 'white',
    color: '#1a1a2e', fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box'
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthConfig = [
    { label: '', color: '#DDE3EC' },
    { label: 'Faible', color: '#DC2626' },
    { label: 'Moyen', color: '#F59E0B' },
    { label: 'Fort', color: '#1D9E75' },
  ]

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
          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Icon name="check" size={28} color="#085041" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0D2E4E', margin: '0 0 8px' }}>Mot de passe modifié !</h2>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <button onClick={onSuccess} style={{ width: '100%', padding: '12px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Icon name="login" size={15} color="white" />
                Se connecter
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Nouveau mot de passe</h2>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>
              </div>

              {/* Champ mot de passe */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '2px' }}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Icon name="lock" size={15} color="#94A3B8" />
                  </div>
                  <input style={{ ...inputStyle, paddingRight: '44px' }} type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <Icon name={showPass ? 'eyeOff' : 'eye'} size={16} color="#94A3B8" />
                  </button>
                </div>
                {/* Force du mot de passe */}
                {password.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= strength ? strengthConfig[strength].color : '#DDE3EC', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: strengthConfig[strength].color, margin: 0, fontWeight: '600' }}>{strengthConfig[strength].label}</p>
                  </div>
                )}
              </div>

              {/* Confirmation */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '2px' }}>Confirmer le mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Icon name="lock" size={15} color="#94A3B8" />
                  </div>
                  <input style={{ ...inputStyle, paddingRight: '44px', borderColor: confirm && password !== confirm ? '#F7C1C1' : confirm && password === confirm ? '#9FE1CB' : '#DDE3EC' }} type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
                  <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <Icon name={showConfirm ? 'eyeOff' : 'eye'} size={16} color="#94A3B8" />
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p style={{ fontSize: '12px', color: '#A32D2D', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="close" size={11} color="#A32D2D" />
                    Les mots de passe ne correspondent pas
                  </p>
                )}
                {confirm && password === confirm && (
                  <p style={{ fontSize: '12px', color: '#085041', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="check" size={11} color="#085041" />
                    Les mots de passe correspondent
                  </p>
                )}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', background: '#FCEBEB', color: '#A32D2D', fontSize: '13px', fontWeight: '500', border: '1px solid #F7C1C1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="alert" size={13} color="#A32D2D" />
                  {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading || !token} style={{ width: '100%', padding: '13px', background: loading ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Icon name={loading ? 'spinner' : 'check'} size={16} color="white" />
                {loading ? 'Modification...' : 'Enregistrer le nouveau mot de passe'}
              </button>
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