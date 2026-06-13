import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import db from '../db/database.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth)

const LAYERS_PATH = path.resolve(process.env.LAYERS_PATH || '../data/layers')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(LAYERS_PATH, req.params.category)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, file.originalname)
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.geojson')) return cb(new Error('Solo archivos .geojson'))
    cb(null, true)
  },
  limits: { fileSize: 50 * 1024 * 1024 }
})

function canAccess(user, category) {
  if (user.role === 'superadmin') return true
  return Array.isArray(user.categories) && user.categories.includes(category)
}

function getLayerMeta(category, filename) {
  return db.data.layers_meta.find(m => m.category === category && m.filename === filename)
}

router.get('/categories', (req, res) => {
  if (!fs.existsSync(LAYERS_PATH)) return res.json([])

  const dirs = fs.readdirSync(LAYERS_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(cat => canAccess(req.user, cat))

  const result = dirs.map(cat => {
    const catPath = path.join(LAYERS_PATH, cat)
    const files = fs.existsSync(catPath)
      ? fs.readdirSync(catPath).filter(f => f.endsWith('.geojson'))
      : []

    const layers = files.map(filename => {
      const meta = getLayerMeta(cat, filename)
      return {
        filename,
        display_name: meta?.display_name || filename.replace('.geojson', '').replace(/_/g, ' '),
        color: meta?.color || '#4f8ef7',
        visible: meta?.visible_default ?? true,
        description: meta?.description || ''
      }
    })
    return { category: cat, layers }
  })

  res.json(result)
})

router.get('/:category/:filename', (req, res) => {
  const { category, filename } = req.params
  if (!canAccess(req.user, category)) return res.status(403).json({ error: 'Sin acceso' })
  if (!filename.endsWith('.geojson')) return res.status(400).json({ error: 'Formato inválido' })

  const filePath = path.join(LAYERS_PATH, category, filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Capa no encontrada' })

  res.setHeader('Content-Type', 'application/json')
  fs.createReadStream(filePath).pipe(res)
})

router.post('/:category/upload', requireRole('superadmin', 'admin'), upload.single('file'), async (req, res) => {
  const { category } = req.params
  if (!canAccess(req.user, category)) return res.status(403).json({ error: 'Sin acceso' })

  const { display_name, color, visible_default, description } = req.body
  const filename = req.file.filename

  const existing = db.data.layers_meta.findIndex(m => m.category === category && m.filename === filename)
  const meta = { category, filename, display_name: display_name || filename.replace('.geojson', ''), color: color || '#4f8ef7', visible_default: visible_default !== '0', description: description || '' }

  if (existing >= 0) db.data.layers_meta[existing] = meta
  else db.data.layers_meta.push(meta)

  await db.write()
  res.json({ ok: true, filename })
})

router.patch('/:category/:filename', requireRole('superadmin', 'admin'), async (req, res) => {
  const { category, filename } = req.params
  if (!canAccess(req.user, category)) return res.status(403).json({ error: 'Sin acceso' })

  const idx = db.data.layers_meta.findIndex(m => m.category === category && m.filename === filename)
  const { display_name, color, visible_default, description } = req.body

  if (idx >= 0) {
    if (display_name !== undefined) db.data.layers_meta[idx].display_name = display_name
    if (color !== undefined) db.data.layers_meta[idx].color = color
    if (visible_default !== undefined) db.data.layers_meta[idx].visible_default = visible_default
    if (description !== undefined) db.data.layers_meta[idx].description = description
  } else {
    db.data.layers_meta.push({ category, filename, display_name: display_name || filename, color: color || '#4f8ef7', visible_default: visible_default ?? true, description: description || '' })
  }
  await db.write()
  res.json({ ok: true })
})

router.delete('/:category/:filename', requireRole('superadmin', 'admin'), async (req, res) => {
  const { category, filename } = req.params
  if (!canAccess(req.user, category)) return res.status(403).json({ error: 'Sin acceso' })

  const filePath = path.join(LAYERS_PATH, category, filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  db.data.layers_meta = db.data.layers_meta.filter(m => !(m.category === category && m.filename === filename))
  await db.write()
  res.json({ ok: true })
})

export default router
