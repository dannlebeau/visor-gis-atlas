import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, 'data.json')
const adapter = new JSONFile(file)

const db = new Low(adapter, { users: [], layers_meta: [] })
await db.read()
db.data ||= { users: [], layers_meta: [] }

export default db
