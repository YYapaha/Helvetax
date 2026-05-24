import { useState } from 'react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Les 5 onglets principaux
const PRIMARY_TABS = [
  {
    id: 'actions',
    label: 'Actions',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h14M4 11h10M4 16h7" />
        <circle cx="17" cy="16" r="3.5" />
        <path d="M15.5 16l1 1 2-2" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="16" height="15" rx="3" />
        <line x1="3" y1="9" x2="19" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="14" y1="2" x2="14" y2="6" />
        <path d="M7 14l2 2 4-4" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'impact',
    label: 'Impact',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,16 8,11 12,14 19,6" />
        <polyline points="15,6 19,6 19,10" />
      </svg>
    ),
  },
  // { id: 'jumeau', label: 'Jumeau', icon: ... }, // MASQUÉ — à réactiver après améliorations
  {
    id: 'more',
    label: 'Plus',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="6" cy="11" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="11" cy="11" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="11" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

// Les onglets dans le "Plus"
const MORE_TABS = [
  { id: 'fiche',   label: 'Ma fiche de paie' },
  { id: 'lexique', label: 'Lexique fiscal' },
  { id: 'decla',   label: 'Déclaration 2026' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_TABS.some((t) => t.id === activeTab);

  const handleTabClick = (id: string) => {
    if (id === 'more') {
      setMoreOpen((prev) => !prev);
      return;
    }
    setMoreOpen(false);
    onTabChange(id);
  };

  return (
    <>
      {/* More sheet backdrop */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setMoreOpen(false)}
          style={{ background: 'rgba(31,29,27,0.3)' }}
        />
      )}

      {/* More sheet */}
      <div
        className="md:hidden fixed left-0 right-0 z-50 transition-all duration-300"
        style={{
          bottom: moreOpen ? 72 : -200,
          background: 'var(--bg-card)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          border: '1px solid var(--border)',
          padding: '16px 8px 8px',
          boxShadow: '0 -4px 24px rgba(31,29,27,0.12)',
        }}
      >
        {MORE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { onTabChange(tab.id); setMoreOpen(false); }}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 20px',
              textAlign: 'left',
              fontSize: 15,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text)',
              background: activeTab === tab.id ? 'var(--accent-bg)' : 'transparent',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bottom nav bar */}
      <nav
        className="md:hidden flex fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          height: 'calc(56px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          alignItems: 'stretch',
        }}
      >
        {PRIMARY_TABS.map((tab) => {
          const isActive = tab.id === 'more' ? isMoreActive || moreOpen : activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              aria-label={tab.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: isActive ? 'var(--accent)' : 'var(--text-3)',
                transition: 'color 150ms',
                paddingTop: 6,
              }}
            >
              {tab.icon}
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: '0.01em' }}>
                {tab.label}
              </span>
              {/* Active dot */}
              <div style={{
                width: 4, height: 4, borderRadius: 99,
                background: isActive ? 'var(--accent)' : 'transparent',
                transition: 'background 150ms',
              }} />
            </button>
          );
        })}
      </nav>
    </>
  );
}
