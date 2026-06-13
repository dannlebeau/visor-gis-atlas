import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/admin.css'

const ALL_CATEGORIES = ['educacion', 'seguridad', 'salud', 'riesgos', 'clima']
const CAT_LABELS = { educacion: 'Educación', seguridad: 'Seguridad', salud: 'Salud', riesgos: 'Riesgos', clima: 'Clima' }
const COLORS = ['#4f8ef7', '#f74f4f', '#4ff77a', '#f7a44f', '#4fddf7', '#a44ff7', '#f7f74f', '#f74fa4']

export default function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({ display_name: '', color: COLORS[0], visible_default: true, description: '' })

  const accessibleCats = user?.role === 'superadmin' ? ALL_CATEGORIES : (user?.categories || [])

  useEffect(() => {
    fetchLayers()
  }, [])

  async function fetchLayers() {
    try {
      const { data } = await axios.get('/api/layers/categories')
      setCategories(data)
      if (!activeCategory && data.length > 0) setActiveCategory(data[0].category)
    } catch { }
  }

  async function handleUpload(e) {
    e.preventDefault()
    const fileInput = e.target.querySelector('input[type="file"]')
    if (!fileInput.files[0]) return setMsg({ type: 'error', text: 'Selecciona un archivo .geojson' })
    setUploading(true)
    setMsg(null)
    const fd = new FormData()
    fd.append('file', fileInput.files[0])
    fd.append('display_name', form.display_name || fileInput.files[0].name.replace('.geojson', ''))
    fd.append('color', form.color)
    fd.append('visible_default', form.visible_default ? '1' : '0')
    fd.append('description', form.description)
    try {
      await axios.post(`/api/layers/${activeCategory}/upload`, fd)
      setMsg({ type: 'ok', text: 'Capa subida correctamente' })
      fileInput.value = ''
      setForm({ display_name: '', color: COLORS[0], visible_default: true, description: '' })
      fetchLayers()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Error al subir' })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(category, filename) {
    if (!confirm(`¿Eliminar la capa "${filename}"?`)) return
    try {
      await axios.delete(`/api/layers/${category}/${filename}`)
      setMsg({ type: 'ok', text: 'Capa eliminada' })
      fetchLayers()
    } catch {
      setMsg({ type: 'error', text: 'Error al eliminar' })
    }
  }

  const activeCategoryData = categories.find(c => c.category === activeCategory)

  return (
    <div className="admin-layout">
      <div className="admin-topbar">
        <button className="btn-back" onClick={() => navigate('/')}>← Volver al mapa</button>
        <h1>Panel de Administración</h1>
        <span className="admin-user">{user?.name}</span>
      </div>

      <div className="admin-body">
        <nav className="admin-nav">
          <p className="nav-label">Categorías</p>
          {accessibleCats.map(cat => (
            <button
              key={cat}
              className={`nav-cat ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CAT_LABELS[cat] || cat}
              <span className="nav-count">
                {categories.find(c => c.category === cat)?.layers.length || 0}
              </span>
            </button>
          ))}
        </nav>

        <div className="admin-content">
          {msg && (
            <div className={`admin-msg ${msg.type}`}>{msg.text}
              <button onClick={() => setMsg(null)}>×</button>
            </div>
          )}

          <section className="admin-section">
            <h2>Subir nueva capa — {CAT_LABELS[activeCategory] || activeCategory}</h2>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-row">
                <div className="field">
                  <label>Archivo GeoJSON</label>
                  <input type="file" accept=".geojson" required />
                </div>
                <div className="field">
                  <label>Nombre para mostrar</label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                    placeholder="Nombre en el visor"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Color de la capa</label>
                  <div className="color-picker">
                    {COLORS.map(c => (
                      <button
                        key={c} type="button"
                        className={`color-dot ${form.color === c ? 'selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setForm(p => ({ ...p, color: c }))}
                      />
                    ))}
                    <input
                      type="color" value={form.color}
                      onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                      title="Color personalizado"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Descripción (opcional)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Breve descripción de la capa"
                  />
                </div>
                <div className="field field-check">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.visible_default}
                      onChange={e => setForm(p => ({ ...p, visible_default: e.target.checked }))}
                    />
                    Visible por defecto
                  </label>
                </div>
              </div>
              <button type="submit" className="btn-upload" disabled={uploading}>
                {uploading ? 'Subiendo...' : 'Subir capa'}
              </button>
            </form>
          </section>

          <section className="admin-section">
            <h2>Capas existentes</h2>
            {!activeCategoryData || activeCategoryData.layers.length === 0 ? (
              <p className="empty-msg">No hay capas en esta categoría</p>
            ) : (
              <table className="layers-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Archivo</th>
                    <th>Color</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCategoryData.layers.map(layer => (
                    <tr key={layer.filename}>
                      <td>{layer.display_name}</td>
                      <td><code>{layer.filename}</code></td>
                      <td><span className="color-preview" style={{ background: layer.color }} /></td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(activeCategory, layer.filename)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
