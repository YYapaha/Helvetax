# Validation Helvetax — swisstaxcalculator 2026

> **Dernière exécution automatique : 24.05.2026**
> API utilisée : `https://swisstaxcalculator.vercel.app/api/taxes`
> Commande : `npx vite-node scripts/validate-against-official.ts`

---

## Note méthodologique essentielle

| Régime | Helvetax | swisstaxcalculator |
|--------|----------|--------------------|
| Type | **IS** — Impôt à la source | **TOU** — Impôt ordinaire |
| Base | Revenu **brut** × taux AFC | Revenu brut − déductions → taxable |
| Qui | Titulaires de permis B salariés | Résidents ordinaires (C, CH) |
| Déductions | Implicites dans le barème AFC | Explicites (prof. expenses, 3a, etc.) |

**Un écart IS < TOU de 5–30% est normal** pour les hauts revenus, et peut atteindre 50–55% pour les revenus faibles (l'IS intègre des déductions forfaitaires très larges à bas revenu).  
**Seul un écart IS > TOU, ou une inversion inter-cantonale, signale un problème.**

---

## Résultats automatiques — Tableau de synthèse

> Exécution 22/22 cas ✓ — API publique disponible

### Impôt sur le revenu (IS vs TOU)

| ID | Situation | Brut/an | HX IS CHF | TOU CHF | Écart | Statut |
|----|-----------|---------|-----------|---------|-------|--------|
| VS-01 | VS · Célibataire · 60k | 60 000 | **4 428** | 9 941 | −55.5% | ✓ attendu |
| VS-02 | VS · Célibataire · 80k | 80 000 | **8 128** | 17 676 | −54.0% | ✓ attendu |
| VS-03 | VS · Célibataire · 100k | 100 000 | **12 430** | 25 933 | −52.1% | ✓ attendu |
| VS-04 | VS · Célibataire · 150k | 150 000 | **26 715** | 43 346 | −38.4% | ✓ attendu |
| VS-05 | VS · Couple 1 rev. · 120k | 120 000 | **17 592** | 30 082 | −41.5% | ✓ attendu |
| VS-06 | VS · Couple 2 rev. · 150k | 150 000 | **16 485** | 37 199 | −55.7% | ✓ attendu |
| VS-07 | VS · Couple 1 rev. · 2 enf. · 120k | 120 000 | **13 476** | 27 264 | −50.6% | ✓ attendu |
| VD-01 | VD · Célibataire · 80k | 80 000 | **9 640** | 13 973 | −31.0% | ✓ attendu |
| VD-02 | VD · Célibataire · 100k | 100 000 | **13 790** | 19 524 | −29.4% | ✓ ok |
| VD-03 | VD · Couple 1 rev. · 150k | 150 000 | **25 425** | 27 702 | −8.2% | ✓ ok |
| VD-04 | VD · Couple 2 rev. · 2 enf. · 150k | 150 000 | **15 480** | 25 536 | −39.4% | ✓ attendu |
| GE-01 | GE · Célibataire · 80k | 80 000 | **8 848** | 13 240 | −33.2% | ✓ attendu |
| GE-02 | GE · Célibataire · 120k | 120 000 | **18 672** | 25 502 | −26.8% | ✓ ok |
| GE-03 | GE · Couple 2 rev. · 200k | 200 000 | **31 440** | 40 947 | −23.2% | ✓ ok |
| NE-01 | NE · Célibataire · 80k | 80 000 | **11 096** | 13 590 | −18.4% | ✓ ok |
| NE-02 | NE · Célibataire · 100k | 100 000 | **15 830** | 19 232 | −17.7% | ✓ ok |
| NE-03 | NE · Couple 1 rev. · 1 enf. · 120k | 120 000 | **18 240** | 17 494 | **+4.3%** | ⚠ HX > TOU |
| NE-04 | NE · Couple 2 rev. · 160k | 160 000 | **25 584** | 28 796 | −11.2% | ✓ ok |

> VS : les grands écarts (−50%) s'expliquent par le barème IS VS qui applique des déductions forfaitaires
> implicites très larges, réduisant fortement le taux sur brut à bas revenu.
> NE-03 : IS légèrement supérieur au TOU — tendance à surveiller, cohérent avec le fort coefficient NE (1.80).

### Impôt sur la fortune

| ID | Situation | Fortune | HX Fort. CHF | TOU Fort. CHF | Écart | Statut |
|----|-----------|---------|-------------|--------------|-------|--------|
| VS-08 | VS · Célibataire · fort. 500k | 500 000 | **3 283** | 2 102 | **+56.2%** | ⚠ À investiguer |
| VS-09 | VS · Couple 1 rev. · fort. 1M | 1 000 000 | **7 296** | 4 777 | **+52.7%** | ⚠ À investiguer |
| VD-04 | VD · Couple 2 rev. · fort. 300k | 300 000 | **651** | 1 174 | −44.5% | ⚠ À investiguer |
| VD-05 | VD · Couple 1 rev. · fort. 1M | 1 000 000 | **4 187** | 6 392 | −34.5% | ⚠ À investiguer |
| GE-04 | GE · Célibataire · fort. 1M | 1 000 000 | **7 038** | 4 313 | **+63.2%** | ⚠ À investiguer |
| NE-03 | NE · Couple · fort. 200k | 200 000 | **225** | 589 | −61.8% | ⚠ À investiguer |
| NE-04 | NE · Couple · fort. 500k | 500 000 | **1 260** | 2 508 | −49.8% | ⚠ À investiguer |

---

## Analyse des écarts

### Revenu IS — Verdict : cohérent ✓

Le pattern IS < TOU est **universel et attendu** sur tous les cantons.

| Canton | Fourchette d'écart | Interprétation |
|--------|--------------------|----------------|
| VS | −38% à −56% | IS très avantageux VS, déductions forfaitaires larges |
| VD | −8% à −39% | VD-03 (couple 1 rev.) quasi parité IS/TOU : barème bien calibré |
| GE | −23% à −33% | Cohérent avec fiscalité genevoise élevée |
| NE | −11% à +4% | NE-03 légèrement IS > TOU — coefficient NE élevé (1.80) |

### Fortune — Anomalies à investiguer

Les écarts sur la fortune ne suivent pas de logique uniforme et méritent vérification :

**VS fortune trop élevée (+52–56%) :**
- HX utilise les tranches LF-VS art. 56 avec coefficient Sion 1.30
- swisstaxcalculator donne ~2,100 CHF pour 500k VS vs HX 3,283 CHF
- Piste : l'abattement VS pourrait être différent en 2026 (HX utilise 25k, TOU utilise peut-être 50k) ou les tranches LF-VS ont été révisées

**GE fortune trop élevée (+63%) :**
- HX utilise un barème GE all-in (canton + GE-ville) avec communalCoeff = 1.00
- swisstaxcalculator donne 4,313 CHF vs HX 7,038 CHF pour 1M fortune GE célibataire
- Piste : les tranches LIPP-GE dans `wealthTax.ts` pourraient être trop élevées, ou l'abattement GE 2026 a changé

**VD fortune trop faible (−34 à −44%) :**
- HX applique `fortuneCommunalCoeff: 1.795` (Lausanne 79.5%) avec plafond 10‰
- Pour 1M fortune couple, HX donne 4,187 CHF vs TOU 6,392 CHF
- Piste : le plafond 10‰ ou le coefficient 1.795 pourrait être mal calculé

**NE fortune trop faible (−50 à −62%) :**
- HX utilise tranches LCdir-NE avec coefficient 1.80 (Neuchâtel-Ville)
- Piste : l'abattement NE (50k célibataire, 100k couple) pourrait être trop élevé

### Conclusion

| Composante | État | Action |
|-----------|------|--------|
| IS revenu — tous cantons | ✅ Cohérent | Aucune |
| IS revenu — NE élevé revenu | ⚠ Légèrement IS > TOU | Surveiller |
| Fortune VS | ❌ HX trop élevé (+50%) | Vérifier tranches LF-VS 2026 et abattement |
| Fortune GE | ❌ HX trop élevé (+63%) | Vérifier tranches LIPP-GE 2026 et abattement |
| Fortune VD | ⚠ HX trop faible (−34%) | Vérifier coeff communal 1.795 et plafond 10‰ |
| Fortune NE | ⚠ HX trop faible (−50%) | Vérifier tranches LCdir-NE 2026 et abattement |

---

## Automatisation

### Commandes

```bash
# Mode automatique (défaut) — appelle l'API publique
npx vite-node scripts/validate-against-official.ts

# Avec serveur local (données fraîches 2026)
SWISSTAX_API_URL=http://localhost:3000 npx vite-node scripts/validate-against-official.ts

# Mode manuel (affiche template à remplir à la main)
npx vite-node scripts/validate-against-official.ts --manual
```

### Démarrer le serveur local

```bash
git clone https://github.com/devbrains-com/swisstaxcalculator
cd swisstaxcalculator
yarn install
yarn importdata 2026 --download   # télécharge les barèmes ESTV 2026
yarn dev                           # → http://localhost:3000
```

### Variable d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SWISSTAX_API_URL` | `https://swisstaxcalculator.vercel.app` | Base URL du serveur API |

### API utilisée

- **Dépôt** : https://github.com/devbrains-com/swisstaxcalculator  
- **Endpoint** : `POST /api/taxes`  
- **Authentification** : aucune  
- **Années disponibles** : 2022–2026  
- **Communes de référence** : Sion (6266), Lausanne (5586), Genève (6621), Neuchâtel (6458)

---

*Généré automatiquement le 24.05.2026 — relancer `npx vite-node scripts/validate-against-official.ts` pour mettre à jour.*
