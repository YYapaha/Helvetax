import { useState } from 'react';
import { FieldItem, BadgeVariant } from '../../types/decla';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  mandatory:  { bg: 'rgba(201,100,66,0.12)', color: 'var(--accent)' },
  important:  { bg: 'rgba(245,158,11,0.12)', color: '#B45309' },
  autofill:   { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  optional:   { bg: 'rgba(100,116,139,0.10)',color: 'var(--text-3)' },
  gain:       { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  profile:    { bg: 'rgba(99,102,241,0.12)', color: '#4F46E5' },
};

interface FieldCardProps {
  field: FieldItem;
  checked: boolean;
  onToggle: () => void;
}

export function FieldCard({ field, checked, onToggle }: FieldCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Max 2 badges inline — le reste dans le détail
  const visibleBadges = field.badges.slice(0, 2);
  const hiddenBadges  = field.badges.slice(2);
  const hasMoreInfo   = hiddenBadges.length > 0 || !!field.ref;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 14, overflow: 'hidden',
      transition: 'border-color 200ms',
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
        {/* Checkbox */}
        <button
          onClick={onToggle}
          style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: 7,
            border: `2px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
            background: checked ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginTop: 1,
            transition: 'all 200ms ease',
          }}
          aria-label="Cocher"
        >
          {checked && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1.5,5.5 4,8 9.5,2.5" />
            </svg>
          )}
        </button>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Max 2 badges inline */}
          {(visibleBadges.length > 0 || hasMoreInfo) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginBottom: 5 }}>
              {visibleBadges.map((b, i) => {
                const s = BADGE_STYLES[b.variant];
                return (
                  <span key={i} style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6,
                    background: s.bg, color: s.color,
                  }}>
                    {b.text}
                  </span>
                );
              })}
              {/* Indicateur discret si infos supplémentaires dans le détail */}
              {hasMoreInfo && !expanded && (
                <span style={{
                  fontSize: 10, color: 'var(--text-3)',
                  padding: '2px 5px', borderRadius: 5,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                }}>
                  ···
                </span>
              )}
            </div>
          )}
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>
            {field.name}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            {field.where}
          </p>
        </div>

        {/* Amount + expand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {field.amount && (
            <span style={{
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: field.amountPositive === false ? 'var(--accent)' : '#059669',
            }}>
              {field.amount}
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'var(--text-3)', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            {expanded ? 'Moins' : 'Détail'}
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
            >
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 16px',
          background: 'var(--bg)',
          display: 'grid', gap: 12,
        }}>
          {/* Référence VStax + badges supplémentaires */}
          {(field.ref || hiddenBadges.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {field.ref && (
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--text-3)',
                }}>
                  {field.ref}
                </span>
              )}
              {hiddenBadges.map((b, i) => {
                const s = BADGE_STYLES[b.variant];
                return (
                  <span key={i} style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6,
                    background: s.bg, color: s.color,
                  }}>
                    {b.text}
                  </span>
                );
              })}
            </div>
          )}
          {field.tip && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="7" cy="7" r="6" />
                <line x1="7" y1="6" x2="7" y2="10" />
                <circle cx="7" cy="4" r="0.5" fill="var(--accent)" />
              </svg>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>{field.tip}</p>
            </div>
          )}
          {field.explain && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.55 }}>
              {field.explain}
            </p>
          )}
          {field.profile && (
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: '#4F46E5', background: 'rgba(99,102,241,0.08)',
              borderRadius: 8, padding: '6px 10px',
            }}>
              {field.profile}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
