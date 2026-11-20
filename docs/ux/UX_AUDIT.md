# DM (Digital Microphone) UX Audit & Information Architecture

**Brand & Product**: **DM** — *digital microphone 🎙️* (`digitalmicrophone.com`)  
**Author**: Antigravity UX & Systems Engineering  
**Scope**: DM Web App (`/admin`, `/speaker`, `/join/:code`, `/dev/gallery`) and Public Marketing Site (`/`)  
**Evaluation Standard**: Nielsen Norman Group 10 Usability Heuristics, WCAG 2.1 / 2.2 AA Accessibility Standards, High-Pressure Live Audio Production Ergonomics  
**Screenshots Captured**: 62 PNG files across 4 viewports (`1366×768`, `1920×1080`, `375×667`, `390×844`) in `/docs/ux/screenshots/`  

---

## Table of Contents
1. [Screenshot Inventory](#1-screenshot-inventory)
2. [Screen-by-Screen Ergonomic Audit](#2-screen-by-screen-ergonomic-audit)
3. [Admin Console (/admin) Pressure & Density Analysis](#3-admin-console-admin-pressure--density-analysis)
4. [Heuristic Usability Evaluation (Nielsen's 10)](#4-heuristic-usability-evaluation-nielsens-10)
5. [Information Architecture & Page Map](#5-information-architecture--page-map)
6. [Low-Fidelity ASCII Wireframes](#6-low-fidelity-ascii-wireframes)

---

## 1. Screenshot Inventory

All screens and states were captured via Playwright in automated headless Chromium (`/usr/bin/chromium`) and stored under `/docs/ux/screenshots/`:

### Admin Console (`/docs/ux/screenshots/admin/`)
Captured at **1366×768** (standard venue laptop) and **1920×1080** (FHD production monitor):

| File Name | Resolution | Description & State |
| :--- | :--- | :--- |
| `empty-1366x768.png` | 1366 × 768 | State 1: Idle venue, empty queue, no active speaker, default telemetry |
| `empty-1920x1080.png` | 1920 × 1080 | State 1: FHD layout with expanded whitespace |
| `live-1366x768.png` | 1366 × 768 | State 2: Live floor (Elena Rostova), 2 queued attendees, dual VU meters active |
| `live-1920x1080.png` | 1920 × 1080 | State 2: FHD live stage view |
| `fair-mode-1366x768.png` | 1366 × 768 | State 3: Fair Mode active, prioritising first-time speakers |
| `fair-mode-1920x1080.png` | 1920 × 1080 | State 3: FHD layout with Fair Mode priority badge |
| `urgent-1366x768.png` | 1366 × 768 | State 4: Urgent interruption alert banner ("Can't hear stage") |
| `urgent-1920x1080.png` | 1920 × 1080 | State 4: FHD urgent alert notification layout |
| `reconnecting-1366x768.png`| 1366 × 768 | State 5: Cloud signaling connection drop / reconnection attempt banner |
| `reconnecting-1920x1080.png`| 1920 × 1080 | State 5: FHD reconnection banner state |
| `floor-dropped-1366x768.png`| 1366 × 768 | State 6: Remote speaker disconnected abruptly while holding floor |
| `floor-dropped-1920x1080.png`| 1920 × 1080 | State 6: FHD dropped speaker revocation banner |

### Speaker Station (`/docs/ux/screenshots/speaker/`)
Captured at **375×667** (iPhone SE) and **390×844** (iPhone 14/15/16):

| File Name | Resolution | Description & State |
| :--- | :--- | :--- |
| `join-375x667.png` | 375 × 667 | Stage PIN login screen with 6-digit credential input |
| `join-390x844.png` | 390 × 844 | iPhone 14/15/16 stage PIN login screen |
| `mic-check-375x667.png` | 375 × 667 | Microphone device selector and level test pre-warm screen |
| `mic-check-390x844.png` | 390 × 844 | iPhone 14/15/16 mic test screen |
| `muted-375x667.png` | 375 × 667 | Speaker dashboard in muted standby mode |
| `muted-390x844.png` | 390 × 844 | iPhone 14/15/16 muted standby screen |
| `next-up-375x667.png` | 375 × 667 | On-deck standby alert: speaker speaks next |
| `next-up-390x844.png` | 390 × 844 | iPhone 14/15/16 on-deck standby screen |
| `live-375x667.png` | 375 × 667 | Active floor: microphone broadcast live, release floor button |
| `live-390x844.png` | 390 × 844 | iPhone 14/15/16 live broadcast screen |
| `questions-closed-375x667.png`| 375 × 667 | Audience Q&A closed indicator with queue disabled |
| `questions-closed-390x844.png`| 390 × 844 | iPhone 14/15/16 Q&A closed screen |
| `urgent-375x667.png` | 375 × 667 | Stage urgent interruption alert card visible to speaker |
| `urgent-390x844.png` | 390 × 844 | iPhone 14/15/16 stage urgent alert card |
| `handover-375x667.png` | 375 × 667 | Co-speaker requesting floor handover with 60s allow button |
| `handover-390x844.png` | 390 × 844 | iPhone 14/15/16 floor handover request card |
| `offline-375x667.png` | 375 × 667 | Network disconnect banner on speaker station |
| `offline-390x844.png` | 390 × 844 | iPhone 14/15/16 offline banner state |

### Attendee Experience (`/docs/ux/screenshots/attendee/`)
Captured at **375×667** and **390×844**:

| File Name | Resolution | Description & State |
| :--- | :--- | :--- |
| `join-375x667.png` | 375 × 667 | Attendee name entry and optional profile photo step |
| `join-390x844.png` | 390 × 844 | iPhone 14/15/16 attendee join screen |
| `listening-375x667.png` | 375 × 667 | Listening screen with 4 reason chips, 56px Raise Hand CTA |
| `listening-390x844.png` | 390 × 844 | iPhone 14/15/16 listening screen |
| `hand-raised-375x667.png` | 375 × 667 | Queue position indicator (#3) with reason badge & Lower Hand CTA |
| `hand-raised-390x844.png` | 390 × 844 | iPhone 14/15/16 queue position card |
| `urgent-confirm-375x667.png` | 375 × 667 | 2-step urgent interruption confirmation modal |
| `urgent-confirm-390x844.png` | 390 × 844 | iPhone 14/15/16 urgent confirm sheet |
| `preparing-mic-375x667.png` | 375 × 667 | Turn transition spinner: WebRTC microphone acquire and lock |
| `preparing-mic-390x844.png` | 390 × 844 | iPhone 14/15/16 preparing mic screen |
| `on-air-375x667.png` | 375 × 667 | Live speaking screen: timer countdown, live VU level, Stop Speaking CTA |
| `on-air-390x844.png` | 390 × 844 | iPhone 14/15/16 on-air speaking screen |
| `on-air-warning-375x667.png`| 375 × 667 | 15-second wrap-up warning alert |
| `on-air-warning-390x844.png`| 390 × 844 | iPhone 14/15/16 wrap-up alert screen |
| `turn-ended-375x667.png` | 375 × 667 | Toast notification after mic revocation |
| `turn-ended-390x844.png` | 390 × 844 | iPhone 14/15/16 turn ended toast |
| `session-ended-375x667.png` | 375 × 667 | Concluded session screen |
| `session-ended-390x844.png` | 390 × 844 | iPhone 14/15/16 session concluded screen |
| `announcement-375x667.png` | 375 × 667 | Room-wide host broadcast banner |
| `announcement-390x844.png` | 390 × 844 | iPhone 14/15/16 broadcast banner |
| `error-invalid-code-375x667.png` | 375 × 667 | Invalid session code scanned or entered |
| `error-invalid-code-390x844.png` | 390 × 844 | iPhone 14/15/16 invalid code screen |
| `error-full-375x667.png` | 375 × 667 | 200 participant room capacity reached |
| `error-full-390x844.png` | 390 × 844 | iPhone 14/15/16 session full screen |
| `error-mic-denied-375x667.png` | 375 × 667 | Browser microphone permission denied |
| `error-mic-denied-390x844.png` | 390 × 844 | iPhone 14/15/16 mic denied screen |
| `error-connection-lost-375x667.png` | 375 × 667 | Signaling socket lost error screen |
| `error-connection-lost-390x844.png` | 390 × 844 | iPhone 14/15/16 connection lost screen |

### Public Marketing Site (`/docs/ux/screenshots/marketing/`)
Captured at **1366×768** (Desktop) and **375×667** (Mobile):

| File Name | Resolution | Description & State |
| :--- | :--- | :--- |
| `home-1366x768.png` | 1366 × 768 | Desktop landing page with room code join card and admin access |
| `home-375x667.png` | 375 × 667 | Mobile landing page |
| `invalid-code-1366x768.png`| 1366 × 768 | Desktop inline validation error on invalid code submit |
| `invalid-code-375x667.png` | 375 × 667 | Mobile inline validation error on invalid code submit |

---

## 2. Screen-by-Screen Ergonomic Audit

### Metrics Matrix by Screen

| Screen & Role | Interactive Elements Visible | Font Sizes in Use | Smallest Text Size | WCAG AA Contrast Failures | Touch Targets < 44px | Horizontal Scroll / Clipped Content | One Primary Action |
| :--- | :---: | :--- | :---: | :--- | :---: | :--- | :--- |
| **Admin Live Console** (`/admin`) | **19** | 9px, 10px, 11px, 12px, 14px, 16px, 18px, 20px | **9px** | Primary Blue button text (3.68:1); Live Red button text (3.76:1); Muted text on Surface (3.73:1); Border contrast (1.36:1) | **11** (Mute buttons, tabs, QR shortcut, copy link, close icons) | **CRITICAL**: All 4 top metrics truncate with ellipsis (`LIVEKIT CON...`, `WEBRTC US...`, `ACTIVE SOC...`, `TURN LATEN...`) | **Grant Next Speaker** (`GRANT NEXT (G)`) |
| **Speaker Station: Join** (`/speaker`) | **4** | 11px, 12px, 14px, 16px, 20px | **11px** | Muted hint text (3.9:1) | **0** (All main buttons > 48px) | None | **Enter Station** |
| **Speaker Station: Mic Check** | **5** | 10px, 11px, 12px, 14px, 18px | **10px** | Level % text on background (3.9:1) | **1** (Device dropdown height is 36px) | None | **Continue to Stage** |
| **Speaker Station: Live Dashboard** | **12** | 9px, 10px, 11px, 12px, 14px, 16px, 18px | **9px** | Chat badge text (3.7:1); Dismiss buttons | **6** (Chat icon, exit icon, tab switch, individual queue grant) | Small text truncated in queue items | **Release Floor** |
| **Attendee: Join** (`/join/:code`) | **2** | 11px, 12px, 14px, 16px, 24px | **11px** | Subtitle text on dark bg (4.1:1) | **0** (All inputs & buttons > 48px) | None | **Join Room** |
| **Attendee: Listening** | **8** | 10px, 11px, 12px, 14px, 16px, 24px | **10px** | Reason chip borders (1.4:1); Photo button text | **1** (Photo button in top bar: 32px height) | None | **Raise Hand** |
| **Attendee: Hand Raised** | **2** | 11px, 12px, 14px, 20px, 24px | **11px** | Position indicator text (3.8:1) | **0** (Lower Hand CTA is 56px) | None | **Lower Hand** |
| **Attendee: On-Air** | **2** | 12px, 14px, 18px, 24px, 32px | **12px** | Live VU meter text | **0** (Stop Speaking CTA is 56px) | None | **Stop Speaking** |
| **Marketing: Home** (`/`) | **4** | 12px, 14px, 16px, 20px, 32px | **12px** | Muted disclaimer text (4.0:1) | **0** (Inputs & buttons > 48px) | None | **Join Session** |

---

## 3. Admin Console (`/admin`) Pressure & Density Analysis

The Admin Console is the operational nerve center during a high-stakes live event. Under cognitive load and ambient acoustic noise, operators suffer when secondary telemetry competes with primary floor controls.

### 3.1 What is Visible All the Time That Could Be Hidden Until Needed
1. **Infrastructure Telemetry Cards (`SessionMetricsBar`)**:
   - `LiveKit Conns: 0 (pk 0)`, `WebRTC Usage: 0.0 min`, `Active Sockets: 0 online`, `Turn Latency: < 100 ms`.
   - **Why Hide**: This is DevOps/network diagnostic data. A live audio engineer or stage moderator does not need to know raw WebRTC minutes or socket counts during active Q&A. On 1366×768 screens, these cards steal 70px of vertical space and truncate into unreadable fragments (`LIVEKIT CON...`).
   - **Recommendation**: Move into an **Diagnostics & Infrastructure** drawer accessed via a discreet status dot in the header.
2. **Multi-Source Audio Chains (`SourceMetersCard`)**:
   - 3 separate meter bars and 3 individual mute toggles (`Principal`, `Attendee`, `Urgent Blip`).
   - **Why Hide**: Stage volume and live speech levels are already displayed on the large primary dual meter in the Live Stage card. Per-source sub-mix mutes are pre-flight audio settings.
   - **Recommendation**: Collapse into an expandable "Audio Sub-Mix" accordion or move to Audio Settings drawer. Keep only the primary output VU meter hot on the main stage card.
3. **5 Persistent Management Tabs (`Queue`, `Urgent`, `Attendees`, `Spoke`, `Speakers`)**:
   - `Attendees` (full participant list), `Spoke` (historical log), and `Speakers` (PIN generation, token credentials) are pre-event setup and post-event review tasks. During the live session, having all 5 tabs visible creates decision paralysis.
   - **Recommendation**: Consolidate live view to **Queue** and **Urgent** tabs only. Move Attendees roster, Speaker PINs, and Spoke history to dedicated drawer or top-level navigation modes.

### 3.2 Duplicated Information
1. **Room QR Code**:
   - Appears as a button in the top navigation bar (`Show QR (Q)`), again as a text link inside the empty queue container (`Show QR Code ->`), and again in the setup flow.
2. **Room Code (`DEMO042`)**:
   - Displayed in top bar (`Session: DEMO42`), duplicated in the URL bar, and inside the Copy Link tooltip.
3. **Current Speaker Status**:
   - Elena Rostova's active speaking turn is displayed in the header (`• Live`), in the primary Stage Card (`Elena Rostova • Attendee • 00:48`), in the Attendees tab list (`Elena Rostova • speaking`), and on the source audio meters card (`Attendee 68%`).

### 3.3 Actions Hard to Find Under Pressure
1. **Handling Urgent Audience Interruptions**:
   - When an attendee raises an urgent issue ("Can't hear stage"), an amber warning banner appears at the very top of the screen reading: *"check Urgent tab"*.
   - **Problem**: The operator must notice the banner, look down to the left tab bar, locate the small `Urgent` tab among 5 tabs, click it, and then find the action button. This takes 4–6 seconds during a critical sound emergency.
   - **Fix**: Floating priority banner mounted directly above the Live Stage with instant 1-click actions: `[Grant 5s Blip]` and `[Dismiss]`.
2. **Cutting Off / Revoking an Attendee**:
   - The primary button is labelled `End Floor (Esc)`. However, if an attendee is muted or dropping audio, operators instinctively look at the attendee list. The attendee row in the queue has a small `X` icon that is 24px wide with poor click affordance.
3. **Mute Host vs Mute Participant**:
   - The button `MUTE HOST (M)` in the bottom stage bar is ambiguous. Operators frequently wonder: *"Does this mute my laptop speakers or does it cut the attendee's microphone to the venue PA?"*
   - **Fix**: Rename clearly to `Mute Venue Output` and `Mute Speaker Mic`.

---

## 4. Heuristic Usability Evaluation (Nielsen's 10)

### 1. Visibility of System Status
- **Severity**: **HIGH**
- **Violation**: The `GRANT NEXT (G)` button displays subtext `"Queue empty"` even when there are 2 attendees queued in line (`Marcus Vance` and `Sophia Chen` in `live-1366x768.png`). This occurs because `nextAttendeeName` is undefined in the preview state while `queueLength` is 2.
- **Screenshot**: `admin/live-1366x768.png`
- **Concrete Fix**: Derive button subtext strictly from queue state: `queue.length > 0 ? "Next: " + queue[0].name : "Queue empty"`. Disable button when queue is 0; illuminate bright accent when queue > 0.

### 2. Match Between System and Real World
- **Severity**: **MEDIUM**
- **Violation**: Technical jargon displayed prominently in user-facing controls: `WebRTC Usage`, `LiveKit Conns (pk 0)`, `Active Sockets`, `SFU Media Server`.
- **Screenshot**: `admin/empty-1366x768.png`
- **Concrete Fix**: Replace technical jargon with human operational terms: `Audience Connected: 38`, `Audio Quality: Excellent (32ms)`. Hide WebRTC protocol stats inside technical diagnostics.

### 3. User Control and Freedom
- **Severity**: **HIGH**
- **Violation**: In Attendee listening screen (`listening-390x844.png`), tapping `Urgent (5s Blip)` opens a confirmation sheet, but once an urgent request is sent, the attendee has no immediate "Cancel Urgent Request" button if they pressed it by mistake.
- **Screenshot**: `attendee/urgent-confirm-390x844.png`
- **Concrete Fix**: Provide a 3-second undo toast or prominent `Cancel Urgent Alert` button on the attendee screen after triggering.

### 4. Consistency and Standards
- **Severity**: **HIGH**
- **Violation**: Inconsistent font sizes and padding across buttons. Some buttons use `text-xs py-1.5` (32px height), others use `text-sm py-2.5` (44px), and mobile buttons use `text-lg py-4` (56px). Additionally, 11 distinct font sizes are used arbitrarily across components (`9px`, `10px`, `11px`, `12px`, `14px`, `16px`, `18px`, `20px`, `24px`, `30px`, `36px`).
- **Screenshot**: `admin/empty-1366x768.png`, `speaker/live-390x844.png`
- **Concrete Fix**: Standardise on a unified 6-step type scale (12px, 14px, 16px, 20px, 24px, 32px) and enforce 3 standard button heights: Small (36px desktop-only), Medium (44px standard), Large (56px primary touch).

### 5. Error Prevention
- **Severity**: **HIGH**
- **Violation**: `End Session` in the top right header of the Admin console is styled with a subtle red icon next to settings. A misclick in a dark sound booth can instantly terminate the live session and disconnect all 200 participants.
- **Screenshot**: `admin/live-1366x768.png`
- **Concrete Fix**: Move `End Session` into the Settings drawer or require a 2-step confirmation modal with a 3-second hold-to-confirm interaction.

### 6. Recognition Rather than Recall
- **Severity**: **MEDIUM**
- **Violation**: Admin keyboard shortcuts are hinted with letters in parentheses: `Grant Next (G)`, `End Floor (Esc)`, `Mute Host (M)`, `Show QR (Q)`. However, other shortcuts (like switching tabs `1-5` or navigation) are unlisted, requiring recall.
- **Screenshot**: `admin/empty-1366x768.png`
- **Concrete Fix**: Add a persistent shortcut legend modal triggered by `?` or a keyboard icon in the header.

### 7. Flexibility and Efficiency of Use
- **Severity**: **MEDIUM**
- **Violation**: On the speaker station (`speaker/live-390x844.png`), when a co-speaker requests a handover, the modal offers only `Allow (60s)` or `Later`. There is no option to delegate immediately without a 60-second timer.
- **Screenshot**: `speaker/handover-390x844.png`
- **Concrete Fix**: Provide two distinct handover options: `Pass Floor Now` (permanent handoff) and `Allow 60s Handoff` (temporary co-speaking).

### 8. Aesthetic and Minimalist Design
- **Severity**: **HIGH**
- **Violation**: High visual clutter on Admin screen. 19 interactive controls, 4 metric cards, 3 audio chain cards, 5 tabs, and 3 stage control buttons all rendered simultaneously on a single viewport.
- **Screenshot**: `admin/live-1366x768.png`
- **Concrete Fix**: Adopt a 3-zone progressive disclosure architecture: Zone A (Top Status), Zone B (Primary Stage & Hot Controls), Zone C (Active Queue). Hide auxiliary audio chains and telemetry behind drawers.

### 9. Help Users Recognize, Diagnose, and Recover from Errors
- **Severity**: **MEDIUM**
- **Violation**: When an attendee's microphone permission is blocked (`attendee/error-mic-denied-390x844.png`), the error message states: *"Microphone permission was denied. Enable microphone in browser settings to speak."* It does not explain how to unblock it in iOS Safari or Android Chrome (which require tapping the "aA" or lock icon in the URL bar).
- **Screenshot**: `attendee/error-mic-denied-390x844.png`
- **Concrete Fix**: Display device-specific visual instructions: iOS Safari (tap `aA` → Website Settings → Allow Microphone) vs Android Chrome (tap Lock icon → Permissions → Allow).

### 10. Help and Documentation
- **Severity**: **LOW**
- **Violation**: No context or explanation of "Fair Mode" on the live admin console. The badge simply says `Fair Mode Active`, but new operators do not know whether it is FIFO, round-robin, or spoke-count weighted.
- **Screenshot**: `admin/fair-mode-1366x768.png`
- **Concrete Fix**: Add an info tooltip to the Fair Mode badge explaining: *"Prioritising attendees who have spoken 0 times"*.

---

## 5. Information Architecture & Page Map

### 5.1 System Page Map

```
EventMic Web Platform
├── Public Marketing Site
│   ├── / (Home / Landing Page)
│   ├── /pricing (Pricing & Event Packages)
│   └── /guide (Hardware Setup & PA Guide)
│
├── Attendee Experience (Frictionless Web - No Auth)
│   ├── /join/:code (Step 1: Name & Photo → Step 2: Live Room)
│   │   ├── State: Listening (Default)
│   │   ├── State: Hand Raised (In-Line Queue)
│   │   ├── State: Preparing Mic (WebRTC Pre-warm)
│   │   ├── State: On-Air (Hot Mic Countdown)
│   │   └── Drawer: Urgent Interruption (Can't hear / sound issue)
│   └── /join/:code/ended (Session Summary / Feedback)
│
├── Speaker Station (Stage Presenters - PIN Auth)
│   ├── /speaker (PIN Login)
│   ├── /speaker/mic-check (Pre-flight Mic & Photo Check)
│   └── /speaker/stage (Live Control Station)
│       ├── View: Standby / On Deck
│       ├── View: Live Broadcast (Hot Mic)
│       └── Drawer: Backstage Admin Chat
│
└── Admin Console (Venue Production - Passcode Auth)
    ├── /admin/setup (Pre-Event Room Creation, Audio Hardware Routing, Speaker PINs)
    ├── /admin/live (Live Operational Floor Management - Low Cognitive Load)
    │   ├── Drawer: Audio Routing & Processing (High-Pass, Gate, Limiter)
    │   ├── Drawer: Backstage Chat & Room Announcements
    │   ├── Drawer: Session Settings & Fair Mode Configuration
    │   └── Drawer: Diagnostic & Network Telemetry
    └── /admin/summary (Post-Event Analytics, Spoke History Export, Duration Metrics)
```

### 5.2 Page Purpose & Progressive Disclosure Specifications

| Page | Purpose | Primary Action | Hidden Behind Drawers / Tabs |
| :--- | :--- | :--- | :--- |
| **Marketing Home** (`/`) | Introduce EventMic, fast room code entry, route to host/speaker portals | **Join Session with Code** | Device setup instructions, feature specs |
| **Admin Setup** (`/admin/setup`) | Create room, assign speaker PINs, test PA sound, configure rules | **Launch Live Session** | Advanced processing (gate/limiter), CSV speaker import |
| **Admin Live** (`/admin/live`) | Real-time floor control, queue granting, speaker management | **Grant Next (Space/G)** | Audio routing, chat, settings, technical telemetry |
| **Admin Summary** (`/admin/summary`)| Review speaking times, export attendee records, verify duration | **Export Session CSV** | Individual audio timestamps, raw logs |
| **Speaker Check-in** (`/speaker`) | Authenticate stage speaker with 6-digit PIN | **Enter Station** | PIN reset request |
| **Speaker Live** (`/speaker/stage`) | Silent stage mic station, floor request, monitor Q&A queue | **Take Floor / Release Floor** | Backstage chat, handover requests |
| **Attendee Room** (`/join/:code`) | Smartphone mic reinforcement, reason-based question intent | **Raise Hand** | Urgent interruption sheet, profile photo change |

---

## 6. Low-Fidelity ASCII Wireframes

### 6.1 Admin Live Console (`1366×768` Desktop Layout)

```
+--------------------------------------------------------------------------------------------------+
| [EM] KEYNOTE 2026   ● LIVE   Code: DEMO42   Time: 42:15   Audience: 38      [Chat(1)] [Gear] [End] |
+----------------------------------------------------+---------------------------------------------+
|  QUEUE (4 in line)              [Auto-Fair: ON]   |  LIVE STAGE                          ● HOT  |
+----------------------------------------------------+---------------------------------------------+
| [!] URGENT ALERT: Sound Desk ("Can't hear stage")  |                                             |
|     [Grant 5s Blip]   [Dismiss]                    |                 ( AVATAR )                  |
+----------------------------------------------------+                 Elena Rostova               |
|                                                    |            Attendee  •  Spoke: 0 times          |
|  1. Marcus Vance [Comment]        [GRANT FLOOR] X  |                                             |
|     Wait: 1m 40s • 1st time                        |  MIC IN   [||||||||||||||....]  68%  00:48  |
|                                                    |  OUT VU   [||||||||||||||....]  68%         |
|  2. Sophia Chen [Question]        [GRANT FLOOR] X  |                                             |
|     Wait: 45s • 1st time                           |  Volume: [===================O====] 100%    |
|                                                    |                                             |
|  3. Dr. Aris Thorne [Clarification]                |                                             |
|     Wait: 12s • Spoke 1x                           |                                             |
|                                                    |                                             |
|  4. Liam Walker [Question]                         |                                             |
|     Wait: 5s • 1st time                            |                                             |
|                                                    +---------------------------------------------+
|                                                    |                 STAGE CONTROLS              |
|                                                    | +-------------------+ +-------------------+ |
|                                                    | |  GRANT NEXT (G)   | |  END FLOOR (Esc)  | |
|                                                    | | Next: Marcus V.   | |    Cut Speaker    | |
|                                                    | +-------------------+ +-------------------+ |
|                                                    | +-----------------------------------------+ |
|                                                    | |           MUTE VENUE PA (M)             | |
+----------------------------------------------------+ +-----------------------------------------+ |
| [Audio Engine: Normal]  [LiveKit: 24ms]  [WiFi: OK] | Shortcuts: [G] Grant  [Esc] Cut  [M] Mute   |
+--------------------------------------------------------------------------------------------------+
```

### 6.2 Admin Setup (`/admin/setup`)

```
+--------------------------------------------------------------------------------------------------+
| [EM] EventMic Studio                                                          [Help] [Sign Out]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   PRE-FLIGHT SESSION SETUP                                                                       |
|   Prepare your venue sound, stage speakers, and room rules before going live.                    |
|                                                                                                  |
|   +---------------------------------------+  +------------------------------------------------+  |
|   | 1. ROOM DETAILS                       |  | 3. SOUND REINFORCEMENT                         |  |
|   | Session Name: [ Annual Keynote 2026 ] |  | Output Device: [ USB Audio Interface (Scarlett)|  |
|   | Room Code:    [ DEMO42 ] (Auto)       |  | High-Pass Filter: [x] 80 Hz (Speech rumble cut)|  |
|   | Access Passcode: [ •••••••• ]         |  | Brickwall Limiter: [x] On (-1 dBFS anti-clip)  |  |
|   +---------------------------------------+  | [ Test 1 kHz Tone ]  [ Test Host Microphone ]  |  |
|   | 2. STAGE SPEAKERS (PRINCIPALS)        |  +------------------------------------------------+  |
|   | + Add Speaker: [ Dr. Jane Smith    ]  |  | 4. PARTICIPATION RULES                         |  |
|   |                                       |  | Speaking Fairness: (*) Auto-Fair  ( ) Manual   |  |
|   | - Dr. Jane Smith     PIN: 482-910 [x] |  | Attendee Turn Cap: [ 120 seconds ]             |  |
|   | - Mark Davis         PIN: 119-304 [x] |  | Profile Photos:    (*) Speaker Only ( ) All    |  |
|   +---------------------------------------+  +------------------------------------------------+  |
|                                                                                                  |
|                          [ LAUNCH LIVE SESSION -> ]                                              |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### 6.3 Speaker Station Live (`/speaker` on `390×844` Phone)

```
+---------------------------------------+
| 9:41                             5G   |
+---------------------------------------+
| DEMO42  Stage Station        [Chat 1] |
+---------------------------------------+
|                                       |
|  +---------------------------------+  |
|  |           YOU ARE LIVE          |  |
|  |  Your lapel microphone is hot   |  |
|  +---------------------------------+  |
|                                       |
|  Level: [||||||||||||||||||||.....]   |
|  Input: Headset (AirPods Pro)         |
|                                       |
|  +---------------------------------+  |
|  |       [ RELEASE FLOOR ]         |  |
|  |      Step off stage mic         |  |
|  +---------------------------------+  |
|                                       |
|---------------------------------------|
|  AUDIENCE QUEUE (4 waiting)           |
|                                       |
|  1. Marcus Vance (Question)           |
|     "Architecture scalability"        |
|     [ Grant Floor Directly ]          |
|                                       |
|  2. Sophia Chen (Clarification)       |
|                                       |
|  3. Dr. Aris Thorne (Comment)         |
|                                       |
+---------------------------------------+
| (i) Keep device away from speakers    |
+---------------------------------------+
```

### 6.4 Attendee Listening & On-Air (`/join/:code` on `390×844` Phone)

```
+-------------------+                   +-------------------+
| 9:41         5G   |                   | 9:41         5G   |
+-------------------+                   +-------------------+
| ● CONNECTED       |                   | ● ON AIR     LIVE |
| Keynote Q&A       |                   | Keynote Q&A       |
+-------------------+                   +-------------------+
|                   |                   |                   |
|   ( AVATAR )      |                   |    YOU ARE LIVE   |
|  Elena Rostova    |                   |    Speak clearly  |
|  Stage Speaker    |                   |                   |
|                   |                   |     01:42         |
| Stage Audio Hot   |                   |  Time remaining   |
|                   |                   |                   |
| REASON TO SPEAK   |                   | [||||||||||.....] |
| [* Question ]     |                   | Live mic meter    |
| [  Comment  ]     |                   |                   |
| [  Clarify  ]     |                   |                   |
|                   |                   | +---------------+ |
| +---------------+ |                   | | STOP SPEAKING | |
| |  RAISE HAND   | |                   | | Relinquish mic| |
| |  Join queue   | |                   | +---------------+ |
| +---------------+ |                   |                   |
|                   |                   |                   |
| [ Urgent: 5s ]    |                   |                   |
+-------------------+                   +-------------------+
```

### 6.5 Marketing Home Page (`1366×768` Desktop)

```
+--------------------------------------------------------------------------------------------------+
| [EM] EventMic Web                        Features    Hardware Guide    Pricing    [Admin Login]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                          Zero Hardware. Zero Apps. Pure Web Audio.                               |
|                                                                                                  |
|               Turn audience smartphones into stage-ready wireless microphones                    |
|                        directly in any mobile browser over WebRTC.                               |
|                                                                                                  |
|          +-----------------------------------+   +------------------------------------+          |
|          |         JOIN AN EVENT             |   |         HOST AN EVENT              |          |
|          |                                   |   |                                    |          |
|          | Enter 6-digit room code:          |   | Set up high-fidelity audio Q&A     |          |
|          | [  7  K  2  M  9  X  ]            |   | for conferences, town halls & PAs. |          |
|          |                                   |   |                                    |          |
|          |      [ JOIN SESSION -> ]          |   |      [ CREATE FREE ROOM -> ]       |          |
|          +-----------------------------------+   +------------------------------------+          |
|                                                                                                  |
|   ✓ Sub-100ms Turn Latency    ✓ 80Hz High-Pass & Limiter    ✓ No App Store Download Required     |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```
