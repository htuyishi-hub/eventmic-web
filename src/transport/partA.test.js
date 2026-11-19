import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockTransport } from './mockTransport.js';

describe('Part A MockTransport Floor Rules & Fairness', () => {
  let channelName;
  let admin;
  let principal;
  let attendee1;
  let attendee2;

  beforeEach(() => {
    channelName = 'test_part_a_' + Math.random().toString(36).substring(2, 9);
  });

  afterEach(async () => {
    if (attendee1) await attendee1.disconnect();
    if (attendee2) await attendee2.disconnect();
    if (principal) await principal.disconnect();
    if (admin) await admin.disconnect();
  });

  it('attendee hand raise supports reason and defaults to question', async () => {
    admin = new MockTransport({ channelName, id: 'admin_1', broadcastDelay: 10 });
    const session = await admin.createSession({ name: 'Reasons Test' });

    attendee1 = new MockTransport({ channelName, id: 'att_1', broadcastDelay: 10 });
    attendee2 = new MockTransport({ channelName, id: 'att_2', broadcastDelay: 10 });

    await attendee1.connect({ role: 'attendee', code: session.code, name: 'Alice' });
    await attendee2.connect({ role: 'attendee', code: session.code, name: 'Bob' });
    await new Promise(r => setTimeout(r, 60));

    await attendee1.raiseHand({ reason: 'clarification' });
    await attendee2.raiseHand(); // default question
    await new Promise(r => setTimeout(r, 60));

    expect(admin.queue.length).toBe(2);
    expect(admin.queue[0].reason).toBe('clarification');
    expect(admin.queue[1].reason).toBe('question');
  });

  it('when principal takes the floor, attendee on floor is preempted with message', async () => {
    admin = new MockTransport({ channelName, id: 'admin_1', broadcastDelay: 10 });
    const session = await admin.createSession({ name: 'Preempt Test' });

    const pData = await admin.createPrincipal('Dr. Speaker');
    expect(pData.pin).toMatch(/^\d{6}$/);

    attendee1 = new MockTransport({ channelName, id: 'att_1', broadcastDelay: 10 });
    let preemptedReason = null;
    attendee1.on('preempted', (msg) => {
      preemptedReason = msg;
    });

    await attendee1.connect({ role: 'attendee', code: session.code, name: 'Alice' });
    await new Promise(r => setTimeout(r, 60));

    await attendee1.raiseHand();
    await new Promise(r => setTimeout(r, 60));

    await admin.grant('att_1');
    await new Promise(r => setTimeout(r, 50));
    expect(admin.floor.id).toBe('att_1');

    // Principal connects and takes floor
    principal = new MockTransport({ channelName, id: pData.id, broadcastDelay: 10 });
    await principal.connect({ role: 'principal', code: session.code, pin: pData.pin, name: 'Dr. Speaker' });
    await new Promise(r => setTimeout(r, 60));

    await principal.takeFloor();
    await new Promise(r => setTimeout(r, 80));

    expect(admin.floor.id).toBe(pData.id);
    expect(admin.floor.mode).toBe('principal');
    expect(preemptedReason).toBe('The speaker is taking the floor');
    expect(attendee1.selfState).toBe('listening');
  });

  it('fair mode prioritizes attendees who have not spoken', async () => {
    admin = new MockTransport({ channelName, id: 'admin_1', broadcastDelay: 10 });
    const session = await admin.createSession({ name: 'Fairness Test' });

    attendee1 = new MockTransport({ channelName, id: 'att_1', broadcastDelay: 10 });
    attendee2 = new MockTransport({ channelName, id: 'att_2', broadcastDelay: 10 });

    await attendee1.connect({ role: 'attendee', code: session.code, name: 'Alice' });
    await attendee2.connect({ role: 'attendee', code: session.code, name: 'Bob' });
    await new Promise(r => setTimeout(r, 60));

    // Alice speaks once
    await attendee1.raiseHand();
    await new Promise(r => setTimeout(r, 40));
    await admin.grant('att_1');
    await new Promise(r => setTimeout(r, 40));
    await admin.revoke('att_1');
    await new Promise(r => setTimeout(r, 40));

    // Enable fair mode
    await admin.updateSettings({ fairMode: 'on' });

    // Now Alice raises hand FIRST, Bob (who has not spoken) raises hand SECOND
    await attendee1.raiseHand();
    await new Promise(r => setTimeout(r, 40));
    await attendee2.raiseHand();
    await new Promise(r => setTimeout(r, 60));

    const state = await admin.fetchSessionState();
    expect(state.fairModeActive).toBe(true);
    // Bob should be first because Bob has 0 speak count, Alice has 1
    expect(state.queue[0].id).toBe('att_2');
    expect(state.queue[0].speakCount).toBe(0);
    expect(state.queue[1].id).toBe('att_1');
    expect(state.queue[1].speakCount).toBe(1);
  });
});
