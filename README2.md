# Patch — Système d'icônes Fiscal Suisse

4 fichiers à copier dans `tax-optimizer/`. La structure est identique, drag-and-drop suffit.

## Fichiers

| Fichier | Destination | Action |
|---|---|---|
| `src/components/icons.tsx` | nouveau composant icônes (App + 7 sidebar) | **nouveau** |
| `src/components/Layout/Sidebar.tsx` | sidebar patchée (icônes + brand logo) | **remplace** |
| `public/favicon.svg` | favicon avec mark "Optimisation" | **remplace** |
| `public/icons.svg` | sprite SVG (optionnel — non utilisé pour l'instant) | **remplace** |

## En 1 commande (depuis la racine de l'app)

```bash
# Adapter le chemin source selon où tu as récupéré le patch
cp -r tax-optimizer-patch/* tax-optimizer/
```

## Ce qui change

- Sidebar : les 7 caractères Unicode (`⬡`, `○`, `◎`, `▣`, `▤`, `◈`, `▧`) sont remplacés par les composants React typés
- Brand : la pastille `FS` du header de sidebar devient le vrai `<AppIcon>`
- Favicon : nouveau mark cohérent avec l'app icon

## À noter

- `Onboarding` dans `App.tsx` garde sa pastille `FS` actuelle — dis-moi si tu veux que je la remplace aussi par `<AppIcon size={40} />`
- Le composant `AppIcon` accepte `size` et `radius` — utilisable partout (splash, loading, etc.)
- Toutes les icônes sidebar utilisent `currentColor` → le styling existant (`var(--accent)` / `var(--text-3)`) fonctionne tel quel
