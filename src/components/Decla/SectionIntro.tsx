import { useProfileStore } from '../../stores/profileStore';
import { getKPIs, getIntroCards } from '../../data/declaData';
import { useCountUp } from '../../hooks/useCountUp';
import { IntroCard, DeclaKPI } from '../../types/decla';

// ── KPI strip ─────────────────────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: DeclaKPI }) {
  const colorMap: Record<string, string> = {
    accent:  'var(--accent)',
    success: '#059669',
    danger:  '#C94242',
    default: 'var(--text)',
  };
  const color = colorMap[kpi.color ?? 'default'];

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{
        fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)',
        color, lineHeight: 1.1,
      }}>
        {kpi.value}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3 }}>
        {kpi.label}
      </span>
    </div>
  );
}

// ── Intro card ────────────────────────────────────────────────────────────────

const CARD_STYLES: Record<IntroCard['type'], { border: string; iconBg: string; iconColor: string; label: string }> = {
  info:      { border: 'var(--border)',             iconBg: 'rgba(99,102,241,0.1)',  iconColor: '#4F46E5', label: 'Info'      },
  important: { border: 'rgba(201,100,66,0.4)',       iconBg: 'rgba(201,100,66,0.1)', iconColor: 'var(--accent)', label: 'Action requise' },
  autofill:  { border: 'rgba(5,150,105,0.3)',        iconBg: 'rgba(5,150,105,0.1)',  iconColor: '#059669', label: 'Auto'      },
};

function IntroCardItem({ card }: { card: IntroCard }) {
  const s = CARD_STYLES[card.type];

  const Icon = () => {
    if (card.type === 'important') return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="8" cy="8" r="7" /><line x1="8" y1="5" x2="8" y2="9" /><circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
      </svg>
    );
    if (card.type === 'autofill') return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2,8 6,12 14,4" />
      </svg>
    );
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="8" cy="8" r="7" /><line x1="8" y1="7" x2="8" y2="11" /><circle cx="8" cy="4.5" r="0.5" fill="currentColor" />
      </svg>
    );
  };

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1.5px solid ${s.border}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 10,
          background: s.iconBg, color: s.iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 2,
        }}>
          <Icon />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: s.iconColor,
          }}>
            {card.ref}
          </span>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '3px 0 0', lineHeight: 1.3 }}>
            {card.name}
          </p>
        </div>
      </div>

      {/* Where */}
      <div style={{ padding: '12px 18px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
          {card.where}
        </p>
      </div>

      {/* Tip */}
      {card.tip && (
        <div style={{
          margin: '12px 18px 16px',
          padding: '10px 12px',
          background: 'var(--bg)',
          borderRadius: 10,
          borderLeft: `3px solid ${s.iconColor}`,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={s.iconColor} strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="6.5" cy="6.5" r="5.5" />
            <line x1="6.5" y1="5.5" x2="6.5" y2="9" />
            <circle cx="6.5" cy="3.8" r="0.4" fill={s.iconColor} />
          </svg>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
            {card.tip}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Section principale ────────────────────────────────────────────────────────

interface SectionIntroProps {
  onNext: () => void;
}

export function SectionIntro({ onNext }: SectionIntroProps) {
  const profile = useProfileStore((s) => s.profile);

  if (!profile) return null;

  const kpis  = getKPIs(profile);
  const cards = getIntroCards(profile);

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {/* Hero text */}
      <div style={{
        background: 'var(--bg-dark)', borderRadius: 20,
        padding: '28px 24px',
      }}>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-inv-2)', marginBottom: 10,
        }}>
          Déclaration fiscale 2026
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(24px, 6vw, 34px)',
          color: 'var(--text-inv)', margin: '0 0 12px', lineHeight: 1.1,
        }}>
          Récupérez ce qui vous est dû.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-inv-2)', margin: 0, lineHeight: 1.6, maxWidth: 340 }}>
          Ce guide vous accompagne section par section pour déclarer vos revenus et maximiser vos déductions en Valais.
        </p>
      </div>

      {/* KPI grid */}
      <div>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12,
        }}>
          Votre situation
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
        }}>
          {kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
        </div>
      </div>

      {/* Intro cards */}
      <div style={{ display: 'grid', gap: 14 }}>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 0,
        }}>
          Avant de commencer
        </p>
        {cards.map((card, i) => <IntroCardItem key={i} card={card} />)}
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        style={{
          width: '100%', height: 52, borderRadius: 14,
          fontSize: 15, fontWeight: 700,
          color: '#fff', background: 'var(--accent)',
          border: 'none', cursor: 'pointer',
          transition: 'background 150ms',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dark)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
      >
        Commencer — Rassembler mes documents
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="8" x2="13" y2="8" /><polyline points="9,4 13,8 9,12" />
        </svg>
      </button>
    </div>
  );
}
