import { DECLA_STEPS, DeclaStepId } from '../../types/decla';

interface DeclaProgressProps {
  currentStep: number;
  onStepClick?: (idx: number) => void;
}

export function DeclaProgress({ currentStep, onStepClick }: DeclaProgressProps) {
  const total = DECLA_STEPS.length;
  const pct   = Math.round((currentStep / (total - 1)) * 100);

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'var(--bg)', borderBottom: '1px solid var(--border)',
      padding: '12px 20px 14px',
    }}>
      {/* Step label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Étape {currentStep + 1}/{total}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
          {DECLA_STEPS[currentStep].label}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative', height: 4, borderRadius: 4, background: 'var(--border)' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pct}%`, borderRadius: 4,
          background: 'var(--accent)',
          transition: 'width 400ms cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>

      {/* Step dots — clickable on larger screens */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 8,
        padding: '0 2px',
      }}>
        {DECLA_STEPS.map((step, idx) => {
          const done    = idx < currentStep;
          const active  = idx === currentStep;
          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(idx)}
              title={step.label}
              style={{
                width: 22, height: 22, borderRadius: '50%', border: 'none',
                cursor: onStepClick ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, letterSpacing: 0,
                transition: 'background 250ms, color 250ms, transform 200ms',
                transform: active ? 'scale(1.25)' : 'scale(1)',
                background: active ? 'var(--accent)' : done ? 'rgba(201,100,66,0.25)' : 'var(--bg-card)',
                color: active ? '#fff' : done ? 'var(--accent)' : 'var(--text-3)',
                outline: 'none',
                boxShadow: active ? 'none' : done ? '0 0 0 1.5px var(--accent)' : '0 0 0 1.5px var(--border)',
              } as React.CSSProperties}
              aria-label={step.label}
              aria-current={active ? 'step' : undefined}
            >
              {done ? (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" />
                </svg>
              ) : (
                <span>{idx + 1}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
