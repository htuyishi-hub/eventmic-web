# EventMic Web — Deployment Guide

This guide describes how to deploy `eventmic-web` to **Vercel** (or any static hosting provider like Netlify or Cloudflare Pages).

---

## 1. Architectural Overview & Critical Rules

- **Framework**: Vite + React single-page application (SPA).
- **Static Artifacts**: The production build produces pre-compiled HTML, CSS, and JS in `dist/`.
- **Public Variables**: Any environment variable prefixed with `VITE_` is baked into the browser JavaScript bundle and visible to any client.
  > [!CAUTION]
  > **No Secrets in Frontend**: Never add API keys, secrets, or passcodes to `VITE_*` variables. `VITE_HOST_PASSCODE` has been completely removed. Admin passcodes are entered by the user in `/admin` and authenticated directly by the server.

---

## 2. WebSocket & Vercel Limitations

> [!IMPORTANT]
> **Vercel Serverless Rewrites Do NOT Support WebSockets!**
> While HTTP requests can be proxied via `vercel.json` rewrites, Vercel Serverless and Edge infrastructure cannot maintain persistent WebSocket connections.
> Therefore, **`VITE_SOCKET_URL` MUST point directly to your deployed backend server's WSS endpoint** (e.g. `wss://eventmic-server.onrender.com/ws`), NOT a relative path or Vercel domain.

---

## 3. Environment Variables for Vercel

Configure these environment variables in your Vercel Project Settings under **Settings** -> **Environment Variables**:

| Variable | Required | Recommended Production Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_TRANSPORT` | **Yes** | `livekit` | Active transport layer. Must be `livekit` in production. Demo mode is tree-shaken in production. |
| `VITE_API_BASE` | **Yes** | `https://<YOUR_SERVER_URL>/api` | Direct HTTPS URL to your deployed server API. |
| `VITE_SOCKET_URL` | **Yes** | `wss://<YOUR_SERVER_URL>/ws` | Direct WSS URL to your deployed server WebSocket endpoint. |
| `VITE_APP_VERSION` | No | `1.0.0` (or Git commit hash) | Optional version identifier displayed in `/admin` and `/speaker` footers. |

---

## 4. Deployment on Vercel

### Option A: Via Vercel Web Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Select your repository: `htuyishi-hub/eventmic-web`.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `.` (or `eventmic-web` if part of a monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Expand **Environment Variables** and add:
   - `VITE_TRANSPORT`: `livekit`
   - `VITE_API_BASE`: `https://<YOUR_SERVER_URL>/api`
   - `VITE_SOCKET_URL`: `wss://<YOUR_SERVER_URL>/ws`
5. Click **Deploy**.

### Option B: Via Vercel CLI

```bash
# In eventmic-web directory
npm install -g vercel
vercel
```

---

## 5. Routing, Deep Links, and vercel.json

`eventmic-web` includes a pre-configured [vercel.json](file:///home/antigravity/htuyishi-hub/eventmic-web/vercel.json) that ensures SPA deep linking works reliably:

```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://eventmic-server.onrender.com/api/$1"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

This guarantees:
1. Navigating or refreshing directly to deep links like `/admin`, `/speaker`, or `/join/:code` will not 404, falling back to `/index.html`.
2. Developer gallery (`/dev/gallery`) and demo controls are tree-shaken and disabled in production builds.

---

## 6. Verification Checklist After Deployment

- [ ] Open `https://<your-app>.vercel.app/admin`: Confirm Passcode gate loads and footer displays version tag.
- [ ] Open `https://<your-app>.vercel.app/speaker`: Confirm speaker login screen loads and mic permission check prompt works.
- [ ] Open `https://<your-app>.vercel.app/join/DEMO12`: Refresh page to verify no 404 error occurs.
- [ ] Check browser Developer Tools -> Network tab -> WS: Verify WebSocket connects cleanly to `wss://<YOUR_SERVER_URL>/ws`.
- [ ] Verify CORS: Ensure browser console does not report any CORS or WebSocket origin rejections. If it does, add the Vercel domain to `ALLOWED_ORIGINS` on the server.

---

## 7. Rollback Procedure

- **Instant Rollback via Vercel**:
  1. Open the Vercel Dashboard for the project.
  2. Navigate to the **Deployments** tab.
  3. Find the previous stable deployment and select **...** -> **Promote to Production** (or **Rollback**).
- **Git Rollback**:
  - Known stable 3-phone verified tag: `last-working-3phones` (commit `d3efffa`).
  - To checkout the tag locally:
    ```bash
    git checkout last-working-3phones
    ```
