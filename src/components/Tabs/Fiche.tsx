import { useState, useEffect, useRef } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { useCountUp } from '../../hooks/useCountUp';
import { useReveal } from '../../hooks/useReveal';

/* ── Types ── */
interface Detail { rate: string; name: string; desc: string }
interface Deduction {
  id: string; label: string; sublabel: string; rate: number;
  color: string; employerRate: number;
  description: string; details: Detail[]; tip: string;
  tags: string[]; permitOnly?: string;
}

/* ── Deduction data (taux officiels 2026) ── */
const DEDUCTIONS: Deduction[] = [
  {
    id: 'avs',
    label: 'AVS / AI / APG',
    sublabel: '1er pilier — Retraite · Invalidité · Perte de gain',
    rate: 0.053,
    color: '#6366f1',
    employerRate: 0.053,
    description: 'Le 1er pilier regroupe trois assurances : l\'AVS (retraite), l\'AI (invalidité) et l\'APG (service militaire, maternité, paternité). Tu cotises maintenant pour financer les retraités d\'aujourd\'hui.',
    details: [
      { rate: '4.35%', name: 'AVS', desc: 'Assurance vieillesse et survivants — ta future rente (1\'225–2\'450 CHF/mois)' },
      { rate: '0.70%', name: 'AI', desc: 'Assurance invalidité — protection si tu ne peux plus travailler' },
      { rate: '0.25%', name: 'APG', desc: 'Allocations perte de gain — service militaire, maternité/paternité' },
    ],
    tip: 'Vérifie ton extrait de compte AVS sur avs-ai.ch. Les lacunes (années à l\'étranger) peuvent parfois être rachetées.',
    tags: ['Obligatoire', 'Partagé 50/50', 'Tous salariés dès 17 ans'],
  },
  {
    id: 'ac',
    label: 'AC',
    sublabel: 'Assurance chômage',
    rate: 0.011,
    color: '#8b5cf6',
    employerRate: 0.011,
    description: 'L\'assurance chômage te verse 70% de ton dernier salaire si tu perds ton emploi involontairement, pendant 12 à 24 mois selon tes années de cotisation.',
    details: [
      { rate: '1.1%', name: 'AC standard', desc: 'Sur les salaires jusqu\'à 148\'200 CHF/an (plafonné)' },
      { rate: '0.5%', name: 'AC solidarité', desc: 'Sur la part entre 148\'200 et 370\'800 CHF/an uniquement' },
    ],
    tip: 'Pour toucher le chômage : avoir cotisé 12 mois sur les 2 dernières années. Inscris-toi à l\'ORP immédiatement après la perte d\'emploi.',
    tags: ['Obligatoire', 'Partagé 50/50', 'Plafonné 148\'200 CHF/an'],
  },
  {
    id: 'lpp',
    label: 'LPP',
    sublabel: '2ème pilier — Caisse de pension',
    rate: 0.050,
    color: '#3b82f6',
    employerRate: 0.065,
    description: 'Le LPP est TON compte épargne retraite personnel lié à ton emploi. C\'est VRAIMENT ton argent — tu le récupères à 65 ans (rente ou capital) ou lors d\'événements spéciaux.',
    details: [
      { rate: '−26\'460', name: 'Déduction de coordination', desc: 'Ton salaire brut annuel MOINS ce montant = salaire coordonné sur lequel tu cotises' },
      { rate: '7%', name: '25–34 ans', desc: 'Taux de bonification selon ta tranche d\'âge' },
      { rate: '10%', name: '35–44 ans', desc: 'Les taux augmentent avec l\'âge (retraite approche)' },
      { rate: '18%', name: '55–65 ans', desc: 'Taux maximum — dernier sprint avant la retraite' },
    ],
    tip: 'Lacunes LPP (travail à l\'étranger, études tardives, temps partiel) ? Tu peux les racheter et DÉDUIRE intégralement de tes impôts !',
    tags: ['Obligatoire dès 22\'680 CHF/an', 'Capital PERSONNEL', 'Rachat = déductible impôts'],
  },
  {
    id: 'aanp',
    label: 'AANP',
    sublabel: 'Accidents non professionnels',
    rate: 0.008,
    color: '#f97316',
    employerRate: 0.0,
    description: 'L\'AANP couvre les accidents hors travail : ski, vélo, sport, accidents domestiques. Si tu travailles moins de 8h/semaine chez un employeur, tu dois la payer via ta LAMal.',
    details: [
      { rate: '~0.5%', name: 'AAP (pro)', desc: '100% payé par l\'employeur — accidents au travail et trajet domicile-travail' },
      { rate: '~0.8–1.3%', name: 'AANP (non-pro)', desc: 'Payé par toi — taux variable selon ton métier et son niveau de risque' },
    ],
    tip: 'Le taux AANP varie selon le risque de ton métier. Un comptable paie moins qu\'un ouvrier du bâtiment. Vérifie dans ton contrat.',
    tags: ['Obligatoire', 'Part salarié seulement', 'Taux variable selon métier'],
  },
  {
    id: 'ijm',
    label: 'IJM',
    sublabel: 'Indemnité journalière maladie',
    rate: 0.008,
    color: '#ef4444',
    employerRate: 0.008,
    description: 'L\'IJM garantit 80% de ton salaire pendant 720 jours si tu es malade plus de 3 jours. Elle est optionnelle pour l\'employeur — vérifie ton contrat !',
    details: [
      { rate: '~0.5–1.5%', name: 'Taux variable', desc: 'Dépend du contrat d\'assurance de ton employeur' },
      { rate: '80%', name: 'Couverture', desc: 'Du salaire brut pendant 720 jours max (2 ans)' },
      { rate: '3 jours', name: 'Carence', desc: 'L\'assurance ne paie pas les 3 premiers jours de maladie' },
    ],
    tip: 'Certains employeurs ne souscrivent PAS à l\'IJM — dans ce cas, tu n\'as que les obligations légales minimales (3 semaines). Vérifie ton contrat !',
    tags: ['Souvent partagé 50/50', 'Assurance privée', 'Optionnel employeur'],
  },
  {
    id: 'is',
    label: 'Impôt à la source',
    sublabel: 'Permis B — prélevé directement par l\'employeur',
    rate: 0.12,
    color: '#d97706',
    employerRate: 0,
    description: 'Avec un permis B, ton employeur prélève l\'impôt directement sur ton salaire chaque mois et le verse au canton. Le taux dépend du canton, du revenu et de ta situation familiale.',
    details: [
      { rate: '~10–18%', name: 'Taux Valais 2026', desc: 'Selon revenu mensuel, situation familiale et barème' },
      { rate: 'Barème A', name: 'Célibataire sans enfants', desc: 'Le taux le plus élevé — sans déductions familiales' },
      { rate: 'Barème B/C', name: 'En couple', desc: 'Taux réduit selon situation du conjoint' },
    ],
    tip: 'TOU (Taxation Ordinaire Ultérieure) : en faisant cette demande avant le 31 mars, tu peux récupérer 2\'000–8\'000 CHF/an grâce à tes déductions !',
    tags: ['Permis B/L uniquement', 'TOU recommandée', 'Deadline 31 mars'],
    permitOnly: 'B',
  },
];

/* ── Helpers ── */
const fmt = (n: number) => n.toLocaleString('fr-CH');

/* ── Component ── */
export function FicheTab() {
  const profile = useProfileStore((s) => s.profile);
  const gross = profile?.income ?? 6000;
  const [permit, setPermit] = useState<string>(profile?.permit ?? 'C');
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Trigger donut animation on mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(t);
  }, []);

  // Recalculate when permit changes (reset animation briefly)
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [permit]);

  // Deductions filtered by permit
  const deductions = DEDUCTIONS.filter((d) => !d.permitOnly || d.permitOnly === permit);
  const totalDed = deductions.reduce((s, d) => s + Math.round(gross * d.rate), 0);
  const net = gross - totalDed;
  const netPct = Math.round((net / gross) * 100);

  // Scroll-to-card when donut segment clicked
  const handleSegmentClick = (id: string) => {
    if (id === 'net') return;
    const next = id === selected ? null : id;
    setSelected(next);
    if (next) {
      setTimeout(() => {
        cardRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  };

  // Count-up for net salary
  const animatedNet = useCountUp(net, { start: mounted });

  // Donut chart geometry
  const R = 76;
  const CX = 100;
  const CY = 100;
  const SW = 28;
  const circumference = 2 * Math.PI * R;

  // Build segments: net first (full circle base), then deductions layered on top
  const dedSegs = deductions.map((d) => ({
    id: d.id,
    label: d.label,
    amount: Math.round(gross * d.rate),
    color: d.color,
  }));

  // Calculate cumulative offsets for donut segments
  const allSegs = [
    { id: 'net', label: 'Salaire net', amount: net, color: '#22c55e' },
    ...dedSegs,
  ];

  let cumulativeLen = 0;
  const segments = allSegs.map((seg, i) => {
    const length = (seg.amount / gross) * circumference;
    const offset = cumulativeLen;
    cumulativeLen += length;
    return { ...seg, length, offset, delay: i * 0.07 };
  });

  // Employer total cost
  const empSegs = deductions.filter((d) => d.employerRate > 0);
  const empTotal = empSegs.reduce((s, d) => s + Math.round(gross * d.employerRate), 0);

  // Reveal refs
  const revealChart = useReveal();
  const revealCards = useReveal();
  const revealEmployer = useReveal();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero — Net salary ── */}
      <div
        style={{
          background: 'var(--bg-dark)',
          borderRadius: 20,
          padding: '28px 24px 24px',
          border: '1px solid var(--border-dark)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blob */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(201,100,66,0.06)', pointerEvents: 'none',
        }} />

        <div className="eyebrow" style={{ color: 'var(--text-inv-2)', marginBottom: 16 }}>
          Décompte mensuel 2026
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-inv-2)', marginBottom: 6 }}>CHF</span>
          <span
            className="mono-num"
            style={{ fontSize: 'clamp(34px, 8vw, 48px)', fontWeight: 700, color: 'var(--text-inv)', lineHeight: 1 }}
          >
            {fmt(animatedNet)}
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-inv-2)', marginBottom: 20 }}>
          net à verser par mois — <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{netPct}% du brut</span>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Brut mensuel', value: `CHF ${fmt(gross)}`, sub: '100%' },
            { label: 'Déductions', value: `−CHF ${fmt(totalDed)}`, sub: `${100 - netPct}%`, danger: true },
            { label: 'Net annuel', value: `CHF ${fmt(net * 12)}`, sub: 'estimation' },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12,
              padding: '12px 14px', border: '1px solid var(--border-dark)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-inv-2)', marginBottom: 4 }}>
                {kpi.label}
              </div>
              <div className="mono-num" style={{ fontSize: 14, fontWeight: 700, color: kpi.danger ? '#f87171' : 'var(--text-inv)' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-inv-2)', marginTop: 2 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Permit toggle */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-inv-2)', marginRight: 4 }}>Permis :</span>
          {(['C', 'B'] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPermit(p); setSelected(null); }}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 150ms', border: '1.5px solid',
                borderColor: permit === p ? 'var(--accent)' : 'var(--border-dark)',
                background: permit === p ? 'rgba(201,100,66,0.18)' : 'transparent',
                color: permit === p ? 'var(--accent)' : 'var(--text-inv-2)',
              }}
            >
              {p === 'C' ? 'Permis C / CH' : 'Permis B'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Donut chart ── */}
      <div
        ref={revealChart.ref}
        className="reveal"
        style={{
          background: 'var(--bg-card)', borderRadius: 20,
          border: '1px solid var(--border)', padding: '24px',
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 20 }}>Répartition visuelle</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

          {/* SVG donut */}
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            <svg
              viewBox="0 0 200 200"
              width="200"
              height="200"
              style={{ overflow: 'visible' }}
            >
              {/* Track ring */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="var(--border)"
                strokeWidth={SW}
              />

              {/* Segments */}
              {segments.map((seg) => (
                <circle
                  key={seg.id}
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={seg.id === selected ? SW + 4 : SW}
                  strokeDasharray={`${mounted ? seg.length : 0} ${circumference}`}
                  strokeDashoffset={-seg.offset}
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                    transition: `stroke-dasharray 0.55s ${seg.delay}s cubic-bezier(0.16,1,0.3,1), stroke-width 200ms ease`,
                    cursor: seg.id !== 'net' ? 'pointer' : 'default',
                    filter: seg.id === selected ? `drop-shadow(0 0 6px ${seg.color}88)` : 'none',
                  }}
                  onClick={() => handleSegmentClick(seg.id)}
                  aria-label={seg.id !== 'net' ? `${seg.label} — ${((seg.amount / gross) * 100).toFixed(1)}%` : undefined}
                  role={seg.id !== 'net' ? 'button' : undefined}
                />
              ))}
            </svg>

            {/* Center overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              {selected ? (
                <>
                  {/* Show selected segment info */}
                  {(() => {
                    const seg = segments.find((s) => s.id === selected);
                    if (!seg) return null;
                    return (
                      <>
                        <span className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: seg.color }}>
                          −{fmt(seg.amount)}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                          {((seg.amount / gross) * 100).toFixed(1)}% du brut
                        </span>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>NET</span>
                  <span className="mono-num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                    {netPct}%
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>du brut</span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%', maxWidth: 340 }}>
            {segments.map((seg) => {
              const pct = ((seg.amount / gross) * 100).toFixed(1);
              const isSelected = seg.id === selected;
              return (
                <div
                  key={seg.id}
                  role={seg.id !== 'net' ? 'button' : undefined}
                  tabIndex={seg.id !== 'net' ? 0 : undefined}
                  onClick={() => handleSegmentClick(seg.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSegmentClick(seg.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: isSelected ? `${seg.color}14` : 'transparent',
                    border: `1px solid ${isSelected ? seg.color + '44' : 'transparent'}`,
                    borderRadius: 8, padding: '6px 10px',
                    cursor: seg.id !== 'net' ? 'pointer' : 'default',
                    textAlign: 'left', transition: 'all 150ms',
                    opacity: seg.id === 'net' ? 0.8 : 1,
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>
                      {seg.label}
                    </div>
                    <div style={{ fontSize: 11, color: seg.color, fontWeight: 600 }}>
                      {pct}% · {fmt(seg.amount)} CHF
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Deduction detail cards ── */}
      <div ref={revealCards.ref} className="reveal reveal-delay-1">
        <div className="eyebrow" style={{ marginBottom: 16 }}>Détail des déductions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deductions.map((d, i) => {
            const amount = Math.round(gross * d.rate);
            const pct = (d.rate * 100).toFixed(1);
            const isOpen = selected === d.id;

            return (
              <div
                key={d.id}
                ref={(el) => { cardRefs.current[d.id] = el; }}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isOpen ? d.color + '55' : 'var(--border)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'border-color 200ms',
                }}
              >
                {/* Row header */}
                <button
                  onClick={() => setSelected(isOpen ? null : d.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 12, padding: '14px 16px',
                    background: isOpen ? `${d.color}0d` : 'transparent',
                    border: 'none', cursor: 'pointer',
                    textAlign: 'left', transition: 'background 200ms',
                  }}
                >
                  {/* Left border */}
                  <div style={{ width: 4, height: 36, borderRadius: 99, background: d.color, flexShrink: 0 }} />

                  {/* Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{d.sublabel}</div>
                  </div>

                  {/* Amount + pct */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="mono-num" style={{ fontSize: 15, fontWeight: 700, color: d.color }}>
                      −{fmt(amount)} <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>CHF</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{pct}%</div>
                  </div>

                  {/* Chevron */}
                  <svg
                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                    stroke="var(--text-3)" strokeWidth="1.6" strokeLinecap="round"
                    style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
                  >
                    <path d="M2 5l5 5 5-5" />
                  </svg>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ padding: '0 16px 16px 16px', animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
                    {/* Description */}
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                      {d.description}
                    </p>

                    {/* Detail breakdown */}
                    <div style={{
                      background: 'var(--bg-sidebar)', borderRadius: 10,
                      padding: '12px 14px', marginBottom: 12,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 10 }}>
                        Détail des taux 2026
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {d.details.map((det, j) => (
                          <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span className="mono-num" style={{
                              fontSize: 12, fontWeight: 700, color: d.color,
                              minWidth: 52, flexShrink: 0, paddingTop: 1,
                            }}>
                              {det.rate}
                            </span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{det.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{det.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Employer part */}
                    {d.employerRate > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(34,197,94,0.06)', borderRadius: 8,
                        padding: '9px 12px', marginBottom: 10,
                        border: '1px solid rgba(34,197,94,0.2)',
                      }}>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                          Part employeur — invisible sur ta fiche
                        </span>
                        <span className="mono-num" style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                          +{fmt(Math.round(gross * d.employerRate))} CHF
                        </span>
                      </div>
                    )}

                    {/* Tip */}
                    <div style={{
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                      padding: '10px 12px', borderRadius: 8,
                      background: `${d.color}0f`,
                      border: `1px solid ${d.color}22`,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-3)', marginTop: 2 }}>
                        <path d="M7 1a4 4 0 0 1 2 7.5V10H5V8.5A4 4 0 0 1 7 1z" />
                        <line x1="5" y1="12" x2="9" y2="12" />
                        <line x1="6" y1="13.5" x2="8" y2="13.5" />
                      </svg>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>{d.tip}</p>
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                      {d.tags.map((tag) => (
                        <span key={tag} style={{
                          fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                          textTransform: 'uppercase', padding: '3px 9px', borderRadius: 99,
                          background: `${d.color}18`, color: d.color,
                          border: `1px solid ${d.color}33`,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Employer cost section ── */}
      <div
        ref={revealEmployer.ref}
        style={{
          background: 'var(--bg-dark)', borderRadius: 20, padding: '24px',
          border: '1px solid var(--border-dark)',
        }}
        className="reveal reveal-delay-2"
      >
        <div className="eyebrow" style={{ color: 'var(--text-inv-2)', marginBottom: 16 }}>
          Ce que paie ton employeur en plus
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-inv-2)', lineHeight: 1.5, marginBottom: 16, margin: '0 0 16px 0' }}>
          Ces charges sociales sont invisibles sur ta fiche de paie — pourtant elles font partie de ton coût total pour l'entreprise.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {empSegs.map((d) => {
            const amt = Math.round(gross * d.employerRate);
            return (
              <div
                key={d.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dark)',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-inv-2)' }}>
                  <span style={{ color: d.color }}>{d.label}</span> — part employeur
                </span>
                <span className="mono-num" style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                  +{fmt(amt)} CHF
                </span>
              </div>
            );
          })}
        </div>

        {/* Total employer cost */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', borderRadius: 12,
          background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-inv-2)', marginBottom: 2 }}>Coût réel mensuel pour ton employeur</div>
            <div style={{ fontSize: 11, color: 'var(--text-inv-2)', opacity: 0.7 }}>
              Brut ({fmt(gross)}) + charges ({fmt(empTotal)})
            </div>
          </div>
          <span className="mono-num" style={{ fontSize: 20, fontWeight: 700, color: '#fb923c' }}>
            {fmt(gross + empTotal)} CHF
          </span>
        </div>
      </div>

    </div>
  );
}
