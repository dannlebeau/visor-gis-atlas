import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db/init.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import layersRoutes from './routes/layers.js'

await initDb()

const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/layers', layersRoutes)

app.get('/api/health', (_, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`✓ Backend corriendo en http://localhost:${PORT}`))
