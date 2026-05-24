import { useTheme } from '../../hooks/useTheme';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3.5"
      style={{
        background: isDark ? 'rgba(26,24,22,0.90)' : 'rgba(250,249,247,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-all"
        style={{ color: 'var(--text-2)', background: 'transparent' }}
        aria-label="Menu"
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--border-soft)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="2" y1="4" x2="14" y2="4" />
          <line x1="2" y1="8" x2="14" y2="8" />
          <line x1="2" y1="12" x2="14" y2="12" />
        </svg>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold leading-snug truncate" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{ color: 'var(--text-3)', background: 'transparent' }}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--border-soft)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          {isDark ? (
            /* Sun icon */
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="7.5" cy="7.5" r="2.5" />
              <line x1="7.5" y1="1"   x2="7.5" y2="2.5" />
              <line x1="7.5" y1="12.5" x2="7.5" y2="14" />
              <line x1="1"   y1="7.5" x2="2.5" y2="7.5" />
              <line x1="12.5" y1="7.5" x2="14" y2="7.5" />
              <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" />
              <line x1="10.89" y1="10.89" x2="11.95" y2="11.95" />
              <line x1="3.05" y1="11.95" x2="4.11" y2="10.89" />
              <line x1="10.89" y1="4.11" x2="11.95" y2="3.05" />
            </svg>
          ) : (
            /* Moon icon */
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9.5A6 6 0 0 1 4.5 2a6 6 0 1 0 7.5 7.5z" />
            </svg>
          )}
        </button>

        {/* Help */}
        <button
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{ color: 'var(--text-3)', background: 'transparent' }}
          title="Aide"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--border-soft)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="7.5" cy="7.5" r="6.5" />
            <path d="M5.5 5.5a2 2 0 1 1 2 2v1" strokeLinecap="round" />
            <circle cx="7.5" cy="11" r="0.5" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
