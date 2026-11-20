import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Avatar } from './Avatar.jsx';
import { AvatarUploader } from './AvatarUploader.jsx';

describe('Avatar component', () => {
  it('renders initials fallback when no src is provided', () => {
    const html = renderToString(<Avatar name="Dr. Jane Smith" size="md" />);
    expect(html).toContain('DS');
    expect(html).toContain('aria-label="Dr. Jane Smith&#x27;s avatar"');
    expect(html).toContain('w-12 h-12');
  });

  it('renders correct size classes for all sizes', () => {
    const sm = renderToString(<Avatar name="Alice" size="sm" />);
    expect(sm).toContain('w-8 h-8');

    const md = renderToString(<Avatar name="Bob" size="md" />);
    expect(md).toContain('w-12 h-12');

    const lg = renderToString(<Avatar name="Charlie" size="lg" />);
    expect(lg).toContain('w-24 h-24');

    const xl = renderToString(<Avatar name="David" size="xl" />);
    expect(xl).toContain('w-40 h-40');
  });

  it('renders image when src is provided', () => {
    const html = renderToString(<Avatar src="blob:mock-url" name="Elena" size="sm" />);
    expect(html).toContain('<img');
    expect(html).toContain('src="blob:mock-url"');
    expect(html).toContain('alt="Elena"');
  });

  it('handles single-word names and fallback characters', () => {
    const sam = renderToString(<Avatar name="Sam" size="sm" />);
    expect(sam).toContain('SA');

    const empty = renderToString(<Avatar name="" size="sm" />);
    expect(empty).toContain('?');
  });
});

describe('AvatarUploader consent and UI', () => {
  it('contains the mandatory consent text and controls', () => {
    const html = renderToString(
      <AvatarUploader
        onSave={() => {}}
        onCancel={() => {}}
      />
    );
    expect(html).toContain('Shown to the organizers and, while you speak, to the room. Deleted when the session ends.');
    expect(html).toContain('Camera');
    expect(html).toContain('Upload');
  });
});
