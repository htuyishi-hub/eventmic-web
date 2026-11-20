import React, { useState, useEffect } from 'react';

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-24 h-24 text-2xl',
  xl: 'w-40 h-40 text-4xl'
};

const COLOR_PALETTE = [
  'bg-emerald-600 text-white',
  'bg-indigo-600 text-white',
  'bg-purple-600 text-white',
  'bg-blue-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-cyan-600 text-white',
  'bg-teal-600 text-white'
];

function hashName(name) {
  if (!name || typeof name !== 'string') return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Presentational Avatar component with image or initials fallback.
 * @param {{
 *   src?: string | null,
 *   name?: string,
 *   size?: 'sm' | 'md' | 'lg' | 'xl',
 *   className?: string
 * }} props
 */
export function Avatar({ src, name = '', size = 'md', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const colorIndex = hashName(name) % COLOR_PALETTE.length;
  const colorClass = COLOR_PALETTE[colorIndex];
  const initials = getInitials(name);
  const ariaLabel = name ? `${name}'s avatar` : 'User avatar';

  const showImage = src && !imgFailed;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden select-none font-semibold flex-shrink-0 ${sizeClass} ${!showImage ? colorClass : 'bg-surface'} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name ? `${name}` : 'Avatar'}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
