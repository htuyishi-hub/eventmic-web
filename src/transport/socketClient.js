/**
 * Realtime WebSocket client for EventMic signaling and presence.
 * Handles authentication, heartbeats (25s), exponential backoff reconnection,
 * and per-session message routing without touching WebRTC.
 */

export class SocketClient {
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || this._deriveWsUrl(options.apiBase);
    this.token = null;
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.isConnected = false;
    this.isExplicitlyClosed = false;
  }

  _deriveWsUrl(apiBase) {
    if (typeof window === 'undefined') return 'ws://localhost:3001/ws';
    const raw = apiBase || import.meta.env?.VITE_API_BASE || '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw.replace(/^http/, 'ws').replace(/\/api\/?$/, '/ws');
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${proto}//${host}/ws`;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => {
      const set = this.listeners.get(event);
      if (set) set.delete(handler);
    };
  }

  emit(event, data) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(fn => {
        try { fn(data); } catch (e) { console.error(`[SocketClient] error on '${event}':`, e); }
      });
    }
  }

  connect(token) {
    this.token = token;
    this.isExplicitlyClosed = false;
    this._initSocket();
  }

  _initSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }

    const fullUrl = this.token
      ? `${this.wsUrl}${this.wsUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(this.token)}`
      : this.wsUrl;

    try {
      this.ws = new WebSocket(fullUrl);
    } catch (err) {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', 'connected');
      this._startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type) {
          this.emit(msg.type, msg);
          this.emit('message', msg);
        }
      } catch (err) {
        console.warn('[SocketClient] Failed to parse message:', err);
      }
    };

    this.ws.onerror = () => {
      this.emit('connection', 'reconnecting');
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this._stopHeartbeat();
      if (!this.isExplicitlyClosed) {
        this.emit('connection', 'reconnecting');
        this._scheduleReconnect();
      } else {
        this.emit('connection', 'disconnected');
      }
    };
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 25000);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  _scheduleReconnect() {
    if (this.isExplicitlyClosed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this._initSocket();
    }, delay);
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type, ...payload }));
      } catch (e) {
        console.warn('[SocketClient] Send error:', e);
      }
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this._stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.isConnected = false;
    this.emit('connection', 'disconnected');
  }
}
