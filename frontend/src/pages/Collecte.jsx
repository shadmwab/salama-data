import { useState, useEffect } from 'react'
import axios from 'axios'
import { savePending } from '../offline'
import { useLang } from '../LanguageContext'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const GROUPES_VULNERABLES = [
  'Enfant non accompagné', 'Femme enceinte', 'Femme allaitante',
  'Personne handicapée', 'Personne âgée', 'Survivant(e) de violence',
  'Malade chronique', 'Aucun'
]

const SECTIONS = ['Identité', 'Famille', 'Localisation', 'Vulnérabilité', 'Besoins']

export default function Collecte({ token, user }) {
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState('formulaire')

  // ── FORMULAIRE STATE ──────────────────────────────────────────
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

  // ── IMPORT STATE ──────────────────────────────────────────────
  const [importType, setImportType] = useState('beneficiaires')
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const getGPS = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { update('latitude', pos.coords.latitude); update('longitude', pos.coords.longitude); setGpsLoading(false) },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handlePhotoCNI = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setPhotoCNI(ev.target.result); update('photo_cni', ev.target.result) }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom) { setStatus({ type: 'error', msg: 'Nom et prénom sont obligatoires' }); return }
    setLoading(true)
    const data = { ...form, age: parseInt(form.age) || null, nb_dependants: parseInt(form.nb_dependants) || 0, agent_id: user?.email || 'agent' }
    try {
      await axios.post(`${API}/beneficiaires`, data, { headers })
      setStatus({ type: 'success', msg: `${form.prenom} ${form.nom} enregistré avec succès` })
      setForm({ nom: '', prenom: '', age: '', sexe: 'F', telephone: '', numero_cni: '', photo_cni: '', nom_referent: '', telephone_referent: '', zone_origine: '', site_deplacement: '', nb_dependants: 0, latitude: null, longitude: null, groupe_vulnerable: 'Aucun', besoin_eau: false, besoin_alimentation: false, besoin_abri: false, besoin_sante: false, besoin_education: false, notes: '' })
      setPhotoCNI(null); setSection(0)
    } catch {
      await savePending(data)
      setStatus({ type: 'offline', msg: 'Sauvegardé localement — synchronisation automatique dès reconnexion' })
    }
    setLoading(false)
  }

  // ── IMPORT FUNCTIONS ──────────────────────────────────────────
  const handleImportFile = async (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) { setImportError('Format non supporté. Utilisez CSV ou XLSX.'); return }
    setImportFile(f); setImportError(null); setImportResult(null); setImportPreview(null); setImportLoading(true)
    if (importType === 'beneficiaires') {
      const formData = new FormData()
      formData.append('file', f)
      try {
        const r = await axios.post(`${API}/import/preview`, formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } })
        setImportPreview(r.data)
      } catch (err) { setImportError(err.response?.data?.detail || 'Erreur lecture fichier') }
    } else {
      setImportPreview({ filename: f.name, total_rows: '?', ready: true })
    }
    setImportLoading(false)
  }

  const handleImportExecute = async () => {
    if (!importFile) return
    setImporting(true); setImportError(null)
    const formData = new FormData()
    formData.append('file', importFile)
    const url = importType === 'beneficiaires' ? `${API}/import/execute` : `${API}/import/personnel`
    try {
      const r = await axios.post(url, formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } })
      setImportResult(r.data); setImportPreview(null); setImportFile(null)
    } catch (err) { setImportError(err.response?.data?.detail || 'Erreur import') }
    setImporting(false)
  }

  const handleDeleteImports = async () => {
    const label = importType === 'beneficiaires' ? 'tous les bénéficiaires importés' : 'tout le personnel importé'
    if (!window.confirm(`Supprimer ${label} ?`)) return
    try {
      const url = importType === 'beneficiaires' ? `${API}/import/beneficiaires` : `${API}/import/personnel`
      await axios.delete(url, { headers })
      setImportResult({ success: true, imported: 0, skipped: 0, message: 'Données supprimées avec succès !' })
    } catch {}
  }

  const resetImport = () => { setImportFile(null); setImportPreview(null); setImportResult(null); setImportError(null) }

  const inputStyle = { width: '100%', padding: '10px 14px', marginTop: '6px', border: '1.5px solid #DDE3EC', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', color: '#1a1a2e', fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box' }
  const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }

  const CheckBox = ({ field, label, icon }) => (
    <div onClick={() => update(field, !form[field])} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', background: form[field] ? '#E1F5EE' : '#F8FAFC', border: `1.5px solid ${form[field] ? '#9FE1CB' : '#DDE3EC'}`, transition: 'all 0.15s' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: form[field] ? '#1D9E75' : 'white', border: `2px solid ${form[field] ? '#1D9E75' : '#DDE3EC'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {form[field] && <Icon name="check" size={12} color="white" strokeWidth={3} />}
      </div>
      <Icon name={icon} size={15} color={form[field] ? '#085041' : '#94A3B8'} />
      <span style={{ fontSize: '13px', fontWeight: form[field] ? '600' : '400', color: form[field] ? '#085041' : '#374151' }}>{label}</span>
    </div>
  )

  const renderFormSection = () => {
    switch (section) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={labelStyle}>Nom *</label><input style={inputStyle} value={form.nom} onChange={e => update('nom', e.target.value)} placeholder="Ex: Kavira" /></div>
            <div><label style={labelStyle}>Prénom *</label><input style={inputStyle} value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Ex: Marie" /></div>
            <div><label style={labelStyle}>Âge</label><input style={inputStyle} type="number" value={form.age} onChange={e => update('age', e.target.value)} placeholder="Ex: 34" /></div>
            <div><label style={labelStyle}>Sexe</label><select style={{ ...inputStyle, cursor: 'pointer' }} value={form.sexe} onChange={e => update('sexe', e.target.value)}><option value="F">Féminin</option><option value="M">Masculin</option></select></div>
            <div><label style={labelStyle}>Téléphone</label><input style={inputStyle} value={form.telephone} onChange={e => update('telephone', e.target.value)} placeholder="+243..." /></div>
            <div><label style={labelStyle}>N° CNI / Document</label><input style={inputStyle} value={form.numero_cni} onChange={e => update('numero_cni', e.target.value)} placeholder="Ex: CD-123456" /></div>
          </div>
          <div>
            <label style={labelStyle}>Photo CNI / Document</label>
            <div style={{ marginTop: '6px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#E6F4FB', color: '#1A4B7A', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', border: '1.5px solid #B5D4F4', fontFamily: "'Poppins', sans-serif" }}>
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
            {photoCNI && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '6px 10px', background: '#E1F5EE', borderRadius: '6px', width: 'fit-content' }}><Icon name="check" size={12} color="#085041" /><span style={{ fontSize: '12px', color: '#085041', fontWeight: '600' }}>Document capturé</span></div>}
          </div>
        </div>
      )
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={labelStyle}>Nom du référent familial</label><input style={inputStyle} value={form.nom_referent} onChange={e => update('nom_referent', e.target.value)} placeholder="Ex: Jean Mutombo (père)" /></div>
            <div><label style={labelStyle}>Téléphone du référent</label><input style={inputStyle} value={form.telephone_referent} onChange={e => update('telephone_referent', e.target.value)} placeholder="+243..." /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Nombre de personnes à charge</label><input style={inputStyle} type="number" value={form.nb_dependants} onChange={e => update('nb_dependants', e.target.value)} placeholder="0" /></div>
          </div>
          <div style={{ padding: '12px 14px', background: '#E6F4FB', borderRadius: '8px', border: '1px solid #B5D4F4' }}>
            <p style={{ fontSize: '12px', color: '#185FA5', fontWeight: '600', margin: '0 0 4px' }}>Pourquoi collecter le référent ?</p>
            <p style={{ fontSize: '12px', color: '#185FA5', margin: 0 }}>Le référent familial permet de retrouver les familles séparées et d'éviter les doublons lors des distributions.</p>
          </div>
        </div>
      )
      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={labelStyle}>Zone d'origine</label><input style={inputStyle} value={form.zone_origine} onChange={e => update('zone_origine', e.target.value)} placeholder="Ex: Masisi" /></div>
            <div><label style={labelStyle}>Site de déplacement actuel</label><input style={inputStyle} value={form.site_deplacement} onChange={e => update('site_deplacement', e.target.value)} placeholder="Ex: Camp Bulengo" /></div>
          </div>
          <div>
            <label style={labelStyle}>Localisation GPS</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
              <button onClick={getGPS} disabled={gpsLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: form.latitude ? '#E1F5EE' : '#1A4B7A', color: form.latitude ? '#085041' : 'white', border: `1px solid ${form.latitude ? '#9FE1CB' : '#1A4B7A'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>
                <Icon name="location" size={15} color={form.latitude ? '#085041' : 'white'} />
                {gpsLoading ? 'Localisation...' : form.latitude ? 'GPS capturé' : 'Capturer GPS'}
              </button>
              {form.latitude && form.longitude && <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}</span>}
            </div>
          </div>
        </div>
      )
      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div><label style={labelStyle}>Groupe vulnérable</label><select style={{ ...inputStyle, cursor: 'pointer', marginTop: '6px' }} value={form.groupe_vulnerable} onChange={e => update('groupe_vulnerable', e.target.value)}>{GROUPES_VULNERABLES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          <div><label style={labelStyle}>Notes complémentaires</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Informations supplémentaires..." /></div>
          <div style={{ padding: '12px 14px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #FCD34D' }}>
            <p style={{ fontSize: '12px', color: '#92400E', fontWeight: '600', margin: '0 0 4px' }}>Données sensibles</p>
            <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>Ces informations sont confidentielles et protégées conformément aux standards UNHCR.</p>
          </div>
        </div>
      )
      case 4: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 8px' }}>Sélectionnez les besoins prioritaires identifiés :</p>
          <CheckBox field="besoin_eau" label="Eau & Assainissement" icon="sync" />
          <CheckBox field="besoin_alimentation" label="Alimentation" icon="report" />
          <CheckBox field="besoin_abri" label="Abri d'urgence" icon="zone" />
          <CheckBox field="besoin_sante" label="Soins de santé" icon="health" />
          <CheckBox field="besoin_education" label="Éducation" icon="agent" />
          {(form.besoin_eau || form.besoin_alimentation || form.besoin_abri || form.besoin_sante || form.besoin_education) && (
            <div style={{ marginTop: '8px', padding: '12px 14px', background: '#FCEBEB', borderRadius: '8px', border: '1px solid #F7C1C1' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#A32D2D', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="alert" size={13} color="#A32D2D" />
                {[form.besoin_eau, form.besoin_alimentation, form.besoin_abri, form.besoin_sante, form.besoin_education].filter(Boolean).length} besoin(s) identifié(s)
              </p>
              <p style={{ fontSize: '11px', color: '#A32D2D', margin: 0 }}>Ces données alimenteront les notifications IA et rapports.</p>
            </div>
          )}
        </div>
      )
      default: return null
    }
  }

  const renderImportTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Type d'import */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Type d'import</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'beneficiaires', label: 'Bénéficiaires', icon: 'people', sub: 'CSV / XLSForm ODK' },
            { id: 'personnel', label: 'Personnel de santé', icon: 'health', sub: 'Registre médecins' },
          ].map(t => (
            <button key={t.id} onClick={() => { setImportType(t.id); resetImport() }} style={{ flex: 1, padding: '12px 16px', border: `1.5px solid ${importType === t.id ? '#1A4B7A' : '#DDE3EC'}`, borderRadius: '8px', background: importType === t.id ? '#E6F4FB' : 'white', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: importType === t.id ? '#1A4B7A' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={t.icon} size={17} color={importType === t.id ? 'white' : '#94A3B8'} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: importType === t.id ? '#1A4B7A' : '#374151' }}>{t.label}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{t.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone upload */}
      {!importPreview && !importResult && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleImportFile(e.dataTransfer.files[0]) }}
          onClick={() => document.getElementById('import-file-input').click()}
          style={{ background: dragOver ? '#E6F4FB' : 'white', borderRadius: '12px', border: `2px dashed ${dragOver ? '#1A4B7A' : '#DDE3EC'}`, padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <input id="import-file-input" type="file" accept=".csv,.xlsx,.xls" onChange={e => handleImportFile(e.target.files[0])} style={{ display: 'none' }} />
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            {importLoading ? <Icon name="spinner" size={24} color="#1A4B7A" /> : <Icon name="download" size={24} color="#1A4B7A" />}
          </div>
          {importLoading ? (
            <p style={{ color: '#1A4B7A', fontWeight: '600', fontSize: '14px', margin: 0 }}>Analyse en cours...</p>
          ) : (
            <>
              <p style={{ color: '#0D2E4E', fontWeight: '700', fontSize: '15px', margin: '0 0 6px' }}>Glissez votre fichier ici</p>
              <p style={{ color: '#64748B', fontSize: '12px', margin: '0 0 1rem' }}>CSV, XLSX, XLS — max 10 MB</p>
              <span style={{ background: '#1A4B7A', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>Sélectionner</span>
            </>
          )}
        </div>
      )}

      {/* Erreur */}
      {importError && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#FCEBEB', color: '#A32D2D', fontSize: '13px', fontWeight: '500', border: '1px solid #F7C1C1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="alert" size={14} color="#A32D2D" />
          {importError}
          <button onClick={resetImport} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>Réessayer</button>
        </div>
      )}

      {/* Aperçu bénéficiaires */}
      {importPreview && importType === 'beneficiaires' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="report" size={18} color="#085041" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0D2E4E' }}>{importPreview.filename}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{importPreview.total_rows} lignes · {importPreview.columns?.length} colonnes · {Object.keys(importPreview.detected_mapping || {}).length} mappées</p>
              </div>
            </div>
            <button onClick={resetImport} style={{ padding: '6px 12px', background: '#F8FAFC', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>Changer</button>
          </div>

          {/* Mapping */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '4px', height: '16px', background: '#1D9E75', borderRadius: '2px' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0D2E4E' }}>Colonnes détectées automatiquement</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
              {Object.entries(importPreview.detected_mapping || {}).map(([col, field], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#E1F5EE', borderRadius: '6px', border: '1px solid #9FE1CB' }}>
                  <span style={{ fontSize: '11px', color: '#374151', flex: 1 }}>{col}</span>
                  <Icon name="agent" size={11} color="#1D9E75" />
                  <span style={{ fontSize: '11px', color: '#085041', fontWeight: '700' }}>{field}</span>
                </div>
              ))}
            </div>
            {importPreview.unmapped_columns?.length > 0 && (
              <div style={{ padding: '8px 12px', background: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#92400E', fontWeight: '600' }}>Ignorées : {importPreview.unmapped_columns.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Aperçu table */}
          {importPreview.preview?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #DDE3EC' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0D2E4E' }}>Aperçu — 5 premières lignes</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {importPreview.columns?.map(col => (
                        <th key={col} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #DDE3EC', whiteSpace: 'nowrap' }}>
                          {col}
                          {importPreview.detected_mapping?.[col] && <span style={{ display: 'block', fontSize: '9px', color: '#1D9E75' }}>→ {importPreview.detected_mapping[col]}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.preview.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                        {importPreview.columns?.map(col => (
                          <td key={col} style={{ padding: '6px 10px', color: '#374151', whiteSpace: 'nowrap', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {String(row[col] || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={resetImport} style={{ padding: '11px 20px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Annuler</button>
            <button onClick={handleImportExecute} disabled={importing} style={{ flex: 1, padding: '11px', background: importing ? '#64748B' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: importing ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={importing ? 'spinner' : 'download'} size={15} color="white" />
              {importing ? 'Import en cours...' : `Importer ${importPreview.total_rows} bénéficiaires`}
            </button>
          </div>
        </div>
      )}

      {/* Aperçu personnel */}
      {importPreview && importType === 'personnel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#E6F4FB', borderRadius: '10px', padding: '1.25rem', border: '1px solid #B5D4F4', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon name="health" size={22} color="#1A4B7A" />
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0D2E4E' }}>{importPreview.filename}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Prêt à importer — colonnes détectées automatiquement</p>
            </div>
          </div>
          <div style={{ padding: '12px 14px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #FCD34D' }}>
            <p style={{ fontSize: '12px', color: '#92400E', fontWeight: '600', margin: '0 0 4px' }}>Colonnes reconnues pour le personnel :</p>
            <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>nom, prenom, specialite, telephone, email, zone, numero_ordre, disponibilite, statut</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={resetImport} style={{ padding: '11px 20px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Annuler</button>
            <button onClick={handleImportExecute} disabled={importing} style={{ flex: 1, padding: '11px', background: importing ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: importing ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={importing ? 'spinner' : 'health'} size={15} color="white" />
              {importing ? 'Import en cours...' : 'Importer le personnel'}
            </button>
          </div>
        </div>
      )}

      {/* Résultat */}
      {importResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: importResult.imported > 0 ? '#E1F5EE' : '#FCEBEB', borderRadius: '10px', padding: '1.5rem', border: `1px solid ${importResult.imported > 0 ? '#9FE1CB' : '#F7C1C1'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: importResult.imported > 0 ? '#1D9E75' : '#A32D2D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={importResult.imported > 0 ? 'check' : 'alert'} size={22} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: importResult.imported > 0 ? '#085041' : '#A32D2D', margin: 0 }}>{importResult.imported > 0 ? 'Import réussi !' : 'Import terminé'}</h3>
                <p style={{ fontSize: '13px', color: importResult.imported > 0 ? '#1D9E75' : '#A32D2D', margin: 0 }}>{importResult.message}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: 'Importés', value: importResult.imported, color: '#085041', bg: 'rgba(29,158,117,0.1)' },
                { label: 'Ignorés', value: importResult.skipped, color: '#92400E', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Doublons', value: importResult.doublons || 0, color: '#A32D2D', bg: 'rgba(220,38,38,0.1)' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: s.color, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Partager avec Agent IA */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #B5D4F4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="agent_ai" size={18} color="#1A4B7A" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0D2E4E' }}>Données partagées avec l'Agent IA</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>L'Agent IA peut maintenant répondre à des questions précises sur ces données</p>
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: '#E6F4FB', borderRadius: '6px', border: '1px solid #B5D4F4' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#185FA5' }}>
                Exemple : "Combien de personnes de Masisi ont besoin d'eau ?" · "Liste les médecins disponibles à Goma"
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={resetImport} style={{ flex: 1, padding: '11px', background: '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name="download" size={14} color="white" />
              Nouvel import
            </button>
            {isAdminOrManager && (
              <button onClick={handleDeleteImports} style={{ padding: '11px 20px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="trash" size={14} color="#A32D2D" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guide colonnes */}
      {!importPreview && !importResult && !importLoading && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingBottom: '10px', borderBottom: '1px solid #DDE3EC' }}>
            <div style={{ width: '4px', height: '16px', background: '#1A4B7A', borderRadius: '2px' }} />
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0D2E4E' }}>
              {importType === 'beneficiaires' ? 'Colonnes reconnues — Bénéficiaires' : 'Colonnes reconnues — Personnel de santé'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            {(importType === 'beneficiaires' ? [
              { col: 'nom / name', req: true },
              { col: 'prenom / first_name', req: true },
              { col: 'age / âge', req: false },
              { col: 'sexe / gender', req: false },
              { col: 'telephone / phone', req: false },
              { col: 'cni / id', req: false },
              { col: 'zone / village', req: false },
              { col: 'site / camp', req: false },
              { col: 'besoin_eau / water', req: false },
              { col: 'besoin_alimentation / food', req: false },
              { col: 'besoin_abri / shelter', req: false },
              { col: 'besoin_sante / health', req: false },
            ] : [
              { col: 'nom / name', req: true },
              { col: 'prenom / first_name', req: true },
              { col: 'specialite / specialty', req: false },
              { col: 'numero_ordre / license', req: false },
              { col: 'telephone / phone', req: false },
              { col: 'email / mail', req: false },
              { col: 'zone / region', req: false },
              { col: 'disponibilite / availability', req: false },
              { col: 'statut / status', req: false },
            ]).map((item, i) => (
              <div key={i} style={{ padding: '6px 10px', background: '#F8FAFC', borderRadius: '6px', border: `1px solid ${item.req ? '#B5D4F4' : '#DDE3EC'}` }}>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: item.req ? '#185FA5' : '#64748B', fontFamily: 'monospace' }}>{item.col} {item.req && <span style={{ color: '#A32D2D' }}>*</span>}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>FORMULAIRE TERRAIN</p>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('collecte_title')}</h1>
        <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{t('collecte_subtitle')}</p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', background: '#F8FAFC', borderRadius: '10px', padding: '4px', border: '1px solid #DDE3EC' }}>
        {[
          { id: 'formulaire', label: 'Formulaire terrain', icon: 'collect' },
          { id: 'import', label: 'Import CSV / ODK', icon: 'download' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#0D2E4E' : '#64748B', fontSize: '13px', fontWeight: activeTab === tab.id ? '700' : '500', fontFamily: "'Poppins', sans-serif", boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}>
            <Icon name={tab.icon} size={15} color={activeTab === tab.id ? '#0D2E4E' : '#64748B'} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu onglet Formulaire */}
      {activeTab === 'formulaire' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          <div>
            {/* Stepper */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden' }}>
              {SECTIONS.map((s, i) => (
                <button key={i} onClick={() => setSection(i)} style={{ flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer', background: section === i ? '#1A4B7A' : i < section ? '#E1F5EE' : 'white', color: section === i ? 'white' : i < section ? '#085041' : '#94A3B8', fontSize: '11px', fontWeight: section === i ? '700' : '500', fontFamily: "'Poppins', sans-serif", borderRight: i < SECTIONS.length - 1 ? '1px solid #DDE3EC' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: section === i ? 'rgba(255,255,255,0.2)' : i < section ? '#1D9E75' : '#DDE3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: i < section ? 'white' : section === i ? 'white' : '#94A3B8' }}>
                    {i < section ? <Icon name="check" size={10} color="white" /> : i + 1}
                  </span>
                  {s}
                </button>
              ))}
            </div>

            {/* Section */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '1.75rem', border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: '320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #DDE3EC' }}>
                <div style={{ width: '4px', height: '20px', background: '#1A4B7A', borderRadius: '2px' }} />
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{section + 1}. {SECTIONS[section]}</h2>
              </div>
              {renderFormSection()}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', gap: '10px' }}>
              <button onClick={() => setSection(s => s - 1)} disabled={section === 0} style={{ padding: '11px 20px', background: section === 0 ? '#F1F5F9' : 'white', color: section === 0 ? '#CBD5E1' : '#374151', border: '1px solid #DDE3EC', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: section === 0 ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif" }}>
                Précédent
              </button>
              {section === SECTIONS.length - 1 ? (
                <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '11px', background: loading ? '#64748B' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icon name={loading ? 'spinner' : 'check'} size={16} color="white" />
                  {loading ? 'Enregistrement...' : 'Enregistrer le bénéficiaire'}
                </button>
              ) : (
                <button onClick={() => setSection(s => s + 1)} style={{ flex: 1, padding: '11px', background: '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
                  Suivant →
                </button>
              )}
            </div>

            {status && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', marginTop: '1rem', background: status.type === 'success' ? '#E1F5EE' : status.type === 'offline' ? '#FEF3C7' : '#FCEBEB', color: status.type === 'success' ? '#085041' : status.type === 'offline' ? '#92400E' : '#A32D2D', fontSize: '13px', fontWeight: '500', border: `1px solid ${status.type === 'success' ? '#9FE1CB' : status.type === 'offline' ? '#FCD34D' : '#F7C1C1'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name={status.type === 'success' ? 'check' : 'alert'} size={14} color={status.type === 'success' ? '#085041' : status.type === 'offline' ? '#92400E' : '#A32D2D'} />
                {status.msg}
              </div>
            )}
          </div>

          {/* Panneau droit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '11px', color: '#7FB3D3' }}>{row.label}</span>
                      <span style={{ fontSize: '11px', color: 'white', fontWeight: '500' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#5A8AA8', fontSize: '13px' }}>Remplissez le formulaire pour voir l'aperçu...</p>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Statut</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: navigator.onLine ? '#E1F5EE' : '#FEF3C7' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: navigator.onLine ? '#1D9E75' : '#F59E0B', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: navigator.onLine ? '#085041' : '#92400E' }}>{navigator.onLine ? 'Connecté' : 'Hors ligne'}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: navigator.onLine ? '#1D9E75' : '#92400E' }}>{navigator.onLine ? 'Données envoyées en temps réel' : 'Sauvegarde locale activée'}</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Progression</p>
              <div style={{ background: '#F1F5F9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${((section + 1) / SECTIONS.length) * 100}%`, height: '100%', background: '#1A4B7A', borderRadius: '4px', transition: 'width 0.3s ease' }} />
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>Section {section + 1} sur {SECTIONS.length} — {SECTIONS[section]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenu onglet Import */}
      {activeTab === 'import' && renderImportTab()}
    </div>
  )
}