import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useLang } from '../LanguageContext'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Agent({ token }) {
  const { lang, t } = useLang()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [contexte, setContexte] = useState(null)
  const messagesEndRef = useRef(null)
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios.get(`${API}/agent/contexte`, { headers })
      .then(r => setContexte(r.data))
      .catch(() => {})
    setMessages([{
      role: 'assistant',
      content: t('agent_welcome')
    }])
  }, [token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (msg) => {
    const question = msg || input.trim()
    if (!question) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const r = await axios.post(`${API}/agent/chat`,
        { message: question, langue: lang },
        { headers }
      )
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t('agent_error') }])
    }
    setLoading(false)
  }

  const questions = contexte ? [
    `Combien de bénéficiaires avons-nous enregistrés ?`,
    `Quels sont les besoins prioritaires les plus urgents ?`,
    `Quel personnel de santé est disponible ?`,
    `Analyse les zones les plus critiques`,
    `Quels groupes vulnérables sont les plus nombreux ?`,
    `Donne-moi un résumé pour les donateurs`,
  ] : [
    t('agent_q1'), t('agent_q2'), t('agent_q3'), t('agent_q4')
  ]

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)' }}>

      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>INTELLIGENCE ARTIFICIELLE</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>{t('agent_title')}</h1>
            <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>{t('agent_subtitle')}</p>
          </div>
          {contexte && (
            <div style={{ background: '#E1F5EE', borderRadius: '8px', padding: '8px 14px', border: '1px solid #9FE1CB', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="check" size={13} color="#085041" />
              <span style={{ fontSize: '12px', color: '#085041', fontWeight: '600' }}>
                {contexte.statistiques.total_beneficiaires} bénéficiaires · {contexte.statistiques.total_zones} zones · {contexte.statistiques.personnel_disponible} agents dispo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats contexte */}
      {contexte && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1rem' }}>
          {[
            { label: 'Bénéficiaires', value: contexte.statistiques.total_beneficiaires, color: '#085041', bg: '#E1F5EE' },
            { label: 'Besoin eau', value: contexte.statistiques.besoins.eau, color: '#185FA5', bg: '#E6F4FB' },
            { label: 'Besoin santé', value: contexte.statistiques.besoins.sante, color: '#A32D2D', bg: '#FCEBEB' },
            { label: 'Vulnérables', value: contexte.statistiques.total_vulnerables, color: '#92400E', bg: '#FEF3C7' },
            { label: 'Personnel dispo', value: contexte.statistiques.personnel_disponible, color: '#085041', bg: '#E1F5EE' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: '8px', padding: '10px 12px', textAlign: 'center', border: `1px solid ${s.color}30` }}>
              <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '10px', color: s.color, margin: 0, opacity: 0.8 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Zone messages */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', padding: '1rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end' }}>
                <Icon name="agent_ai" size={16} color="#1A4B7A" />
              </div>
            )}
            <div style={{
              maxWidth: '75%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              background: msg.role === 'user' ? '#1A4B7A' : '#F8FAFC',
              color: msg.role === 'user' ? 'white' : '#374151',
              fontSize: '13px', lineHeight: 1.6,
              border: msg.role === 'assistant' ? '1px solid #DDE3EC' : 'none',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1A4B7A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '8px', alignSelf: 'flex-end' }}>
                <Icon name="people" size={16} color="white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="spinner" size={16} color="#1A4B7A" />
            </div>
            <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '12px 12px 12px 0', border: '1px solid #DDE3EC' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8', animation: `pulse ${0.6 + i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Questions suggérées */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {questions.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q)} style={{ padding: '5px 12px', background: 'white', color: '#1A4B7A', border: '1px solid #B5D4F4', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          placeholder={t('agent_placeholder')}
          style={{ flex: 1, padding: '12px 16px', border: '1.5px solid #DDE3EC', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: "'Poppins', sans-serif", color: '#1a1a2e' }}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: '12px 20px', background: loading ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
          <Icon name="send" size={16} color="white" />
          {t('agent_send')}
        </button>
      </div>
    </div>
  )
}