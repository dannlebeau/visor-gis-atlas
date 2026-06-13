import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Map from '../components/Map.jsx'
import StatsPanel from '../components/StatsPanel.jsx'
import '../styles/viewer.css'

export default function Viewer() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [categories, setCategories] = useState([])
  const [visibleLayers, setVisibleLayers] = useState({})
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    axios.get('/api/layers/categories').then(({ data }) => {
      setCategories(data)
      const initial = {}
      data.forEach(({ category, layers }) => {
        layers.forEach(layer => {
          if (layer.visible) initial[`${category}/${layer.filename}`] = layer
        })
      })
      setVisibleLayers(initial)
    }).catch(console.error)
  }, [])

  function handleToggleLayer(key, layer) {
    setVisibleLayers(prev => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = layer
      return next
    })
  }

  function handleFeatureClick(feature, category) {
    setSelectedFeature(feature)
    setSelectedCategory(category)
  }

  return (
    <div className="viewer-layout">
      <Navbar onToggleSidebar={() => setSidebarOpen(v => !v)} />
      <div className="viewer-body">
        <Sidebar
          categories={categories}
          visibleLayers={visibleLayers}
          onToggleLayer={handleToggleLayer}
          isOpen={sidebarOpen}
        />
        <main className="map-wrapper">
          <Map
            visibleLayers={visibleLayers}
            onFeatureClick={handleFeatureClick}
          />
        </main>
        {selectedFeature && (
          <StatsPanel
            feature={selectedFeature}
            category={selectedCategory}
            onClose={() => setSelectedFeature(null)}
          />
        )}
      </div>
    </div>
  )
}
