import { EventEmitter } from 'events'

// Ensure a single, durable EventEmitter across hot reloads and serverless invocations
// by stashing it on globalThis. This is critical for SSE to receive emits
// from API routes in the same process/lambda.
class EventBus extends EventEmitter {}

declare global {
  // eslint-disable-next-line no-var
  var __eventBus: EventBus | undefined
}

export const eventBus: EventBus = globalThis.__eventBus ?? (globalThis.__eventBus = new EventBus())
eventBus.setMaxListeners(0)

// Helpful typed emitters
export type StatsEvent =
  | { type: 'click'; payload: any }
  | { type: 'lead'; payload: any }
  | { type: 'ftd'; payload: any }
  | { type: 'campaignDelta'; payload: any }
  | { type: 'influencerDelta'; payload: any }
  | { type: 'resetCampaign'; payload: { id: string } }
  | { type: 'resetInfluencer'; payload: { id: string } }

export function emitStats(event: StatsEvent) {
  eventBus.emit('stats', event)
}
