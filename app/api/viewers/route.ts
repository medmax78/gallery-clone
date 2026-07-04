import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Parse DATABASE_URL manually to handle special characters in passwords
function getDbConfig() {
  const url = new URL(process.env.DATABASE_URL!)
  return {
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace('/', ''),
  }
}

async function getConnection() {
  return mysql.createConnection(getDbConfig())
}

// POST — called when a client connects or disconnects
// body: { action: 'join' | 'leave' }
export async function POST(req: NextRequest) {
  const { action } = await req.json()
  const conn = await getConnection()

  try {
    await conn.execute(`
      INSERT INTO viewer_sessions (id, count) VALUES (1, 0)
      ON DUPLICATE KEY UPDATE count = count + 0
    `)

    if (action === 'join') {
      await conn.execute(`UPDATE viewer_sessions SET count = count + 1 WHERE id = 1`)
    } else if (action === 'leave') {
      await conn.execute(`UPDATE viewer_sessions SET count = GREATEST(count - 1, 0) WHERE id = 1`)
    }

    const [rows] = await conn.execute(`SELECT count FROM viewer_sessions WHERE id = 1`)
    const count = (rows as { count: number }[])[0]?.count ?? 0
    return NextResponse.json({ count })
  } finally {
    await conn.end()
  }
}

// GET — called every 10s to poll current count
export async function GET() {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute(`SELECT count FROM viewer_sessions WHERE id = 1`)
    const count = (rows as { count: number }[])[0]?.count ?? 0
    return NextResponse.json({ count })
  } finally {
    await conn.end()
  }
}
