/**
 * LiveKit Transport Stub
 * 
 * TODO: Implement LiveKitTransport adhering to the TransportInterface in types.js.
 * 
 * Required Methods to Implement:
 * - createSession({ name }) -> Promise<{ code, name, status, createdAt }>
 * - endSession() -> Promise<void>
 * - connect({ role: 'host' | 'attendee', code: string, name?: string }) -> Promise<void>
 * - disconnect() -> Promise<void>
 * - raiseHand() -> Promise<void>
 * - lowerHand() -> Promise<void>
 * - grant(attendeeId: string) -> Promise<void>
 * - revoke(attendeeId?: string) -> Promise<void>
 * - muteSpeaker(muted: boolean) -> Promise<void>
 * - sendLevel(level: number) -> Promise<void>
 * - on(event: string, handler: Function) -> () => void
 * 
 * Required Events to Emit:
 * - 'queue'        -> QueuedAttendee[]
 * - 'floor'        -> ActiveSpeaker | null
 * - 'level'        -> number (0..1)
 * - 'session'      -> SessionInfo
 * - 'connection'   -> 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
 * - 'error'        -> { code: ErrorCode, message: string }
 * - 'attendees'    -> { count: number }
 * - 'self'         -> 'listening' | 'hand_raised' | 'on_air'
 */

export class LiveKitTransport {
  constructor() {
    throw new Error('LiveKitTransport is not implemented in Phase 1. Use VITE_TRANSPORT=mock.');
  }
}
