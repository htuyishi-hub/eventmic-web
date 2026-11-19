import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveKitTransport } from './livekitTransport.js';
import { SourceChainManager } from '../lib/sourceChains.js';
import { createMockAudioContext } from '../lib/mockAudioContext.js';

describe('Connect-on-Speak & Multi-Source Subsystem', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('LiveKitTransport Connect-on-Speak turn events', () => {
    it('handles turn_granted: transitions to preparing and records latency', async () => {
      const transport = new LiveKitTransport({ apiBase: 'http://localhost:3001' });
      transport.role = 'attendee';

      const socketSendSpy = vi.spyOn(transport.socketClient, 'send').mockImplementation(() => {});
      const connectRoomSpy = vi.spyOn(transport.sessionManager, 'connectRoom').mockResolvedValue({});
      const publishMicSpy = vi.spyOn(transport.sessionManager, 'publishMic').mockResolvedValue({});

      const selfEvents = [];
      transport.on('self', (st) => selfEvents.push(st));

      // Simulate turn_granted received on WebSocket
      transport.socketClient.emit('turn_granted', {
        token: 'fake-jwt',
        livekitUrl: 'wss://demo.livekit.cloud'
      });

      // Allow async chain to execute
      await new Promise(r => setTimeout(r, 20));

      expect(connectRoomSpy).toHaveBeenCalledWith('wss://demo.livekit.cloud', 'fake-jwt', 'attendee');
      expect(publishMicSpy).toHaveBeenCalled();
      expect(socketSendSpy).toHaveBeenCalledWith('record_latency', expect.objectContaining({
        role: 'attendee',
        grantToAudioMs: expect.any(Number)
      }));
      expect(selfEvents).toContain('preparing');
      expect(selfEvents).toContain('on_air');
    });

    it('handles turn_ended: disconnects LiveKit session and resets state to listening', async () => {
      const transport = new LiveKitTransport({ apiBase: 'http://localhost:3001' });
      transport.selfState = 'on_air';

      const disconnectSpy = vi.spyOn(transport.sessionManager, 'disconnect').mockResolvedValue({});

      const selfEvents = [];
      transport.on('self', (st) => selfEvents.push(st));

      transport.socketClient.emit('turn_ended', {});
      await new Promise(r => setTimeout(r, 10));

      expect(disconnectSpy).toHaveBeenCalled();
      expect(selfEvents).toContain('listening');
      expect(transport.selfState).toBe('listening');
    });

    it('sends urgent_request over websocket on urgentRequest()', async () => {
      const transport = new LiveKitTransport({ apiBase: 'http://localhost:3001' });
      const socketSendSpy = vi.spyOn(transport.socketClient, 'send').mockImplementation(() => {});

      await transport.urgentRequest();
      expect(socketSendSpy).toHaveBeenCalledWith('urgent_request', {});
    });
  });

  describe('SourceChainManager Multi-Source Audio & Ducking', () => {
    it('ducks non-urgent audio to 30% and restores to 100%', () => {
      const mockCtx = createMockAudioContext({ maxChannelCount: 2 });
      const volumeGain = mockCtx.createGain();
      const manager = new SourceChainManager(mockCtx, volumeGain);

      // Duck to 30%
      manager.duckStage(true, 0.3);
      expect(manager.isDucked).toBe(true);
      expect(manager.duckGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.3, 10.05);

      // Restore to 100%
      manager.duckStage(false);
      expect(manager.isDucked).toBe(false);
      expect(manager.duckGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1.0, 10.05);
    });

    it('supports instant per-source muting', () => {
      const mockCtx = createMockAudioContext({ maxChannelCount: 2 });
      const volumeGain = mockCtx.createGain();
      const manager = new SourceChainManager(mockCtx, volumeGain);

      manager.muteSource('principal', true);
      expect(manager.mutes.principal).toBe(true);

      const lvls = manager.getLevels();
      expect(lvls.principal.muted).toBe(true);
      expect(lvls.attendee.muted).toBe(false);

      manager.muteSource('principal', false);
      expect(manager.mutes.principal).toBe(false);
    });
  });
});
