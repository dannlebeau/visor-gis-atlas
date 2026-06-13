import db from './database.js'
import bcrypt from 'bcryptjs'

export async function initDb() {
  const hasSuperadmin = db.data.users.some(u => u.role === 'superadmin')
  if (!hasSuperadmin) {
    db.data.users.push({
      id: 1,
      email: 'superadmin@visor-gis.com',
      password_hash: bcrypt.hashSync('Admin1234!', 10),
      name: 'Super Admin',
      role: 'superadmin',
      active: true,
      categories: ['educacion', 'seguridad', 'salud', 'riesgos', 'clima'],
      created_at: new Date().toISOString()
    })
    await db.write()
    console.log('✓ Superadmin creado: superadmin@visor-gis.com / Admin1234!')
  }
}
