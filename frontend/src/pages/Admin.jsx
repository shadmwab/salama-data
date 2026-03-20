import { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'


export default function Admin({ token, user }) {
  const [tab, setTab] = useState('demandes')
  const [demandes, setDemandes] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [msg, setMsg] = useState(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [userForm, setUserForm] = useState({ nom: '', prenom: '', email: '', password: '', role: 'agent' })
  const [savingUser, setSavingUser] = useState(false)
  const [personnel, setPersonnel] = useState([])

  const headers = { Authorization: `Bearer ${token}` }

   


  const fetchData = async () => {
    setLoading(true)
    try {
        const personnelRes = await axios.get(`${API}/personnel`, { headers })
setPersonnel(personnelRes.data)
      const [demandesRes, usersRes] = await Promise.all([
        axios.get(`${API}/org-requests`, { headers }),
        axios.get(`${API}/users`, { headers })
      
      ])
      setDemandes(demandesRes.data)
      setUsers(usersRes.data)
    } catch {}
    setLoading(false)
  }
  
  useEffect(() => { fetchData() }, [token])
  
  const approuver = async (id, nom) => {
    setProcessing(id)
    try {
      await axios.post(`${API}/org-requests/${id}/approve`, {}, { headers })
      setMsg({ type: 'success', text: `Organisation ${nom} approuvée ! Email envoyé avec les identifiants.` })
      fetchData()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de l\'approbation' })
    }
    setProcessing(null)
  }

  const rejeter = async (id, nom) => {
    if (!window.confirm(`Rejeter la demande de ${nom} ?`)) return
    setProcessing(id)
    try {
      await axios.post(`${API}/org-requests/${id}/reject`, {}, { headers })
      setMsg({ type: 'success', text: `Demande de ${nom} rejetée.` })
      fetchData()
    } catch {}
    setProcessing(null)
  }

  const toggleUser = async (id, actif) => {
    try {
      await axios.put(`${API}/users/${id}`, { is_active: !actif }, { headers })
      fetchData()
    } catch {}
  }

  const deleteUser = async (id, nom) => {
    if (!window.confirm(`Supprimer ${nom} ?`)) return
    try {
      await axios.delete(`${API}/users/${id}`, { headers })
      fetchData()
    } catch {}
  }

  const createUser = async () => {
    if (!userForm.nom || !userForm.prenom || !userForm.email || !userForm.password) {
      setMsg({ type: 'error', text: 'Tous les champs sont obligatoires' })
      return
    }
    setSavingUser(true)
    try {
      await axios.post(`${API}/users`, userForm, { headers })
      setMsg({ type: 'success', text: `Compte créé pour ${userForm.prenom} ${userForm.nom} — email envoyé !` })
      setUserForm({ nom: '', prenom: '', email: '', password: '', role: 'agent' })
      setShowCreateUser(false)
      fetchData()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur' })
    }
    setSavingUser(false)
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', marginTop: '5px',
    border: '1.5px solid #DDE3EC', borderRadius: '8px',
    fontSize: '13px', outline: 'none', background: 'white',
    fontFamily: "'Poppins', sans-serif", color: '#1a1a2e', boxSizing: 'border-box'
  }
  const labelStyle = {
    fontSize: '11px', fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block'
  }

  const pendingCount = demandes.filter(d => d.status === 'pending').length


  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Header */}
<div style={{ marginBottom: '1.5rem' }}>
  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
    {user?.role === 'admin' ? 'ADMINISTRATION' : 'GESTION ÉQUIPE'}
  </p>
  <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>
    {user?.role === 'admin' ? 'Panel Administrateur' : 'Mon équipe'}
  </h1>
  <p style={{ color: 'var(--gray)', marginTop: '4px', fontSize: '14px' }}>
    {user?.role === 'admin' ? 'Gestion des organisations et des utilisateurs' : 'Gérez vos agents et coordinateurs'}
  </p>
</div>

      {/* Stats */}
<div style={{ display: 'grid', gridTemplateColumns: user?.role === 'admin' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
  {user?.role === 'admin' ? (
    <>
      {[
        { value: pendingCount, label: 'Demandes en attente', color: '#92400E', bg: '#FEF3C7', icon: 'alert' },
        { value: demandes.filter(d => d.status === 'approved').length, label: 'Organisations approuvées', color: '#085041', bg: '#E1F5EE', icon: 'check' },
        { value: users.length, label: 'Utilisateurs actifs', color: '#1A4B7A', bg: '#E6F4FB', icon: 'people' },
        { value: users.filter(u => u.role === 'agent').length, label: 'Agents terrain', color: '#A32D2D', bg: '#FCEBEB', icon: 'collect' },
      ].map((kpi, i) => (
        <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={kpi.icon} size={18} color={kpi.color} />
          </div>
          <div>
            <p style={{ fontSize: '26px', fontWeight: '700', color: kpi.color, margin: 0, lineHeight: 1 }}>{kpi.value}</p>
            <p style={{ fontSize: '11px', color: '#64748B', margin: 0, marginTop: '3px' }}>{kpi.label}</p>
          </div>
        </div>
      ))}
    </>
  ) : (
    <>
      {[
        { value: users.filter(u => u.role === 'agent').length, label: 'Agents terrain', color: '#085041', bg: '#E1F5EE', icon: 'collect' },
        { value: users.filter(u => u.role === 'manager').length, label: 'Coordinateurs', color: '#1A4B7A', bg: '#E6F4FB', icon: 'people' },
      ].map((kpi, i) => (
        <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid #DDE3EC', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={kpi.icon} size={18} color={kpi.color} />
          </div>
          <div>
            <p style={{ fontSize: '26px', fontWeight: '700', color: kpi.color, margin: 0, lineHeight: 1 }}>{kpi.value}</p>
            <p style={{ fontSize: '11px', color: '#64748B', margin: 0, marginTop: '3px' }}>{kpi.label}</p>
          </div>
        </div>
      ))}
    </>
  )}
</div>

      {/* Message */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '1rem', background: msg.type === 'success' ? '#E1F5EE' : '#FCEBEB', color: msg.type === 'success' ? '#085041' : '#A32D2D', fontSize: '13px', fontWeight: '500', border: `1px solid ${msg.type === 'success' ? '#9FE1CB' : '#F7C1C1'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name={msg.type === 'success' ? 'check' : 'alert'} size={14} color={msg.type === 'success' ? '#085041' : '#A32D2D'} />
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="close" size={14} color={msg.type === 'success' ? '#085041' : '#A32D2D'} />
          </button>
        </div>
      )}

      {/* Tabs */}
<div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', background: '#F8FAFC', borderRadius: '10px', padding: '4px', border: '1px solid #DDE3EC' }}>
  {(user?.role === 'admin'
    ? [
        { id: 'demandes', label: 'Demandes organisations', icon: 'report', count: pendingCount },
        { id: 'users', label: 'Gestion utilisateurs', icon: 'people', count: null },
      ]
    : [
        { id: 'users', label: 'Mes agents', icon: 'people', count: null },
      ]
  ).map(tab_item => (
          <button key={tab_item.id} onClick={() => setTab(tab_item.id)} style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: tab === tab_item.id ? 'white' : 'transparent', color: tab === tab_item.id ? '#0D2E4E' : '#64748B', fontSize: '13px', fontWeight: tab === tab_item.id ? '700' : '500', fontFamily: "'Poppins', sans-serif", boxShadow: tab === tab_item.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}>
            <Icon name={tab_item.icon} size={15} color={tab === tab_item.id ? '#0D2E4E' : '#64748B'} />
            {tab_item.label}
            {tab_item.count > 0 && (
              <span style={{ background: '#A32D2D', color: 'white', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>{tab_item.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Demandes */}
      {tab === 'demandes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><Icon name="spinner" size={24} color="#94A3B8" /></div>
          ) : demandes.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '10px', padding: '3rem', textAlign: 'center', border: '1px solid #DDE3EC' }}>
              <Icon name="report" size={32} color="#DDE3EC" />
              <p style={{ color: '#94A3B8', marginTop: '1rem', fontSize: '14px' }}>Aucune demande reçue pour le moment.</p>
            </div>
          ) : demandes.map(d => (
            <div key={d.id} style={{ background: 'white', borderRadius: '10px', border: `1px solid ${d.status === 'pending' ? '#FCD34D' : d.status === 'approved' ? '#9FE1CB' : '#F7C1C1'}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="people" size={18} color="#1A4B7A" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0D2E4E' }}>{d.org_name}</p>
                      <span style={{ fontSize: '11px', background: '#E6F4FB', color: '#185FA5', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>{d.type_org}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    {[
                      { icon: 'people', label: 'Contact', value: d.contact_name },
                      { icon: 'mail', label: 'Email', value: d.email },
                      { icon: 'phone', label: 'Téléphone', value: d.phone || '—' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <Icon name={item.icon} size={12} color="#94A3B8" />
                        <div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>{item.label}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#374151', fontWeight: '500' }}>{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {d.message && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #DDE3EC' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>"{d.message}"</p>
                    </div>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94A3B8' }}>
                    Reçu le {new Date(d.date_demande).toLocaleDateString('fr-FR')} à {new Date(d.date_demande).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  {d.status === 'pending' ? (
                    <>
                      <button onClick={() => approuver(d.id, d.org_name)} disabled={processing === d.id} style={{ padding: '9px 20px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <Icon name={processing === d.id ? 'spinner' : 'check'} size={14} color="white" />
                        {processing === d.id ? 'Traitement...' : 'Approuver'}
                      </button>
                      <button onClick={() => rejeter(d.id, d.org_name)} disabled={processing === d.id} style={{ padding: '9px 20px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="close" size={14} color="#A32D2D" />
                        Rejeter
                      </button>
                    </>
                  ) : (
                    <span style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', background: d.status === 'approved' ? '#E1F5EE' : '#FCEBEB', color: d.status === 'approved' ? '#085041' : '#A32D2D', border: `1px solid ${d.status === 'approved' ? '#9FE1CB' : '#F7C1C1'}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name={d.status === 'approved' ? 'check' : 'close'} size={13} color={d.status === 'approved' ? '#085041' : '#A32D2D'} />
                      {d.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Utilisateurs */}
{tab === 'users' && (
  <div>
    {/* Bouton créer */}
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
      <button onClick={() => setShowCreateUser(!showCreateUser)} style={{ padding: '10px 20px', background: showCreateUser ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon name={showCreateUser ? 'close' : 'add'} size={16} color="white" />
        {showCreateUser ? 'Annuler' : user?.role === 'admin' ? 'Créer un compte' : 'Ajouter un agent'}
      </button>
    </div>

    {/* Formulaire création */}
    {showCreateUser && (
      <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', border: '1px solid #DDE3EC', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #DDE3EC' }}>
          <div style={{ width: '4px', height: '20px', background: '#1A4B7A', borderRadius: '2px' }} />
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0D2E4E', margin: 0 }}>Nouveau compte utilisateur</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input style={inputStyle} value={userForm.nom} onChange={e => setUserForm({ ...userForm, nom: e.target.value })} placeholder="Ex: Mutombo" />
          </div>
          <div>
            <label style={labelStyle}>Prénom *</label>
            <input style={inputStyle} value={userForm.prenom} onChange={e => setUserForm({ ...userForm, prenom: e.target.value })} placeholder="Ex: Jean" />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="jean@organisation.org" />
          </div>
          <div>
            <label style={labelStyle}>Mot de passe *</label>
            <input style={inputStyle} type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} placeholder="Minimum 8 caractères" />
          </div>
          <div>
            <label style={labelStyle}>Rôle</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
              <option value="agent">Agent terrain</option>
              <option value="manager">Manager / Coordinateur</option>
              {user?.role === 'admin' && <option value="admin">Administrateur</option>}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
            <div style={{ padding: '10px 12px', background: '#E6F4FB', borderRadius: '8px', border: '1px solid #B5D4F4', fontSize: '12px', color: '#185FA5', width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="mail" size={12} color="#185FA5" />
              Email avec identifiants envoyé automatiquement.
            </div>
          </div>
        </div>
        <button onClick={createUser} disabled={savingUser} style={{ marginTop: '1rem', padding: '11px 24px', background: savingUser ? '#64748B' : '#1A4B7A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: savingUser ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name={savingUser ? 'spinner' : 'send'} size={15} color="white" />
          {savingUser ? 'Création en cours...' : 'Créer le compte et envoyer l\'email'}
        </button>
      </div>
    )}

    {/* Sections équipe pour manager */}
    {user?.role === 'manager' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Section Agents terrain */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '12px 16px', background: '#E1F5EE', borderBottom: '1px solid #9FE1CB', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '4px', height: '18px', background: '#1D9E75', borderRadius: '2px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#085041', margin: 0 }}>Agents terrain</h3>
            <span style={{ background: '#1D9E75', color: 'white', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
              {users.filter(u => u.role === 'agent').length}
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Agent', 'Email', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role === 'agent').length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Aucun agent terrain.</td></tr>
              ) : users.filter(u => u.role === 'agent').map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9', opacity: u.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#085041', flexShrink: 0 }}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0D2E4E' }}>{u.prenom} {u.nom}</p>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748B' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: u.is_active ? '#E1F5EE' : '#F8FAFC', color: u.is_active ? '#085041' : '#94A3B8', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: `1px solid ${u.is_active ? '#9FE1CB' : '#DDE3EC'}` }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.is_active ? '#1D9E75' : '#CBD5E1' }} />
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#94A3B8' }}>
                    {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => toggleUser(u.id, u.is_active)} style={{ padding: '5px 10px', background: u.is_active ? '#FEF3C7' : '#E1F5EE', color: u.is_active ? '#92400E' : '#085041', border: `1px solid ${u.is_active ? '#FCD34D' : '#9FE1CB'}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteUser(u.id, `${u.prenom} ${u.nom}`)} style={{ padding: '5px 8px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Icon name="trash" size={13} color="#A32D2D" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Coordinateurs */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '12px 16px', background: '#E6F4FB', borderBottom: '1px solid #B5D4F4', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '4px', height: '18px', background: '#1A4B7A', borderRadius: '2px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A4B7A', margin: 0 }}>Coordinateurs</h3>
            <span style={{ background: '#1A4B7A', color: 'white', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
              {users.filter(u => u.role === 'manager').length}
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Coordinateur', 'Email', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role === 'manager').length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Aucun coordinateur.</td></tr>
              ) : users.filter(u => u.role === 'manager').map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9', opacity: u.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E6F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#1A4B7A', flexShrink: 0 }}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0D2E4E' }}>{u.prenom} {u.nom}</p>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748B' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: u.is_active ? '#E6F4FB' : '#F8FAFC', color: u.is_active ? '#185FA5' : '#94A3B8', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: `1px solid ${u.is_active ? '#B5D4F4' : '#DDE3EC'}` }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.is_active ? '#3B82F6' : '#CBD5E1' }} />
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#94A3B8' }}>
                    {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => toggleUser(u.id, u.is_active)} style={{ padding: '5px 10px', background: u.is_active ? '#FEF3C7' : '#E6F4FB', color: u.is_active ? '#92400E' : '#185FA5', border: `1px solid ${u.is_active ? '#FCD34D' : '#B5D4F4'}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteUser(u.id, `${u.prenom} ${u.nom}`)} style={{ padding: '5px 8px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Icon name="trash" size={13} color="#A32D2D" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Personnel de santé */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '12px 16px', background: '#FAEEDA', borderBottom: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '4px', height: '18px', background: '#BA7517', borderRadius: '2px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#92400E', margin: 0 }}>Personnel de santé</h3>
            <span style={{ background: '#BA7517', color: 'white', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
              {personnel.length}
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Nom', 'Spécialité', 'Zone', 'Statut', 'Disponibilité'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personnel.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Aucun personnel de santé enregistré.</td></tr>
              ) : personnel.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#92400E', flexShrink: 0 }}>
                        {p.prenom?.[0]}{p.nom?.[0]}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0D2E4E' }}>{p.prenom} {p.nom}</p>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: '#E6F4FB', color: '#185FA5', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500' }}>{p.specialite}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#374151' }}>{p.zone || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: p.statut === 'actif' ? '#E1F5EE' : '#FAEEDA', color: p.statut === 'actif' ? '#085041' : '#BA7517', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.statut === 'actif' ? '#1D9E75' : '#F59E0B' }} />
                      {p.statut === 'actif' ? 'Actif' : 'Retraité'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: p.disponibilite ? '#E1F5EE' : '#FCEBEB', color: p.disponibilite ? '#085041' : '#A32D2D', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: `1px solid ${p.disponibilite ? '#9FE1CB' : '#F7C1C1'}` }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.disponibilite ? '#1D9E75' : '#DC2626' }} />
                      {p.disponibilite ? 'Disponible' : 'Indisponible'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    ) : (
      /* Vue admin — table complète */
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #DDE3EC', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #DDE3EC' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}><Icon name="spinner" size={20} color="#94A3B8" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>Aucun utilisateur.</td></tr>
            ) : users.map((u, i) => {
              const roleColors = {
                admin:   { bg: '#FCEBEB', color: '#A32D2D' },
                manager: { bg: '#E6F4FB', color: '#185FA5' },
                agent:   { bg: '#E1F5EE', color: '#085041' },
              }
              const rc = roleColors[u.role] || roleColors.agent
              return (
                <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F1F5F9', opacity: u.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: rc.color, flexShrink: 0 }}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0D2E4E' }}>{u.prenom} {u.nom}</p>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748B' }}>{u.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: rc.bg, color: rc.color, padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Manager' : 'Agent'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: u.is_active ? '#E1F5EE' : '#F8FAFC', color: u.is_active ? '#085041' : '#94A3B8', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: `1px solid ${u.is_active ? '#9FE1CB' : '#DDE3EC'}` }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.is_active ? '#1D9E75' : '#CBD5E1' }} />
                      {u.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#94A3B8' }}>
                    {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => toggleUser(u.id, u.is_active)} style={{ padding: '5px 10px', background: u.is_active ? '#FEF3C7' : '#E1F5EE', color: u.is_active ? '#92400E' : '#085041', border: `1px solid ${u.is_active ? '#FCD34D' : '#9FE1CB'}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteUser(u.id, `${u.prenom} ${u.nom}`)} style={{ padding: '5px 8px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Icon name="trash" size={13} color="#A32D2D" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}
    </div>
  )
}