import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

// Each worker keeps its own local set of open controllers.
// The total count is stored in the DB so all workers agree on the real number.
const controllers = new Set<ReadableStreamDefaultController>()

function broadcastLocal(count: number) {
  const msg = new TextEncoder().encode(`data: ${count}\n\n`)
  for (const ctrl of controllers) {
    try { ctrl.enqueue(msg) } catch { controllers.delete(ctrl) }
  }
}

async function increment(): Promise<number> {
  await db.execute(sql`
    INSERT INTO viewer_sessions (id, count)
    VALUES (1, 1)
    ON DUPLICATE KEY UPDATE count = count + 1
  `)
  const rows = await db.execute(sql`SELECT count FROM viewer_sessions WHERE id = 1`)
  const row = (rows as unknown as { count: number }[])[0]
  return row?.count ?? 1
}

async function decrement(): Promise<number> {
  await db.execute(sql`
    UPDATE viewer_sessions SET count = GREATEST(count - 1, 0) WHERE id = 1
  `)
  const rows = await db.execute(sql`SELECT count FROM viewer_sessions WHERE id = 1`)
  const row = (rows as unknown as { count: number }[])[0]
  return row?.count ?? 0
}

export async function GET() {
  let ctrl!: ReadableStreamDefaultController
  let heartbeat: ReturnType<typeof setInterval>

  const stream = new ReadableStream({
    async start(controller) {
      ctrl = controller
      controllers.add(ctrl)

      const count = await increment()
      broadcastLocal(count)

      // Send a heartbeat every 15s to keep the connection alive through Nginx
      heartbeat = setInterval(async () => {
        try {
          const rows = await db.execute(sql`SELECT count FROM viewer_sessions WHERE id = 1`)
          const row = (rows as unknown as { count: number }[])[0]
          const n = row?.count ?? 0
          broadcastLocal(n)
        } catch { /* ignore */ }
      }, 15_000)
    },
    async cancel() {
      clearInterval(heartbeat)
      controllers.delete(ctrl)
      const count = await decrement()
      broadcastLocal(count)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
