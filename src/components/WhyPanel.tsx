import { useEffect, useState } from 'react';
import { getExplanation } from '../utils/getExplanation';
import type { UserProfile } from '../types';

interface Action {
  id: string;
  titre: string;
  gain: number;
  category: string;
  why?: string;
  source?: string;
  guide?: string;
  checklist?: string[];
  priority: 'high' | 'medium' | 'low';
}

interface WhyPanelProps {
  action: Action | null;
  profile: UserProfile;
  onClose: () => void;
}

const PRIORITY_LABEL = { high: 'Haute priorité', medium: 'Priorité moyenne', low: 'Basse priorité' } as const;
const PRIORITY_COLOR = { high: '#C94242', medium: '#C9830A', low: '#2E9E6B' } as const;
const PRIORITY_BG    = { high: '#FDF0F0', medium: '#FDF6EC', low: '#EFFAF5' } as const;

function GuideContent({ action }: { action: Action }) {
  const steps = (action.guide ?? '').split('\n').filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Steps */}
      {steps.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-3)', letterSpacing: '0.08em' }}>
            Étapes à suivre
          </h3>
          <div className="space-y-2">
            {steps.map((step, i) => {
              const isNumbered = /^[\d]+\./.test(step.trim());
              const isBullet   = /^[-•✓✅⚠️💡❌🔑]/.test(step.trim());
              const isHeader   = /^[A-ZÀÂÇ\u{1F300}-\u{1F9FF}].*:$/u.test(step.trim());
              const cleanStep  = step.replace(/^[\d]+\.\s*/, '').replace(/^[-•]\s*/, '').trim();

              if (isHeader) {
                return (
                  <p key={i} className="text-xs font-semibold uppercase mt-4 mb-1"
                    style={{ color: 'var(--text-3)', letterSpacing: '0.06em' }}>
                    {cleanStep}
                  </p>
                );
              }

              if (isNumbered) {
                const num = step.match(/^(\d+)/)?.[1] ?? String(i + 1);
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center mt-0.5"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {num}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{cleanStep}</p>
                  </div>
                );
              }

              if (isBullet) {
                const isWarning = step.includes('⚠️');
                const isTip     = step.includes('💡');
                const isGood    = step.includes('✅') || step.includes('✓');
                const isBad     = step.includes('❌');
                const bg = isWarning ? '#FDF6EC' : isTip ? 'var(--accent-bg)' : isGood ? '#EFFAF5' : isBad ? '#FDF0F0' : 'var(--bg)';
                const color = isWarning ? '#C9830A' : isTip ? 'var(--accent)' : isGood ? '#2E9E6B' : isBad ? '#C94242' : 'var(--text-2)';
                return (
                  <div key={i} className="rounded-lg px-3 py-2 text-sm leading-relaxed"
                    style={{ background: bg, color, border: `1px solid ${isWarning ? '#F0C478' : isTip ? 'var(--accent)' : isGood ? '#A8DFC4' : isBad ? '#F0A0A0' : 'var(--border-soft)'}` }}>
                    {cleanStep}
                  </div>
                );
              }

              // Plain text / key:value line
              if (step.includes(':') && !step.includes('http')) {
                const [key, ...vals] = step.split(':');
                return (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0 font-medium" style={{ color: 'var(--text)', minWidth: '120px' }}>{key.trim()}</span>
                    <span style={{ color: 'var(--text-2)' }}>{vals.join(':').trim()}</span>
                  </div>
                );
              }

              return (
                <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{step.trim()}</p>
              );
            })}
          </div>
        </div>
      )}

      {/* Checklist */}
      {action.checklist && action.checklist.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-3)', letterSpacing: '0.08em' }}>
            Checklist
          </h3>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {action.checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 text-sm"
                style={{ borderBottom: i < action.checklist!.length - 1 ? '1px solid var(--border-soft)' : 'none', color: 'var(--text-2)' }}>
                <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--bg)' }}>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gain reminder */}
      <div className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)' }}>
        <span className="text-sm" style={{ color: 'var(--text-2)' }}>Économie estimée</span>
        <span className="text-sm font-semibold font-mono" style={{ color: 'var(--accent)' }}>
          CHF {action.gain.toLocaleString('fr-CH')}
        </span>
      </div>
    </div>
  );
}

export function WhyPanel({ action, profile, onClose }: WhyPanelProps) {
  const isOpen = action !== null;
  const [activeTab, setActiveTab] = useState<'why' | 'guide'>('why');

  // Reset tab when action changes
  useEffect(() => { setActiveTab('why'); }, [action?.id]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const explanation = action ? getExplanation(action, profile) : null;

  const tabStyle = (active: boolean) => ({
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-3)',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    fontWeight: active ? 600 : 400,
  });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: 'rgba(31,29,27,0.45)',
          backdropFilter: 'blur(3px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 'min(520px, 100vw)',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '-8px 0 40px rgba(31,29,27,0.12)',
        }}
      >
        {action && explanation && (
          <>
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-5 pb-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  {/* Eyebrow priorité */}
                  <div className="eyebrow" style={{ marginBottom: 10, color: PRIORITY_COLOR[action.priority] }}>
                    {PRIORITY_LABEL[action.priority]}
                  </div>
                  {/* Titre Instrument Serif */}
                  <h2
                    className="display"
                    style={{
                      fontSize: 'clamp(20px, 4vw, 26px)',
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      margin: '0 0 14px',
                      color: 'var(--text)',
                    }}
                  >
                    {action.titre}
                  </h2>
                  {/* Gain dramatique */}
                  <div
                    className="display mono-num"
                    style={{
                      fontSize: 34, lineHeight: 1,
                      color: 'var(--accent)',
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                      CHF
                    </span>
                    {action.gain.toLocaleString('fr-CH')}
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                      économisés
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all mt-1"
                  style={{ color: 'var(--text-3)', background: 'transparent' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--border-soft)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  aria-label="Fermer"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <line x1="1" y1="1" x2="13" y2="13" />
                    <line x1="13" y1="1" x2="1" y2="13" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-0">
                <button
                  onClick={() => setActiveTab('why')}
                  className="px-4 py-2.5 text-sm transition-all"
                  style={tabStyle(activeTab === 'why')}
                >
                  Pourquoi ?
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className="px-4 py-2.5 text-sm transition-all"
                  style={tabStyle(activeTab === 'guide')}
                >
                  Guide pratique
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {activeTab === 'why' && (
                <div className="space-y-6">
                  {explanation.sections.map((section, i) => (
                    <div key={i}>
                      <h3
                        className="text-xs font-semibold uppercase tracking-widest mb-3"
                        style={{ color: 'var(--text-3)', letterSpacing: '0.08em' }}
                      >
                        {section.title}
                      </h3>
                      {section.content}
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'guide' && <GuideContent action={action} />}
            </div>

            {/* Footer */}
            <div
              className="flex-shrink-0 px-6 py-4 flex items-center gap-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {explanation.source && (
                <a
                  href={explanation.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs transition-all"
                  style={{ color: 'var(--accent)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7M8 1h3m0 0v3m0-3L5 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Source officielle
                </a>
              )}
              <button
                onClick={onClose}
                className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent-dark)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent)')}
              >
                Compris
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
