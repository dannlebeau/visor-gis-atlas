import { useState } from 'react'
import '../styles/sidebar.css'

const CATEGORY_ICONS = {
  educacion: '🎓',
  seguridad: '🚔',
  salud: '🏥',
  riesgos: '⚠️',
  clima: '🌤️',
  default: '📍'
}

const CATEGORY_LABELS = {
  educacion: 'Educación',
  seguridad: 'Seguridad',
  salud: 'Salud',
  riesgos: 'Riesgos',
  clima: 'Clima',
}

export default function Sidebar({ categories, visibleLayers, onToggleLayer, isOpen }) {
  const [expanded, setExpanded] = useState({})

  function toggleCategory(cat) {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <span>Capas</span>
      </div>
      <div className="sidebar-content">
        {categories.length === 0 && (
          <p className="sidebar-empty">No hay capas disponibles</p>
        )}
        {categories.map(({ category, layers }) => {
          const isExpanded = expanded[category] !== false
          const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default
          const label = CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1)
          const activeCount = layers.filter(l => visibleLayers[`${category}/${l.filename}`]).length

          return (
            <div key={category} className="category-group">
              <button
                className={`category-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleCategory(category)}
              >
                <span className="cat-icon">{icon}</span>
                <span className="cat-label">{label}</span>
                {activeCount > 0 && <span className="cat-badge">{activeCount}</span>}
                <svg
                  className={`cat-chevron ${isExpanded ? 'up' : ''}`}
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {isExpanded && (
                <div className="layer-list">
                  {layers.map(layer => {
                    const key = `${category}/${layer.filename}`
                    const isVisible = !!visibleLayers[key]
                    return (
                      <label key={layer.filename} className="layer-item">
                        <div className="layer-toggle">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => onToggleLayer(key, layer)}
                          />
                          <span className="toggle-slider" />
                        </div>
                        <span
                          className="layer-dot"
                          style={{ background: layer.color }}
                        />
                        <span className="layer-name">{layer.display_name}</span>
                      </label>
                    )
                  })}
                  {layers.length === 0 && (
                    <p className="layer-empty">Sin capas en esta categoría</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="sidebar-footer">
        <span>Visor GIS Territorial</span>
      </div>
    </aside>
  )
}
