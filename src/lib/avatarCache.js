import { useState, useEffect } from 'react';

/**
 * In-memory Blob URL cache for avatars.
 * Keyed by `${identity}:${version}`.
 * Manages object URL lifecycle and revokes blob URLs on unmount.
 */

// Map<string, { blobUrl: string, refCount: number }>
const cache = new Map();

// Map<string, Promise<string | null>> for in-flight request deduplication
const inFlight = new Map();

/**
 * Fetches an avatar using Authorization header and returns an in-memory blob URL.
 * @param {string} code
 * @param {string} identity
 * @param {number} version
 * @param {string} token
 * @param {string} [apiBase]
 * @returns {Promise<string | null>}
 */
export async function getAvatarUrl(code, identity, version, token, apiBase) {
  if (!identity || !version || version <= 0) return null;
  const key = `${identity}:${version}`;

  const existing = cache.get(key);
  if (existing) {
    existing.refCount++;
    return existing.blobUrl;
  }

  if (inFlight.has(key)) {
    const blobUrl = await inFlight.get(key);
    const item = cache.get(key);
    if (item) item.refCount++;
    return blobUrl;
  }

  const promise = (async () => {
    try {
      const base = apiBase || import.meta.env?.VITE_API_BASE || '/api';
      const cleanBase = base.replace(/\/+$/, '');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${cleanBase}/avatar/${code}/${identity}`, { headers });
      if (!res.ok) return null;

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      cache.set(key, { blobUrl, refCount: 1 });
      return blobUrl;
    } catch {
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * Decrements reference count and revokes blob URL when no components use it.
 * @param {string} identity
 * @param {number} version
 */
export function releaseAvatarUrl(identity, version) {
  if (!identity || !version) return;
  const key = `${identity}:${version}`;
  const item = cache.get(key);
  if (!item) return;

  item.refCount = Math.max(0, item.refCount - 1);
  if (item.refCount === 0) {
    try {
      URL.revokeObjectURL(item.blobUrl);
    } catch {}
    cache.delete(key);
  }
}

/**
 * Clears and revokes all cached blob URLs (e.g. on session end or teardown).
 */
export function clearAvatarCache() {
  for (const item of cache.values()) {
    try {
      URL.revokeObjectURL(item.blobUrl);
    } catch {}
  }
  cache.clear();
  inFlight.clear();
}

/**
 * React hook to load and manage an avatar blob URL lifecycle.
 * @param {string} code
 * @param {string} identity
 * @param {number} version
 * @param {string} [token]
 * @param {string} [apiBase]
 * @returns {string | null}
 */
export function useAvatarUrl(code, identity, version, token, apiBase) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!identity || !version || version <= 0) {
      setUrl(null);
      return;
    }

    let isCurrent = true;
    getAvatarUrl(code, identity, version, token, apiBase).then((blobUrl) => {
      if (isCurrent) {
        setUrl(blobUrl);
      }
    });

    return () => {
      isCurrent = false;
      releaseAvatarUrl(identity, version);
    };
  }, [code, identity, version, token, apiBase]);

  return url;
}
