import { useAuth } from '../context/AuthContext.jsx'
import '../styles/stats.css'

const SKIP_PROPS = ['id', 'ID', 'FID', 'OBJECTID', 'geometry']

const PROP_LABELS = {
  nombre: 'Nombre',
  name: 'Nombre',
  matriculados: 'Matriculados',
  tipo: 'Tipo',
  type: 'Tipo',
  comuna: 'Comuna',
  direccion: 'Dirección',
  address: 'Dirección',
  efectivos: 'Efectivos',
  camas: 'Camas',
  telefono: 'Teléfono',
  email: 'Email',
  descripcion: 'Descripción',
  description: 'Descripción',
  area: 'Área',
  poblacion: 'Población',
  año: 'Año',
  year: 'Año',
  region: 'Región',
  provincia: 'Provincia',
  estado: 'Estado',
  categoria: 'Categoría',
  nivel: 'Nivel',
}

function formatValue(key, value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString('es-CL')
    return value.toLocaleString('es-CL', { maximumFractionDigits: 4 })
  }
  return String(value)
}

export default function StatsPanel({ feature, category, onClose }) {
  const { user } = useAuth()

  if (!feature) return null

  const props = feature.properties || {}
  const visibleProps = Object.entries(props).filter(([k]) => !SKIP_PROPS.includes(k))
  const title = props.nombre || props.name || props.NOMBRE || props.NAME || 'Elemento seleccionado'

  return (
    <aside className="stats-panel">
      <div className="stats-header">
        <div>
          <p className="stats-category">{category}</p>
          <h2 className="stats-title">{title}</h2>
        </div>
        <button className="stats-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="stats-body">
        {visibleProps.length === 0 ? (
          <p className="stats-empty">Sin atributos disponibles</p>
        ) : (
          <dl className="stats-list">
            {visibleProps.map(([key, value]) => (
              <div key={key} className="stat-row">
                <dt>{PROP_LABELS[key] || key}</dt>
                <dd>{formatValue(key, value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="stats-footer">
        <span className="watermark">{user?.email}</span>
      </div>
    </aside>
  )
}
