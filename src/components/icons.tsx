import type { SVGProps } from 'react';

type IconProps = { size?: number; stroke?: number } & Omit<SVGProps<SVGSVGElement>, 'stroke'>;

const lineBase = (stroke = 1.5) => ({
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: stroke,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/* ─── Sidebar icons — 24×24, currentColor ─── */

export const IconActions = ({ size = 20, stroke, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...lineBase(stroke)} {...rest}>
    <path d="M12 3 4.5 7.25v9.5L12 21l7.5-4.25v-9.5L12 3Z" />
    <path d="m8.75 12.25 2.25 2.25 4.25-4.5" />
  </svg>
);

export const IconTimeline = ({ size = 20, stroke, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...lineBase(stroke)} {...rest}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.25" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3.25v3.5M16 3.25v3.5" />
    <circle cx="8.5" cy="14.25" r="1.1" fill="currentColor" stroke="none" />
    <path d="M11 14.25h6" />
  </svg>
);

export const IconImpact = ({ size = 20, stroke, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...lineBase(stroke)} {...rest}>
    <path d="M3.75 19.75h16.5" />
    <path d="M6.75 16.5v-3M11 16.5V9.75M15.25 16.5v-5" />
    <path d="m6.5 8.5 4.25-3.25 3.25 2.25 4.5-3.5" />
    <path d="M16.5 4h2.5v2.5" />
  </svg>
);

export const IconLexique = ({ size = 20, stroke, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...lineBase(stroke)} {...rest}>
    <path d="M5 4.5h9a3.5 3.5 0 0 1 3.5 3.5v11.5H8.5A3.5 3.5 0 0 1 5 16V4.5Z" />
    <path d="M8.5 19.5a3.5 3.5 0 0 1 0-7H17.5" />
    <path d="M8.75 8.5h5.5M8.75 11.5h3.5" />
  </svg>
);

export const IconFiche = ({ size = 20, stroke, ...rest }: IconProps) => {
  const s = stroke ?? 1.5;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...lineBase(s)} {...rest}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.75" />
      <path d="M4.5 8h15" />
      <path d="M7.25 11h4M13.5 11h3.25" />
      <path d="M7.25 13.75h4M13.5 13.75h3.25" />
      <path d="M7.25 16.25h9.5" />
      <path d="M7.25 18.25h4M13.5 18.25h3.25" strokeWidth={s * 1.4} />
    </svg>
  );
};

export const IconJumeau = ({ size = 20, stroke, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...lineBase(stroke)} {...rest}>
    <circle cx="9" cy="12" r="5.5" />
    <circle cx="15" cy="12" r="5.5" />
    <path d="M12 7.5v9" strokeDasharray="1.5 2" />
  </svg>
);

export const IconDecla = ({ size = 20, stroke, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...lineBase(stroke)} {...rest}>
    <path d="M5.5 3.5h7.5L18.5 9v10.25a1.25 1.25 0 0 1-1.25 1.25H6.75A1.25 1.25 0 0 1 5.5 19.25V3.5Z" />
    <path d="M13 3.5V9h5.5" />
    <path d="M8 13h4M8 15.75h2.5" />
    <circle cx="15" cy="15.75" r="3.25" stroke="var(--accent)" />
    <path d="m13.7 15.75 1 1 1.6-1.75" stroke="var(--accent)" />
  </svg>
);

/* ─── App icon — option B (Optimisation) ─── */

type AppIconProps = { size?: number; radius?: number; className?: string };

export const AppIcon = ({ size = 32, radius = 0.22, className }: AppIconProps) => (
  <svg width={size} height={size} viewBox="0 0 96 96" className={className} aria-label="Fiscal Suisse">
    <rect width="96" height="96" rx={96 * radius} fill="#1F1D1B" />
    <g fill="#C96442">
      <rect x="24" y="56" width="11" height="20" rx="2" />
      <rect x="42.5" y="42" width="11" height="34" rx="2" />
      <rect x="61" y="28" width="11" height="48" rx="2" />
    </g>
    <path d="M22 24.5 38 33l16-10.5 20 12.5" stroke="#FAF9F7" strokeWidth="2.5"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="74" cy="35" r="3" fill="#FAF9F7" />
  </svg>
);
