import { LogoHorizontal } from './Logo'

const links = [
  { id: 'dashboard', icon: '▦', label: 'Tableau de bord' },
  { id: 'collecte', icon: '✎', label: 'Collecte terrain' },
  { id: 'beneficiaires', icon: '◉', label: 'Bénéficiaires' },
  { id: 'agent', icon: '✦', label: 'Salama Agent IA' },
]

export default function Sidebar({ currentPage, onNavigate, isOnline }) {
  return (
    <aside style={{
      width: '260px', minHeight: '100vh', display: 'flex',
      flexDirection: 'column', background: 'var(--blue-dark)',
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      fontFamily: "'Poppins', sans-serif"
    }}>

      {/* Header avec logo */}
      <div style={{ background: '#0D2E4E', padding: '1.25rem 1.5rem' }}>
        <LogoHorizontal online={isOnline} dark={true} />
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: '6px',
          padding: '8px 12px', marginTop: '12px'
        }}>
          <p style={{ color: '#7FB3D3', fontSize: '11px', marginBottom: '4px' }}>Zone d'opération</p>
          <p style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>📍 Goma, Nord-Kivu</p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{
          color: '#7FB3D3', fontSize: '10px', fontWeight: '700',
          letterSpacing: '0.1em', padding: '8px 1.5rem 4px',
          textTransform: 'uppercase'
        }}>Navigation</p>

        {links.map(link => (
          <button key={link.id} onClick={() => onNavigate(link.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 1.5rem', border: 'none', cursor: 'pointer',
            background: currentPage === link.id ? 'rgba(0,158,219,0.2)' : 'transparent',
            color: currentPage === link.id ? 'white' : '#A8C8E0',
            fontSize: '14px', textAlign: 'left',
            fontWeight: currentPage === link.id ? '600' : '400',
            borderLeft: currentPage === link.id ? '3px solid var(--blue)' : '3px solid transparent',
            fontFamily: "'Poppins', sans-serif",
            transition: 'all 0.15s'
          }}>
            <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {['FR', 'EN', 'SW', 'LN'].map(l => (
            <span key={l} style={{
              background: 'rgba(255,255,255,0.1)', color: '#A8C8E0',
              fontSize: '10px', padding: '3px 7px', borderRadius: '4px', fontWeight: '600'
            }}>{l}</span>
          ))}
        </div>
        <p style={{ color: '#5A8AA8', fontSize: '11px' }}>Salama Data MVP v1.0</p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
          padding: '6px 10px', borderRadius: '6px',
          background: isOnline ? 'rgba(29,158,117,0.15)' : 'rgba(186,117,23,0.15)'
        }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: isOnline ? '#1D9E75' : '#BA7517'
          }} />
          <p style={{
            fontSize: '11px', fontWeight: '600', margin: 0,
            color: isOnline ? '#9FE1CB' : '#FFD49A'
          }}>
            {isOnline ? '🌐 En ligne' : '📴 Hors ligne'}
          </p>
        </div>
      </div>

    </aside>
  )
}