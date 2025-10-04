import { NextRequest } from 'next/server'
import { eventBus } from '@/lib/event-bus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  let onStats: ((evt: any) => void) | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (event: any) => {
        const data = JSON.stringify(event)
        controller.enqueue(encoder.encode(`event: stats\n`))
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      // Initial ping
      controller.enqueue(encoder.encode(`event: ping\n`))
      controller.enqueue(encoder.encode(`data: \"ok\"\n\n`))

      // Periodic heartbeat to keep the connection alive
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\n`))
          controller.enqueue(encoder.encode(`data: \"ok\"\n\n`))
        } catch {}
      }, 15000)

      onStats = (evt: any) => send(evt)
      eventBus.on('stats', onStats)
    },
    cancel() {
      if (onStats) eventBus.off('stats', onStats)
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
