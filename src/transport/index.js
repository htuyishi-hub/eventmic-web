import { MockTransport } from './mockTransport.js';
import { LiveKitTransport } from './livekitTransport.js';

let DemoTransportClass = null;
if (import.meta.env.DEV) {
  try {
    const mod = await import('./demoTransport.js');
    DemoTransportClass = mod.DemoTransport;
  } catch {}
}

/**
 * Creates and returns the active transport instance based on configuration.
 * Demo mode and ?demo=true / localStorage switches are strictly dev-only.
 * @param {object} [options]
 * @returns {import('./types.js').TransportInterface}
 */
export function createTransport(options = {}) {
  let type = options.type;

  if (import.meta.env.DEV) {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isUrlDemo = urlParams?.get('demo') === 'true' || urlParams?.get('transport') === 'demo';
    const savedTransport = typeof localStorage !== 'undefined' ? localStorage.getItem('eventmic_transport') : null;
    if (isUrlDemo || savedTransport === 'demo') {
      type = 'demo';
    } else if (!type && savedTransport) {
      type = savedTransport;
    }
  }

  type = (type || import.meta.env?.VITE_TRANSPORT || 'mock').toLowerCase();

  if (import.meta.env.DEV && type === 'demo' && DemoTransportClass) {
    return new DemoTransportClass(options);
  }

  if (type === 'livekit') {
    return new LiveKitTransport(options);
  }

  return new MockTransport(options);
}
