import { useState } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const roleConfig = {
  admin:   { label: 'Administrateur', color: '#A32D2D', bg: '#FCEBEB' },
  manager: { label: 'Manager / Coordinateur', color: '#185FA5', bg: '#E6F4FB' },
  agent:   { label: 'Agent terrain', color: '#085041', bg: '#E1F5EE' },
}

export default function Profil({ token, user, onUserUpdate }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }
  const rc = roleConfig[user?.role] || roleConfig.agent

  const strength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3
  const strengthConfig = [
    { label: '', color: '#DDE3EC' },
    { label: 'Faible', color: '#DC2626' },
    { label: 'Moyen', color: '#F59E0B' },
    { label: 'Fort', color: '#1D9E75' },
  ]

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: 'Tous les champs sont obligatoires' })
      return
    }
    if (newPassword.length < 8) {
      setMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      await axios.post(`${API}/auth/change-password`, null, {
        headers,
        params: { old_password: oldPassword, new_password: newPassword }
      })
      setMsg({ type: 'success', text: 'Mot de passe modifié avec succès !' })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors du changement' })
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px 10px 38px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '13px', outline: 'none', background: 'white',
    fontFamily: "'Poppins', sans-serif", color: '#1a1a2e',
    boxSizing: 'border-box', marginTop: '5px'
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block'
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", maxWidth: '700px' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>MON COMPTE</p>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Profil</h1>
        <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>Vos informations et paramètres de sécurité</p>
      </div>

      {/* Card profil */}
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <div style={{ background: '#0D2E4E', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>{user?.prenom} {user?.nom}</h2>
              <p style={{ color: '#7FB3D3', fontSize: '13px', margin: '4px 0 0' }}>{user?.email}</p>
              <span style={{ display: 'inline-block', marginTop: '6px', background: rc.bg, color: rc.color, padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                {rc.label}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Informations du compte</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Prénom', value: user?.prenom, icon: 'people' },
              { label: 'Nom', value: user?.nom, icon: 'people' },
              { label: 'Email', value: user?.email, icon: 'mail' },
              { label: 'Rôle', value: rc.label, icon: 'settings' },
              { label: 'ID utilisateur', value: `#${user?.id}`, icon: 'report' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #DDE3EC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Icon name={item.icon} size={12} color="#94A3B8" />
                  <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0D2E4E' }}>{item.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card changement mot de passe */}
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #DDE3EC' }}>
          <div style={{ width: '4px', height: '20px', background: '#1A4B7A', borderRadius: '2px' }} />
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Changer le mot de passe</h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Choisissez un mot de passe sécurisé d'au moins 8 caractères</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Ancien mot de passe */}
          <div>
            <label style={labelStyle}>Mot de passe actuel</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="lock" size={14} color="#94A3B8" />
              </div>
              <input
                style={{ ...inputStyle, paddingRight: '40px' }}
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
              />
              <button onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                <Icon name={showOld ? 'eyeOff' : 'eye'} size={15} color="#94A3B8" />
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label style={labelStyle}>Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="lock" size={14} color="#94A3B8" />
              </div>
              <input
                style={{ ...inputStyle, paddingRight: '40px' }}
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
              />
              <button onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                <Icon name={showNew ? 'eyeOff' : 'eye'} size={15} color="#94A3B8" />
              </button>
            </div>
            {newPassword.length > 0 && (
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

          {/* Confirmer */}
          <div>
            <label style={labelStyle}>Confirmer le nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="lock" size={14} color="#94A3B8" />
              </div>
              <input
                style={{ ...inputStyle, paddingRight: '40px', borderColor: confirmPassword && newPassword !== confirmPassword ? '#F7C1C1' : confirmPassword && newPassword === confirmPassword ? '#9FE1CB' : '#DDE3EC' }}
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
              />
              <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                <Icon name={showConfirm ? 'eyeOff' : 'eye'} size={15} color="#94A3B8" />
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p style={{ fontSize: '12px', color: '#A32D2D', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="close" size={11} color="#A32D2D" />
                Les mots de passe ne correspondent pas
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p style={{ fontSize: '12px', color: '#085041', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="check" size={11} color="#085041" />
                Les mots de passe correspondent
              </p>
            )}
          </div>
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', marginTop: '1rem', background: msg.type === 'success' ? '#E1F5EE' : '#FCEBEB', color: msg.type === 'success' ? '#085041' : '#A32D2D', fontSize: '13px', fontWeight: '500', border: `1px solid ${msg.type === 'success' ? '#9FE1CB' : '#F7C1C1'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name={msg.type === 'success' ? 'check' : 'alert'} size={14} color={msg.type === 'success' ? '#085041' : '#A32D2D'} />
            {msg.text}
          </div>
        )}

        <button onClick={handleChangePassword} disabled={loading} style={{ marginTop: '1.25rem', padding: '11px 24px', background: loading ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name={loading ? 'spinner' : 'save'} size={15} color="white" />
          {loading ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </div>
    </div>
  )
}