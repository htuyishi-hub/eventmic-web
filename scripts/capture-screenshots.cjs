const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/ux/screenshots');

const ADMIN_STATES = [
  { index: 0, name: 'empty' },
  { index: 1, name: 'live' },
  { index: 2, name: 'fair-mode' },
  { index: 3, name: 'urgent' },
  { index: 4, name: 'reconnecting' },
  { index: 5, name: 'floor-dropped' }
];

const SPEAKER_STATES = [
  { index: 0, name: 'join' },
  { index: 1, name: 'mic-check' },
  { index: 2, name: 'muted' },
  { index: 3, name: 'next-up' },
  { index: 4, name: 'live' },
  { index: 5, name: 'questions-closed' },
  { index: 6, name: 'urgent' },
  { index: 7, name: 'handover' },
  { index: 8, name: 'offline' }
];

const ATTENDEE_STATES = [
  { section: 'attendee', index: 0, name: 'join' },
  { section: 'attendee', index: 1, name: 'listening' },
  { section: 'attendee', index: 2, name: 'hand-raised' },
  { section: 'attendee', index: 3, name: 'urgent-confirm' },
  { section: 'attendee', index: 4, name: 'preparing-mic' },
  { section: 'attendee', index: 5, name: 'on-air' },
  { section: 'attendee', index: 6, name: 'on-air-warning' },
  { section: 'attendee', index: 7, name: 'turn-ended' },
  { section: 'attendee', index: 8, name: 'session-ended' },
  { section: 'attendee', index: 9, name: 'announcement' },
  { section: 'error', index: 0, name: 'error-invalid-code' },
  { section: 'error', index: 1, name: 'error-full' },
  { section: 'error', index: 2, name: 'error-mic-denied' },
  { section: 'error', index: 3, name: 'error-connection-lost' }
];

async function captureAll() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const capturedFiles = [];

  // Helper to isolate element
  async function isolateElement(page, selector) {
    await page.evaluate((sel) => {
      const existing = document.getElementById('screenshot-overlay');
      if (existing) existing.remove();

      const el = document.querySelector(sel);
      if (!el) throw new Error('Element not found for selector: ' + sel);

      const overlay = document.createElement('div');
      overlay.id = 'screenshot-overlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '9999999';
      overlay.style.background = '#090d16';
      overlay.style.overflow = 'hidden';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';

      const clone = el.cloneNode(true);
      clone.style.width = '100%';
      clone.style.height = '100%';
      clone.style.flex = '1';
      clone.style.minHeight = '0';

      overlay.appendChild(clone);
      document.body.appendChild(overlay);
    }, selector);
    await page.waitForTimeout(100);
  }

  // --- 1. MARKETING SITE ---
  console.log('Capturing Marketing Site...');
  for (const size of [{ w: 1366, h: 768, label: '1366x768' }, { w: 375, h: 667, label: '375x667' }]) {
    const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const homeFile = `marketing/home-${size.label}.png`;
    const homePath = path.join(SCREENSHOT_DIR, homeFile);
    await page.screenshot({ path: homePath });
    capturedFiles.push(homeFile);
    console.log(`  ✓ Saved ${homeFile}`);

    // Trigger validation error
    const input = await page.$('input[type="text"]');
    if (input) {
      await input.fill('XYZ');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForTimeout(150);

      const errFile = `marketing/invalid-code-${size.label}.png`;
      const errPath = path.join(SCREENSHOT_DIR, errFile);
      await page.screenshot({ path: errPath });
      capturedFiles.push(errFile);
      console.log(`  ✓ Saved ${errFile}`);
    }
    await page.close();
  }

  // --- 2. ADMIN STATES ---
  console.log('Capturing Admin States...');
  for (const size of [{ w: 1366, h: 768, label: '1366x768' }, { w: 1920, h: 1080, label: '1920x1080' }]) {
    const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
    await page.goto('http://localhost:5173/dev/gallery', { waitUntil: 'networkidle' });

    for (const state of ADMIN_STATES) {
      const selector = `#admin-states .relative.min-h-\\[480px\\] > div:nth-child(1)`;
      await page.evaluate((idx) => {
        const existing = document.getElementById('screenshot-overlay');
        if (existing) existing.remove();

        const cards = document.querySelectorAll('#admin-states .relative.min-h-\\[480px\\] > div');
        const card = cards[idx];
        if (!card) throw new Error('Admin card not found at index ' + idx);

        const overlay = document.createElement('div');
        overlay.id = 'screenshot-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '9999999';
        overlay.style.background = '#090d16';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';

        const clone = card.cloneNode(true);
        clone.style.height = '100vh';
        clone.style.width = '100vw';
        clone.style.flex = '1';
        clone.style.minHeight = '0';

        overlay.appendChild(clone);
        document.body.appendChild(overlay);
      }, state.index);

      await page.waitForTimeout(100);
      const filename = `admin/${state.name}-${size.label}.png`;
      const filePath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: filePath });
      capturedFiles.push(filename);
      console.log(`  ✓ Saved ${filename}`);
    }
    await page.close();
  }

  // --- 3. SPEAKER STATES ---
  console.log('Capturing Speaker States...');
  for (const size of [{ w: 375, h: 667, label: '375x667' }, { w: 390, h: 844, label: '390x844' }]) {
    const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
    await page.goto('http://localhost:5173/dev/gallery', { waitUntil: 'networkidle' });

    for (const state of SPEAKER_STATES) {
      await page.evaluate((idx) => {
        const existing = document.getElementById('screenshot-overlay');
        if (existing) existing.remove();

        const cards = document.querySelectorAll('#speaker-states .flex-1.overflow-y-auto > div');
        const card = cards[idx];
        if (!card) throw new Error('Speaker card not found at index ' + idx);

        const overlay = document.createElement('div');
        overlay.id = 'screenshot-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '9999999';
        overlay.style.background = '#090d16';
        overlay.style.overflow = 'hidden';

        const clone = card.cloneNode(true);
        clone.style.width = '100vw';
        clone.style.minHeight = '100vh';
        overlay.appendChild(clone);
        document.body.appendChild(overlay);
      }, state.index);

      await page.waitForTimeout(100);
      const filename = `speaker/${state.name}-${size.label}.png`;
      const filePath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: filePath });
      capturedFiles.push(filename);
      console.log(`  ✓ Saved ${filename}`);
    }
    await page.close();
  }

  // --- 4. ATTENDEE STATES ---
  console.log('Capturing Attendee States...');
  for (const size of [{ w: 375, h: 667, label: '375x667' }, { w: 390, h: 844, label: '390x844' }]) {
    const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
    await page.goto('http://localhost:5173/dev/gallery', { waitUntil: 'networkidle' });

    for (const state of ATTENDEE_STATES) {
      await page.evaluate(({ sec, idx }) => {
        const existing = document.getElementById('screenshot-overlay');
        if (existing) existing.remove();

        const parentSel = sec === 'attendee' ? '#attendee-states' : '#error-states';
        const cards = document.querySelectorAll(`${parentSel} .flex-1.overflow-y-auto > div`);
        const card = cards[idx];
        if (!card) throw new Error(`Attendee card not found in ${sec} at index ${idx}`);

        const overlay = document.createElement('div');
        overlay.id = 'screenshot-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '9999999';
        overlay.style.background = '#090d16';
        overlay.style.overflow = 'hidden';

        const clone = card.cloneNode(true);
        clone.style.width = '100vw';
        clone.style.minHeight = '100vh';
        overlay.appendChild(clone);
        document.body.appendChild(overlay);
      }, { sec: state.section, idx: state.index });

      await page.waitForTimeout(100);
      const filename = `attendee/${state.name}-${size.label}.png`;
      const filePath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: filePath });
      capturedFiles.push(filename);
      console.log(`  ✓ Saved ${filename}`);
    }
    await page.close();
  }

  await browser.close();
  console.log(`\nSuccessfully captured ${capturedFiles.length} screenshots!`);
  return capturedFiles;
}

captureAll().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
