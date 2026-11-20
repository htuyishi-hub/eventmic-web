import React from 'react';

/**
 * DM (Digital Microphone) Logo Component
 * 
 * Anatomy:
 * 1. Border-perfect short word "DM": precision 1.5px/2px geometric border enclosing "DM".
 * 2. WhatsApp-style Voice Inequality Waveform: 5 vertical pill bars tapering from large to small.
 * 3. Domain descriptor: "digital microphone 🎙️" (digitalmicrophone.com).
 * 
 * Principles:
 * - Dieter Rams / Teenage Engineering / Braun Industrial Functionalism.
 * - Zero "movie fiction" / sci-fi clutter. Clean, tactile, acoustic precision.
 */
export function DMLogo({
  variant = 'mark', // 'mark' | 'full' | 'badge' | 'bars'
  size = 'md',      // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  animated = false,
  showDomain = false,
  className = '',
  color = 'currentColor',
}) {
  const sizeMap = {
    xs: 'h-5',
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-14',
  };

  const heightClass = sizeMap[size] || sizeMap.md;

  if (variant === 'badge') {
    return (
      <svg
        viewBox="0 0 48 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heightClass} w-auto inline-block ${className}`}
        role="img"
        aria-label="DM Badge"
      >
        <rect x="2" y="2" width="44" height="32" rx="4" stroke={color} strokeWidth="2" fill="none" />
        <text
          x="24"
          y="23"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
          fontWeight="800"
          fontSize="15"
          textAnchor="middle"
          fill={color}
          letterSpacing="1"
        >
          DM
        </text>
      </svg>
    );
  }

  if (variant === 'bars') {
    return (
      <svg
        viewBox="0 0 44 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heightClass} w-auto inline-block ${className}`}
        role="img"
        aria-label="DM Voice Waveform"
      >
        <rect
          x="2"
          y="4"
          width="4"
          height="28"
          rx="2"
          fill={color}
          className={animated ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : ''}
        />
        <rect
          x="11"
          y="8"
          width="4"
          height="20"
          rx="2"
          fill={color}
          className={animated ? 'animate-[pulse_1.5s_ease-in-out_0.2s_infinite]' : ''}
        />
        <rect
          x="20"
          y="11"
          width="4"
          height="14"
          rx="2"
          fill={color}
          className={animated ? 'animate-[pulse_1.5s_ease-in-out_0.4s_infinite]' : ''}
        />
        <rect
          x="29"
          y="13.5"
          width="4"
          height="9"
          rx="2"
          fill={color}
          className={animated ? 'animate-[pulse_1.5s_ease-in-out_0.6s_infinite]' : ''}
        />
        <rect
          x="38"
          y="15.5"
          width="4"
          height="5"
          rx="2"
          fill={color}
          className={animated ? 'animate-[pulse_1.5s_ease-in-out_0.8s_infinite]' : ''}
        />
      </svg>
    );
  }

  if (variant === 'full' || showDomain) {
    return (
      <div className={`inline-flex items-center gap-3 select-none text-current ${className}`}>
        <svg
          viewBox="0 0 96 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${heightClass} w-auto flex-shrink-0`}
          role="img"
          aria-label="DM Logo"
        >
          {/* Border-perfect short word DM */}
          <rect x="2" y="2" width="44" height="32" rx="4" stroke={color} strokeWidth="2" fill="none" />
          <text
            x="24"
            y="23"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
            fontWeight="800"
            fontSize="15"
            textAnchor="middle"
            fill={color}
            letterSpacing="1"
          >
            DM
          </text>
          
          {/* WhatsApp-style voice inequality waveform */}
          <rect x="54" y="4" width="4" height="28" rx="2" fill={color} />
          <rect x="63" y="8" width="4" height="20" rx="2" fill={color} />
          <rect x="72" y="11" width="4" height="14" rx="2" fill={color} />
          <rect x="81" y="13.5" width="4" height="9" rx="2" fill={color} />
          <rect x="90" y="15.5" width="4" height="5" rx="2" fill={color} />
        </svg>

        <div className="flex flex-col justify-center border-l border-white/15 dark:border-white/15 border-black/15 pl-3 leading-none">
          <div className="flex items-center gap-1.5 font-semibold text-xs tracking-tight text-white dark:text-white text-neutral-900">
            <span>digital microphone</span>
            <span className="text-xs">🎙️</span>
          </div>
          <span className="text-[10px] tracking-wider uppercase font-mono text-neutral-400 mt-0.5">
            digitalmicrophone.com
          </span>
        </div>
      </div>
    );
  }

  // Default: Mark ([DM] + 5 WhatsApp waveform bars)
  return (
    <svg
      viewBox="0 0 96 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${heightClass} w-auto inline-block ${className}`}
      role="img"
      aria-label="DM Logo"
    >
      {/* Border-perfect short word DM */}
      <rect x="2" y="2" width="44" height="32" rx="4" stroke={color} strokeWidth="2" fill="none" />
      <text
        x="24"
        y="23"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
        fontWeight="800"
        fontSize="15"
        textAnchor="middle"
        fill={color}
        letterSpacing="1"
      >
        DM
      </text>
      
      {/* WhatsApp-style voice inequality waveform (starts bigger, ends small) */}
      <rect x="54" y="4" width="4" height="28" rx="2" fill={color} />
      <rect x="63" y="8" width="4" height="20" rx="2" fill={color} />
      <rect x="72" y="11" width="4" height="14" rx="2" fill={color} />
      <rect x="81" y="13.5" width="4" height="9" rx="2" fill={color} />
      <rect x="90" y="15.5" width="4" height="5" rx="2" fill={color} />
    </svg>
  );
}

export default DMLogo;
