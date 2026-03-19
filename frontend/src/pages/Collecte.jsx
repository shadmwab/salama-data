import { useState, useEffect } from 'react'
import axios from 'axios'
import { savePending } from '../offline'
import { useLang } from '../LanguageContext'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const GROUPES_VULNERABLES = [
  'Enfant non accompagné',
  'Femme enceinte',
  'Femme allaitante',
  'Personne handicapée',
  'Personne âgée',
  'Survivant(e) de violence',
  'Malade chronique',
  'Aucun'
]

const SECTIONS = ['Identité', 'Famille', 'Localisation', 'Vulnérabilité', 'Besoins']

export default function Collecte({ token, user }) {
  const { t } = useLang()
  const [section, setSection] = useState(0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [photoCNI, setPhotoCNI] = useState(null)

  const [form, setForm] = useState({
    nom: '', prenom: '', age: '', sexe: 'F',
    telephone: '', numero_cni: '', photo_cni: '',
    nom_referent: '', telephone_referent: '',
    zone_origine: '', site_deplacement: '', nb_dependants: 0,
    latitude: null, longitude: null,
    groupe_vulnerable: 'Aucun',
    besoin_eau: false, besoin_alimentation: false,
    besoin_abri: false, besoin_sante: false, besoin_education: false,
    notes: ''
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const getGPS = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        update('latitude', pos.coords.latitude)
        update('longitude', pos.coords.longitude)
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handlePhotoCNI = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoCNI(ev.target.result)
      update('photo_cni', ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom) {
      setStatus({ type: 'error', msg: 'Nom et prénom sont obligatoires' })
      return
    }
    setLoading(true)
    const data = {
      ...form,
      age: parseInt(form.age) || null,
      nb_dependants: parseInt(form.nb_dependants) || 0,
      agent_id: user?.email || 'agent'
    }
    try {
      await axios.post(`${API}/beneficiaires`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStatus({ type: 'success', msg: `✓ ${form.prenom} ${form.nom} enregistré avec succès` })
      setForm({
        nom: '', prenom: '', age: '', sexe: 'F',
        telephone: '', numero_cni: '', photo_cni: '',
        nom_referent: '', telephone_referent: '',
        zone_origine: '', site_deplacement: '', nb_dependants: 0,
        latitude: null, longitude: null,
        groupe_vulnerable: 'Aucun',
        besoin_eau: false, besoin_alimentation: false,
        besoin_abri: false, besoin_sante: false, besoin_education: false,
        notes: ''
      })
      setPhotoCNI(null)
      setSection(0)
    } catch {
      await savePending(data)
      setStatus({ type: 'offline', msg: '📴 Sauvegardé localement — synchronisation automatique dès reconnexion' })
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', marginTop: '6px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '14px', outline: 'none', background: 'white',
    color: '#1a1a2e', fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box'
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block'
  }

  const CheckBox = ({ field, label, icon }) => (
    <div
      onClick={() => update(field, !form[field])}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
        background: form[field] ? '#E1F5EE' : '#F8FAFC',
        border: `1.5px solid ${form[field] ? '#9FE1CB' : '#DDE3EC'}`,
        transition: 'all 0.15s'
      }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '5px',
        background: form[field] ? '#1D9E75' : 'white',
        border: `2px solid ${form[field] ? '#1D9E75' : '#DDE3EC'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        {form[field] && <Icon name="check" size={12} color="white" strokeWidth={3} />}
      </div>
      <Icon name={icon} size={15} color={form[field] ? '#085041' : '#94A3B8'} />
      <span style={{ fontSize: '13px', fontWeight: form[field] ? '600' : '400', color: form[field] ? '#085041' : '#374151' }}>
        {label}
      </span>
    </div>
  )

  const renderSection = () => {
    switch (section) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input style={inputStyle} value={form.nom} onChange={e => update('nom', e.target.value)} placeholder="Ex: Kavira" />
            </div>
            <div>
              <label style={labelStyle}>Prénom *</label>
              <input style={inputStyle} value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Ex: Marie" />
            </div>
            <div>
              <label style={labelStyle}>Âge</label>
              <input style={inputStyle} type="number" value={form.age} onChange={e => update('age', e.target.value)} placeholder="Ex: 34" />
            </div>
            <div>
              <label style={labelStyle}>Sexe</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.sexe} onChange={e => update('sexe', e.target.value)}>
                <option value="F">Féminin</option>
                <option value="M">Masculin</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} value={form.telephone} onChange={e => update('telephone', e.target.value)} placeholder="+243..." />
            </div>
            <div>
              <label style={labelStyle}>N° CNI / Document</label>
              <input style={inputStyle} value={form.numero_cni} onChange={e => update('numero_cni', e.target.value)} placeholder="Ex: CD-123456" />
            </div>
          </div>

          {/* Photo CNI */}
          <div>
            <label style={labelStyle}>Photo CNI / Document d'identité</label>
            <div style={{ marginTop: '6px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', background: '#E6F4FB', color: '#1A4B7A',
                borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                fontWeight: '600', border: '1.5px solid #B5D4F4',
                fontFamily: "'Poppins', sans-serif"
              }}>
                <Icon name="report" size={15} color="#1A4B7A" />
                Scanner / Photographier
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCNI} style={{ display: 'none' }} />
              </label>
              {photoCNI && (
                <div style={{ position: 'relative' }}>
                  <img src={photoCNI} alt="CNI" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #9FE1CB' }} />
                  <button onClick={() => { setPhotoCNI(null); update('photo_cni', '') }} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#A32D2D', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="close" size={10} color="white" />
                  </button>
                </div>
              )}
            </div>
            {photoCNI && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '6px 10px', background: '#E1F5EE', borderRadius: '6px', width: 'fit-content' }}>
                <Icon name="check" size={12} color="#085041" />
                <span style={{ fontSize: '12px', color: '#085041', fontWeight: '600' }}>Document capturé</span>
              </div>
            )}
          </div>
        </div>
      )

      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Nom du référent familial</label>
              <input style={inputStyle} value={form.nom_referent} onChange={e => update('nom_referent', e.target.value)} placeholder="Ex: Jean Mutombo (père)" />
            </div>
            <div>
              <label style={labelStyle}>Téléphone du référent</label>
              <input style={inputStyle} value={form.telephone_referent} onChange={e => update('telephone_referent', e.target.value)} placeholder="+243..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nombre de personnes à charge</label>
              <input style={inputStyle} type="number" value={form.nb_dependants} onChange={e => update('nb_dependants', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div style={{ padding: '12px 14px', background: '#E6F4FB', borderRadius: '8px', border: '1px solid #B5D4F4' }}>
            <p style={{ fontSize: '12px', color: '#185FA5', fontWeight: '600', margin: '0 0 4px' }}>Pourquoi collecter le référent ?</p>
            <p style={{ fontSize: '12px', color: '#185FA5', margin: 0 }}>Le référent familial permet de retrouver les familles séparées et d'éviter les doublons lors des distributions d'aide.</p>
          </div>
        </div>
      )

      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Zone d'origine</label>
              <input style={inputStyle} value={form.zone_origine} onChange={e => update('zone_origine', e.target.value)} placeholder="Ex: Masisi" />
            </div>
            <div>
              <label style={labelStyle}>Site de déplacement actuel</label>
              <input style={inputStyle} value={form.site_deplacement} onChange={e => update('site_deplacement', e.target.value)} placeholder="Ex: Camp Bulengo" />
            </div>
          </div>

          {/* GPS */}
          <div>
            <label style={labelStyle}>Localisation GPS</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
              <button onClick={getGPS} disabled={gpsLoading} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', background: form.latitude ? '#E1F5EE' : '#1A4B7A',
                color: form.latitude ? '#085041' : 'white',
                border: `1px solid ${form.latitude ? '#9FE1CB' : '#1A4B7A'}`,
                borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                fontWeight: '600', fontFamily: "'Poppins', sans-serif"
              }}>
                <Icon name="location" size={15} color={form.latitude ? '#085041' : 'white'} />
                {gpsLoading ? 'Localisation...' : form.latitude ? 'GPS capturé' : 'Capturer GPS'}
              </button>
              {form.latitude && form.longitude && (
                <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
                  {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                </span>
              )}
            </div>
          </div>
        </div>
      )

      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Groupe vulnérable</label>
            <select style={{ ...inputStyle, cursor: 'pointer', marginTop: '6px' }} value={form.groupe_vulnerable} onChange={e => update('groupe_vulnerable', e.target.value)}>
              {GROUPES_VULNERABLES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes complémentaires</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Informations supplémentaires sur la situation..." />
          </div>
          <div style={{ padding: '12px 14px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #FCD34D' }}>
            <p style={{ fontSize: '12px', color: '#92400E', fontWeight: '600', margin: '0 0 4px' }}>Données sensibles</p>
            <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>Ces informations sont confidentielles et protégées conformément aux standards UNHCR de protection des données.</p>
          </div>
        </div>
      )

      case 4: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 8px' }}>
            Sélectionnez les besoins prioritaires identifiés pour ce bénéficiaire :
          </p>
          <CheckBox field="besoin_eau" label="Eau & Assainissement" icon="sync" />
          <CheckBox field="besoin_alimentation" label="Alimentation" icon="report" />
          <CheckBox field="besoin_abri" label="Abri d'urgence" icon="zone" />
          <CheckBox field="besoin_sante" label="Soins de santé" icon="health" />
          <CheckBox field="besoin_education" label="Éducation" icon="agent" />

          {/* Résumé besoins */}
          {(form.besoin_eau || form.besoin_alimentation || form.besoin_abri || form.besoin_sante || form.besoin_education) && (
            <div style={{ marginTop: '8px', padding: '12px 14px', background: '#FCEBEB', borderRadius: '8px', border: '1px solid #F7C1C1' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#A32D2D', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="alert" size={13} color="#A32D2D" />
                {[form.besoin_eau, form.besoin_alimentation, form.besoin_abri, form.besoin_sante, form.besoin_education].filter(Boolean).length} besoin(s) prioritaire(s) identifié(s)
              </p>
              <p style={{ fontSize: '11px', color: '#A32D2D', margin: 0 }}>Ces données alimenteront les notifications IA et les rapports de coordination.</p>
            </div>
          )}
        </div>
      )

      default: return null
    }
  }

  const isLastSection = section === SECTIONS.length - 1
  const isFirstSection = section === 0

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>FORMULAIRE TERRAIN</p>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('collecte_title')}</h1>
        <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{t('collecte_subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div>
          {/* Stepper */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden' }}>
            {SECTIONS.map((s, i) => (
              <button key={i} onClick={() => setSection(i)} style={{
                flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
                background: section === i ? '#1A4B7A' : i < section ? '#E1F5EE' : 'white',
                color: section === i ? 'white' : i < section ? '#085041' : '#94A3B8',
                fontSize: '11px', fontWeight: section === i ? '700' : '500',
                fontFamily: "'Poppins', sans-serif",
                borderRight: i < SECTIONS.length - 1 ? '1px solid #DDE3EC' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                transition: 'all 0.15s'
              }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: section === i ? 'rgba(255,255,255,0.2)' : i < section ? '#1D9E75' : '#DDE3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: i < section ? 'white' : section === i ? 'white' : '#94A3B8' }}>
                  {i < section ? <Icon name="check" size={10} color="white" /> : i + 1}
                </span>
                {s}
              </button>
            ))}
          </div>

          {/* Formulaire section */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '1.75rem', border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #DDE3EC' }}>
              <div style={{ width: '4px', height: '20px', background: '#1A4B7A', borderRadius: '2px' }} />
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>
                {section + 1}. {SECTIONS[section]}
              </h2>
            </div>
            {renderSection()}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', gap: '10px' }}>
            <button onClick={() => setSection(s => s - 1)} disabled={isFirstSection} style={{
              padding: '11px 20px', background: isFirstSection ? '#F1F5F9' : 'white',
              color: isFirstSection ? '#CBD5E1' : '#374151',
              border: '1px solid #DDE3EC', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600', cursor: isFirstSection ? 'not-allowed' : 'pointer',
              fontFamily: "'Poppins', sans-serif",
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              ← Précédent
            </button>

            {isLastSection ? (
              <button onClick={handleSubmit} disabled={loading} style={{
                flex: 1, padding: '11px', background: loading ? '#64748B' : '#1D9E75',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Poppins', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <Icon name={loading ? 'spinner' : 'check'} size={16} color="white" />
                {loading ? 'Enregistrement...' : 'Enregistrer le bénéficiaire'}
              </button>
            ) : (
              <button onClick={() => setSection(s => s + 1)} style={{
                flex: 1, padding: '11px', background: '#1A4B7A',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
                Suivant →
              </button>
            )}
          </div>

          {status && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginTop: '1rem',
              background: status.type === 'success' ? '#E1F5EE' : status.type === 'offline' ? '#FEF3C7' : '#FCEBEB',
              color: status.type === 'success' ? '#085041' : status.type === 'offline' ? '#92400E' : '#A32D2D',
              fontSize: '13px', fontWeight: '500',
              border: `1px solid ${status.type === 'success' ? '#9FE1CB' : status.type === 'offline' ? '#FCD34D' : '#F7C1C1'}`,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Icon name={status.type === 'success' ? 'check' : 'alert'} size={14} color={status.type === 'success' ? '#085041' : status.type === 'offline' ? '#92400E' : '#A32D2D'} />
              {status.msg}
            </div>
          )}
        </div>

        {/* Panneau droit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Résumé bénéficiaire */}
          <div style={{ background: '#0D2E4E', borderRadius: '10px', padding: '1.5rem', color: 'white' }}>
            <p style={{ color: '#7FB3D3', fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Aperçu</p>
            {form.prenom || form.nom ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                    {form.prenom?.[0]}{form.nom?.[0]}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>{form.prenom} {form.nom}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#7FB3D3' }}>{form.age ? `${form.age} ans` : '—'} · {form.sexe === 'F' ? 'Femme' : 'Homme'}</p>
                  </div>
                </div>
                {[
                  { label: 'Téléphone', value: form.telephone || '—' },
                  { label: 'CNI', value: form.numero_cni || '—' },
                  { label: 'Zone', value: form.zone_origine || '—' },
                  { label: 'Site', value: form.site_deplacement || '—' },
                  { label: 'Référent', value: form.nom_referent || '—' },
                  { label: 'Groupe', value: form.groupe_vulnerable !== 'Aucun' ? form.groupe_vulnerable : '—' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '11px', color: '#7FB3D3' }}>{row.label}</span>
                    <span style={{ fontSize: '11px', color: 'white', fontWeight: '500', maxWidth: '130px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                  </div>
                ))}
                {(form.besoin_eau || form.besoin_alimentation || form.besoin_abri || form.besoin_sante || form.besoin_education) && (
                  <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(220,38,38,0.15)', borderRadius: '6px', border: '1px solid rgba(220,38,38,0.3)' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#FCA5A5', fontWeight: '600' }}>
                      {[form.besoin_eau, form.besoin_alimentation, form.besoin_abri, form.besoin_sante, form.besoin_education].filter(Boolean).length} besoin(s) identifié(s)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#5A8AA8', fontSize: '13px' }}>Remplissez le formulaire pour voir l'aperçu...</p>
            )}
          </div>

          {/* Statut connexion */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Statut</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: navigator.onLine ? '#E1F5EE' : '#FEF3C7' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: navigator.onLine ? '#1D9E75' : '#F59E0B', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: navigator.onLine ? '#085041' : '#92400E' }}>
                  {navigator.onLine ? 'Connecté' : 'Hors ligne'}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: navigator.onLine ? '#1D9E75' : '#92400E' }}>
                  {navigator.onLine ? 'Données envoyées en temps réel' : 'Sauvegarde locale activée'}
                </p>
              </div>
            </div>
          </div>

          {/* Progrès formulaire */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Progression</p>
            <div style={{ background: '#F1F5F9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${((section + 1) / SECTIONS.length) * 100}%`, height: '100%', background: '#1A4B7A', borderRadius: '4px', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
              Section {section + 1} sur {SECTIONS.length} — {SECTIONS[section]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}