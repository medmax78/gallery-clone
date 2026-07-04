import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

// Parse DATABASE_URL manually so special characters in the password
// (!, @, #, etc.) are never passed through decodeURIComponent by mysql2.
// Format: mysql://user:password@host:port/database
function parseDbUrl(url: string) {
  const match = url.match(/^mysql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/)
  if (!match) throw new Error(`Invalid DATABASE_URL format: ${url}`)
  const [, user, password, host, port, database] = match
  return { host, port: Number(port), user, password, database }
}

const config = parseDbUrl(process.env.DATABASE_URL!)

const pool = mysql.createPool({
  host:     config.host,
  port:     config.port,
  user:     config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit:    10,
})

export const db = drizzle(pool, { schema, mode: 'default' })
