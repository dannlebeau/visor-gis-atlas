import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/admin.css'

const ALL_CATEGORIES = ['educacion', 'seguridad', 'salud', 'riesgos', 'clima']
const CAT_LABELS = { educacion: 'Educación', seguridad: 'Seguridad', salud: 'Salud', riesgos: 'Riesgos', clima: 'Clima' }
const ROLE_LABELS = { viewer: 'Visor', admin: 'Administrador', superadmin: 'Super Admin' }

const EMPTY_FORM = { name: '', email: '', password: '', role: 'viewer', categories: [], active: true }

export default function SuperAdmin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    try {
      const { data } = await axios.get('/api/users')
      setUsers(data)
    } catch { }
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditUser(null)
    setShowForm(true)
    setMsg(null)
  }

  function openEdit(u) {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, categories: u.categories, active: u.active })
    setEditUser(u)
    setShowForm(true)
    setMsg(null)
  }

  function toggleCategory(cat) {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      if (editUser) {
        const body = { name: form.name, role: form.role, active: form.active, categories: form.categories }
        if (form.password) body.password = form.password
        await axios.patch(`/api/users/${editUser.id}`, body)
        setMsg({ type: 'ok', text: 'Usuario actualizado' })
      } else {
        await axios.post('/api/users', { ...form })
        setMsg({ type: 'ok', text: 'Usuario creado' })
      }
      fetchUsers()
      setShowForm(false)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(u) {
    try {
      await axios.patch(`/api/users/${u.id}`, { active: !u.active })
      fetchUsers()
    } catch { }
  }

  async function handleDelete(u) {
    if (!confirm(`¿Eliminar el usuario "${u.name}"?`)) return
    try {
      await axios.delete(`/api/users/${u.id}`)
      fetchUsers()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Error' })
    }
  }

  return (
    <div className="admin-layout">
      <div className="admin-topbar">
        <button className="btn-back" onClick={() => navigate('/')}>← Volver al mapa</button>
        <h1>Super Admin — Gestión de Usuarios</h1>
        <span className="admin-user">{user?.name}</span>
      </div>

      <div className="superadmin-body">
        {msg && (
          <div className={`admin-msg ${msg.type}`}>{msg.text}
            <button onClick={() => setMsg(null)}>×</button>
          </div>
        )}

        <div className="superadmin-header">
          <div className="sa-stats">
            <div className="sa-stat"><strong>{users.length}</strong><span>Usuarios totales</span></div>
            <div className="sa-stat"><strong>{users.filter(u => u.active).length}</strong><span>Activos</span></div>
            <div className="sa-stat"><strong>{users.filter(u => u.role === 'admin').length}</strong><span>Admins</span></div>
            <div className="sa-stat"><strong>{users.filter(u => u.role === 'viewer').length}</strong><span>Visores</span></div>
          </div>
          <button className="btn-create" onClick={openCreate}>+ Nuevo usuario</button>
        </div>

        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Categorías</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={!u.active ? 'inactive-row' : ''}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role]}</span></td>
                <td>
                  <div className="cat-tags">
                    {u.role === 'superadmin'
                      ? <span className="cat-tag all">Todas</span>
                      : u.categories.map(c => <span key={c} className="cat-tag">{CAT_LABELS[c] || c}</span>)
                    }
                  </div>
                </td>
                <td>
                  <button
                    className={`toggle-active ${u.active ? 'on' : 'off'}`}
                    onClick={() => handleToggleActive(u)}
                    disabled={u.role === 'superadmin'}
                    title={u.active ? 'Deshabilitar' : 'Habilitar'}
                  >
                    {u.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="actions-cell">
                  <button className="btn-edit" onClick={() => openEdit(u)}>Editar</button>
                  {u.role !== 'superadmin' && (
                    <button className="btn-delete" onClick={() => handleDelete(u)}>Eliminar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showForm && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <div className="modal">
              <div className="modal-header">
                <h2>{editUser ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                <button onClick={() => setShowForm(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="user-form">
                <div className="form-row">
                  <div className="field">
                    <label>Nombre completo</label>
                    <input
                      required value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email" required={!editUser} value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      disabled={!!editUser}
                      placeholder="usuario@dominio.com"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>{editUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
                    <input
                      type="password" required={!editUser} value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  <div className="field">
                    <label>Rol</label>
                    <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                      <option value="viewer">Visor</option>
                      <option value="admin">Administrador (pagado)</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Acceso a categorías</label>
                  <div className="cat-checkboxes">
                    {ALL_CATEGORIES.map(cat => (
                      <label key={cat} className="cat-check">
                        <input
                          type="checkbox"
                          checked={form.categories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                        />
                        {CAT_LABELS[cat]}
                      </label>
                    ))}
                  </div>
                </div>

                {editUser && (
                  <div className="field field-check">
                    <label>
                      <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
                      Usuario activo
                    </label>
                  </div>
                )}

                {msg && <div className={`admin-msg ${msg.type}`}>{msg.text}</div>}

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
                  <button type="submit" className="btn-create" disabled={loading}>
                    {loading ? 'Guardando...' : editUser ? 'Guardar cambios' : 'Crear usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
