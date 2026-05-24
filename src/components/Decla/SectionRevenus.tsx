import { useProfileStore } from '../../stores/profileStore';
import { useDeclaStore } from '../../stores/declaStore';
import { getRevenus } from '../../data/declaData';
import { FieldCard } from './FieldCard';

interface SectionRevenusProps {
  onNext: () => void;
  onBack: () => void;
}

export function SectionRevenus({ onNext, onBack }: SectionRevenusProps) {
  const profile       = useProfileStore((s) => s.profile);
  const checkedFields = useDeclaStore((s) => s.checkedFields);
  const toggleField   = useDeclaStore((s) => s.toggleField);

  if (!profile) return null;

  const fields    = getRevenus(profile);
  const mandatory = fields.filter((f) => f.type === 'mandatory');
  const optional  = fields.filter((f) => f.type !== 'mandatory');
  const mandatoryDone = mandatory.every((f) => checkedFields.includes(f.id));
  const doneCount = fields.filter((f) => checkedFields.includes(f.id)).length;

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {/* Context banner */}
      <div style={{
        padding: '16px 18px', borderRadius: 14,
        background: 'var(--bg-dark)', color: 'var(--text-inv)',
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-inv-2)', marginBottom: 6 }}>
          VStax — Page 2
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
          Déclarez tous vos revenus. Pour chaque ligne, cochez quand c'est rempli dans VStax.
        </p>
      </div>

      {/* Mandatory fields */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            Revenus à déclarer
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{doneCount}/{fields.length}</span>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {mandatory.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              checked={checkedFields.includes(field.id)}
              onToggle={() => toggleField(field.id)}
            />
          ))}
        </div>
      </div>

      {/* Optional fields */}
      {optional.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              Autres revenus (si applicable)
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {optional.map((field) => (
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
          disabled={!mandatoryDone}
          style={{
            height: 50, borderRadius: 14, fontSize: 14, fontWeight: 700,
            color: '#fff',
            background: mandatoryDone ? 'var(--accent)' : 'var(--border)',
            border: 'none', cursor: mandatoryDone ? 'pointer' : 'not-allowed',
            transition: 'all 150ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          } as React.CSSProperties}
        >
          {mandatoryDone ? 'Continuer → Déductions' : `${mandatory.filter(f => !checkedFields.includes(f.id)).length} revenu(s) à cocher`}
        </button>
      </div>
    </div>
  );
}
