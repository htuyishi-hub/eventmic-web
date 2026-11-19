/**
 * Output audio device management, permissions, and persistence.
 */

export const DEVICE_ID_KEY = 'eventmic_output_device_id';
export const DEVICE_LABEL_KEY = 'eventmic_output_device_label';

export async function enumerateOutputDevices() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'audiooutput');
  } catch (err) {
    console.warn('[AudioDevices] Error enumerating devices:', err);
    return [];
  }
}

export function hasDeviceLabels(devices = []) {
  return devices.some(d => Boolean(d.label && d.label.trim().length > 0));
}

export async function requestDeviceLabelsPermission() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return [];
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return await enumerateOutputDevices();
  } catch (err) {
    console.warn('[AudioDevices] Mic permission request was denied or failed:', err);
    return await enumerateOutputDevices();
  }
}

export function loadSavedDevice(devices = []) {
  if (typeof localStorage === 'undefined') {
    return { activeDeviceId: '', activeDeviceLabel: 'Default Output', missingDevice: null };
  }

  const savedId = localStorage.getItem(DEVICE_ID_KEY);
  const savedLabel = localStorage.getItem(DEVICE_LABEL_KEY);

  if (!savedId || savedId === 'default') {
    const defaultDev = devices.find(d => d.deviceId === 'default') || devices[0];
    return {
      activeDeviceId: defaultDev?.deviceId || '',
      activeDeviceLabel: defaultDev?.label || 'Default Audio Output',
      missingDevice: null
    };
  }

  const found = devices.find(d => d.deviceId === savedId);
  if (found) {
    return {
      activeDeviceId: found.deviceId,
      activeDeviceLabel: found.label || savedLabel || 'Audio Output',
      missingDevice: null
    };
  }

  try {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(DEVICE_LABEL_KEY);
  } catch {}

  const fallback = devices.find(d => d.deviceId === 'default') || devices[0];
  return {
    activeDeviceId: fallback?.deviceId || '',
    activeDeviceLabel: fallback?.label || 'Default Audio Output',
    missingDevice: { id: savedId, label: savedLabel || savedId }
  };
}

export function saveActiveDevice(deviceId, deviceLabel) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (!deviceId || deviceId === 'default') {
      localStorage.removeItem(DEVICE_ID_KEY);
      localStorage.removeItem(DEVICE_LABEL_KEY);
    } else {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      if (deviceLabel) {
        localStorage.setItem(DEVICE_LABEL_KEY, deviceLabel);
      }
    }
  } catch {}
}

export function isDeviceUnplugged(activeDeviceId, newDevices = []) {
  if (!activeDeviceId || activeDeviceId === 'default') return false;
  return !newDevices.some(d => d.deviceId === activeDeviceId);
}

export function listenDeviceChanges(handler) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.addEventListener) {
    return () => {};
  }
  navigator.mediaDevices.addEventListener('devicechange', handler);
  return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
}
