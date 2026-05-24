import { DocItem } from '../../types/decla';

interface DocCheckItemProps {
  doc: DocItem;
  checked: boolean;
  onToggle: () => void;
}

export function DocCheckItem({ doc, checked, onToggle }: DocCheckItemProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        width: '100%', textAlign: 'left',
        background: checked ? 'rgba(201,100,66,0.05)' : 'var(--bg-card)',
        border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 14, padding: '14px 16px',
        cursor: 'pointer', transition: 'all 200ms ease',
      } as React.CSSProperties}
    >
      {/* Checkbox */}
      <div style={{
        flexShrink: 0, width: 22, height: 22, borderRadius: 7,
        border: `2px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
        background: checked ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 1, transition: 'all 200ms ease',
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,5.5 4,8 9.5,2.5" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: checked ? 'var(--text-3)' : 'var(--text)',
            textDecoration: checked ? 'line-through' : 'none',
            transition: 'color 200ms',
          }}>
            {doc.title}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6,
            background: doc.mandatory ? 'rgba(201,100,66,0.12)' : 'rgba(100,116,139,0.10)',
            color: doc.mandatory ? 'var(--accent)' : 'var(--text-3)',
          }}>
            {doc.mandatory ? 'Obligatoire' : 'Optionnel'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          {doc.where}
        </p>
      </div>
    </button>
  );
}
