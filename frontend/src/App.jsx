import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Collecte from './pages/Collecte'
import Beneficiaires from './pages/Beneficiaires'
import Agent from './pages/Agent'
import Login from './pages/Login'
import JoinRequest from './pages/JoinRequest'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Personnel from './pages/Personnel'
import Affectations from './pages/Affectations'
import Zones from './pages/Zones'
import Admin from './pages/Admin'
import { Icon } from './components/Icons'
import { syncPending } from './offline'
import './index.css'

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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function App() {
  // ── TOUS LES STATES ──────────────────────────────────────────────
  const [page, setPage] = useState('dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncMsg, setSyncMsg] = useState(null)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [checking, setChecking] = useState(true)
  const [showJoinRequest, setShowJoinRequest] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifCount, setNotifCount] = useState(0)

  // ── TOUS LES USEEFFECTS ───────────────────────────────────────────
  // Vérification session
  useEffect(() => {
    const savedToken = localStorage.getItem('salama_token')
    const savedUser = localStorage.getItem('salama_user')
    if (savedToken && savedUser) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
        .then(() => { setToken(savedToken); setUser(JSON.parse(savedUser)) })
        .catch(() => {
          localStorage.removeItem('salama_token')
          localStorage.removeItem('salama_user')
        })
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [])

  // Notifications
  useEffect(() => {
    if (!token) return
    const fetchNotifs = async () => {
      try {
        const r = await axios.get(`${API}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotifications(r.data)
        setNotifCount(r.data.filter(n => !n.lu).length)
      } catch {}
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [token])

  // Online/offline
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setSyncMsg('Reconnexion détectée — synchronisation en cours...')
      const result = await syncPending(API)
      if (result.synced > 0) {
        setSyncMsg(`✓ ${result.synced} fiche(s) synchronisée(s) avec succès !`)
        setTimeout(() => setSyncMsg(null), 4000)
      } else { setSyncMsg(null) }
    }
    const handleOffline = () => { setIsOnline(false); setSyncMsg(null) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Favicon dynamique
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32; canvas.height = 32
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = isOnline ? '#1A4B7A' : '#085041'
    roundRect(ctx, 0, 0, 32, 32, 6)
    ctx.fill()
    ctx.strokeStyle = isOnline ? '#009EDB' : '#1D9E75'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(16, 13, 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = isOnline ? '#1D9E75' : '#9FE1CB'
    ctx.beginPath()
    ctx.arc(16, 13, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#9FE1CB'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(16, 19); ctx.lineTo(16, 23); ctx.stroke()
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = canvas.toDataURL()
    document.head.appendChild(link)
  }, [isOnline])

  // ── FONCTIONS ────────────────────────────────────────────────────
  const marquerLu = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/lire`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
      setNotifCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const handleLogin = (userData, accessToken) => {
    setUser(userData); setToken(accessToken); setPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('salama_token')
    localStorage.removeItem('salama_user')
    setUser(null); setToken(null)
  }

  const renderPage = () => {
    switch(page) {
      case 'dashboard':     return <Dashboard token={token} />
      case 'collecte':      return <Collecte token={token} user={user} />
      case 'beneficiaires': return <Beneficiaires token={token} />
      case 'personnel':     return <Personnel token={token} />
      case 'affectations':  return <Affectations token={token} />
      case 'zones':         return <Zones token={token} />
      case 'admin':         return <Admin token={token} user={user} />
      case 'agent':         return <Agent token={token} />
      default:              return <Dashboard token={token} />
    }
  }

  // ── RETURNS CONDITIONNELS (après tous les hooks) ──────────────────
  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="56" height="56" viewBox="0 0 48 48" style={{ marginBottom: '1rem' }}>
            <rect width="48" height="48" rx="10" fill="#1A4B7A"/>
            <circle cx="24" cy="20" r="8" fill="none" stroke="#009EDB" strokeWidth="1.5"/>
            <circle cx="24" cy="20" r="3" fill="#1D9E75"/>
            <path d="M24 28 L24 34" stroke="#9FE1CB" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
          <p style={{ color: '#1A4B7A', fontSize: '15px', fontWeight: '600', margin: 0 }}>SALAMA DATA</p>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '6px' }}>Vérification de la session...</p>
        </div>
      </div>
    )
  }

  if (window.location.pathname === '/reset-password' || window.location.search.includes('token=')) {
    return <ResetPassword onSuccess={() => { window.history.pushState({}, '', '/'); setShowForgotPassword(false) }} />
  }

  if (showJoinRequest) {
    return <JoinRequest onBack={() => setShowJoinRequest(false)} />
  }

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />
  }

  if (!user || !token) {
    return (
      <Login
        onLogin={handleLogin}
        onJoinRequest={() => setShowJoinRequest(true)}
        onForgotPassword={() => setShowForgotPassword(true)}
      />
    )
  }

  // ── APP PRINCIPALE ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {!isOnline && (
        <div style={{ background: '#BA7517', color: 'white', padding: '9px 1.5rem', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Icon name="offline" size={14} color="white" />
          Mode hors ligne — Les données sont sauvegardées localement
        </div>
      )}
      {syncMsg && (
        <div style={{ background: syncMsg.startsWith('✓') ? '#085041' : '#185FA5', color: 'white', padding: '9px 1.5rem', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Icon name="sync" size={14} color="white" />
          {syncMsg}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar currentPage={page} onNavigate={setPage} isOnline={isOnline} user={user} onLogout={handleLogout} />
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>

      {/* Bouton flottant notifications — Admin et Manager seulement */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <div style={{ position: 'fixed', top: '16px', right: '20px', zIndex: 1000 }}>
          <button onClick={() => setShowNotifPanel(!showNotifPanel)} style={{ width: '44px', height: '44px', borderRadius: '10px', background: notifCount > 0 ? '#A32D2D' : '#1A4B7A', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', position: 'relative' }}>
            <Icon name="alert" size={20} color="white" />
            {notifCount > 0 && (
              <span style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#DC2626', color: 'white', borderRadius: '50%', width: '22px', height: '22px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontFamily: "'Poppins', sans-serif" }}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Panel notifications */}
      {showNotifPanel && (
        <>
          <div onClick={() => setShowNotifPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.2)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', zIndex: 999, background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', fontFamily: "'Poppins', sans-serif" }}>
            <div style={{ background: '#0D2E4E', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#7FB3D3', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>INTELLIGENCE ARTIFICIELLE</p>
                <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '700', margin: '4px 0 0' }}>Notifications IA</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {notifCount > 0 && (
                  <span style={{ background: '#DC2626', color: 'white', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '700' }}>
                    {notifCount} non lue(s)
                  </span>
                )}
                <button onClick={() => setShowNotifPanel(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                  <Icon name="close" size={16} color="white" />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Icon name="agent_ai" size={26} color="#1A4B7A" />
                  </div>
                  <p style={{ color: '#0D2E4E', fontSize: '15px', fontWeight: '600', margin: '0 0 6px' }}>Aucune notification</p>
                  <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>Analysez vos données depuis le Dashboard pour générer des alertes.</p>
                </div>
              ) : notifications.map(n => {
                const c = NIVEAU_CONFIG[n.niveau] || NIVEAU_CONFIG.info
                const iconName = TYPE_ICON[n.type] || 'alert'
                return (
                  <div key={n.id} style={{ padding: '14px 1.5rem', borderBottom: '1px solid #F1F5F9', background: n.lu ? 'white' : '#FAFAFA', opacity: n.lu ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: n.lu ? '#F8FAFC' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={iconName} size={16} color={n.lu ? '#94A3B8' : c.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: n.lu ? '#64748B' : '#0D2E4E', lineHeight: 1.3 }}>{n.titre}</p>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: n.lu ? '#F8FAFC' : c.bg, color: n.lu ? '#94A3B8' : c.color, padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', border: `1px solid ${n.lu ? '#DDE3EC' : c.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: n.lu ? '#CBD5E1' : c.dot }} />
                            {c.label}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>{n.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                            {new Date(n.date_creation).toLocaleDateString('fr-FR')} {new Date(n.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!n.lu && (
                            <button onClick={() => marquerLu(n.id)} style={{ padding: '3px 10px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '5px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Icon name="check" size={10} color="#64748B" />
                              Lu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #DDE3EC', background: '#F8FAFC' }}>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>
                Actualisé automatiquement toutes les 30 secondes
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}