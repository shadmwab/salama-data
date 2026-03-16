import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Collecte from './pages/Collecte'
import Beneficiaires from './pages/Beneficiaires'
import Agent from './pages/Agent'
import { syncPending } from './offline'
import './index.css'

const API = 'http://127.0.0.1:8000'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncMsg, setSyncMsg] = useState(null)

  useEffect(() => {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
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
  ctx.moveTo(16, 19)
  ctx.lineTo(16, 23)
  ctx.stroke()

  const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
  link.type = 'image/x-icon'
  link.rel = 'shortcut icon'
  link.href = canvas.toDataURL()
  document.head.appendChild(link)
}, [isOnline])

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
    const handleOffline = () => {
      setIsOnline(false)
      setSyncMsg(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const renderPage = () => {
    switch(page) {
      case 'dashboard': return <Dashboard />
      case 'collecte': return <Collecte />
      case 'beneficiaires': return <Beneficiaires />
      case 'agent': return <Agent />
      default: return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Barre de statut connexion */}
      {!isOnline && (
        <div style={{
          background: '#BA7517', color: 'white',
          padding: '9px 1.5rem', fontSize: '13px', fontWeight: '600',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', zIndex: 1000
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD49A' }} />
          📴 Mode hors ligne — Les données sont sauvegardées localement et seront synchronisées à la reconnexion
        </div>
      )}

      {/* Message de synchronisation */}
      {syncMsg && (
        <div style={{
          background: syncMsg.startsWith('✓') ? '#085041' : '#185FA5',
          color: 'white', padding: '9px 1.5rem', fontSize: '13px',
          fontWeight: '600', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '10px', zIndex: 1000
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: syncMsg.startsWith('✓') ? '#9FE1CB' : '#7FB3D3' }} />
          {syncMsg}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar currentPage={page} onNavigate={setPage} isOnline={isOnline} />
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}