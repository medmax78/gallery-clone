// In-process set of SSE response controllers.
// Each open browser connection adds one controller here.
const controllers = new Set<ReadableStreamDefaultController>()

function broadcast(count: number) {
  const msg = `data: ${count}\n\n`
  const encoded = new TextEncoder().encode(msg)
  for (const ctrl of controllers) {
    try {
      ctrl.enqueue(encoded)
    } catch {
      // Controller already closed — remove it
      controllers.delete(ctrl)
    }
  }
}

export async function GET() {
  let ctrl: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(controller) {
      ctrl = controller
      controllers.add(ctrl)
      broadcast(controllers.size)
    },
    cancel() {
      controllers.delete(ctrl)
      broadcast(controllers.size)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx buffering
    },
  })
}
