import type { SVGProps } from 'react';

export type IconName =
  | 'overview'
  | 'company'
  | 'trial-balance'
  | 'mapping'
  | 'adjustments'
  | 'review'
  | 'statements'
  | 'notes'
  | 'ratios'
  | 'reports'
  | 'finalise'
  | 'settings'
  | 'search'
  | 'bell'
  | 'chevron'
  | 'arrow-up'
  | 'arrow-down'
  | 'check'
  | 'warning'
  | 'error'
  | 'info'
  | 'upload'
  | 'download'
  | 'lock'
  | 'unlock'
  | 'more'
  | 'plus'
  | 'filter'
  | 'print'
  | 'eye'
  | 'arrow-right'
  | 'database'
  | 'shield'
  | 'wifi-off'
  | 'close';

const paths: Record<IconName, React.ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  company: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01"/></>,
  'trial-balance': <><path d="M4 4h16v16H4zM4 9h16M9 4v16M14 4v16"/></>,
  mapping: <><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.5 7.5 15.5 16.5M18 6h-5a3 3 0 0 0-3 3v6"/></>,
  adjustments: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></>,
  review: <><path d="M9 11l2 2 4-4M5 3h14v18H5zM8 3V1M16 3V1"/></>,
  statements: <><path d="M6 2h9l4 4v16H6zM14 2v5h5M9 12h6M9 16h6"/></>,
  notes: <><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/></>,
  ratios: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><circle cx="18.5" cy="6.5" r="2.5"/></>,
  reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="m17 7 2-2 2 2"/></>,
  finalise: <><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="m8 12 2.5 2.5L16 9"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  'arrow-up': <path d="m6 15 6-6 6 6M12 9v12"/>,
  'arrow-down': <path d="m6 9 6 6 6-6M12 3v12"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  warning: <><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
  error: <><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></>,
  info: <><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></>,
  download: <><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  unlock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7-2"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  filter: <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z"/>,
  print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  'arrow-right': <path d="M5 12h14M14 7l5 5-5 5"/>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>,
  'wifi-off': <><path d="m2 2 20 20M8.5 8.5A10 10 0 0 0 5 11M2 8a15 15 0 0 1 2.5-1.8M16 11a10 10 0 0 1 3 2M12 18h.01M9 15a4 4 0 0 1 6-1"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>
};

export function Icon({ name, size = 18, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
