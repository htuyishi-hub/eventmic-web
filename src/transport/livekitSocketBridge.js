/**
 * Binds SocketClient events to LiveKitTransport handlers.
 */

export function attachSocketListeners(transport, socketClient, sessionManager) {
  socketClient.on('connection', (st) => transport.setConnectionState(st));

  socketClient.on('init', (d) => {
    if (d.session) transport.emit('session', d.session);
    if (d.queue) transport.emit('queue', d.queue);
    if (d.floor !== undefined) transport.emit('floor', d.floor);
    if (d.attendeeCount !== undefined) transport.emit('attendees', { count: d.attendeeCount });
    if (d.metrics) transport.emit('metrics', d.metrics);
  });

  socketClient.on('queue_update', (d) => {
    transport.emit('queue', d.queue);
    if (d.attendeeCount !== undefined) transport.emit('attendees', { count: d.attendeeCount });
    if (d.fairModeActive !== undefined) transport.emit('fairMode', d.fairModeActive);
  });

  socketClient.on('queue_position', (d) => {
    transport.emit('queue_position', d.position);
    if (d.attendeeCount !== undefined) transport.emit('attendees', { count: d.attendeeCount });
  });

  socketClient.on('floor_update', (d) => transport.emit('floor', d.floor));
  socketClient.on('preempted', (d) => transport.emit('preempted', d.message));
  socketClient.on('duck_stage', (d) => transport.emit('duck_stage', d));
  socketClient.on('turn_warning', (d) => transport.emit('turn_warning', d.secondsLeft));
  socketClient.on('metrics_update', (d) => transport.emit('metrics', d.metrics));

  socketClient.on('turn_granted', async (d) => {
    const startMs = Date.now();
    transport.setSelfState('preparing');
    try {
      await sessionManager.connectRoom(d.livekitUrl, d.token, transport.role);
      await sessionManager.publishMic(transport.preWarmedStream);
      socketClient.send('record_latency', { grantToAudioMs: Date.now() - startMs, role: transport.role });
      transport.setSelfState('on_air');
      transport.emit('turn_granted', { ...d, grantToAudioMs: Date.now() - startMs });
    } catch {
      socketClient.send('livekit_failed', {});
      transport.setSelfState('listening');
      transport.emit('error', { code: 'LIVEKIT_CONNECT_FAILED', message: 'Connection failed, you are still in line' });
    }
  });

  socketClient.on('turn_ended', async () => {
    await sessionManager.disconnect();
    transport.setSelfState('listening');
  });
}
