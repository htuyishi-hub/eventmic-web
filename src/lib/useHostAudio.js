import { useState, useEffect, useRef, useCallback } from 'react';
import { HostAudioEngine } from './hostAudio.js';
import { enumerateOutputDevices, loadSavedDevice } from './audioDevices.js';

export function useHostAudio(transport, floor, isMuted, showToast) {
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new HostAudioEngine();
  }
  const engine = engineRef.current;

  const [audioDevices, setAudioDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState('');
  const [activeDeviceLabel, setActiveDeviceLabel] = useState('Default Audio Output');
  const [unpluggedWarning, setUnpluggedWarning] = useState('');
  const [volume, setVolumeState] = useState(1.0);
  const [isContextSuspended, setIsContextSuspended] = useState(false);
  const [liveLevels, setLiveLevels] = useState({ in: 0, out: 0, clipping: false, limiterActive: false });
  const [isClipping, setIsClipping] = useState(false);
  const clipTimerRef = useRef(null);

  // Sync mute with engine
  useEffect(() => {
    engine.setMuted(isMuted);
  }, [engine, isMuted]);

  // Volume change handler
  const setVolume = useCallback((vol) => {
    setVolumeState(vol);
    engine.setVolume(vol);
  }, [engine]);

  // Device Selection
  const selectOutputDevice = useCallback(async (deviceId) => {
    const dev = audioDevices.find(d => d.deviceId === deviceId);
    const label = dev?.label || (deviceId === 'default' || !deviceId ? 'Default Audio Output' : 'Audio Output');
    setActiveDeviceId(deviceId || '');
    setActiveDeviceLabel(label);
    engine.activeDeviceLabel = label;
    await engine.setOutputDevice(deviceId);
  }, [engine, audioDevices]);

  // Device list refresh
  const refreshDevices = useCallback(async (explicitDevices = null) => {
    const devs = explicitDevices || (await enumerateOutputDevices());
    setAudioDevices(devs);
    return devs;
  }, []);

  // Initialization & Device enumeration
  useEffect(() => {
    let mounted = true;
    (async () => {
      const devs = await enumerateOutputDevices();
      if (!mounted) return;
      setAudioDevices(devs);

      const { activeDeviceId: devId, activeDeviceLabel: devLabel, missingDevice } = loadSavedDevice(devs);
      setActiveDeviceId(devId);
      setActiveDeviceLabel(devLabel);
      engine.activeDeviceLabel = devLabel;
      await engine.setOutputDevice(devId);

      if (missingDevice) {
        showToast?.(`Previous audio output "${missingDevice.label || missingDevice.id}" not found. Reverted to default output.`);
      }
    })();

    // Listen to engine events
    const unsubUnplugged = engine.on('device_unplugged', ({ disconnectedDevice }) => {
      setUnpluggedWarning(`Audio device "${disconnectedDevice || 'active output'}" was disconnected. Output safely switched to default.`);
      setActiveDeviceId('');
      setActiveDeviceLabel('Default Audio Output');
    });

    const unsubState = engine.on('stateChange', (st) => {
      setIsContextSuspended(st === 'suspended');
    });

    const unsubDev = engine.on('devicechange', async () => {
      const refreshed = await enumerateOutputDevices();
      setAudioDevices(refreshed);
    });

    return () => {
      mounted = false;
      unsubUnplugged();
      unsubState();
      unsubDev();
    };
  }, [engine, showToast]);

  // Wire speaker stream from LiveKitTransport
  useEffect(() => {
    if (!transport) return;
    const unsub = transport.on?.('speakerStream', (stream) => {
      engine.attachStream(stream);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [transport, engine]);

  // Detach stream when floor ends
  useEffect(() => {
    if (!floor) {
      engine.attachStream(null);
    }
  }, [floor, engine]);

  // Metering & Clip-holding interval (runs at 50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const lvls = engine.getLevels();
      setLiveLevels(lvls);

      if (lvls.clipping) {
        setIsClipping(true);
        if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
        clipTimerRef.current = setTimeout(() => {
          setIsClipping(false);
        }, 2000);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
    };
  }, [engine]);

  // Auto-resume on ANY user interaction
  const resumeAudio = useCallback(async () => {
    await engine.resume();
    setIsContextSuspended(false);
  }, [engine]);

  useEffect(() => {
    const handleGesture = () => {
      if (engine.ctx && engine.ctx.state === 'suspended') {
        engine.resume();
      }
    };
    window.addEventListener('click', handleGesture, { capture: true });
    window.addEventListener('keydown', handleGesture, { capture: true });
    return () => {
      window.removeEventListener('click', handleGesture, { capture: true });
      window.removeEventListener('keydown', handleGesture, { capture: true });
    };
  }, [engine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engine.dispose();
    };
  }, [engine]);

  return {
    audioEngine: engine,
    audioDevices,
    activeDeviceId,
    activeDeviceLabel,
    unpluggedWarning,
    dismissUnpluggedWarning: () => setUnpluggedWarning(''),
    selectOutputDevice,
    refreshDevices,
    attachMicStream: (stream) => engine.attachStream(stream),
    volume,
    setVolume,
    liveLevels,
    isClipping,
    isContextSuspended,
    resumeAudio
  };
}
