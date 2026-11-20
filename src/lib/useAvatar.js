import { useSession } from '../context/SessionContext.jsx';
import { useTransport } from '../context/TransportContext.jsx';
import { useAvatarUrl } from './avatarCache.js';

/**
 * Resolves an avatar blob URL for any participant honoring hasAvatar and avatarVersion.
 * Pure presentational components receive the resolved src string.
 * @param {{ id?: string, attendeeId?: string, hasAvatar?: boolean, avatarVersion?: number } | null} person
 * @returns {string | null}
 */
export function useResolvedAvatarSrc(person) {
  const { session } = useSession();
  const { transport } = useTransport();

  const code = session?.code || transport?.code;
  const token = transport?.apiToken;
  const apiBase = transport?.apiBase;

  const identity = person?.id || person?.attendeeId;
  const hasAvatar = person?.hasAvatar;
  const version = hasAvatar ? (person?.avatarVersion || 1) : 0;

  return useAvatarUrl(code, identity, version, token, apiBase);
}
