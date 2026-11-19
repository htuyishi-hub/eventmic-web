# EventMic Web (Phase 1 & Phase 2: LiveKit Real Audio)

**EventMic** turns attendees' smartphones into wireless stage Q&A microphones entirely in the browser. Zero native apps, zero friction.

- **Phase 1**: In-browser `BroadcastChannel` mock transport for local offline multi-tab testing.
- **Phase 2**: Real-time WebRTC audio streaming powered by **LiveKit Cloud** and `eventmic-server`. Attendees' smartphone microphones are captured, transmitted over WebRTC with speech-optimized Opus audio, and played directly through the host's mixing console or sound system.

---

## Architecture Overview

```
                      ┌──────────────────────┐
                      │    LiveKit Cloud     │
                      │ (SFU Media Server)   │
                      └───────▲──────┬───────┘
          Attendee Mic Track  │      │ Speaker Track Subscribed
        (Opus speech 24kbps)  │      │ + Live Audio Level
                              │      ▼
      ┌─────────────────────────┐  ┌─────────────────────────┐
      │   Phone (Attendee)      │  │   Laptop (Host Console) │
      │  /join/:code            │  │  /host                  │
      │                         │  │                         │
      │  • Web Audio Mic        │  │  • StageView Meter      │
      │  • Raise/Lower Intent   │  │  • Floor Grant / Revoke │
      │  • In-Line Queue Pos    │  │  • Audio Output Routing │
      └───────────┬─────────────┘  └───────────▲─────────────┘
                  │                            │
                  ▼                            │
         ┌─────────────────────────────────────┴─────────────┐
         │       eventmic-server (Node.js + Express)         │
         │  • LiveKit Token Issuer (RoomAdmin / Attendee)    │
         │  • Floor Permission & Track Mute Controller       │
         │  • In-Memory Session Store & 200 Cap              │
         └───────────────────────────────────────────────────┘
```

The application strictly decouples signaling and audio behind the `TransportInterface` (`src/transport/types.js`), allowing instant switching between `mock` and `livekit` via `VITE_TRANSPORT`.

---

## Prerequisites & LiveKit Cloud Setup

1. **Create a Free LiveKit Cloud Account**:
   - Sign up at [cloud.livekit.io](https://cloud.livekit.io).
   - Create a project (e.g., `eventmic-prod`).
   - Go to **Project Settings &rarr; Keys** to generate an **API Key** and **API Secret**.
   - Copy your WebSocket URL (`wss://<your-project>.livekit.cloud`).

2. **Configure Server Environment (`eventmic-server/.env`)**:
   ```bash
   cd ../eventmic-server
   cp .env.example .env
   ```
   Fill in your credentials:
   ```env
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   HOST_PASSCODE=1234
   PORT=3001
   ```
   > [!WARNING]
   > Never commit `.env` or expose the API secret to frontend client bundles.

3. **Configure Web Client (`eventmic-web/.env`)**:
   ```bash
   cd ../eventmic-web
   cp .env.example .env
   ```
   Default settings:
   ```env
   VITE_TRANSPORT=livekit
   VITE_API_BASE=/api
   VITE_HOST_PASSCODE=1234
   ```

---

## Running the Application

### 1. Combined Development Mode (`dev:all`)

Runs both the Express API backend (`port 3001`) and the Vite dev server (`port 5173`) concurrently:

```bash
cd eventmic-web
npm run dev:all
```

Vite proxies `/api/*` requests to `http://localhost:3001`, so a single host or tunnel URL serves both the web frontend and API.

### 2. HTTPS Tunnel for Real Smartphone Testing

Mobile browsers (iOS Safari, Android Chrome) strictly require **HTTPS** to allow microphone access (`getUserMedia`). When testing with real phones, expose the Vite port (`5173`) using a secure tunnel:

**Using Cloudflare Tunnel (Recommended):**
```bash
cloudflared tunnel --url http://localhost:5173
```

**Using Ngrok:**
```bash
ngrok http 5173
```

1. Open the provided `https://...` tunnel URL on your laptop at `/host` (e.g. `https://random-name.trycloudflare.com/host`).
2. Unlock the console using passcode `1234` and start a session.
3. The on-screen QR code and **Copy Link** button dynamically use `window.location.origin`, pointing directly to the HTTPS tunnel URL.
4. Scan the QR code with your smartphone to join as an attendee.

---

## Latency Testing (Clap Test)

EventMic achieves ultra-low speech latency over LiveKit's SFU WebRTC pipeline. To measure real-world acoustic latency:

1. Bring the attendee phone and the host laptop (with speakers active) into the same room.
2. Grant the phone the floor.
3. Perform a loud, sharp **clap** near the phone's microphone.
4. Record both the original physical clap and the laptop speaker's playback on a third device (or audio editor like Audacity).
5. Measure the delta between the two waveform transients:
   - Typical local Wi-Fi / 5G latency: **60 ms – 140 ms**.

---

## 11-Step Manual Test Protocol

Follow this protocol to verify the complete Phase 2 real-audio workflow:

1. **Environment Setup**:
   Fill `eventmic-server/.env` with your LiveKit credentials. In `eventmic-web`, run:
   ```bash
   npm run dev:all
   ```
2. **Host Launch & Audio Unlock**:
   Start a Cloudflare or Ngrok HTTPS tunnel to `http://localhost:5173`. Open the HTTPS tunnel URL on your laptop at `/host`. Enter passcode `1234`, click **Unlock Console**, enter a session name (e.g., `All-Hands Q&A`), and click **Start session**. If prompted, click **Start audio** to permit audio output.
3. **Attendee Mobile Join**:
   Scan the host's on-screen QR code with a real smartphone. Enter a name (e.g., `Sarah`) and tap **Join Room**. The phone confirms: *"You're connected"*.
4. **Raise Hand**:
   Tap **Raise Hand** on the phone. Verify the host console's **Up Next** queue updates immediately showing Sarah with a live wait timer. The phone displays: *"You are #1 in line"*.
5. **Grant Floor & Real Audio**:
   On the host console, click **Grant Next (G)**. The phone automatically transitions to the red **You're Live** screen and prompts for microphone access. Allow microphone permission and speak into the phone: verify audio plays through the laptop speakers in real time and the host's **StageView** level meter pulses in sync.
6. **Mute & Floor Revocation**:
   On the host console, press **M** (or tap **Mute Speaker**): verify the laptop audio mutes instantly. Click **End Speaker** (or press **Esc**): verify the phone returns to the listening screen with a notification.
7. **One-Speaker Rule & Preemption**:
   Join a second phone or browser tab (e.g., `Alex`). Raise hands on both. Grant Sarah. While Sarah is speaking live, grant Alex. Verify Sarah's microphone cuts immediately, returning her to the listening screen, while Alex becomes the sole active on-air speaker.
8. **Screen Lock Behavior**:
   While live on-air, lock the phone's screen. Due to mobile operating system power management, background tabs may pause WebRTC tracks. When unlocked, the tab automatically resumes without dropping the session.
9. **Network Interruption (Wi-Fi Dropout)**:
   While connected as an attendee, toggle airplane mode on the phone for 10 seconds, then re-enable connectivity. Observe the top yellow warning banner: *"Reconnecting to host..."*. LiveKit automatically re-establishes the ICE connection and returns to *"connected"*.
10. **End Session**:
    On the host console, click **End Session** and confirm. Verify all connected attendee phones immediately transition to the **Session Ended** screen. The host console displays the **SessionSummary** with duration, speaker count, and total hands raised.
11. **Measure Latency (Clap Test)**:
    Perform the clap test described above and verify latency is under 150 ms.

---

## Known Limitations and Deviations

1. **Browser Autoplay & Audio Output**:
   - Modern browsers (Chrome, Safari) block unprompted Web Audio playback without a prior user gesture. If the host opens the dashboard without interacting with the page, audio output may be suspended until the host clicks the prominent **Start Audio** button.
2. **Mobile Background Audio & Screen Lock**:
   - Web browsers on mobile devices (iOS Safari in particular) pause `getUserMedia` microphone tracks and throttle WebRTC background threads when the screen is locked or the browser is minimized. When the screen is unlocked, tracks resume automatically.
3. **Audio Output Routing (`setSinkId`)**:
   - Custom audio output selection is supported in Chromium-based browsers (Chrome, Edge, Brave). In Safari and Firefox, the selector gracefully hides and routes audio to the system's default output.
4. **Session Participant Cap**:
   - The server enforces an upper limit of 200 concurrent attendees per room (`409 FULL`) to protect SFU bandwidth.
5. **Timing-Safe Authentication**:
   - All host endpoints enforce timing-safe comparison on the `x-host-passcode` header using `crypto.timingSafeEqual` to prevent timing attacks.

---

## Automated Tests

Both projects feature comprehensive test suites:

```bash
# Run server integration tests (Supertest + Vitest)
cd eventmic-server
npm test

# Run web unit, audio engine & transport tests (Vitest + Happy-DOM)
cd ../eventmic-web
npm test

# Verify production build
npm run build
```

---

## Host Audio Engine & Hardware Integration

EventMic Web incorporates a dedicated framework-free Web Audio processing engine (`src/lib/hostAudio.js`) tailored for live event sound engineers and PA systems.

### 1. Web Audio Processing Chain

```
Speaker WebRTC MediaStream
  │
  ├──► [Hidden Muted <audio> Element] (Fixes Chrome remote WebRTC Web Audio playback gotcha)
  │
  ▼
[MediaStreamAudioSourceNode]
  │
  ├──► [Input AnalyserNode] ─────────► Pre-processing Level Meter (0–100%)
  │
  ▼
[High-Pass Filter] (BiquadFilterNode highpass, default 80 Hz, adjustable 40–240 Hz, bypassable)
  │
  ▼
[RMS Noise Gate] (ScriptProcessor fallback, adjustable threshold -60 to -20 dB, release 50–500 ms)
  │
  ▼
[DynamicsCompressor Limiter] (Threshold -3 dBFS, 20:1 ratio, 1 ms attack, 50 ms release, bypassable)
  │
  ▼
[Volume GainNode] (0% to 200%, default 100%)
  │
  ▼
[Mute GainNode] (Instant, click-free 10 ms linear ramp)
  │
  ├──► [Output AnalyserNode] ────────► Post-limiter Level Meter + Peak Clip Hold (2s) + LIM active light
  │
  ▼
[Channel Router / ChannelMergerNode] (Discrete mono mapping: Both/Centre, Left Only, Right Only, Channel N)
  │
  ▼
AudioContext.destination (or MediaStreamAudioDestinationNode with setSinkId fallback)
```

### 2. Browser Compatibility Table

| Feature / Browser | Google Chrome (110+) | Microsoft Edge (110+) | Mozilla Firefox | Apple Safari (macOS / iOS) |
| :--- | :--- | :--- | :--- | :--- |
| **`AudioContext.setSinkId`** | ✅ Supported | ✅ Supported | ❌ Unavailable | ❌ Unavailable |
| **`HTMLMediaElement.setSinkId`** | ✅ Supported | ✅ Supported | ⚠️ Behind config flag | ❌ Unavailable |
| **Custom Device Selection** | ✅ Full support | ✅ Full support | ℹ️ System default | ℹ️ System default |
| **Discrete Multichannel (>2ch)** | ✅ Supported | ✅ Supported | ⚠️ Limited | ⚠️ Limited |
| **High-Pass, Gate & Limiter DSP**| ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported |
| **Device Hotplug (`devicechange`)**| ✅ Real-time | ✅ Real-time | ✅ Real-time | ⚠️ Partial |

> [!NOTE]
> When `setSinkId` is unsupported (Safari or Firefox), the UI displays: *"Your browser uses the system default output; use Chrome or Edge for device selection"*, and safely routes audio through the operating system's active sound card.

---

### 3. Audio Hardware Setup Guides

#### A. USB Audio Interface or Venue Mixing Console (e.g., Focusrite, Behringer, Yamaha, Allen & Heath)
1. Connect your USB audio interface or mixer to the host computer via USB.
2. Open `/host` in Google Chrome or Microsoft Edge.
3. Open **Settings &rarr; Audio Output Device**.
4. If device brand names are hidden, click **Allow device names** (grants temporary permission so the browser can read hardware labels).
5. Select your interface (e.g. `Focusrite Scarlett 2i2`, `Behringer X32 USB`, or `USB Audio CODEC`).
6. In **Channel Routing**, select:
   - **Both (Centre)**: Sends speech to physical outputs 1 & 2 (Main Stereo PA).
   - **Left Only (Ch 1)**: Isolates speech to physical output 1 (e.g. Stage Left or Monitor Mix).
   - **Right Only (Ch 2)**: Isolates speech to physical output 2 (e.g. Broadcast stream feed).
   - **Channel N (Advanced)**: If your audio desk provides a multi-channel USB card (e.g. 8 or 32 channels), discrete buttons appear (`Ch 1`, `Ch 2`, `Ch 3`, etc.). Select the exact input strip on your mixing desk.
7. Click **Play Test Sound** or individual channel test tones to verify audio appears on the corresponding meters on your physical desk.

#### B. Virtual Audio Device (e.g., BlackHole, Loopback, VB-Cable) for Zoom / OBS / vMix
1. Install a virtual audio device (e.g., [BlackHole 2ch/16ch](https://github.com/ExistentialAudio/BlackHole) on macOS or [VB-Audio Virtual Cable](https://vb-audio.com/Cable/) on Windows).
2. In EventMic **Settings &rarr; Audio Output Device**, select `BlackHole 2ch` (or `CABLE Input`).
3. In OBS, Zoom, or vMix, configure your microphone/input source as `BlackHole 2ch` (or `CABLE Output`).
4. Attendee questions will now stream directly into your stream or video conference with zero bleed and processed by the high-pass filter, noise gate, and limiter.

---

## Hardware Test Script

Run through this procedure to verify physical sound hardware, routing, and hotplug failover:

1. **Host Launch & Phone Join**:
   - On a laptop running Chrome or Edge, open `/host`, unlock the console, and start a live session.
   - Scan the QR code from a smartphone and join as an attendee.
2. **Device Enumeration & Test Tone Verification**:
   - Open **Settings** on the host. Click **Allow device names** if prompted.
   - Select the laptop's built-in speakers.
   - Click the test tone buttons: **Centre**, **Left**, **Right**. Confirm the 1 kHz calibration sine tone lands exactly where labelled.
3. **USB Soundcard Hotplug & Discrete Routing**:
   - Plug in a USB audio interface, multi-channel soundcard, or digital mixer.
   - Confirm the device list in **Settings** updates automatically without reloading the page.
   - Select the USB interface and test physical desk routing.
4. **Hot-Unplug Protection & Live Failover**:
   - Grant the floor to the attendee smartphone and speak continuously into the phone.
   - While audio is playing live, unplug the USB interface cable from the laptop.
   - **Expected behavior**: The host dashboard displays an amber warning banner (*"Audio device was disconnected. Output safely switched to default."*), output immediately switches to the laptop's built-in sound without crashing, and the live session remains 100% active.
5. **Acoustic Processing & Clip Metering**:
   - Speak normally: adjust the **Volume slider** (0% to 200%), press **M** to verify click-free muting.
   - Enable the **High-Pass Filter (80 Hz)** and **RMS Noise Gate (-45 dB)** in Settings to verify background room rumble suppression.
   - Shout or make a loud noise near the phone: observe the amber **LIM** indicator illuminate as the DynamicsCompressor limits peaks at -3 dBFS. If volume is pushed above 150%, observe the red **CLIP** light illuminate and hold for 2 seconds.
6. **Persistence**:
   - Refresh the host page: reopen Settings and verify that the selected output device, routing mode, high-pass cutoff, gate, and limiter settings were preserved in `localStorage`.
7. **Cross-Browser Verification**:
   - Repeat the test in Microsoft Edge (full feature parity with Chrome).
   - In Firefox and Safari, verify that the console defaults gracefully to system output with descriptive capability notes.
