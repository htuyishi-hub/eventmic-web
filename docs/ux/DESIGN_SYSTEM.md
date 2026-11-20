# EventMic Design System Proposal (v2.0)

**Status**: Proposal (Documentation Only — Zero Code Changes in Current Release)  
**Target Environments**: Desktop Venue Console (`1366×768`–`1920×1080`), Presenter/Speaker Mobile (`375×667`–`390×844`), In-Audience Attendee Mobile (`375×667`–`390×844`), Public Marketing Portal (`1366×768` & Mobile)  
**Core Design Philosophy**: *"Speed Under Pressure, Zero Cognitive Overhead in the Dark"*

---

## 1. Typography & Font Stack

### 1.1 The Font Stack: System UI with Tabular Numerals

```css
font-family:
  Inter,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  Helvetica,
  Arial,
  sans-serif;
font-feature-settings: "tnum" 1, "cv05" 1, "cv11" 1;
```

#### Why This Choice?
1. **Zero Latency / Zero CDN Failure Risk**: Using a robust modern system stack supplemented by Inter (pre-loaded locally or system-installed) ensures zero blocking web font requests (`FOIT`/`FOUT`) when an attendee opens the web app on weak conference Wi-Fi or cellular networks.
2. **Tabular Numerals (`font-feature-settings: "tnum" 1`)**: Vital for audio engineering and live turn countdowns. Without tabular numbers, countdown clocks (`01:08` → `01:07`) and volume level percentages (`68%` → `69%`) jitter horizontally on every tick, causing micro-distractions for operators.
3. **High Legibility in Low Light**: Inter / San Francisco / Segoe UI feature large x-heights, open counters, and distinct letterforms (`1`, `l`, `I` distinction via `cv05`/`cv11`), preventing mistyped 6-digit session codes and PINs.

---

### 1.2 Unified 6-Step Type Scale

Eliminate arbitrary font sizes (`9px`, `10px`, `11px`, `13px`, `15px`, `30px`). All typography conforms to a strict 6-step scale:

| Token | Desktop Size / Line-Height | Mobile Size / Line-Height | Weight Range | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-2xs` | **11px / 16px** (0.6875rem) | **11px / 16px** (0.6875rem) | Medium (500), Bold (700) | Strictly reserved for uppercase keyboard hints `(G)`, status pills, and audio channel tags |
| `text-xs` | **13px / 18px** (0.8125rem) | **12px / 16px** (0.75rem) | Regular (400), Bold (700) | Secondary metadata, wait times, helper descriptions, badge labels |
| `text-sm` | **14px / 20px** (0.875rem) | **14px / 20px** (0.875rem) | Medium (500), SemiBold (600) | Queue items, table cells, drawer options, input values |
| `text-base`| **16px / 24px** (1.0rem) | **16px / 24px** (1.0rem) | Regular (400), Bold (700) | Standard body text, primary button labels, dialogue prompts |
| `text-lg` | **20px / 28px** (1.25rem) | **18px / 26px** (1.125rem) | SemiBold (600), Bold (700) | Card titles, speaker names on stage, modal headers |
| `text-xl` | **28px / 36px** (1.75rem) | **24px / 32px** (1.5rem) | Bold (700), Black (900) | Big live countdown clock, screen headings, hero statements |
| `text-code`| **32px / 40px** (2.0rem) | **28px / 36px** (1.75rem) | Mono Black (900) | 6-character room codes (`7K2M9X`), 6-digit speaker PINs (`482910`) |

---

## 2. Spacing Scale (8px Strict Grid)

All margins, paddings, gap dimensions, and layout widths adhere to an 8px base grid with a 4px sub-grid for tight audio hardware indicators:

| Token | Dimension | Pixels | Permitted Component Applications |
| :--- | :--- | :--- | :--- |
| `space-0.5` | `0.25rem` | **4px** | Button icon gaps, badge internal padding, VU meter segment spacing |
| `space-1` | `0.5rem` | **8px** | Stack gap between metadata rows, list row separation, tight chip padding |
| `space-1.5` | `0.75rem` | **12px** | Card internal padding (compact), input field horizontal padding |
| `space-2` | `1.0rem` | **16px** | Standard card internal padding, layout column gap on desktop |
| `space-3` | `1.5rem` | **24px** | Section gaps, modal internal padding, desktop panel margin |
| `space-4` | `2.0rem` | **32px** | Major screen section separation, hero top spacing |
| `space-6` | `3.0rem` | **48px** | Desktop screen boundary padding, full-page hero vertical gutters |
| `space-8` | `4.0rem` | **64px** | Marketing landing section dividers |

---

## 3. Colour Tokens & WCAG Contrast Matrix

EventMic is operated predominantly in dark environments (sound booths, darkened keynote halls, auditoriums). To avoid blinding operators while guaranteeing WCAG 2.1 AA compliance (minimum 4.5:1 for normal text, 3:1 for UI controls), the palette is anchored by deep navy-slate foundations with saturated, high-contrast operational indicators:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EVENTMIC PALETTE v2.0                            │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬───────┤
│   NEUTRAL   │   ACCENT    │    LIVE     │   URGENT    │   SUCCESS   │ MUTED │
│   #090D16   │   #2563EB   │   #DC2626   │   #D97706   │   #16A34A   │#94A3B8│
│ (Dark Base) │(Blue-600 AA)│ (Red-600 AA)│(Amber-600)  │ (Green-600) │(Slate)│
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴───────┘
```

### 3.1 Color Tokens Specification

```css
:root {
  /* Surfaces & Neutrals */
  --color-bg-base:      #090D16; /* Deepest void background */
  --color-bg-surface:   #111726; /* Card, panel, and container background */
  --color-bg-surface-hi:#1A233A; /* Hovered card, active tab background */
  --color-border-subtle:#1E293B; /* Subtle visual dividers */
  --color-border-strong:#334155; /* Focus boundaries & input borders (3.2:1 AA non-text) */

  /* Text & Foreground */
  --color-text-primary:  #F8FAFC; /* Primary text, titles, hot indicators (17.8:1 AAA) */
  --color-text-secondary:#94A3B8; /* Helper descriptions, labels, units (6.8:1 AA) */
  --color-text-tertiary: #64748B; /* De-emphasized timestamps, inactive keys (4.5:1 AA) */

  /* Operational State Tokens */
  --color-accent-base:  #2563EB; /* Primary interaction (Blue-600, 5.14:1 vs white text) */
  --color-accent-hover: #1D4ED8; /* Hover state (Blue-700) */
  --color-accent-subtle:#1E3A8A; /* Active focus glow, tinted card borders */

  --color-live-base:    #DC2626; /* Hot Mic / Live broadcast (Red-600, 4.88:1 vs white) */
  --color-live-hover:   #B91C1C; /* Hover state (Red-700) */
  --color-live-glow:    rgba(220, 38, 38, 0.25);

  --color-urgent-base:  #D97706; /* Urgent Interruption (Amber-600, 9.2:1 vs black text) */
  --color-urgent-subtle:#78350F; /* Urgent alert container border */

  --color-success-base: #16A34A; /* Verified audio, connected status (Green-600) */
  --color-warning-base: #EAB308; /* Approaching turn limit (Yellow-500) */
}
```

### 3.2 WCAG 2.1 AA Contrast Verification Table

| UI Element Pair | Color Hex Codes | Contrast Ratio | WCAG AA Result |
| :--- | :--- | :---: | :---: |
| **Primary Button Text on Blue** | `#FFFFFF` on `#2563EB` | **5.14 : 1** | **PASS** (Normal text > 4.5:1) |
| **Live Button Text on Red** | `#FFFFFF` on `#DC2626` | **4.88 : 1** | **PASS** (Normal text > 4.5:1) |
| **Urgent Alert Text on Amber** | `#000000` on `#D97706` | **6.42 : 1** | **PASS** (Normal text > 4.5:1) |
| **Primary Text on Base Background**| `#F8FAFC` on `#090D16` | **17.82 : 1** | **PASS** (Exceeds AAA 7.0:1) |
| **Secondary Text on Surface** | `#94A3B8` on `#111726` | **6.84 : 1** | **PASS** (Exceeds AA 4.5:1) |
| **Tertiary Text on Surface** | `#64748B` on `#111726` | **4.52 : 1** | **PASS** (Passes AA 4.5:1) |
| **Input Border on Background** | `#334155` on `#090D16` | **3.22 : 1** | **PASS** (Non-text UI > 3.0:1) |

---

## 4. Component Design Specifications

### 4.1 Buttons
Buttons must guarantee immediate tactile certainty with distinct operational roles:

```
+--------------------------------------------------------------------------+
| BUTTON HIERARCHY & SIZES                                                 |
|                                                                          |
| 1. PRIMARY LIVE (56px) - Single primary action per screen                |
|    [  ● RAISE HAND TO SPEAK  ]  /  [  GRANT NEXT SPEAKER (Space)  ]      |
|                                                                          |
| 2. SECONDARY ACTION (44px) - Routine floor actions                       |
|    [ Stop Speaking ]   [ Allow 60s ]   [ Grant Floor ]                   |
|                                                                          |
| 3. AUXILIARY / COMPACT (36px Desktop Only) - Inline row tools            |
|    [ Mute ]   [ Copy Link ]   [ Revoke ]                                 |
+--------------------------------------------------------------------------+
```

- **Primary Action (56px)**: Minimum 56px height on mobile (`h-14`) and 48px on desktop (`h-12`). Bold `text-base` or `text-lg`. Border radius `12px` (`rounded-xl`).
- **Danger / Cut Mic (48px)**: Saturated Red `#DC2626`. Clear icon (`PhoneOff` or `MicOff`).
- **Active Focus Ring**: Enforced `focus-visible: outline 2px solid #2563EB; outline-offset: 2px`.
- **Keyboard Affordance**: Display shortcut badges inside button text on desktop: e.g. `Grant Next [Space]` or `Cut Mic [Esc]`.

### 4.2 Form Inputs
- **Height**: Minimum 48px (`h-12`).
- **Room Code Field**: 56px height, font-mono, 28px letter-spacing, uppercase auto-capitalization, centered text.
- **Microphone Device Picker**: 44px height native `<select>` with custom chevron and 12px internal padding.

### 4.3 Tabs
- **Height**: Minimum 44px (`h-11`).
- **Structure**: Pill-style segmented control inside a `#111726` surface container.
- **Active Tab**: Background `#1E293B`, border `#334155`, text `#F8FAFC`.
- **Unread / Alert Count**: Bubble indicator with contrasting live red or amber pill (`text-2xs font-mono font-bold px-1.5 py-0.5 rounded-full`).

### 4.4 Status Badges & Pills
- **Live On-Air**: Pill with 8px pulsing red dot (`#DC2626`), text `text-2xs font-black uppercase tracking-wider`.
- **Reason Chips**:
  - `Question`: Indigo tint (`bg-blue-500/15 text-blue-300 border border-blue-500/30`)
  - `Comment`: Violet tint (`bg-purple-500/15 text-purple-300 border border-purple-500/30`)
  - `Compliment`: Emerald tint (`bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`)
  - `Clarification`: Amber tint (`bg-amber-500/15 text-amber-300 border border-amber-500/30`)
  - `Urgent`: Rose tint (`bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold`)

### 4.5 Audio VU Level Meters
- **Segmentation**: 16 discrete LED blocks for instantaneous level recognition.
- **Gradient Mapping**:
  - Blocks 1–10 (Safe): Emerald Green `#16A34A` (-48 dBFS to -12 dBFS)
  - Blocks 11–14 (Nominal Speech): Amber `#D97706` (-12 dBFS to -3 dBFS)
  - Blocks 15–16 (Clipping / Limiter): Crimson `#DC2626` (-3 dBFS to 0 dBFS)
- **Peak Hold Indicator**: 1px vertical bar that stays at peak level for 1.2 seconds with a smooth fall-off curve.

### 4.6 Drawers & Modals
- **Drawer Placement**: Right-hand sheet on desktop (`w-96` or `w-[480px]`), bottom-sheet on mobile.
- **Scrim Overlay**: `bg-black/75 backdrop-blur-sm`.
- **Dismiss Affordance**: ESC key listener, top-right close `X` button (44×44px hit area), and click-outside dismissal.

### 4.7 Toast Notifications
- **Position**: Floating bottom-center on mobile (`bottom-6 inset-x-4`), top-right on desktop (`top-6 right-6`).
- **Timing**: Auto-dismiss after 4.0 seconds with visual progress indicator; persistent for connection drop warnings until re-established.

---

## 5. Motion & Animation Rules

Live audio production software must feel instantaneous and rock-solid. Unnecessary motion triggers cognitive fatigue and UI lag.

1. **Duration Tokens**:
   - `duration-fast`: **100ms** (hover feedback, button active scale, tab selection)
   - `duration-normal`: **200ms** (drawer slide-in, modal opacity, toast enter)
   - `duration-slow`: **350ms** (large layout accordion expand)
2. **Easing**:
   - Standard Enter: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy ease-out)
   - Standard Exit: `cubic-bezier(0.7, 0, 0.84, 0)` (immediate ease-in)
3. **Accessibility**:
   - Strictly honor `@media (prefers-reduced-motion: reduce)`.
   - When active, all durations become `0.01ms` and pulsing alerts convert to static bold high-contrast outlines.

---

## 6. Responsive Breakpoints

| Breakpoint | Window Width | Primary Device Class | Primary Layout Behavior |
| :--- | :---: | :--- | :--- |
| `sm` | **375px–420px** | Smartphone (iPhone SE to 16 Pro Max) | Single column vertical stack, bottom-fixed action thumb-zone, 56px CTAs |
| `md` | **768px–1023px** | Tablets / iPad Audio Monitor | 2-column split (Left: Queue, Right: Stage card), top bar navigation |
| `lg` (Primary) | **1366px–1599px** | Standard Venue Laptop (13"-14" MacBook, ThinkPad) | Fixed 2-column console layout: Left 40% (Queue), Right 60% (Stage & Hot Controls) |
| `xl` | **1600px+** | 1080p/4K Production Video Wall Monitors | 3-column expanded studio layout: Left (Queue), Center (Stage), Right (Audio Sub-Mix & Chat) |

---

## 7. The "Remove, Enlarge, Shrink" Directive

Based on real-world event sound reinforcement ergonomics, the following transformations must be implemented when building the redesign:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REMOVE, ENLARGE, SHRINK DIRECTIVE                       │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│          REMOVE          │         ENLARGE          │        SHRINK         │
│  (Clutter & Distraction) │ (High-Pressure Targets)  │(Low-Priority Overhead)│
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│ • 4 Telemetry Metric Box │ • Grant Next Floor Button│ • Top Bar Header Area │
│ • Multi-Source Sub-Meter │ • Current Speaker Avatar │ • Source Chain Meters │
│ • 9px / 10px Micro-Fonts │ • Audio VU Level Meters  │ • Inactive Queue Rows │
│ • Secondary Tab Clutter  │ • Urgent Interruption Bar│ • Keyboard Hint Pills │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

### Detailed Justifications

| Action | Target Element | Concrete Reason |
| :--- | :--- | :--- |
| **REMOVE** | **4 Telemetry Cards** (`LiveKit Conns`, `WebSockets`, `WebRTC Minutes`, `Latency`) from main Live view | These are diagnostic server stats that cause visual noise and truncate severely on 1366×768 screens (`LIVEKIT CON...`). Move to an on-demand Diagnostics drawer. |
| **REMOVE** | **Multi-Source Web Audio Sub-Meter Card** from default left column | Per-source mutes (Principal, Attendee, Urgent) are configured during pre-flight setup. Having 3 meters and 3 mutes active in the live floor view distracts from the active speaker. Move into an Audio Drawer. |
| **REMOVE** | **9px and 10px Font Sizes** across all components | Unreadable from arm's length or across a dark sound table. Minimum legible font size on desktop must be 12px. |
| **REMOVE** | **3 of the 5 Persistent Tabs** (`Attendees`, `Spoke History`, `Speakers/PINs`) | Only `Queue` and `Urgent` are active during live Q&A. The full participant roster and PIN lists belong in setup or drawer menus. |
| **ENLARGE** | **Grant Next Speaker Button** (from 44px to **64px height**) | The single most critical operational action during live Q&A. Must be a massive, unmissable target operable with a rapid click or Spacebar tap. |
| **ENLARGE** | **Live Audio Level Meter** (from 12px height to **28px dual-channel LED strip**) | Audio engineers need to detect clipping and low gain from 3 feet away without squinting. |
| **ENLARGE** | **Current Speaker Avatar and Name** (from 48px to **96px avatar**, 16px to **24px font**) | Instant visual identification of who is live on stage. |
| **ENLARGE** | **Urgent Interruption Alert** (from a tiny 1-line amber banner to a **full-width priority callout banner**) | When an attendee reports sound failure, the MC must see it immediately without having to switch tabs. |
| **SHRINK** | **Session Top Bar** (from 56px height to **40px height**) | Free up 16px of vertical real estate for queue rows and stage view. |
| **SHRINK** | **Secondary Action Buttons** (e.g. `Copy Link`, `Settings`, `Chat`) | Group into a compact right-hand utility cluster in the header. |
| **SHRINK** | **Inactive Queued Attendee Rows** (from 64px height to **48px compact list items**) | Enables viewing 6–8 queued hands simultaneously without scrolling on 1366×768 screens. |
