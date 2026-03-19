import { LogoHorizontal } from './Logo'
import { useLang } from '../LanguageContext'
import { Icon } from './Icons'

const getLinks = (t, role) => {
  const all = [
    { id: 'dashboard',     icon: 'dashboard', label: t('nav_dashboard'),     roles: ['admin','manager','agent'] },
    { id: 'collecte',      icon: 'collect',   label: t('nav_collecte'),      roles: ['admin','manager','agent'] },
    { id: 'beneficiaires', icon: 'people',    label: t('nav_beneficiaires'), roles: ['admin','manager'] },
    { id: 'personnel',     icon: 'health',    label: 'Personnel de Santé',   roles: ['admin','manager'] },
    { id: 'agent',         icon: 'agent_ai',  label: t('nav_agent'),         roles: ['admin','manager'] },
    { id: 'affectations', icon: 'map', label: 'Affectations', roles: ['admin', 'manager'] },
  ]
  return all.filter(l => l.roles.includes(role))
}

const roleColors = {
  admin:   { bg: '#FCEBEB', color: '#A32D2D', label: 'Admin' },
  manager: { bg: '#E6F4FB', color: '#185FA5', label: 'Manager' },
  agent:   { bg: '#E1F5EE', color: '#085041', label: 'Agent' },
}

export default function Sidebar({ currentPage, onNavigate, isOnline, user, onLogout }) {
  const { lang, setLang, t } = useLang()
  const links = getLinks(t, user?.role || 'agent')
  const roleStyle = roleColors[user?.role] || roleColors.agent

  return (
    <aside style={{
      width: '260px', minHeight: '100vh', display: 'flex',
      flexDirection: 'column', background: 'var(--blue-dark)',
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      fontFamily: "'Poppins', sans-serif"
    }}>

      <div style={{ background: '#0D2E4E', padding: '1.25rem 1.5rem' }}>
        <LogoHorizontal online={isOnline} dark={true} />
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', marginTop: '12px' }}>
          <p style={{ color: '#7FB3D3', fontSize: '11px', marginBottom: '4px' }}>{t('nav_zone')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="location" size={12} color="#9FE1CB" />
            <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', margin: 0 }}>Goma, Nord-Kivu</p>
          </div>
        </div>
      </div>

      {user && (
        <div style={{ padding: '12px 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
            {user.prenom?.[0]}{user.nom?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.prenom} {user.nom}
            </p>
            <span style={{ background: roleStyle.bg, color: roleStyle.color, fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', display: 'inline-block', marginTop: '2px' }}>
              {roleStyle.label}
            </span>
          </div>
        </div>
      )}

      <div style={{ padding: '8px 0', flex: 1 }}>
        <p style={{ color: '#7FB3D3', fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', padding: '8px 1.5rem 4px', textTransform: 'uppercase' }}>Navigation</p>
        {links.map(link => (
          <button key={link.id} onClick={() => onNavigate(link.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 1.5rem', border: 'none', cursor: 'pointer',
            background: currentPage === link.id ? 'rgba(0,158,219,0.2)' : 'transparent',
            color: currentPage === link.id ? 'white' : '#A8C8E0',
            fontSize: '14px', textAlign: 'left',
            fontWeight: currentPage === link.id ? '600' : '400',
            borderLeft: currentPage === link.id ? '3px solid var(--blue)' : '3px solid transparent',
            fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s'
          }}>
            <Icon name={link.icon} size={16} color={currentPage === link.id ? 'white' : '#A8C8E0'} />
            <span>{link.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)' }}>
        <p style={{ color: '#7FB3D3', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Langue</p>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {['fr','en','sw','ln'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              background: lang === l ? 'var(--blue)' : 'rgba(255,255,255,0.1)',
              color: lang === l ? 'white' : '#A8C8E0',
              fontSize: '11px', padding: '4px 10px', borderRadius: '4px',
              fontWeight: '600', border: 'none', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif"
            }}>{l.toUpperCase()}</button>
          ))}
        </div>

        <p style={{ color: '#5A8AA8', fontSize: '11px' }}>Salama Data MVP v1.0</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', background: isOnline ? 'rgba(29,158,117,0.15)' : 'rgba(186,117,23,0.15)' }}>
            <Icon name={isOnline ? 'online' : 'offline'} size={12} color={isOnline ? '#1D9E75' : '#BA7517'} />
            <p style={{ fontSize: '11px', fontWeight: '600', margin: 0, color: isOnline ? '#9FE1CB' : '#FFD49A' }}>
              {isOnline ? t('status_online') : t('status_offline')}
            </p>
          </div>
          <button onClick={onLogout} style={{
            background: 'rgba(255,255,255,0.08)', color: '#A8C8E0',
            border: 'none', borderRadius: '6px', padding: '6px 10px',
            fontSize: '11px', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            <Icon name="logout" size={12} color="#A8C8E0" />
            Sortir
          </button>
        </div>
      </div>
    </aside>
  )
}