# EventMic Web (Phase 1)

**EventMic** turns attendees' smartphones into wireless stage Q&A microphones entirely in the browser. Zero native apps, zero friction.

Phase 1 delivers the full host dashboard and attendee mobile experience powered by an in-browser `BroadcastChannel` mock transport. The application is architected so that all signaling and audio transport logic is decoupled behind a unified `TransportInterface`, preparing for a seamless drop-in replacement with `LiveKitTransport` in Phase 2.

---

## Tech Stack

- **Framework**: React 18, Vite 5, React Router v6
- **Styling**: Tailwind CSS 3 (Dark theme with custom design tokens)
- **Icons & QR**: Lucide React, `qrcode.react`
- **State Management**: Native React Context & Reducers (`TransportContext`, `SessionContext`)
- **Testing**: Vitest + Happy-DOM

---

## Folder Structure

```
src/
├── App.jsx                     # Top-level Router & Providers
├── main.jsx                    # React root entry point
├── transport/
│   ├── types.js                # JSDoc interface documentation
│   ├── mockTransport.js        # BroadcastChannel tab-to-tab transport
│   ├── livekitTransport.js     # Phase 2 LiveKit stub
│   ├── mockTransport.test.js   # Vitest unit tests
│   └── index.js                # Factory selecting transport via VITE_TRANSPORT
├── context/
│   ├── TransportContext.jsx    # Transport lifecycle & connection state
│   └── SessionContext.jsx      # Reducer managing queue, floor, level, and events
├── pages/
│   ├── HomePage.jsx            # / landing page
│   ├── HostPage.jsx            # /host dashboard route
│   ├── JoinPage.jsx            # /join/:code attendee route
│   └── NotFoundPage.jsx        # Catch-all 404 route
├── components/
│   ├── host/                   # PasscodeGate, CreateSession, Dashboard, SessionBar,
│   │                           # QueueList, QueueItem, StageView, LevelMeter,
│   │                           # RoomQrModal, EndSessionConfirm, SessionSummary,
│   │                           # SettingsDrawer, ConnectionBadge
│   ├── attendee/               # JoinScreen, ListeningScreen, HandRaisedScreen,
│   │                           # OnAirScreen, EndedScreen, ErrorScreen
│   └── ui/                     # Button, Modal, Drawer, Toast, Spinner, EmptyState
├── lib/
│   ├── ids.js                  # Unambiguous code generator (no 0, O, 1, I)
│   ├── time.js                 # Duration & live wait time formatters
│   └── audioMeter.js           # Web Audio AnalyserNode (real mic level 0..1)
└── styles/
    └── index.css               # Tailwind directives & CSS variables
```

---

## Installation & Running

```bash
# Navigate to the project directory
cd eventmic-web

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To run the automated Vitest test suite:
```bash
npm test
```

To create a production build:
```bash
npm run build
```

---

## Configuration

Environment variables (configure via `.env` or `.env.example`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_TRANSPORT` | `mock` | Transport engine to use (`mock` or `livekit`). |
| `VITE_HOST_PASSCODE` | `1234` | Security passcode required to unlock the `/host` dashboard. |

---

## Manual Test Script (Multi-Tab Verification)

Follow this 10-step protocol to verify all features in your browser:

1. **Host Unlock & Creation**:
   - Open [http://localhost:5173/host](http://localhost:5173/host) in **Tab A**.
   - Enter passcode `1234` and tap **Unlock Console**.
   - Enter a session title (e.g. `Keynote Q&A`) and click **Start session**.
   - Confirm the session code (e.g., `7K2M9X`) and QR button appear on the top bar.

2. **Attendee Join**:
   - In **Tab B**, navigate to `http://localhost:5173/join/<CODE>`.
   - In **Tab C**, navigate to `http://localhost:5173/join/<CODE>`.
   - In Tab B, enter name `Alice` and click **Join Room**.
   - In Tab C, enter name `Bob` and click **Join Room**.
   - Both tabs now show the **Listening** state ("You're connected").
   - Tab A's attendee badge in the header displays `2`.

3. **Queue & FIFO Order**:
   - In Tab B (Alice), tap **Raise Hand**.
   - In Tab C (Bob), tap **Raise Hand** 2 seconds later.
   - Verify Tab B displays `You are #1 in line`.
   - Verify Tab C displays `You are #2 in line`.
   - Verify Tab A's **Up Next** queue displays Alice at position 1 and Bob at position 2 with live-updating wait timers.

4. **Granting the Floor & Audio Level**:
   - In Tab A, click **Grant Next (G)** (or press keyboard shortcut `G`).
   - Tab B automatically switches to **You're Live** and prompts for microphone permission.
   - Speak into your microphone: verify the live audio meter on Tab B pulses and the host's **StageView** meter moves in sync.
   - Verify Tab C stays in line at position #1.

5. **One-Speaker Rule**:
   - While Alice (Tab B) is live, in Tab A click **Grant** on Bob (Tab C).
   - Verify Alice's mic stops immediately, returning to the Listening screen with a toast: *"The host ended your turn"*.
   - Verify Bob (Tab C) becomes the active on-air speaker.

6. **Microphone Permission Denied**:
   - Open another tab, raise hand, grant it, and block/deny mic permission in browser permissions.
   - Verify the **ErrorScreen** appears explaining how to unblock mic access with a **Try Again** button.

7. **Auto-Removal on Tab Close**:
   - Close Tab C.
   - Within 8 seconds (heartbeat timeout), verify Tab C is automatically removed from the host's queue or active floor.

8. **Host Refresh & Session Persistence**:
   - In Tab A, refresh the page.
   - Verify the session name, code, queue, and floor are restored seamlessly from `localStorage`.

9. **End Session & Summary**:
   - In Tab A, click **End Session** and confirm in the modal dialog.
   - Verify attendee tabs immediately show the **EndedScreen** (*"This session has ended. Thank you."*).
   - Verify Tab A displays the **SessionSummary** showing duration, speaker count, and total hands raised.

10. **Edge Cases**:
    - Navigate to `/join/ZZZZZZ` (non-existent code): verify the **Invalid Room Code** screen appears with an option to return home.
    - Test mobile viewport (360x740): verify buttons are >= 56px, touch targets are comfortable, and safe-area margins are respected.

---

## Transport Interface (`src/transport/types.js`)

All interactions outside `src/transport` rely solely on the following API:

```javascript
// Methods
createSession({ name })     // -> Promise<SessionInfo> (Host)
endSession()                // -> Promise<void> (Host)
connect({ role, code, name })// -> Promise<void>
disconnect()                // -> Promise<void>
raiseHand()                 // -> Promise<void> (Attendee)
lowerHand()                 // -> Promise<void> (Attendee)
grant(attendeeId)           // -> Promise<void> (Host)
revoke(attendeeId)          // -> Promise<void> (Host)
muteSpeaker(isMuted)        // -> Promise<void> (Host)
sendLevel(level)            // -> Promise<void> (Attendee, 0..1, ~10x/sec)
on(event, handler)          // -> () => unsubscribe()
```

### Events

- `'queue'`: `[{ id, name, raisedAt }]`
- `'floor'`: `{ id, name, startedAt } | null`
- `'level'`: `number` (0..1)
- `'session'`: `{ code, name, status, createdAt }`
- `'connection'`: `'connecting' | 'connected' | 'reconnecting' | 'disconnected'`
- `'error'`: `{ code: 'INVALID_CODE' | 'SESSION_ENDED' | 'FULL' | 'UNKNOWN', message }`
- `'attendees'`: `{ count: number }`
- `'self'`: `'listening' | 'hand_raised' | 'on_air'`

---

## Future LiveKitTransport Integration (Phase 2)

In Phase 2, `LiveKitTransport` replaces `MockTransport`:
1. **Signaling**: LiveKit Room data messages (`room.localParticipant.publishData`) handle queueing, raise/lower intents, and floor grants.
2. **Audio Track**: When granted, attendee publishes their WebRTC local microphone track (`room.localParticipant.setMicrophoneEnabled(true)`).
3. **Sound Output**: The host tab subscribes to the active speaker's audio track and routes it directly to the designated venue output via Web Audio / `setSinkId`.
4. Zero application UI or page changes are required—only switching `VITE_TRANSPORT=livekit` in `.env`.
