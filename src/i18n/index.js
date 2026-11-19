import { en } from './en.js';

let currentDictionary = en;

/**
 * Access a nested string key (e.g. 'admin.queue.empty') and interpolate params.
 * @param {string} key
 * @param {Record<string, any>} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  const parts = key.split('.');
  let val = currentDictionary;
  for (const part of parts) {
    if (val && typeof val === 'object' && part in val) {
      val = val[part];
    } else {
      return key; // fallback to key
    }
  }

  if (typeof val !== 'string') return key;

  return val.replace(/\{\{(\w+)\}\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : ''));
}

export function setLanguage(dict) {
  currentDictionary = dict;
}
