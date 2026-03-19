import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Beneficiaires({ token }) {
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filterVulnerable, setFilterVulnerable] = useState('')
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

  const filtered = list.filter(b => {
    const matchSearch = `${b.prenom} ${b.nom} ${b.zone_origine} ${b.site_deplacement} ${b.numero_cni || ''}`
      .toLowerCase().includes(search.toLowerCase())
    const matchVulnerable = !filterVulnerable || b.groupe_vulnerable === filterVulnerable
    return matchSearch && matchVulnerable
  })

  const toggleVerif = async (id) => {
    try {
      const r = await axios.put(`${API}/beneficiaires/${id}/verify`, {}, { headers })
      setList(list.map(b => b.id === id ? { ...b, verifie: r.data.verifie } : b))
      if (selected?.id === id) setSelected(s => ({ ...s, verifie: r.data.verifie }))
    } catch {}
  }

  const updateAide = async (id, field, value) => {
    try {
      await axios.put(`${API}/beneficiaires/${id}/aide`, null, {
        headers, params: { [field]: value }
      })
      setList(list.map(b => b.id === id ? { ...b, [field]: value } : b))
      if (selected?.id === id) setSelected(s => ({ ...s, [field]: value }))
    } catch {}
  }

  // Stats
  const stats = {
    total: list.length,
    verifies: list.filter(b => b.verifie).length,
    doublons: list.filter(b => b.doublon_detecte).length,
    vulnerables: list.filter(b => b.groupe_vulnerable && b.groupe_vulnerable !== 'Aucun').length,
    besoins_eau: list.filter(b => b.besoin_eau).length,
    besoins_alim: list.filter(b => b.besoin_alimentation).length,
    besoins_abri: list.filter(b => b.besoin_abri).length,
    besoins_sante: list.filter(b => b.besoin_sante).length,
    besoins_educ: list.filter(b => b.besoin_education).length,
  }

  const groupes = [...new Set(list.map(b => b.groupe_vulnerable).filter(g => g && g !== 'Aucun'))]

  const BesoinTag = ({ actif, label }) => actif ? (
    <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', border: '1px solid #F7C1C1' }}>
      {label}
    </span>
  ) : null

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", display: 'flex', gap: '1.5rem' }}>

      {/* Liste */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>LISTE</p>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('benef_title')}</h1>
          <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{filtered.length} bénéficiaire(s) affiché(s)</p>
        </div>

        {/* Stats rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem' }}>
          {[
            { label: 'Total', num: stats.total, color: '#1A4B7A', bg: '#E6F4FB', icon: 'people' },
            { label: 'Vérifiés', num: stats.verifies, color: '#085041', bg: '#E1F5EE', icon: 'check' },
            { label: 'Vulnérables', num: stats.vulnerables, color: '#92400E', bg: '#FEF3C7', icon: 'alert' },
            { label: 'Doublons', num: stats.doublons, color: '#A32D2D', bg: '#FCEBEB', icon: 'duplicate' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #DDE3EC', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={s.icon} size={15} color={s.color} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: 0, lineHeight: 1 }}>{s.num}</p>
                <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Besoins overview */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '12px 16px', border: '1px solid #DDE3EC', marginBottom: '1rem', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Besoins :</span>
          {[
            { label: 'Eau', num: stats.besoins_eau },
            { label: 'Alim.', num: stats.besoins_alim },
            { label: 'Abri', num: stats.besoins_abri },
            { label: 'Santé', num: stats.besoins_sante },
            { label: 'Éduc.', num: stats.besoins_educ },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: b.num > 0 ? '#A32D2D' : '#94A3B8' }}>{b.num}</span>
              <span style={{ fontSize: '12px', color: '#64748B' }}>{b.label}</span>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
              <Icon name="people" size={14} color="#94A3B8" />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, zone, CNI..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #DDE3EC', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box' }}
            />
          </div>
          <select onChange={e => setFilterVulnerable(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #DDE3EC', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", outline: 'none', background: 'white', color: '#64748B' }}>
            <option value="">Tous groupes</option>
            {groupes.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['ID', 'Bénéficiaire', 'Groupe', 'Zone → Site', 'Besoins', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  <Icon name="spinner" size={20} color="#94A3B8" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>Aucun bénéficiaire trouvé.</td></tr>
              ) : filtered.map((b, i) => {
                const nbBesoins = [b.besoin_eau, b.besoin_alimentation, b.besoin_abri, b.besoin_sante, b.besoin_education].filter(Boolean).length
                return (
                  <tr key={b.id} onClick={() => setSelected(b)} style={{ background: selected?.id === b.id ? '#EEF2F7' : i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>#{b.id}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#1A4B7A', flexShrink: 0 }}>
                          {b.prenom?.[0]}{b.nom?.[0]}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0D2E4E' }}>{b.prenom} {b.nom}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{b.age ? `${b.age} ans` : '—'} · {b.sexe === 'F' ? 'F' : 'M'} {b.telephone ? `· ${b.telephone}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {b.groupe_vulnerable && b.groupe_vulnerable !== 'Aucun' ? (
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', border: '1px solid #FCD34D' }}>{b.groupe_vulnerable}</span>
                      ) : <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {b.zone_origine && <span style={{ background: '#E1F5EE', color: '#085041', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>{b.zone_origine}</span>}
                        {b.zone_origine && b.site_deplacement && <Icon name="agent" size={10} color="#CBD5E1" />}
                        {b.site_deplacement && <span style={{ fontSize: '11px', color: '#64748B' }}>{b.site_deplacement}</span>}
                        {!b.zone_origine && !b.site_deplacement && '—'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {nbBesoins > 0 ? (
                        <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: '1px solid #F7C1C1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icon name="alert" size={10} color="#A32D2D" />
                          {nbBesoins} besoin{nbBesoins > 1 ? 's' : ''}
                        </span>
                      ) : <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {b.doublon_detecte ? (
                        <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icon name="duplicate" size={10} color="#A32D2D" />Doublon
                        </span>
                      ) : b.verifie ? (
                        <span style={{ background: '#E1F5EE', color: '#085041', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icon name="check" size={10} color="#085041" />Vérifié
                        </span>
                      ) : (
                        <span style={{ background: '#F8FAFC', color: '#64748B', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>En attente</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fiche détaillée */}
      {selected && (
        <div style={{ width: '340px', flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'sticky', top: '1rem' }}>

            {/* Header */}
            <div style={{ background: '#0D2E4E', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: 'white' }}>
                    {selected.prenom?.[0]}{selected.nom?.[0]}
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: '700', fontSize: '15px', margin: 0 }}>{selected.prenom} {selected.nom}</p>
                    <p style={{ color: '#7FB3D3', fontSize: '11px', margin: 0 }}>ID #{selected.id} · {selected.date_enregistrement ? new Date(selected.date_enregistrement).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                  <Icon name="close" size={14} color="white" />
                </button>
              </div>
              <button onClick={() => toggleVerif(selected.id)} style={{ marginTop: '12px', width: '100%', padding: '7px', background: selected.verifie ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${selected.verifie ? '#1D9E75' : 'rgba(255,255,255,0.2)'}`, borderRadius: '6px', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Icon name="check" size={13} color={selected.verifie ? '#9FE1CB' : '#A8C8E0'} />
                {selected.verifie ? 'Identité vérifiée' : 'Marquer comme vérifié'}
              </button>
            </div>

            <div style={{ padding: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>

              {/* Photo CNI */}
              {selected.photo_cni && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Document d'identité</p>
                  <img src={selected.photo_cni} alt="CNI" style={{ width: '100%', borderRadius: '8px', border: '1px solid #DDE3EC' }} />
                </div>
              )}

              {/* Identité */}
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Identité</p>
              {[
                { label: 'Âge', value: selected.age ? `${selected.age} ans` : '—' },
                { label: 'Sexe', value: selected.sexe === 'F' ? 'Féminin' : 'Masculin' },
                { label: 'Téléphone', value: selected.telephone || '—' },
                { label: 'N° CNI', value: selected.numero_cni || '—' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0D2E4E' }}>{row.value}</span>
                </div>
              ))}

              {/* Famille */}
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '12px 0 8px' }}>Famille</p>
              {[
                { label: 'Référent', value: selected.nom_referent || '—' },
                { label: 'Tél. référent', value: selected.telephone_referent || '—' },
                { label: 'Dépendants', value: `${selected.nb_dependants} personne(s)` },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0D2E4E' }}>{row.value}</span>
                </div>
              ))}

              {/* Localisation */}
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '12px 0 8px' }}>Localisation</p>
              {[
                { label: 'Zone origine', value: selected.zone_origine || '—' },
                { label: 'Site actuel', value: selected.site_deplacement || '—' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0D2E4E' }}>{row.value}</span>
                </div>
              ))}
              {selected.latitude && selected.longitude && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '5px 8px', background: '#E1F5EE', borderRadius: '6px' }}>
                  <Icon name="location" size={12} color="#085041" />
                  <span style={{ fontSize: '11px', color: '#085041', fontWeight: '500' }}>{selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</span>
                </div>
              )}

              {/* Vulnérabilité */}
              {selected.groupe_vulnerable && selected.groupe_vulnerable !== 'Aucun' && (
                <>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '12px 0 8px' }}>Vulnérabilité</p>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid #FCD34D' }}>
                    {selected.groupe_vulnerable}
                  </span>
                </>
              )}

              {/* Besoins prioritaires */}
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '12px 0 8px' }}>Besoins prioritaires</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {[
                  { field: 'besoin_eau', label: 'Eau' },
                  { field: 'besoin_alimentation', label: 'Alimentation' },
                  { field: 'besoin_abri', label: 'Abri' },
                  { field: 'besoin_sante', label: 'Santé' },
                  { field: 'besoin_education', label: 'Éducation' },
                ].map(item => (
                  <span key={item.field} style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                    background: selected[item.field] ? '#FCEBEB' : '#F8FAFC',
                    color: selected[item.field] ? '#A32D2D' : '#CBD5E1',
                    border: `1px solid ${selected[item.field] ? '#F7C1C1' : '#DDE3EC'}`
                  }}>
                    {item.label}
                  </span>
                ))}
              </div>

              {/* Aide reçue */}
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Aide reçue</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { field: 'aide_alimentaire', label: 'Kit alimentaire', icon: 'report' },
                  { field: 'aide_abri', label: 'Abri d\'urgence', icon: 'zone' },
                  { field: 'aide_medicale', label: 'Soins médicaux', icon: 'health' },
                ].map(item => (
                  <div key={item.field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Icon name={item.icon} size={13} color="#64748B" />
                      <span style={{ fontSize: '12px', color: '#374151' }}>{item.label}</span>
                    </div>
                    <button onClick={() => updateAide(selected.id, item.field, !selected[item.field])} style={{ padding: '3px 10px', border: `1px solid ${selected[item.field] ? '#9FE1CB' : '#DDE3EC'}`, borderRadius: '6px', cursor: 'pointer', background: selected[item.field] ? '#E1F5EE' : '#F8FAFC', color: selected[item.field] ? '#085041' : '#94A3B8', fontSize: '11px', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>
                      {selected[item.field] ? 'Distribué' : 'En attente'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Doublon */}
              {selected.doublon_detecte && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#FCEBEB', borderRadius: '8px', border: '1px solid #F7C1C1', display: 'flex', gap: '8px' }}>
                  <Icon name="alert" size={16} color="#A32D2D" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#A32D2D' }}>Doublon détecté</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#A32D2D', marginTop: '2px' }}>Ce bénéficiaire a été identifié comme doublon potentiel.</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #DDE3EC' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>Notes</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#374151', fontStyle: 'italic' }}>{selected.notes}</p>
                </div>
              )}
            {/* Bouton supprimer */}
              <button
                onClick={async () => {
                  if (!window.confirm(`Supprimer ${selected.prenom} ${selected.nom} ?`)) return
                  try {
                    await axios.delete(`${API}/beneficiaires/${selected.id}`, { headers })
                    setList(list.filter(b => b.id !== selected.id))
                    setSelected(null)
                  } catch {}
                }}
                style={{
                  width: '100%', marginTop: '12px', padding: '9px',
                  background: '#FCEBEB', color: '#A32D2D',
                  border: '1px solid #F7C1C1', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                <Icon name="trash" size={14} color="#A32D2D" />
                Supprimer ce bénéficiaire
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}