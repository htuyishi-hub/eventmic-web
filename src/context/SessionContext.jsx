import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { useTransport } from './TransportContext.jsx';

const SessionContext = createContext(null);

const initialState = {
  session: null, queue: [], floor: null, level: 0, attendeeCount: 0, attendeeList: [],
  selfState: 'listening', error: null, isMuted: false, principals: [],
  principalQueue: [], fairModeActive: false, preemptedMessage: null,
  speakerStream: null, metrics: null, spoken: [], urgent: [], messages: [],
  announcement: null, settings: null
};

function sessionReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION': return { ...state, session: action.payload };
    case 'SET_QUEUE': return { ...state, queue: action.payload };
    case 'SET_FLOOR': return { ...state, floor: action.payload };
    case 'SET_LEVEL': return { ...state, level: action.payload };
    case 'SET_ATTENDEES': return { ...state, attendeeCount: action.payload.count, attendeeList: action.payload.list || state.attendeeList };
    case 'SET_SELF': return { ...state, selfState: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'CLEAR_ERROR': return { ...state, error: null };
    case 'SET_MUTED': return { ...state, isMuted: action.payload };
    case 'SET_PRINCIPALS': return { ...state, principals: action.payload };
    case 'SET_PRINCIPAL_QUEUE': return { ...state, principalQueue: action.payload };
    case 'SET_FAIR_MODE': return { ...state, fairModeActive: action.payload };
    case 'SET_PREEMPTED': return { ...state, preemptedMessage: action.payload };
    case 'CLEAR_PREEMPTED': return { ...state, preemptedMessage: null };
    case 'SET_SPEAKER_STREAM': return { ...state, speakerStream: action.payload };
    case 'SET_METRICS': return { ...state, metrics: action.payload };
    case 'SET_SPOKEN': return { ...state, spoken: action.payload };
    case 'SET_URGENT': return { ...state, urgent: action.payload };
    case 'SET_MESSAGES': return { ...state, messages: action.payload };
    case 'SET_ANNOUNCEMENT': return { ...state, announcement: action.payload };
    case 'SET_SETTINGS': return { ...state, settings: action.payload };
    case 'RESET': return { ...initialState };
    default: return state;
  }
}

export function SessionProvider({ children }) {
  const { transport } = useTransport();
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  useEffect(() => {
    if (!transport) return;
    const unsubs = [
      transport.on('session', (s) => dispatch({ type: 'SET_SESSION', payload: s })),
      transport.on('queue', (q) => dispatch({ type: 'SET_QUEUE', payload: q })),
      transport.on('floor', (f) => dispatch({ type: 'SET_FLOOR', payload: f })),
      transport.on('level', (l) => dispatch({ type: 'SET_LEVEL', payload: l })),
      transport.on('attendees', (d) => dispatch({ type: 'SET_ATTENDEES', payload: d })),
      transport.on('self', (s) => dispatch({ type: 'SET_SELF', payload: s })),
      transport.on('error', (e) => dispatch({ type: 'SET_ERROR', payload: e })),
      transport.on('principals', (p) => dispatch({ type: 'SET_PRINCIPALS', payload: p })),
      transport.on('principalQueue', (pq) => dispatch({ type: 'SET_PRINCIPAL_QUEUE', payload: pq })),
      transport.on('fairMode', (a) => dispatch({ type: 'SET_FAIR_MODE', payload: a })),
      transport.on('preempted', (m) => dispatch({ type: 'SET_PREEMPTED', payload: m })),
      transport.on('speakerStream', (s) => dispatch({ type: 'SET_SPEAKER_STREAM', payload: s })),
      transport.on('metrics', (m) => dispatch({ type: 'SET_METRICS', payload: m })),
      transport.on('spoken', (s) => dispatch({ type: 'SET_SPOKEN', payload: s })),
      transport.on('urgent', (u) => dispatch({ type: 'SET_URGENT', payload: u })),
      transport.on('messages', (m) => dispatch({ type: 'SET_MESSAGES', payload: m })),
      transport.on('announcement', (a) => dispatch({ type: 'SET_ANNOUNCEMENT', payload: a })),
      transport.on('settings', (st) => dispatch({ type: 'SET_SETTINGS', payload: st }))
    ];
    return () => unsubs.forEach(fn => fn());
  }, [transport]);

  const createSession = useCallback(async ({ name }) => { dispatch({ type: 'CLEAR_ERROR' }); return transport.createSession({ name }); }, [transport]);
  const endSession = useCallback(async () => transport.endSession(), [transport]);
  const connect = useCallback(async (opts) => { dispatch({ type: 'CLEAR_ERROR' }); return transport.connect(opts); }, [transport]);
  const disconnect = useCallback(async () => transport.disconnect(), [transport]);
  const raiseHand = useCallback(async (opts) => transport.raiseHand(opts), [transport]);
  const lowerHand = useCallback(async () => transport.lowerHand(), [transport]);
  const urgentRequest = useCallback(async () => transport.urgentRequest?.(), [transport]);
  const grant = useCallback(async (id) => transport.grant(id), [transport]);
  const revoke = useCallback(async (id) => transport.revoke(id), [transport]);
  const takeFloor = useCallback(async () => transport.takeFloor(), [transport]);
  const requestSpeak = useCallback(async () => transport.requestSpeak(), [transport]);
  const allowPrincipal = useCallback(async (id) => transport.allowPrincipal(id), [transport]);
  const createPrincipal = useCallback(async (name) => transport.createPrincipal(name), [transport]);
  const getPrincipals = useCallback(async () => transport.getPrincipals(), [transport]);
  const revokePrincipal = useCallback(async (id) => transport.revokePrincipal(id), [transport]);
  const regeneratePrincipalPin = useCallback(async (id) => transport.regeneratePrincipalPin(id), [transport]);
  const updateSettings = useCallback(async (s) => transport.updateSettings(s), [transport]);
  const fetchSessionState = useCallback(async () => transport.fetchSessionState(), [transport]);
  const muteSpeaker = useCallback(async (m) => { dispatch({ type: 'SET_MUTED', payload: m }); return transport.muteSpeaker(m); }, [transport]);
  const sendLevel = useCallback(async (lvl) => transport.sendLevel(lvl), [transport]);
  const sendMessage = useCallback(async (text, role) => transport.sendMessage?.(text, role), [transport]);
  const broadcastAnnouncement = useCallback(async (text, type, duration) => transport.broadcastAnnouncement?.(text, type, duration), [transport]);
  const grantUrgent = useCallback(async (id) => transport.grantUrgent?.(id), [transport]);
  const dismissUrgent = useCallback(async (id) => transport.dismissUrgent?.(id), [transport]);
  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);
  const clearPreempted = useCallback(() => dispatch({ type: 'CLEAR_PREEMPTED' }), []);

  const value = {
    ...state, createSession, endSession, connect, disconnect,
    raiseHand, lowerHand, urgentRequest, grant, revoke, takeFloor, requestSpeak,
    allowPrincipal, createPrincipal, getPrincipals, revokePrincipal,
    regeneratePrincipalPin, updateSettings, fetchSessionState,
    muteSpeaker, sendLevel, sendMessage, broadcastAnnouncement,
    grantUrgent, dismissUrgent, clearError, clearPreempted
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
}
