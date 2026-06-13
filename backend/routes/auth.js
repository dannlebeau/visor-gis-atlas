import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/database.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })

  const user = db.data.users.find(u => u.email === email.toLowerCase().trim())
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Credenciales incorrectas' })

  if (!user.active) return res.status(403).json({ error: 'Usuario deshabilitado' })

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, categories: user.categories },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, categories: user.categories } })
})

router.post('/change-password', async (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' })
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    const { currentPassword, newPassword } = req.body
    const user = db.data.users.find(u => u.id === decoded.id)
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash))
      return res.status(401).json({ error: 'Contraseña actual incorrecta' })
    if (newPassword.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' })
    user.password_hash = bcrypt.hashSync(newPassword, 10)
    await db.write()
    res.json({ ok: true })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
})

export default router
