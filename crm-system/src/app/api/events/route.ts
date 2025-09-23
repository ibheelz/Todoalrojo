import { NextRequest } from 'next/server'
import { eventBus } from '@/lib/event-bus'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (event: any) => {
        const data = JSON.stringify(event)
        controller.enqueue(encoder.encode(`event: stats\n`))
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      // Send an initial heartbeat
      controller.enqueue(encoder.encode(`event: ping\n`))
      controller.enqueue(encoder.encode(`data: "ok"\n\n`))

      const onStats = (evt: any) => send(evt)
      eventBus.on('stats', onStats)

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\n`))
        controller.enqueue(encoder.encode(`data: "hb"\n\n`))
      }, 25000)

      // Cleanup
      const close = () => {
        clearInterval(heartbeat)
        eventBus.off('stats', onStats)
        controller.close()
      }

      // @ts-ignore - not all runtimes expose it
      // Close when client disconnects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(globalThis as any).addEventListener?.('close', close)
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

