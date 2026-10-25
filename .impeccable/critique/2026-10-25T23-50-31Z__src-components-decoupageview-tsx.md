---
target: Découpage technique
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\elavallard\\Documents\\camera\\src\\components\\DecoupageView.tsx"
target_fingerprint: "sha256:0e40a73ba1495e48d7f717bae42030e0685c1027a5afbcb24e8fe1b19bb61dab"
target_path: "C:\\Users\\elavallard\\Documents\\camera\\src\\components\\DecoupageView.tsx"
timestamp: 2026-10-25T23-50-31Z
slug: src-components-decoupageview-tsx
---
# Critique : onglet « Découpage technique » (Caméra)

Méthode : double évaluation (A revue de design, B détecteur + navigateur). Surface : Operate. Score 21/40 (Acceptable).

| # | Heuristique | Note | Problème clé |
|---|---|---|---|
| 1 | Visibilité de l'état | 2 | Messages IA/erreurs dans une ligne grise sous le tableau, hors écran quand un volet est ouvert |
| 2 | Correspondance avec le réel | 3 | « Dép. » et « Cadre ✓ » cryptiques |
| 3 | Contrôle et liberté | 2 | « ✕ » supprime un plan sans confirmation ni annulation |
| 4 | Cohérence | 2 | Le jaune a trois sens (marque, sélection, volet ouvert) |
| 5 | Prévention des erreurs | 2 | Taille/mouvement libres ; un plan par défaut ressemble à un plan décidé |
| 6 | Reconnaissance | 2 | Aucune légende PG/PA/PR |
| 7 | Flexibilité | 2 | Pas de duplication, de raccourci ni de glisser-déposer |
| 8 | Minimalisme | 3 | Volet Dép. : 15 zones d'un coup |
| 9 | Récupération d'erreur | 2 | Erreurs IA sans « Réessayer » |
| 10 | Aide | 1 | Aucune aide contextuelle |

Verdict de spécificité : spécifique par le contenu, générique par la forme (tableur sans image de film).

Détecteur : overused-font (Inter) src/index.css:1 ; navigateur : 19 undersized-ui-text (libellés 10 px) + 1 overused-font.

## Problèmes prioritaires
- [P1] Actions destructives sans filet (✕, plans IA non retirables en bloc) → harden
- [P1] Cellules invisibles, focus clavier insuffisant, pas d'aria-label/aria-expanded → layout, colorize
- [P2] Mobile cassé (en-tête 220 px, tableau 900 px, cibles 20-24 px) → adapt
- [P2] Dép. : 15 zones d'un bloc, sans aide → distill, clarify
- [P2] Libellés de 10 px → typeset

Écarté : « gel après Découper » signalé par A : cause = confirm() natif de ImportView.tsx:23 (projet non vide), pas un bug.

## Personas
Alex : pas de duplication ni de raccourci. Jordan : « Dép. »/« Cadre ✓ » inexpliqués. Sam : champs sans libellé, focus gris sur gris. Réalisateur : plan par défaut indiscernable d'un plan décidé, pas de durée par plan.

## Questions
Un plan est-il une image avant d'être une ligne de tableau ? Qu'est-ce qui mérite d'être jaune ? Comment distinguer proposé / par défaut / décidé ?
