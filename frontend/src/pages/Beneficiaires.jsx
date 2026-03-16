import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

export default function Beneficiaires() {
  const [list, setList] = useState([])

  useEffect(() => {
    axios.get(`${API}/beneficiaires`).then(r => setList(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600' }}>Bénéficiaires</h1>
          <p style={{ color: 'var(--gray)', marginTop: '4px' }}>{list.length} enregistrés</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['ID', 'Nom complet', 'Âge', 'Sexe', 'Zone origine', 'Site déplacement', 'Dépendants'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((b, i) => (
              <tr key={b.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--gray)' }}>#{b.id}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{b.prenom} {b.nom}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{b.age ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{b.sexe ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>{b.zone_origine ?? '—'}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{b.site_deplacement ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{b.nb_dependants}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>Aucun bénéficiaire enregistré pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}