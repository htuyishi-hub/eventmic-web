import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DemoTransport } from './demoTransport.js';

describe('DemoTransport Subsystem', () => {
  let transport;

  beforeEach(() => {
    transport = new DemoTransport({ code: 'DEMO01' });
  });

  afterEach(() => {
    transport.dispose();
  });

  it('initializes and connects as admin with pre-seeded data', async () => {
    const queueSpy = vi.fn();
    const floorSpy = vi.fn();
    const urgentSpy = vi.fn();
    const spokenSpy = vi.fn();
    const attendeesSpy = vi.fn();
    const principalsSpy = vi.fn();

    transport.on('queue', queueSpy);
    transport.on('floor', floorSpy);
    transport.on('urgent', urgentSpy);
    transport.on('spoken', spokenSpy);
    transport.on('attendees', attendeesSpy);
    transport.on('principals', principalsSpy);

    await transport.connect({ role: 'admin', code: 'DEMO01' });

    expect(transport.connectionState).toBe('connected');
    expect(queueSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'Alex Rivera' })
    ]));
    expect(floorSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Sarah Connor',
      role: 'principal'
    }));
    expect(urgentSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'Diana Prince' })
    ]));
    expect(spokenSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'Brenda Zhao' })
    ]));
    expect(attendeesSpy).toHaveBeenCalledWith(expect.objectContaining({ count: 12 }));
    expect(principalsSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'Sarah Connor' }),
      expect.objectContaining({ name: 'Dr. Emmett Brown' })
    ]));
  });

  it('rejects principal connect with incorrect 6-digit PIN', async () => {
    await expect(transport.connect({
      role: 'principal',
      code: 'DEMO01',
      pin: '999999'
    })).rejects.toThrow('Invalid 6-digit speaker PIN');

    expect(transport.connectionState).toBe('disconnected');
  });

  it('accepts principal connect with valid PIN', async () => {
    await transport.connect({
      role: 'principal',
      code: 'DEMO01',
      pin: '847291'
    });
    expect(transport.connectionState).toBe('connected');
  });

  it('handles raiseHand and lowerHand state transitions', async () => {
    await transport.connect({ role: 'attendee', code: 'DEMO01' });
    transport.myId = 'att-user';

    const selfSpy = vi.fn();
    transport.on('self', selfSpy);

    await transport.raiseHand({ reason: 'clarification' });
    expect(transport.selfState).toBe('hand_raised');
    expect(transport.seed.queue.some(q => q.id === 'att-user')).toBe(true);

    await transport.lowerHand();
    expect(transport.selfState).toBe('listening');
    expect(transport.seed.queue.some(q => q.id === 'att-user')).toBe(false);
  });

  it('grants floor to queued attendee and revokes back to spoken records', async () => {
    await transport.connect({ role: 'admin', code: 'DEMO01' });
    const spokenSpy = vi.fn();
    transport.on('spoken', spokenSpy);

    await transport.grant('att-1');
    expect(transport.seed.floor.id).toBe('att-1');
    expect(transport.seed.queue.some(q => q.id === 'att-1')).toBe(false);

    await transport.revoke();
    expect(transport.seed.floor).toBeNull();
    expect(spokenSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'Alex Rivera' })
    ]));
  });

  it('handles demo controls helpers: addFakeAttendee, raiseFakeHand, sendFakeUrgent', async () => {
    await transport.connect({ role: 'admin', code: 'DEMO01' });

    const initialAttendees = transport.seed.attendees.length;
    transport.addFakeAttendee('Demo Guest');
    expect(transport.seed.attendees.length).toBe(initialAttendees + 1);

    const initialQueue = transport.seed.queue.length;
    transport.raiseFakeHand('comment');
    expect(transport.seed.queue.length).toBe(initialQueue + 1);

    const initialUrgent = transport.seed.urgent.length;
    transport.sendFakeUrgent('other');
    expect(transport.seed.urgent.length).toBe(initialUrgent + 1);
  });
});
