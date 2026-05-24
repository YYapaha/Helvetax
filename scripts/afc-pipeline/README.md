# AFC Data Pipeline

Télécharge et parse les barèmes impôt à la source 2026 depuis l'AFC.

## Setup (1 fois)

```bash
cd tax-optimizer
npm install -D ts-node adm-zip node-fetch@2 @types/adm-zip @types/node-fetch
```

## Exécution

```bash
npx ts-node scripts/afc-pipeline/fetch-afc.ts
```

## Résultat

Génère `src/data/fiscalData2026.json` avec:
- Données fédérales (pillar3a, taux cotisations)
- Barèmes par canton (VS, VD, GE, NE) parsés depuis les ZIPs AFC

## Notes

- Cache local dans `scripts/afc-pipeline/.cache/` (évite re-téléchargement)
- Encoding latin1 (format AFC)
- En cas d'erreur HTTP: vérifier que les URLs AFC sont toujours valides
- Sources: `https://www.estv2.admin.ch/qst/2026/loehne/tar26vs.zip` (et vd, ge, ne)
