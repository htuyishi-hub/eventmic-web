import { Room, RoomEvent, AudioPresets, Track } from 'livekit-client';

/**
 * Manages LiveKit Room connection lifecycle for Connect-on-Speak.
 * Keeps WebRTC connections active only when holding floor or on-deck.
 */
export class LiveKitSessionManager {
  constructor(options = {}) {
    this.room = null;
    this.localTrack = null;
    this.grantTimestamp = 0;
    this.onTrackSubscribed = options.onTrackSubscribed || (() => {});
    this.onTrackUnsubscribed = options.onTrackUnsubscribed || (() => {});
    this.onAudioPlaybackChanged = options.onAudioPlaybackChanged || (() => {});
  }

  createRoom() {
    return new Room({
      adaptiveStream: false,
      dynacast: false,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1
      },
      publishDefaults: {
        audioPreset: AudioPresets.speech, // Opus ~40kbps mono speech
        audioBitrate: 40000,
        dtx: true,
        red: false
      }
    });
  }

  async connectRoom(url, token, role) {
    if (this.room) {
      await this.disconnect();
    }

    this.room = this.createRoom();

    if (role === 'admin') {
      this.room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
        if (track.kind === Track.Kind.Audio || track.kind === 'audio') {
          if (track.mediaStreamTrack) {
            const stream = new MediaStream([track.mediaStreamTrack]);
            const pRole = participant.identity?.startsWith('prn-') || participant.identity?.startsWith('prin-')
              ? 'principal'
              : 'attendee';
            this.onTrackSubscribed(stream, pRole, participant.identity);
          }
        }
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio || track.kind === 'audio') {
          this.onTrackUnsubscribed();
        }
      });
    }

    this.room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      this.onAudioPlaybackChanged(this.room.canPlaybackAudio);
    });

    await this.room.connect(url, token);
    return this.room;
  }

  async publishMic(existingStream) {
    if (!this.room?.localParticipant) return 0;
    const startMs = Date.now();

    try {
      if (existingStream) {
        const audioTracks = existingStream.getAudioTracks();
        if (audioTracks.length > 0) {
          const track = audioTracks[0];
          track.enabled = true;
          this.localTrack = track;
          await this.room.localParticipant.publishTrack(track, {
            name: 'microphone',
            source: Track.Source.Microphone
          });
        }
      } else {
        await this.room.localParticipant.setMicrophoneEnabled(true);
      }
    } catch (err) {
      console.warn('[LiveKitSessionManager] Mic publish error:', err);
    }

    const elapsedMs = Date.now() - startMs;
    return elapsedMs;
  }

  async muteLocalMic(muted) {
    if (this.localTrack) {
      this.localTrack.enabled = !muted;
    }
    if (this.room?.localParticipant) {
      try {
        await this.room.localParticipant.setMicrophoneEnabled(!muted);
      } catch {}
    }
  }

  async disconnect() {
    if (this.room) {
      try {
        if (this.room.localParticipant) {
          await this.room.localParticipant.setMicrophoneEnabled(false);
        }
        await this.room.disconnect();
      } catch {}
      this.room = null;
    }
    this.localTrack = null;
  }
}
