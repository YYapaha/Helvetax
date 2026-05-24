import { SubmitStepItem } from '../../types/decla';

interface SubmitChecklistProps {
  steps: SubmitStepItem[];
  checked: number[];
  onToggle: (n: number) => void;
}

export function SubmitChecklist({ steps, checked, onToggle }: SubmitChecklistProps) {
  const doneCount = checked.length;
  const total = steps.length;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {/* Overall progress mini-bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6,
            width: `${Math.round((doneCount / total) * 100)}%`,
            background: doneCount === total ? '#059669' : 'var(--accent)',
            transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', minWidth: 32, textAlign: 'right' }}>
          {doneCount}/{total}
        </span>
      </div>

      {steps.map((step) => {
        const isDone = checked.includes(step.n);
        return (
          <button
            key={step.n}
            onClick={() => onToggle(step.n)}
            style={{
              display: 'flex', gap: 14, textAlign: 'left', width: '100%',
              background: isDone ? 'rgba(5,150,105,0.05)' : 'var(--bg-card)',
              border: `1.5px solid ${isDone ? 'rgba(5,150,105,0.35)' : 'var(--border)'}`,
              borderRadius: 14, padding: '14px 16px',
              cursor: 'pointer', transition: 'all 200ms ease',
            } as React.CSSProperties}
          >
            {/* Step number / check */}
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDone ? '#059669' : 'var(--border)',
              transition: 'background 200ms',
            }}>
              {isDone ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6.5 5,9.5 11,3.5" />
                </svg>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>{step.n}</span>
              )}
            </div>

            {/* Label + description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 14, fontWeight: 600, margin: '0 0 3px',
                color: isDone ? 'var(--text-3)' : 'var(--text)',
                textDecoration: isDone ? 'line-through' : 'none',
                transition: 'color 200ms',
              }}>
                {step.title}
              </p>
              {step.desc && (
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              )}
              {step.link && (
                <a
                  href={step.link} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, color: 'var(--accent)', marginTop: 6,
                    fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  {step.linkText ?? 'Ouvrir'}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M4 2H2a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V6" />
                    <polyline points="6.5,1 9,1 9,3.5" />
                    <line x1="5" y1="5" x2="9" y2="1" />
                  </svg>
                </a>
              )}
            </div>
          </button>
        );
      })}

      {/* Completion banner */}
      {doneCount === total && (
        <div style={{
          padding: '16px 18px', borderRadius: 14, marginTop: 4,
          background: 'rgba(5,150,105,0.08)', border: '1.5px solid rgba(5,150,105,0.3)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: '#059669',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,8 6,12 14,4" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#059669', margin: '0 0 2px' }}>
              Déclaration soumise
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
              Toutes les étapes sont complètes. Conservez votre accusé de réception.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
