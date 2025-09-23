import { EventEmitter } from 'events'

// Simple singleton event bus for server-side modules
class EventBus extends EventEmitter {}

export const eventBus = new EventBus()

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

