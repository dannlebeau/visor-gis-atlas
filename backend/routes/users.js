import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db/database.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth)

router.get('/', requireRole('superadmin'), (req, res) => {
  const users = db.data.users.map(({ password_hash, ...u }) => u)
  res.json(users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
})

router.post('/', requireRole('superadmin'), async (req, res) => {
  const { email, password, name, role, categories } = req.body
  if (!email || !password || !name || !role) return res.status(400).json({ error: 'Faltan campos requeridos' })
  if (password.length < 8) return res.status(400).json({ error: 'Contraseña mínimo 8 caracteres' })

  if (db.data.users.find(u => u.email === email.toLowerCase().trim()))
    return res.status(409).json({ error: 'El email ya existe' })

  const maxId = db.data.users.reduce((m, u) => Math.max(m, u.id), 0)
  const newUser = {
    id: maxId + 1,
    email: email.toLowerCase().trim(),
    password_hash: bcrypt.hashSync(password, 10),
    name,
    role,
    active: true,
    categories: categories || [],
    created_at: new Date().toISOString()
  }
  db.data.users.push(newUser)
  await db.write()
  res.json({ id: newUser.id, ok: true })
})

router.patch('/:id', requireRole('superadmin'), async (req, res) => {
  const id = parseInt(req.params.id)
  const user = db.data.users.find(u => u.id === id)
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

  const { name, role, active, categories, password } = req.body
  if (password) {
    if (password.length < 8) return res.status(400).json({ error: 'Contraseña mínimo 8 caracteres' })
    user.password_hash = bcrypt.hashSync(password, 10)
  }
  if (name !== undefined) user.name = name
  if (role !== undefined) user.role = role
  if (active !== undefined) user.active = active
  if (categories !== undefined) user.categories = categories

  await db.write()
  res.json({ ok: true })
})

router.delete('/:id', requireRole('superadmin'), async (req, res) => {
  const id = parseInt(req.params.id)
  const user = db.data.users.find(u => u.id === id)
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
  if (user.role === 'superadmin') return res.status(403).json({ error: 'No puedes eliminar al superadmin' })
  db.data.users = db.data.users.filter(u => u.id !== id)
  await db.write()
  res.json({ ok: true })
})

export default router
