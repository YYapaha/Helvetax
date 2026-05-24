# Helvetax

Optimiseur fiscal personnel pour résidents suisses — Bêta privée 2026.

Calculs 100 % locaux, aucune donnée transmise à un serveur.

---

## Stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4
- Zustand 5 (persistence localStorage)

## Fonctionnalités

| Onglet | Description |
|--------|-------------|
| **Actions** | 42 leviers fiscaux personnalisés selon profil (canton, permis, situation) |
| **Timeline** | Calendrier des échéances fiscales 2026 |
| **Impact** | Graphique CHF économisé par catégorie + taux marginal/effectif |
| **Lexique** | 35 termes fiscaux suisses avec définitions et sources officielles |
| **Ma fiche** | Récapitulatif du profil fiscal |
| **Déclaration** | Aide à la déclaration avec simulation |

## Cantons supportés

VS · VD · GE · NE

## Calculs

- Barèmes IFD 2026 officiels (ESTV) — barème A (célibataires) et B (couples)
- Barèmes cantonaux recalibrés sur données VStax / taxcalculator.ch
- Taux marginal par différence finie (Δ 1 000 CHF)
- Revenu imposable estimé à 80 % du brut (déductions forfaitaires standard)

## Lancement

```bash
npm install
npm run dev
```

## Sources

- [ESTV — Barèmes IFD 2026](https://www.estv.admin.ch/fr/impot-federal-direct)
- [vs.ch — Service cantonal des contributions](https://www.vs.ch/web/scc)
- [admin.ch — Pilier 3a](https://www.admin.ch/fr/newnsb/xgRMirCsezICX4rtof9Lm)

---

> Données indicatives — non contractuelles. En cas de doute, consultez votre service cantonal des contributions ou un expert fiscal.
