import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import axios from 'axios'

const CATEGORY_LABELS = {
  educacion: 'Educación', seguridad: 'Seguridad', salud: 'Salud',
  riesgos: 'Riesgos', clima: 'Clima',
}

export default function Map({ visibleLayers, onFeatureClick }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const loadedLayers = useRef({})

  useEffect(() => {
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
          }
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }]
      },
      center: [-70.65, -33.45],
      zoom: 10
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')

    return () => map.current?.remove()
  }, [])

  useEffect(() => {
    if (!map.current) return
    const m = map.current

    function applyLayers() {
      Object.entries(visibleLayers).forEach(([key, layerInfo]) => {
        if (layerInfo && !loadedLayers.current[key]) {
          loadLayer(key, layerInfo)
        }
      })

      Object.keys(loadedLayers.current).forEach(key => {
        const visible = !!visibleLayers[key]
        const visibility = visible ? 'visible' : 'none'
        const ids = loadedLayers.current[key] || []
        ids.forEach(id => {
          if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', visibility)
        })
      })
    }

    if (m.isStyleLoaded()) {
      applyLayers()
    } else {
      m.once('load', applyLayers)
    }
  }, [visibleLayers])

  async function loadLayer(key, layerInfo) {
    if (loadedLayers.current[key] !== undefined) return
    loadedLayers.current[key] = []

    const [category, filename] = key.split('/')
    try {
      const { data: geojson } = await axios.get(`/api/layers/${category}/${filename}`)
      const m = map.current
      if (!m || !m.isStyleLoaded()) return

      const sourceId = `src-${key}`
      if (!m.getSource(sourceId)) {
        m.addSource(sourceId, { type: 'geojson', data: geojson })
      }

      const color = layerInfo?.color || '#4f8ef7'
      const layerIds = []
      const geomType = detectGeomType(geojson)

      if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
        const fillId = `fill-${key}`
        const lineId = `line-${key}`
        m.addLayer({ id: fillId, type: 'fill', source: sourceId, paint: { 'fill-color': color, 'fill-opacity': 0.3 } })
        m.addLayer({ id: lineId, type: 'line', source: sourceId, paint: { 'line-color': color, 'line-width': 1.5 } })
        layerIds.push(fillId, lineId)
        addClickHandler(m, fillId, key, category)
      } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
        const lineId = `line-${key}`
        m.addLayer({ id: lineId, type: 'line', source: sourceId, paint: { 'line-color': color, 'line-width': 2 } })
        layerIds.push(lineId)
        addClickHandler(m, lineId, key, category)
      } else {
        const circleId = `circle-${key}`
        m.addLayer({
          id: circleId, type: 'circle', source: sourceId,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 8],
            'circle-color': color,
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.9
          }
        })
        layerIds.push(circleId)
        addClickHandler(m, circleId, key, category)
        addHoverCursor(m, circleId)
      }

      loadedLayers.current[key] = layerIds
    } catch (e) {
      console.error(`Error cargando capa ${key}:`, e.message)
    }
  }

  function addClickHandler(m, layerId, key, category) {
    m.on('click', layerId, e => {
      if (!e.features?.length) return
      onFeatureClick(e.features[0], CATEGORY_LABELS[category] || category)
    })
  }

  function addHoverCursor(m, layerId) {
    m.on('mouseenter', layerId, () => { m.getCanvas().style.cursor = 'pointer' })
    m.on('mouseleave', layerId, () => { m.getCanvas().style.cursor = '' })
  }

  function detectGeomType(geojson) {
    const f = geojson.features?.[0]
    return f?.geometry?.type || 'Point'
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}
