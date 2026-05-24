import { useProfileStore } from '../../stores/profileStore';
import { useDeclaStore } from '../../stores/declaStore';
import { getDeductions } from '../../data/declaData';
import { FieldCard } from './FieldCard';

interface SectionDeductionsProps {
  onNext: () => void;
  onBack: () => void;
}

export function SectionDeductions({ onNext, onBack }: SectionDeductionsProps) {
  const profile       = useProfileStore((s) => s.profile);
  const checkedFields = useDeclaStore((s) => s.checkedFields);
  const toggleField   = useDeclaStore((s) => s.toggleField);

  if (!profile) return null;

  const fields    = getDeductions(profile);
  const gains     = fields.filter((f) => f.type === 'gain');
  const standard  = fields.filter((f) => f.type !== 'gain');
  const doneCount = fields.filter((f) => checkedFields.includes(f.id)).length;

  // Calculate total potential gain from checked fields
  const totalGainText = gains.length > 0
    ? gains.map(f => f.amount).filter(Boolean).join(' + ')
    : null;

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {/* Gain hero */}
      <div style={{
        background: 'var(--bg-dark)', borderRadius: 16,
        padding: '20px 20px',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-inv-2)', marginBottom: 8 }}>
          VStax — Page 3 · Déductions
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-inv)', margin: '0 0 6px', lineHeight: 1.5, fontWeight: 500 }}>
          Chaque déduction réduit votre revenu imposable. Cochez chaque ligne dans VStax.
        </p>
        {totalGainText && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(5,150,105,0.2)', borderRadius: 8, padding: '5px 10px', marginTop: 4,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1.5,6 4.5,9 10.5,3" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>
              {fields.length} déductions personnalisées pour votre profil
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6,
            width: `${Math.round((doneCount / Math.max(fields.length, 1)) * 100)}%`,
            background: doneCount === fields.length ? '#059669' : 'var(--accent)',
            transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', minWidth: 48, textAlign: 'right' }}>
          {doneCount}/{fields.length}
        </span>
      </div>

      {/* Gain fields (high value) */}
      {gains.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#059669' }}>
              Déductions à fort gain
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(5,150,105,0.3)' }} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {gains.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                checked={checkedFields.includes(field.id)}
                onToggle={() => toggleField(field.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Standard deductions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            Déductions standard
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {standard.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              checked={checkedFields.includes(field.id)}
              onToggle={() => toggleField(field.id)}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <button onClick={onBack} style={{
          height: 50, borderRadius: 14, fontSize: 14, fontWeight: 600,
          color: 'var(--text-2)', background: 'var(--bg-card)',
          border: '1.5px solid var(--border)', cursor: 'pointer',
        }}>
          ← Retour
        </button>
        <button
          onClick={onNext}
          style={{
            height: 50, borderRadius: 14, fontSize: 14, fontWeight: 700,
            color: '#fff', background: 'var(--accent)',
            border: 'none', cursor: 'pointer', transition: 'background 150ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          } as React.CSSProperties}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dark)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
        >
          Continuer → Simulation
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
