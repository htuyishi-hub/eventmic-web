/**
 * @typedef {'admin' | 'principal' | 'attendee' | 'host'} Role
 * @typedef {'connecting' | 'connected' | 'reconnecting' | 'disconnected'} ConnectionState
 * @typedef {'listening' | 'hand_raised' | 'on_air'} AttendeeSelfState
 * @typedef {'live' | 'ended'} SessionStatus
 * @typedef {'INVALID_CODE' | 'SESSION_ENDED' | 'FULL' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'UNKNOWN'} ErrorCode
 * @typedef {'question' | 'comment' | 'compliment' | 'clarification'} HandReason
 * 
 * @typedef {Object} SessionInfo
 * @property {string} code - 6-character room code
 * @property {string} name - Session display name
 * @property {SessionStatus} status - Status of session ('live' | 'ended')
 * @property {number} createdAt - Creation timestamp (epoch ms)
 * 
 * @typedef {Object} QueuedAttendee
 * @property {string} id - Unique attendee identifier
 * @property {string} name - Display name
 * @property {HandReason} [reason] - Categorized reason for raising hand
 * @property {number} raisedAt - Timestamp when hand was raised (epoch ms)
 * @property {number} [speakCount] - Number of times attendee has spoken
 * @property {boolean} [hasNotSpoken] - True if speakCount is 0
 * @property {boolean} [urgent] - Whether request is marked urgent
 * 
 * @typedef {Object} ActiveSpeaker
 * @property {string} id - Speaker attendee or principal identifier
 * @property {string} name - Speaker display name
 * @property {Role} [role] - Role of active speaker ('principal' | 'attendee' | 'admin')
 * @property {number} startedAt - Timestamp when floor was granted (epoch ms)
 * @property {string} [mode] - Floor mode ('principal' | 'attendee' | 'urgent')
 * @property {string} [reason] - Reason attendee raised hand
 * 
 * @typedef {Object} PrincipalInfo
 * @property {string} id
 * @property {string} name
 * @property {string} [pin]
 * @property {number} createdAt
 * 
 * @typedef {Object} TransportError
 * @property {ErrorCode} code - Error category
 * @property {string} message - Human-readable explanation
 * 
 * @typedef {Object} TransportEvents
 * @property {(queue: QueuedAttendee[]) => void} queue
 * @property {(floor: ActiveSpeaker | null) => void} floor
 * @property {(level: number) => void} level
 * @property {(session: SessionInfo) => void} session
 * @property {(state: ConnectionState) => void} connection
 * @property {(error: TransportError) => void} error
 * @property {(data: { count: number }) => void} attendees
 * @property {(state: AttendeeSelfState) => void} self
 * @property {(stream: MediaStream | null) => void} [speakerStream]
 * @property {(principals: PrincipalInfo[]) => void} [principals]
 * @property {(requests: Array<{ id: string, name: string, requestedAt: number }>) => void} [principalQueue]
 * @property {(reason: string) => void} [preempted]
 * @property {(active: boolean) => void} [fairMode]
 * 
 * @typedef {Object} TransportInterface
 * @property {(params: { name: string }) => Promise<SessionInfo>} createSession
 * @property {() => Promise<void>} endSession
 * @property {(params: { role: Role, code: string, name?: string, pin?: string, passcode?: string }) => Promise<void>} connect
 * @property {() => Promise<void>} disconnect
 * @property {(options?: { reason?: HandReason }) => Promise<void>} raiseHand
 * @property {() => Promise<void>} lowerHand
 * @property {(attendeeId: string) => Promise<void>} grant
 * @property {(attendeeId?: string) => Promise<void>} revoke
 * @property {() => Promise<void>} takeFloor
 * @property {() => Promise<void>} requestSpeak
 * @property {(principalId: string) => Promise<void>} allowPrincipal
 * @property {(name: string) => Promise<PrincipalInfo>} createPrincipal
 * @property {() => Promise<PrincipalInfo[]>} getPrincipals
 * @property {(id: string) => Promise<void>} revokePrincipal
 * @property {(id: string) => Promise<string>} regeneratePrincipalPin
 * @property {(settings: Object) => Promise<void>} updateSettings
 * @property {() => Promise<Object>} fetchSessionState
 * @property {(muted: boolean) => Promise<void>} muteSpeaker
 * @property {(level: number) => Promise<void>} sendLevel
 * @property {(event: string, handler: Function) => () => void} on
 */

export {};
