import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Collecte from './pages/Collecte'
import Beneficiaires from './pages/Beneficiaires'
import Agent from './pages/Agent'
import Login from './pages/Login'
import JoinRequest from './pages/JoinRequest'
import { syncPending } from './offline'
import './index.css'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

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
  const [page, setPage] = useState('dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncMsg, setSyncMsg] = useState(null)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [checking, setChecking] = useState(true)
  const [showJoinRequest, setShowJoinRequest] = useState(false)

  // Vérification de session au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem('salama_token')
    const savedUser = localStorage.getItem('salama_user')

    if (savedToken && savedUser) {
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(() => {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
        })
        .catch(() => {
          localStorage.removeItem('salama_token')
          localStorage.removeItem('salama_user')
        })
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [])

  // Gestion connexion online/offline
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setSyncMsg('Reconnexion détectée — synchronisation en cours...')
      const result = await syncPending(API)
      if (result.synced > 0) {
        setSyncMsg(`✓ ${result.synced} fiche(s) synchronisée(s) avec succès !`)
        setTimeout(() => setSyncMsg(null), 4000)
      } else {
        setSyncMsg(null)
      }
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
    const bg = isOnline ? '#1A4B7A' : '#085041'
    const ring = isOnline ? '#009EDB' : '#1D9E75'
    ctx.fillStyle = bg
    roundRect(ctx, 0, 0, 32, 32, 6)
    ctx.fill()
    ctx.strokeStyle = ring
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

  const handleLogin = (userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    setPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('salama_token')
    localStorage.removeItem('salama_user')
    setUser(null)
    setToken(null)
  }

  const renderPage = () => {
    switch(page) {
      case 'dashboard': return <Dashboard token={token} />
      case 'collecte': return <Collecte token={token} user={user} />
      case 'beneficiaires': return <Beneficiaires token={token} />
      case 'agent': return <Agent token={token} />
      default: return <Dashboard token={token} />
    }
  }

  // Écran de chargement pendant la vérification
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', background: '#EEF2F7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="56" height="56" viewBox="0 0 48 48" style={{ marginBottom: '1rem' }}>
            <rect width="48" height="48" rx="10" fill="#1A4B7A"/>
            <circle cx="24" cy="20" r="8" fill="none" stroke="#009EDB" strokeWidth="1.5"/>
            <circle cx="24" cy="20" r="3" fill="#1D9E75"/>
            <path d="M24 28 L24 34" stroke="#9FE1CB" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M19 32 L24 34 L29 32" stroke="#9FE1CB" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="14" cy="32" r="2.5" fill="#009EDB" opacity="0.8"/>
            <circle cx="34" cy="32" r="2.5" fill="#009EDB" opacity="0.8"/>
            <circle cx="36" cy="14" r="5" fill="#085041" stroke="#9FE1CB" strokeWidth="1"/>
            <path d="M33 14 L35 16 L39 12" stroke="#9FE1CB" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ color: '#1A4B7A', fontSize: '15px', fontWeight: '600', margin: 0 }}>
            SALAMA DATA
          </p>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '6px' }}>
            Vérification de la session...
          </p>
        </div>
      </div>
    )
  }

  // Page demande organisation
  if (showJoinRequest) {
    return <JoinRequest onBack={() => setShowJoinRequest(false)} />
  }

  // Page login
  if (!user || !token) {
    return <Login onLogin={handleLogin} onJoinRequest={() => setShowJoinRequest(true)} />
  }

  // Application principale
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isOnline && (
        <div style={{
          background: '#BA7517', color: 'white', padding: '9px 1.5rem',
          fontSize: '13px', fontWeight: '600', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: '10px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD49A' }} />
          Mode hors ligne — Les données sont sauvegardées localement
        </div>
      )}
      {syncMsg && (
        <div style={{
          background: syncMsg.startsWith('✓') ? '#085041' : '#185FA5',
          color: 'white', padding: '9px 1.5rem', fontSize: '13px',
          fontWeight: '600', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '10px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: syncMsg.startsWith('✓') ? '#9FE1CB' : '#7FB3D3' }} />
          {syncMsg}
        </div>
      )}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          currentPage={page}
          onNavigate={setPage}
          isOnline={isOnline}
          user={user}
          onLogout={handleLogout}
        />
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}