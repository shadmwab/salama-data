import { useState } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'

const API = 'http://127.0.0.1:8000'

export default function Agent({ token }) {
  const { t } = useLang()
  const [messages, setMessages] = useState([
    { role: 'agent', text: t('agent_welcome') }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const suggestions = [
    t('agent_q1'), t('agent_q2'), t('agent_q3'), t('agent_q4')
  ]

  const send = async (question) => {
    const q = question || input
    if (!q.trim()) return
    setMessages(m => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const r = await axios.post(`${API}/agent`, { question: q }, {
  headers: { Authorization: `Bearer ${token}` }
})
      setMessages(m => [...m, { role: 'agent', text: r.data.reponse }])
    } catch {
      setMessages(m => [...m, { role: 'agent', text: t('agent_error') }])
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>AI</p>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E' }}>{t('agent_title')}</h1>
        <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{t('agent_subtitle')}</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {suggestions.map(s => (
          <button key={s} onClick={() => send(s)} style={{
            padding: '8px 14px', background: 'white',
            border: '1px solid var(--border)', borderRadius: '20px',
            fontSize: '13px', cursor: 'pointer', color: 'var(--gray)',
            fontFamily: "'Poppins', sans-serif"
          }}>{s}</button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '1.5rem', minHeight: '400px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '12px 16px',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.role === 'user' ? 'var(--green)' : '#F8FAFC',
                color: m.role === 'user' ? 'white' : 'var(--dark)',
                fontSize: '14px', lineHeight: '1.6',
                border: m.role === 'agent' ? '1px solid var(--border)' : 'none'
              }}>
                {m.role === 'agent' && <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--blue)', marginBottom: '6px' }}>SALAMA AGENT</p>}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: '14px 14px 14px 4px', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--gray)' }}>
                {t('agent_loading')}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={t('agent_placeholder')}
            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '14px', outline: 'none', fontFamily: "'Poppins', sans-serif" }} />
          <button onClick={() => send()} style={{
            padding: '10px 20px', background: 'var(--blue)', color: 'white',
            border: 'none', borderRadius: '20px', fontSize: '14px',
            fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif"
          }}>{t('agent_send')}</button>
        </div>
      </div>
    </div>
  )
}