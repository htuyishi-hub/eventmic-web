/**
 * EventMic Transport Types & Contracts.
 * @typedef {'admin' | 'principal' | 'attendee' | 'host'} Role
 * @typedef {'connecting' | 'connected' | 'reconnecting' | 'disconnected'} ConnectionState
 * @typedef {'listening' | 'hand_raised' | 'preparing' | 'on_air'} AttendeeSelfState
 * @typedef {'live' | 'ended'} SessionStatus
 * @typedef {'INVALID_CODE' | 'SESSION_ENDED' | 'FULL' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'UNKNOWN'} ErrorCode
 * @typedef {'question' | 'comment' | 'compliment' | 'clarification' | 'urgent' | 'cant_hear' | 'other'} HandReason
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
 * @property {boolean} [hasAvatar] - Whether user has a profile photo
 * @property {number} [avatarVersion] - Version of avatar for cache busting
 * 
 * @typedef {Object} ActiveSpeaker
 * @property {string} id - Speaker attendee or principal identifier
 * @property {string} name - Speaker display name
 * @property {Role} [role] - Role of active speaker ('principal' | 'attendee' | 'admin')
 * @property {number} startedAt - Timestamp when floor was granted (epoch ms)
 * @property {string} [mode] - Floor mode ('principal' | 'attendee' | 'urgent')
 * @property {string} [reason] - Reason attendee raised hand
 * @property {boolean} [disconnected] - True if speaker dropped connection
 * @property {boolean} [hasAvatar] - Whether speaker has a profile photo
 * @property {number} [avatarVersion] - Avatar version
 * 
 * @typedef {Object} PrincipalInfo
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} [pin] - 6-digit access PIN
 * @property {number} createdAt - Timestamp
 * @property {'offline' | 'on_deck' | 'live' | 'idle'} [status]
 * @property {boolean} [hasAvatar] - Whether principal has an avatar
 * @property {number} [avatarVersion] - Avatar version
 * 
 * @typedef {Object} AttendeeInfo
 * @property {string} id
 * @property {string} name
 * @property {'listening' | 'hand_raised' | 'on_air' | 'spoken'} status
 * @property {HandReason} [handReason]
 * @property {number} [raisedAt]
 * @property {number} speakCount
 * @property {boolean} hasNotSpoken
 * @property {number} joinedAt
 * 
 * @typedef {Object} SpokenRecord
 * @property {string} id
 * @property {string} name
 * @property {string} reason
 * @property {number} startedAt
 * @property {number} endedAt
 * @property {number} durationSeconds
 * @property {Role} role
 * 
 * @typedef {Object} UrgentRequest
 * @property {string} id
 * @property {string} attendeeId
 * @property {string} name
 * @property {string} reason
 * @property {number} requestedAt
 * 
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} senderId
 * @property {string} senderName
 * @property {Role} senderRole
 * @property {string} text
 * @property {number} timestamp
 * 
 * @typedef {Object} Announcement
 * @property {string} id
 * @property {'info' | 'warning'} type
 * @property {string} text
 * @property {number} createdAt
 * @property {number} expiresAt
 * 
 * @typedef {Object} SessionSettings
 * @property {'off' | 'auto' | 'on'} fairMode
 * @property {number} fairFromMinutes
 * @property {number | null} sessionEndTime
 * @property {boolean} allowUrgent
 * @property {number} attendeeTurnCapSeconds
 * @property {'on_demand' | 'always'} principalConnectMode
 * @property {'on' | 'speaker_only' | 'off'} [photos]
 * 
 * @typedef {Object} TransportError
 * @property {ErrorCode} code
 * @property {string} message
 * 
 * @typedef {Object} TransportEvents
 * @property {(queue: QueuedAttendee[]) => void} queue
 * @property {(floor: ActiveSpeaker | null) => void} floor
 * @property {(level: number) => void} level
 * @property {(session: SessionInfo) => void} session
 * @property {(state: ConnectionState) => void} connection
 * @property {(error: TransportError) => void} error
 * @property {(data: { count: number, list?: AttendeeInfo[] }) => void} attendees
 * @property {(state: AttendeeSelfState) => void} self
 * @property {(stream: MediaStream | null) => void} [speakerStream]
 * @property {(principals: PrincipalInfo[]) => void} [principals]
 * @property {(requests: Array<{ id: string, name: string, requestedAt: number }>) => void} [principalQueue]
 * @property {(spokenList: SpokenRecord[]) => void} [spoken]
 * @property {(urgentList: UrgentRequest[]) => void} [urgent]
 * @property {(messages: ChatMessage[]) => void} [messages]
 * @property {(announcement: Announcement | null) => void} [announcement]
 * @property {(settings: SessionSettings) => void} [settings]
 * @property {(reason: string) => void} [preempted]
 * @property {(active: boolean) => void} [fairMode]
 * @property {(data: { identity: string, hasAvatar: boolean, avatarVersion: number }) => void} [avatar]
 * 
 * @typedef {Object} TransportInterface
 * @property {(params: { name: string }) => Promise<SessionInfo>} createSession
 * @property {() => Promise<void>} endSession
 * @property {(params: { role: Role, code: string, name?: string, pin?: string, passcode?: string }) => Promise<void>} connect
 * @property {() => Promise<void>} disconnect
 * @property {(options?: { reason?: HandReason }) => Promise<void>} raiseHand
 * @property {() => Promise<void>} lowerHand
 * @property {() => Promise<void>} urgentRequest
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
 * @property {(imageBlobOrData: Blob | string, targetIdentity?: string) => Promise<any>} [uploadAvatar]
 * @property {(targetIdentity?: string) => Promise<any>} [deleteAvatar]
 * @property {(text: string, recipientRole?: Role) => Promise<void>} [sendMessage]
 * @property {(text: string, type?: 'info' | 'warning', durationMs?: number) => Promise<void>} [broadcastAnnouncement]
 * @property {(urgentId: string) => Promise<void>} [grantUrgent]
 * @property {(urgentId: string) => Promise<void>} [dismissUrgent]
 * @property {(event: string, handler: Function) => () => void} on
 */

export {};
