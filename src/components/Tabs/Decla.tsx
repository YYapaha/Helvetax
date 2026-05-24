import { useRef, useEffect, useState } from 'react';
import { useDeclaStore } from '../../stores/declaStore';
import {
  DeclaProgress,
  SectionIntro,
  SectionDocs,
  SectionRevenus,
  SectionDeductions,
  SectionSimulation,
  SectionSoumettre,
} from '../Decla';

// ── Transition wrapper ────────────────────────────────────────────────────────

function SlidePane({
  children,
  direction,
}: {
  children: React.ReactNode;
  direction: 'left' | 'right' | 'none';
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const translateStart = direction === 'left' ? '24px' : direction === 'right' ? '-24px' : '0px';

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : `translateX(${translateStart})`,
        transition: 'opacity 320ms ease, transform 320ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {children}
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export function DeclaTab() {
  const { currentStep, setStep } = useDeclaStore();
  const prevStepRef = useRef(currentStep);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine slide direction
  const direction = currentStep > prevStepRef.current ? 'left' : 'right';
  const slideKey = currentStep; // forces remount → re-trigger animation

  function goTo(step: number) {
    prevStepRef.current = currentStep;
    setStep(step);
    // Scroll to top of the wizard
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const goNext = () => goTo(Math.min(currentStep + 1, 5));
  const goBack = () => goTo(Math.max(currentStep - 1, 0));

  const renderSection = () => {
    // Direction for this step transition
    const dir = currentStep > prevStepRef.current ? 'left' : currentStep < prevStepRef.current ? 'right' : 'none';

    switch (currentStep) {
      case 0: return (
        <SlidePane key={slideKey} direction={dir}>
          <SectionIntro onNext={goNext} />
        </SlidePane>
      );
      case 1: return (
        <SlidePane key={slideKey} direction={dir}>
          <SectionDocs onNext={goNext} onBack={goBack} />
        </SlidePane>
      );
      case 2: return (
        <SlidePane key={slideKey} direction={dir}>
          <SectionRevenus onNext={goNext} onBack={goBack} />
        </SlidePane>
      );
      case 3: return (
        <SlidePane key={slideKey} direction={dir}>
          <SectionDeductions onNext={goNext} onBack={goBack} />
        </SlidePane>
      );
      case 4: return (
        <SlidePane key={slideKey} direction={dir}>
          <SectionSimulation onNext={goNext} onBack={goBack} />
        </SlidePane>
      );
      case 5: return (
        <SlidePane key={slideKey} direction={dir}>
          <SectionSoumettre onBack={goBack} />
        </SlidePane>
      );
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sticky progress bar */}
      <div style={{ margin: '0 -20px', marginBottom: 24 }} className="lg:mx-0">
        <DeclaProgress
          currentStep={currentStep}
          onStepClick={(idx) => {
            // Allow clicking back to previous steps freely, forward only if current is complete
            if (idx <= currentStep) goTo(idx);
          }}
        />
      </div>

      {/* Section content */}
      <div ref={containerRef} style={{ flex: 1 }}>
        {renderSection()}
      </div>

      {/* Bottom reset link */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <button
          onClick={() => {
            if (window.confirm('Recommencer le wizard depuis le début ? Vos cochages seront réinitialisés.')) {
              useDeclaStore.getState().resetDecla();
            }
          }}
          style={{
            fontSize: 12, color: 'var(--text-3)', background: 'none',
            border: 'none', cursor: 'pointer', textDecoration: 'underline',
            textDecorationColor: 'var(--border)',
          }}
        >
          Recommencer depuis le début
        </button>
      </div>
    </div>
  );
}
