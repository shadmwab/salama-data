import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Beneficiaires({ token }) {
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { t } = useLang()

  const headers = { Authorization: `Bearer ${token}` }

  const fetchList = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API}/beneficiaires`, { headers })
      setList(r.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchList() }, [token])

  const filtered = list.filter(b =>
    `${b.prenom} ${b.nom} ${b.zone_origine} ${b.site_deplacement}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const toggleVerif = async (id) => {
    try {
      const r = await axios.put(`${API}/beneficiaires/${id}/verify`, {}, { headers })
      setList(list.map(b => b.id === id ? { ...b, verifie: r.data.verifie } : b))
      if (selected?.id === id) setSelected({ ...selected, verifie: r.data.verifie })
    } catch {}
  }

  const updateAide = async (id, field, value) => {
    try {
      await axios.put(`${API}/beneficiaires/${id}/aide`, null, {
        headers, params: { [field]: value }
      })
      setList(list.map(b => b.id === id ? { ...b, [field]: value } : b))
      if (selected?.id === id) setSelected({ ...selected, [field]: value })
    } catch {}
  }

  const Badge = ({ ok, label }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: ok ? '#E1F5EE' : '#F8FAFC',
      color: ok ? '#085041' : '#64748B',
      padding: '4px 10px', borderRadius: '6px',
      fontSize: '12px', fontWeight: '600',
      border: `1px solid ${ok ? '#9FE1CB' : '#DDE3EC'}`
    }}>
      <Icon name={ok ? 'check' : 'close'} size={11} color={ok ? '#085041' : '#94A3B8'} />
      {label}
    </span>
  )

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", display: 'flex', gap: '1.5rem' }}>

      {/* Liste */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>LISTE</p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('benef_title')}</h1>
            <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{filtered.length} {t('benef_count')}</p>
          </div>
        </div>

        {/* Recherche */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <Icon name="people" size={15} color="#94A3B8" />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, zone ou site..."
            style={{
              width: '100%', padding: '10px 14px 10px 38px',
              border: '1.5px solid #DDE3EC', borderRadius: '8px',
              fontSize: '13px', outline: 'none', background: 'white',
              fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Stats rapides */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', num: list.length, color: '#1A4B7A', bg: '#E6F4FB' },
            { label: 'Vérifiés', num: list.filter(b => b.verifie).length, color: '#085041', bg: '#E1F5EE' },
            { label: 'Doublons', num: list.filter(b => b.doublon_detecte).length, color: '#A32D2D', bg: '#FCEBEB' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: '8px', padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: '700', color: s.color, margin: 0 }}>{s.num}</p>
              <p style={{ fontSize: '12px', color: s.color, margin: 0, opacity: 0.8 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['ID', 'Nom complet', 'Âge/Sexe', 'Zone', 'Site', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  <Icon name="spinner" size={20} color="#94A3B8" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>{t('benef_empty')}</td></tr>
              ) : filtered.map((b, i) => (
                <tr key={b.id}
                  onClick={() => setSelected(b)}
                  style={{ background: selected?.id === b.id ? '#EEF2F7' : i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.1s' }}>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>#{b.id}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#1A4B7A', flexShrink: 0 }}>
                        {b.prenom?.[0]}{b.nom?.[0]}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0D2E4E' }}>{b.prenom} {b.nom}</p>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151' }}>
                    {b.age ?? '—'} · {b.sexe ?? '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    {b.zone_origine ? (
                      <span style={{ background: '#E1F5EE', color: '#085041', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500' }}>{b.zone_origine}</span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B' }}>{b.site_deplacement ?? '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    {b.doublon_detecte ? (
                      <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <Icon name="duplicate" size={11} color="#A32D2D" />
                        Doublon
                      </span>
                    ) : b.verifie ? (
                      <span style={{ background: '#E1F5EE', color: '#085041', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <Icon name="check" size={11} color="#085041" />
                        Vérifié
                      </span>
                    ) : (
                      <span style={{ background: '#F8FAFC', color: '#64748B', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500' }}>En attente</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <Icon name="agent" size={14} color="#94A3B8" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fiche détaillée */}
      {selected && (
        <div style={{ width: '320px', flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'sticky', top: '1rem' }}>

            {/* Header fiche */}
            <div style={{ background: '#0D2E4E', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: 'white' }}>
                    {selected.prenom?.[0]}{selected.nom?.[0]}
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: '700', fontSize: '15px', margin: 0 }}>{selected.prenom} {selected.nom}</p>
                    <p style={{ color: '#7FB3D3', fontSize: '11px', margin: 0 }}>ID #{selected.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Icon name="close" size={14} color="white" />
                </button>
              </div>

              {/* Statut vérifié */}
              <button onClick={() => toggleVerif(selected.id)} style={{
                marginTop: '12px', width: '100%', padding: '7px',
                background: selected.verifie ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${selected.verifie ? '#1D9E75' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '6px', cursor: 'pointer', color: 'white',
                fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
                <Icon name="check" size={13} color={selected.verifie ? '#9FE1CB' : '#A8C8E0'} />
                {selected.verifie ? 'Identité vérifiée' : 'Marquer comme vérifié'}
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>

              {/* Infos personnelles */}
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Informations</p>
              {[
                { label: 'Âge', value: selected.age ? `${selected.age} ans` : '—' },
                { label: 'Sexe', value: selected.sexe === 'F' ? 'Femme' : selected.sexe === 'M' ? 'Homme' : '—' },
                { label: 'Dépendants', value: `${selected.nb_dependants} personne(s)` },
                { label: 'Zone d\'origine', value: selected.zone_origine ?? '—' },
                { label: 'Site', value: selected.site_deplacement ?? '—' },
                { label: 'Agent', value: selected.agent_id ?? '—' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0D2E4E' }}>{row.value}</span>
                </div>
              ))}

              {/* GPS */}
              {selected.latitude && selected.longitude && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '6px 10px', background: '#E1F5EE', borderRadius: '6px' }}>
                  <Icon name="location" size={13} color="#085041" />
                  <span style={{ fontSize: '11px', color: '#085041', fontWeight: '500' }}>
                    {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                  </span>
                </div>
              )}

              {/* Aide reçue */}
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 10px' }}>Aide reçue</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { field: 'aide_alimentaire', label: 'Kit alimentaire', icon: 'report' },
                  { field: 'aide_abri',        label: 'Abri d\'urgence', icon: 'zone' },
                  { field: 'aide_medicale',    label: 'Soins médicaux',  icon: 'health' },
                ].map(item => (
                  <div key={item.field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Icon name={item.icon} size={13} color="#64748B" />
                      <span style={{ fontSize: '12px', color: '#374151' }}>{item.label}</span>
                    </div>
                    <button
                      onClick={() => updateAide(selected.id, item.field, !selected[item.field])}
                      style={{
                        padding: '3px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                        background: selected[item.field] ? '#E1F5EE' : '#F8FAFC',
                        color: selected[item.field] ? '#085041' : '#94A3B8',
                        fontSize: '11px', fontWeight: '600',
                        fontFamily: "'Poppins', sans-serif",
                        border: `1px solid ${selected[item.field] ? '#9FE1CB' : '#DDE3EC'}`
                      }}>
                      {selected[item.field] ? 'Distribué' : 'En attente'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Doublon */}
              {selected.doublon_detecte && (
                <div style={{ marginTop: '14px', padding: '10px', background: '#FCEBEB', borderRadius: '8px', border: '1px solid #F7C1C1', display: 'flex', gap: '8px' }}>
                  <Icon name="alert" size={16} color="#A32D2D" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#A32D2D' }}>Doublon détecté</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#A32D2D', marginTop: '2px' }}>Ce bénéficiaire a été identifié comme doublon potentiel.</p>
                  </div>
                </div>
              )}

              {/* Date */}
              <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '14px', textAlign: 'center' }}>
                Enregistré le {selected.date_enregistrement ? new Date(selected.date_enregistrement).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}