import { MockTransport } from './mockTransport.js';
import { LiveKitTransport } from './livekitTransport.js';
import { DemoTransport } from './demoTransport.js';

export { DemoTransport } from './demoTransport.js';

/**
 * Creates and returns the active transport instance based on VITE_TRANSPORT environment variable.
 * @param {object} [options]
 * @returns {import('./types.js').TransportInterface}
 */
export function createTransport(options = {}) {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isUrlDemo = urlParams?.get('demo') === 'true' || urlParams?.get('transport') === 'demo';
  const savedTransport = typeof localStorage !== 'undefined' ? localStorage.getItem('eventmic_transport') : null;
  const type = (options.type || (isUrlDemo ? 'demo' : savedTransport) || import.meta.env?.VITE_TRANSPORT || 'mock').toLowerCase();

  if (type === 'demo') {
    return new DemoTransport(options);
  }

  if (type === 'livekit') {
    return new LiveKitTransport(options);
  }

  return new MockTransport(options);
}
