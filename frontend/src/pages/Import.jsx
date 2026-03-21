import { useState, useRef } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Import({ token }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const headers = { Authorization: `Bearer ${token}` }

  const handleFile = async (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Format non supporté. Utilisez CSV ou XLSX.')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
    setPreview(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('file', f)
    try {
      const r = await axios.post(`${API}/import/preview`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      setPreview(r.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la lecture du fichier')
    }
    setLoading(false)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const r = await axios.post(`${API}/import/execute`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      setResult(r.data)
      setPreview(null)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'import')
    }
    setImporting(false)
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>DONNÉES</p>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Import CSV / XLSForm</h1>
        <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>Importez vos données terrain depuis Excel, CSV ou XLSForm ODK</p>
      </div>

      {/* Formats supportés */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: 'report', label: 'CSV', sub: 'Fichier texte séparé par virgules', color: '#085041', bg: '#E1F5EE', border: '#9FE1CB' },
          { icon: 'report', label: 'XLSX / XLS', sub: 'Microsoft Excel ou XLSForm ODK', color: '#185FA5', bg: '#E6F4FB', border: '#B5D4F4' },
          { icon: 'check', label: 'Mapping auto', sub: 'Détection intelligente des colonnes', color: '#BA7517', bg: '#FAEEDA', border: '#FCD34D' },
        ].map((f, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: `1px solid ${f.border}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={f.icon} size={18} color={f.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0D2E4E' }}>{f.label}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>{f.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Zone upload */}
      {!preview && !result && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current.click()}
          style={{
            background: dragOver ? '#E6F4FB' : 'white', borderRadius: '12px',
            border: `2px dashed ${dragOver ? '#1A4B7A' : '#DDE3EC'}`,
            padding: '3rem', textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s', marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            {loading ? <Icon name="spinner" size={26} color="#1A4B7A" /> : <Icon name="download" size={26} color="#1A4B7A" />}
          </div>
          {loading ? (
            <p style={{ color: '#1A4B7A', fontWeight: '600', fontSize: '15px', margin: 0 }}>Analyse du fichier en cours...</p>
          ) : (
            <>
              <p style={{ color: '#0D2E4E', fontWeight: '700', fontSize: '16px', margin: '0 0 6px' }}>
                Glissez votre fichier ici ou cliquez pour sélectionner
              </p>
              <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 1rem' }}>
                Formats acceptés : CSV, XLSX, XLS (max 10 MB)
              </p>
              <span style={{ background: '#1A4B7A', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                Sélectionner un fichier
              </span>
            </>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '1rem', background: '#FCEBEB', color: '#A32D2D', fontSize: '13px', fontWeight: '500', border: '1px solid #F7C1C1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="alert" size={14} color="#A32D2D" />
          {error}
          <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>Réessayer</button>
        </div>
      )}

      {/* Aperçu */}
      {preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Infos fichier */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="report" size={18} color="#085041" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0D2E4E' }}>{preview.filename}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{preview.total_rows} lignes · {preview.columns.length} colonnes</p>
              </div>
            </div>
            <button onClick={reset} style={{ padding: '6px 12px', background: '#F8FAFC', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="close" size={12} color="#64748B" />
              Changer
            </button>
          </div>

          {/* Mapping détecté */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingBottom: '10px', borderBottom: '1px solid #DDE3EC' }}>
              <div style={{ width: '4px', height: '18px', background: '#1D9E75', borderRadius: '2px' }} />
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>
                Mapping automatique — {Object.keys(preview.detected_mapping).length} colonne(s) détectée(s)
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {Object.entries(preview.detected_mapping).map(([col, field], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#E1F5EE', borderRadius: '6px', border: '1px solid #9FE1CB' }}>
                  <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500', flex: 1 }}>{col}</span>
                  <Icon name="agent" size={12} color="#1D9E75" />
                  <span style={{ fontSize: '12px', color: '#085041', fontWeight: '700' }}>{field}</span>
                </div>
              ))}
            </div>
            {preview.unmapped_columns.length > 0 && (
              <div style={{ padding: '10px 12px', background: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#92400E', fontWeight: '600' }}>
                  Colonnes non mappées (seront ignorées) : {preview.unmapped_columns.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Aperçu données */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #DDE3EC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '18px', background: '#1A4B7A', borderRadius: '2px' }} />
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Aperçu — 5 premières lignes</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {preview.columns.map(col => (
                      <th key={col} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC', whiteSpace: 'nowrap' }}>
                        {col}
                        {preview.detected_mapping[col] && (
                          <span style={{ display: 'block', fontSize: '9px', color: '#1D9E75', fontWeight: '600', textTransform: 'none', letterSpacing: 0 }}>
                            → {preview.detected_mapping[col]}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                      {preview.columns.map(col => (
                        <td key={col} style={{ padding: '7px 12px', color: '#374151', whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {String(row[col] || '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Boutons action */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={reset} style={{ padding: '11px 20px', background: 'white', color: '#64748B', border: '1px solid #DDE3EC', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="close" size={14} color="#64748B" />
              Annuler
            </button>
            <button onClick={handleImport} disabled={importing} style={{ flex: 1, padding: '11px', background: importing ? '#64748B' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: importing ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={importing ? 'spinner' : 'download'} size={16} color="white" />
              {importing ? `Import en cours...` : `Importer ${preview.total_rows} bénéficiaires`}
            </button>
          </div>
        </div>
      )}

      {/* Résultat import */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: result.imported > 0 ? '#E1F5EE' : '#FCEBEB', borderRadius: '10px', padding: '1.5rem', border: `1px solid ${result.imported > 0 ? '#9FE1CB' : '#F7C1C1'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: result.imported > 0 ? '#1D9E75' : '#A32D2D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={result.imported > 0 ? 'check' : 'alert'} size={24} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: result.imported > 0 ? '#085041' : '#A32D2D', margin: 0 }}>
                  {result.imported > 0 ? 'Import réussi !' : 'Import échoué'}
                </h2>
                <p style={{ fontSize: '13px', color: result.imported > 0 ? '#1D9E75' : '#A32D2D', margin: 0 }}>{result.message}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { label: 'Importés', value: result.imported, color: '#085041', bg: 'rgba(29,158,117,0.1)' },
                { label: 'Ignorés', value: result.skipped, color: '#92400E', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Erreurs', value: result.errors?.length || 0, color: '#A32D2D', bg: 'rgba(220,38,38,0.1)' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: '12px', color: s.color, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #F7C1C1' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#A32D2D', margin: '0 0 8px' }}>Détail des erreurs :</p>
              {result.errors.map((e, i) => (
                <p key={i} style={{ fontSize: '12px', color: '#64748B', margin: '2px 0', fontFamily: 'monospace' }}>{e}</p>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={reset} style={{ flex: 1, padding: '11px', background: '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name="download" size={14} color="white" />
              Importer un autre fichier
            </button>
          </div>
        </div>
      )}

      {/* Guide format */}
      {!preview && !result && !loading && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid #DDE3EC', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingBottom: '10px', borderBottom: '1px solid #DDE3EC' }}>
            <div style={{ width: '4px', height: '18px', background: '#1A4B7A', borderRadius: '2px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Format recommandé</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
            Le système détecte automatiquement les colonnes suivantes :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { col: 'nom / name', field: 'Nom de famille', required: true },
              { col: 'prenom / first_name', field: 'Prénom', required: true },
              { col: 'age / âge', field: 'Âge', required: false },
              { col: 'sexe / gender', field: 'Sexe (M/F)', required: false },
              { col: 'telephone / phone', field: 'Téléphone', required: false },
              { col: 'cni / id', field: 'N° CNI', required: false },
              { col: 'zone / village', field: 'Zone d\'origine', required: false },
              { col: 'site / camp', field: 'Site déplacement', required: false },
              { col: 'besoin_eau / water', field: 'Besoin eau (1/0)', required: false },
              { col: 'besoin_alimentation / food', field: 'Besoin alim. (1/0)', required: false },
              { col: 'besoin_abri / shelter', field: 'Besoin abri (1/0)', required: false },
              { col: 'besoin_sante / health', field: 'Besoin santé (1/0)', required: false },
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', border: `1px solid ${item.required ? '#B5D4F4' : '#DDE3EC'}` }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: item.required ? '#185FA5' : '#64748B', fontFamily: 'monospace' }}>{item.col}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{item.field} {item.required && <span style={{ color: '#A32D2D' }}>*</span>}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}