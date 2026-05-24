import React from 'react';

interface Props {
  compact?: boolean; // true = une seule ligne, false = texte complet
}

export function LegalDisclaimer({ compact = false }: Props) {
  if (compact) {
    return (
      <p style={{
        fontSize: 11, color: 'var(--text-3)', textAlign: 'center',
        padding: '8px 16px', lineHeight: 1.5,
      }}>
        Données indicatives — non contractuelles. Source : barèmes officiels AFC 2026.
      </p>
    );
  }

  return (
    <div style={{
      margin: '24px 0 8px',
      padding: '12px 16px',
      borderRadius: 10,
      background: 'rgba(201,100,66,0.06)',
      border: '1px solid rgba(201,100,66,0.15)',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
        <strong style={{ color: 'var(--text)', fontWeight: 600 }}>Avertissement</strong>
        {' '}—{' '}
        Les informations fournies par Helvetax sont à titre indicatif et ne constituent pas
        un conseil fiscal personnalisé. Les calculs sont basés sur les barèmes officiels
        AFC 2026. En cas de doute, consultez votre service cantonal des contributions ou
        un expert fiscal. Helvetax décline toute responsabilité en cas d&apos;erreur de
        saisie ou d&apos;interprétation.
      </p>
    </div>
  );
}
