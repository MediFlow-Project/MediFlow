/**
 * `width`/`height` are set from the viewBox so an icon still renders at a sane
 * size when a caller passes a className that carries no sizing utility.
 * Tailwind size classes continue to win over the attributes.
 */
function Svg({ size = 24, className, children }) {
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconStethoscope({ className = "h-6 w-6" }) {
  return (
    <Svg className={className}>
      <path
        d="M6 3v7a4 4 0 0 0 8 0V3M6 3h2M14 3h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 14v1.5A5.5 5.5 0 0 0 15.5 21H17a3 3 0 1 0 0-6h-.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconCalendar({ className = "h-6 w-6" }) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconChat({ className = "h-6 w-6" }) {
  return (
    <Svg className={className}>
      <path
        d="M5 18.5 4 21l3.2-1.4A9 9 0 1 0 5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconClock({ className = "h-6 w-6" }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.2L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconHeart({ className = "h-6 w-6" }) {
  return (
    <Svg className={className}>
      <path
        d="M12 19s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 2.8C19 14.6 12 19 12 19Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconUsers({ className = "h-6 w-6" }) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.8 19a5.2 5.2 0 0 1 10.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.2 19a4.2 4.2 0 0 1 4.6-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconArrow({ className = "h-4 w-4" }) {
  return (
    <Svg size={16} className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMenu({ className = "h-5 w-5" }) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M4 12h16M4 17h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconClose({ className = "h-5 w-5" }) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconPhone({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path
        d="M7.2 3.8h3.1l1.2 3-1.7 1.1a12.5 12.5 0 0 0 6.3 6.3l1.1-1.7 3 1.2v3.1c0 .8-.7 1.5-1.5 1.5C10.8 18.3 5.7 13.2 5.7 5.3c0-.8.7-1.5 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconPin({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path
        d="M12 21s6.5-5.4 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.6 6.5 11 6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </Svg>
  );
}

export function IconSearch({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconFilter({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path
        d="M4 6h16l-6.2 7.3V20L10.2 18v-4.7L4 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconUpload({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="M12 16V5m0 0L8 9m4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 15v2.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconEdit({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path
        d="M15.6 4.7l3.7 3.7L8.6 19.1H4.9v-3.7L15.6 4.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconTrash({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPlus({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

export function IconCheck({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconAlert({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.8v5m0 3.1v.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

export function IconInfo({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5.2m0-8.3v.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

export function IconUser({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19.5a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconReceipt({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="M6 3.5h12v17l-3-1.6-3 1.6-3-1.6-3 1.6v-17Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8.5h6M9 12.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconPill({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <rect x="2.6" y="8.4" width="18.8" height="7.2" rx="3.6" transform="rotate(-45 2.6 8.4)" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9.4 9.4 5.2 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevron({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevronDown({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="m5 9 7 7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconBell({ className = "h-5 w-5" }) {
  return (
    <Svg className={className}>
      <path
        d="M6.2 9.4a5.8 5.8 0 0 1 11.6 0c0 4.2 1.4 5.6 1.4 5.6H4.8s1.4-1.4 1.4-5.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 18.4a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconLogout({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="M14 5.5H8.5A2.5 2.5 0 0 0 6 8v8a2.5 2.5 0 0 0 2.5 2.5H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 12h7m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconShield({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="M12 3.2 19 6v5.6c0 4.2-2.9 7.4-7 9.2-4.1-1.8-7-5-7-9.2V6l7-2.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9 12 2.2 2.2L15.4 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconSparkle({ className = "h-4 w-4" }) {
  return (
    <Svg className={className}>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.9L12 18.2 10.2 12.7 4.5 10.8 10.2 9 12 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </Svg>
  );
}
