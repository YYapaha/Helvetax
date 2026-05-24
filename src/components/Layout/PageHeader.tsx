import { useTheme } from '../../hooks/useTheme';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  accent?: string;
  meta?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, accent, meta }: PageHeaderProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header style={{ padding: '40px 0 28px', position: 'relative' }}>

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        title={isDark ? 'Mode clair' : 'Mode sombre'}
        aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
        style={{
          position: 'absolute', top: 40, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-3)', cursor: 'pointer',
          transition: 'background 150ms, color 150ms',
        }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-sidebar)'; el.style.color = 'var(--text)'; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-card)'; el.style.color = 'var(--text-3)'; }}
      >
        {isDark ? (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="7.5" cy="7.5" r="2.5" />
            <line x1="7.5" y1="1" x2="7.5" y2="2.5" />
            <line x1="7.5" y1="12.5" x2="7.5" y2="14" />
            <line x1="1" y1="7.5" x2="2.5" y2="7.5" />
            <line x1="12.5" y1="7.5" x2="14" y2="7.5" />
            <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" />
            <line x1="10.89" y1="10.89" x2="11.95" y2="11.95" />
            <line x1="3.05" y1="11.95" x2="4.11" y2="10.89" />
            <line x1="10.89" y1="4.11" x2="11.95" y2="3.05" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9.5A6 6 0 0 1 4.5 2a6 6 0 1 0 7.5 7.5z" />
          </svg>
        )}
      </button>

      {/* Eyebrow */}
      <div className="eyebrow" style={{ marginBottom: 14 }}>
        {eyebrow}
      </div>

      {/* Titre Instrument Serif */}
      <h1
        className="display"
        style={{
          fontSize: 'var(--fs-display-lg)',
          color: 'var(--text)',
          margin: 0,
          lineHeight: 1.05,
        }}
      >
        {title}
        {accent && (
          <>
            {' '}
            <span className="italic-accent">{accent}</span>
          </>
        )}
      </h1>

      {meta && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-2)' }}>
          {meta}
        </div>
      )}
    </header>
  );
}
