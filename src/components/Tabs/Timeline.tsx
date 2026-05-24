import React, { useMemo, useRef, useEffect } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { generateTimeline } from '../../utils/generateTimeline';
import type { EventType } from '../../utils/generateTimeline';
import { useReveal } from '../../hooks/useReveal';
import { useCountUp } from '../../hooks/useCountUp';

const TYPE_CONFIG: Record<EventType, { dot: string; bg: string; border: string; text: string; label: string }> = {
  critical: { dot: '#C94242', bg: '#FDF0F0', border: '#F0A0A0', text: '#C94242', label: 'Deadline' },
  warning:  { dot: '#C9830A', bg: '#FDF6EC', border: '#F0C478', text: '#C9830A', label: 'Action'   },
  positive: { dot: '#2E9E6B', bg: '#EFFAF5', border: '#A8DFC4', text: '#2E9E6B', label: 'Habitude'  },
  info:     { dot: 'var(--text-3)', bg: 'var(--bg-sidebar)', border: 'var(--border)', text: 'var(--text-2)', label: 'Info' },
};

function IconCritical() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 1L11 10H1L6 1z" /><line x1="6" y1="5" x2="6" y2="7.5" /><circle cx="6" cy="9" r="0.5" fill="currentColor" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="6" cy="6" r="5" /><line x1="6" y1="4" x2="6" y2="6.5" /><circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
function IconPositive() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="5" /><path d="M3.5 6l1.8 1.8L8.5 4.5" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="6" cy="6" r="5" /><line x1="6" y1="5.5" x2="6" y2="9" /><circle cx="6" cy="3.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

const TYPE_ICONS: Record<EventType, React.ReactNode> = {
  critical: <IconCritical />,
  warning:  <IconWarning />,
  positive: <IconPositive />,
  info:     <IconInfo />,
};

// ─── KPI Card Timeline ─────────────────────────────────────────────────────
function TLKPI({ value, label, accentColor, delayClass }: { value: number; label: string; accentColor?: string; delayClass?: string }) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const n = useCountUp(value, { start: inView, duration: 1000 });
  return (
    <div ref={ref} className={`reveal ${delayClass ?? ''}`} style={{ flex: 1, padding: '20px 12px', textAlign: 'center' }}>
      <div className="display mono-num" style={{
        fontSize: 'clamp(18px, 4vw, 26px)',
        color: accentColor ?? 'var(--text)',
        lineHeight: 1, marginBottom: 6,
      }}>
        {n}
      </div>
      <div className="eyebrow" style={{ fontSize: 9, justifyContent: 'center' }}>{label}</div>
    </div>
  );
}

export function TimelineTab() {
  const profile          = useProfileStore((s) => s.profile);
  const completedActions = useProfileStore((s) => s.completedActions);
  const currentMonthRef  = useRef<HTMLDivElement>(null);

  const timeline = useMemo(() => (profile ? generateTimeline(profile) : []), [profile]);

  const now = new Date();
  const currentMonth  = now.getMonth() + 1;
  const currentYear   = now.getFullYear();
  const isCurrentYear = currentYear === 2026;

  const [openMonths, setOpenMonths] = React.useState<Set<number>>(() =>
    new Set(isCurrentYear ? [currentMonth] : [])
  );

  const toggleMonth = (month: number) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) { next.delete(month); } else { next.add(month); }
      return next;
    });
  };

  useEffect(() => {
    if (currentMonthRef.current && isCurrentYear) {
      setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [isCurrentYear]);

  if (!profile) return (
    <div className="flex items-center justify-center py-20 rounded-2xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-2)' }}>Veuillez compléter votre profil</p>
    </div>
  );

  const deadlineCount = timeline.flatMap(m => m.events).filter(e => e.type === 'critical').length;
  const totalEvents   = timeline.flatMap(m => m.events).length;

  // Calculer le prochain événement critique non-passé
  const nextDeadline = timeline
    .flatMap(m => m.events.map((e: any) => ({ ...e, monthNum: m.month })))
    .filter((e: any) => e.type === 'critical')
    .map((e: any) => ({ ...e, date: new Date(2026, e.monthNum - 1, e.day || 1) }))
    .filter((e: any) => e.date.getTime() > Date.now())
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())[0];

  const daysLeft = nextDeadline
    ? Math.ceil((nextDeadline.date.getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* ── Hero countdown deadline ─────────────────────────────── */}
      {nextDeadline && daysLeft !== null && (
        <div
          className="reveal rounded-2xl"
          style={{
            background: 'var(--bg-dark)',
            padding: '22px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--text-inv-2)', marginBottom: 10 }}>
              Prochaine deadline
            </div>
            <div className="display" style={{
              fontSize: 'clamp(18px, 4vw, 24px)',
              color: 'var(--text-inv)',
              lineHeight: 1.1,
            }}>
              {nextDeadline.title}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div
              className="display mono-num italic-accent"
              style={{ fontSize: 'clamp(40px, 9vw, 56px)', lineHeight: 1 }}
            >
              J–{daysLeft}
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Strip ──────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex' }}
      >
        <TLKPI value={2026}          label="Année fiscale"      delayClass="reveal-delay-1" />
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
        <TLKPI value={deadlineCount} label="Deadlines absolues" accentColor="#C94242" delayClass="reveal-delay-2" />
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
        <TLKPI value={totalEvents}   label="Événements"         accentColor="var(--accent)" delayClass="reveal-delay-3" />
      </div>

      {/* ── Legend ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '0 2px' }}>
        {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 99, background: cfg.dot, flexShrink: 0 }} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* ── Timeline accordion ──────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 19, top: 12, bottom: 12, width: 1,
          background: 'var(--border)',
        }} />

        <div>
          {timeline.map((month, mIdx) => {
            const isCurrentMonth = isCurrentYear && month.month === currentMonth;
            const isPast         = isCurrentYear && month.month < currentMonth;
            const isOpen         = openMonths.has(month.month);

            return (
              <div
                key={month.month}
                ref={isCurrentMonth ? currentMonthRef : undefined}
                style={{ position: 'relative' }}
              >
                {/* Month header */}
                <button
                  onClick={() => toggleMonth(month.month)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 12, padding: '16px 0',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                  }}
                >
                  {/* Month circle */}
                  <div style={{
                    position: 'relative', zIndex: 10, flexShrink: 0,
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: isCurrentMonth ? 'var(--accent)' : 'var(--bg-sidebar)',
                    color:      isCurrentMonth ? '#fff'          : 'var(--text-3)',
                    border:     isCurrentMonth ? '2px solid var(--accent)' : '2px solid var(--border)',
                  }}>
                    {month.month.toString().padStart(2, '0')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    {/* Mois en Instrument Serif */}
                    <h2
                      className="display"
                      style={{
                        fontSize: 'clamp(20px, 4vw, 26px)',
                        lineHeight: 1,
                        color: isPast ? 'var(--text-3)' : 'var(--text)',
                        margin: 0,
                      }}
                    >
                      {month.name}
                    </h2>

                    {/* Badge "En cours" avec pulse dot */}
                    {isCurrentMonth && (
                      <div className="eyebrow" style={{ fontSize: 10, color: 'var(--accent)', gap: 6 }}>
                        <span style={{
                          width: 6, height: 6,
                          background: 'var(--accent)', borderRadius: 99,
                          display: 'inline-block',
                          animation: 'pulse 1.6s ease-in-out infinite',
                        }} />
                        En cours · {now.getDate()}
                      </div>
                    )}

                    {isPast && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Passé</span>
                    )}

                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginLeft: 'auto' }}>
                      {month.events.length} év.
                    </span>

                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                      style={{
                        color: 'var(--text-3)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      <path d="M2.5 5l4.5 4 4.5-4" />
                    </svg>
                  </div>
                </button>

                {/* Collapsible events */}
                <div style={{
                  overflow: 'hidden',
                  maxHeight: isOpen ? '3000px' : '0px',
                  transition: isOpen ? 'max-height 0.35s ease' : 'max-height 0.2s ease',
                }}>
                  <div style={{ paddingLeft: 56, paddingBottom: 12, display: 'grid', gap: 8 }}>
                    {month.events.map((event: any) => {
                      const cfg    = TYPE_CONFIG[event.type as EventType];
                      const isDone = event.actionId ? completedActions.includes(event.actionId) : false;

                      return (
                        <div
                          key={event.id}
                          style={{
                            position: 'relative', borderRadius: 12, padding: '14px 16px',
                            background: isDone ? 'var(--bg-sidebar)' : cfg.bg,
                            border: `1px solid ${isDone ? 'var(--border-soft)' : cfg.border}`,
                            opacity: isPast && !isDone ? 0.6 : 1,
                            transition: 'opacity 200ms',
                          }}
                        >
                          {/* Connector line */}
                          <div style={{
                            position: 'absolute', left: -22, top: '50%', transform: 'translateY(-50%)',
                            width: 18, height: 1,
                            background: cfg.dot, opacity: isDone ? 0.3 : 0.5,
                          }} />
                          {/* Connector dot */}
                          <div style={{
                            position: 'absolute', left: -28, top: '50%', transform: 'translateY(-50%)',
                            width: 7, height: 7, borderRadius: '50%',
                            background: isDone ? 'var(--text-3)' : cfg.dot,
                            border: '1.5px solid var(--bg-card)',
                          }} />

                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            {/* Icon */}
                            <div style={{
                              flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: 6,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isDone ? 'var(--border-soft)' : cfg.bg,
                              color: isDone ? 'var(--text-3)' : cfg.text,
                            }}>
                              {isDone
                                ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5l2.5 2.5 5-5" /></svg>
                                : TYPE_ICONS[event.type as EventType]
                              }
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <p style={{
                                  flex: 1, fontSize: 14, fontWeight: 500, lineHeight: 1.4, margin: 0,
                                  color: isDone ? 'var(--text-3)' : event.type === 'info' ? 'var(--text)' : cfg.text,
                                  textDecoration: isDone ? 'line-through' : 'none',
                                }}>
                                  {event.title}
                                </p>
                                {event.day && !isDone && (
                                  <span className="mono-num" style={{
                                    flexShrink: 0, fontSize: 12, fontWeight: 600,
                                    padding: '2px 7px', borderRadius: 6,
                                    background: cfg.text, color: '#fff',
                                  }}>
                                    /{event.day}
                                  </span>
                                )}
                              </div>
                              {event.detail && (
                                <p style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5, color: isDone ? 'var(--text-3)' : 'var(--text-2)', margin: '4px 0 0' }}>
                                  {event.detail}
                                </p>
                              )}
                              {event.actionId && (
                                <div style={{ marginTop: 8 }}>
                                  <span style={{
                                    fontSize: 11, padding: '3px 10px', borderRadius: 99,
                                    background: isDone ? 'var(--border-soft)' : 'var(--accent-bg)',
                                    color: isDone ? 'var(--text-3)' : 'var(--accent)',
                                    border: `1px solid ${isDone ? 'var(--border)' : 'var(--accent)'}`,
                                  }}>
                                    {isDone ? '✓ Action réalisée' : `→ Action #${event.actionId}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Month separator */}
                {mIdx < timeline.length - 1 && (
                  <div style={{ height: 1, marginLeft: 56, background: 'var(--border-soft)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: 11, textAlign: 'center', padding: '0 16px 16px', color: 'var(--text-3)' }}>
        Deadlines basées sur le canton de {profile.canton} · Année fiscale 2026
      </p>
    </div>
  );
}
