import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAvatarUrl, releaseAvatarUrl, clearAvatarCache } from './avatarCache.js';

describe('avatarCache', () => {
  beforeEach(() => {
    clearAvatarCache();
    global.URL.createObjectURL = vi.fn(() => `blob:mock-url-${Math.random().toString(36).substring(2, 7)}`);
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    clearAvatarCache();
    vi.restoreAllMocks();
  });

  it('fetches and creates blob URL when not cached', async () => {
    const mockBlob = new Blob(['fake-image'], { type: 'image/webp' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => mockBlob
    });

    const url1 = await getAvatarUrl('SESS1', 'user1', 1, 'token123');
    expect(url1).toMatch(/^blob:mock-url-/);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call with same version uses cached blob URL and increments ref
    const url2 = await getAvatarUrl('SESS1', 'user1', 1, 'token123');
    expect(url2).toBe(url1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates in-flight fetch requests for the same identity:version', async () => {
    let resolveBlob;
    const pendingPromise = new Promise((resolve) => { resolveBlob = resolve; });
    global.fetch = vi.fn().mockImplementation(() => pendingPromise);

    const promise1 = getAvatarUrl('SESS1', 'user2', 1, 'token123');
    const promise2 = getAvatarUrl('SESS1', 'user2', 1, 'token123');

    resolveBlob({
      ok: true,
      blob: async () => new Blob(['img'])
    });
    const [u1, u2] = await Promise.all([promise1, promise2]);

    expect(u1).toBe(u2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('ref counts and revokes URL only when refs reach zero', async () => {
    const mockBlob = new Blob(['data'], { type: 'image/webp' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => mockBlob
    });

    const url = await getAvatarUrl('SESS1', 'user3', 1, 'token123');
    await getAvatarUrl('SESS1', 'user3', 1, 'token123'); // ref count = 2

    releaseAvatarUrl('user3', 1); // ref count = 1
    expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();

    releaseAvatarUrl('user3', 1); // ref count = 0 -> revokes
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url);
  });

  it('clears all cached URLs and revokes them on clearAvatarCache()', async () => {
    const mockBlob = new Blob(['data'], { type: 'image/webp' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => mockBlob
    });

    const urlA = await getAvatarUrl('SESS1', 'userA', 1, 'token123');
    const urlB = await getAvatarUrl('SESS1', 'userB', 1, 'token123');

    clearAvatarCache();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(urlA);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(urlB);
  });
});
