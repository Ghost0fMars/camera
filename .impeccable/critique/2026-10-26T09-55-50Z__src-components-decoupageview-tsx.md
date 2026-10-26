---
target: Découpage technique
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\elavallard\\Documents\\camera\\src\\components\\DecoupageView.tsx"
target_fingerprint: "sha256:ad102c1ec2d3d3beb2b65be593f349cdb3b4ed06cfd685755b5c3dd7f42019c7"
target_path: "C:\\Users\\elavallard\\Documents\\camera\\src\\components\\DecoupageView.tsx"
timestamp: 2026-10-26T09-55-50Z
slug: src-components-decoupageview-tsx
---
Method: dual-agent (A : revue de design · B : détecteur). Limite : navigateur indisponible pour A et B (extension non connectée) ; analyse sur le code, aucune mesure au rendu.

## Score : 27/40 (Bon), contre 21/40 avant corrections

| # | Heuristique | Score | Problème clé |
|---|---|---|---|
| 1 | Visibilité de l'état | 3 | « Analyse en cours… » seulement dans le bouton ; aucun signe d'enregistrement |
| 2 | Correspondance avec le réel | 3 | Dépouillement de production mêlé au découpage artistique ; Taille libre |
| 3 | Contrôle et liberté | 3 | Un seul undo, 8 s ; rien pour champs et déplacements |
| 4 | Cohérence | 3 | Erreurs de FrameAnalysis hors système de bandeaux |
| 5 | Prévention des erreurs | 3 | « pm »/« Pm »/« plan moyen » acceptés ; « Un plan par caméra » duplique |
| 6 | Reconnaissance | 2 | Légende des valeurs de plan repliée, loin des champs |
| 7 | Flexibilité | 2 | Ni duplication, ni raccourci, ni glisser-déposer, ni durée |
| 8 | Minimalisme | 3 | En-tête surchargé avant le premier plan |
| 9 | Récupération d'erreur | 3 | « Réessayer » partout sauf analyse du cadre |
| 10 | Aide | 2 | Rien sur le dépouillement de plan ni l'enregistrement local |

## Verdict de spécificité
Spécifique par le fond (vocabulaire, socle théorique, pastille IA sobre, jaune de sélection), générique par la forme : la carte de plan est un formulaire empilé, sans cadre, vignette ni durée. Détecteur : 0 résultat (sensibilité non testée sur du JSX).

## Problèmes prioritaires
- [P1] Focus invisible dans le panneau latéral et le bandeau d'annulation (index.css:23-24, `header :focus-visible` seulement). Commande : audit.
- [P1] 40 contrôles et plus visibles dès trois plans ; en-tête surchargé. Commande : distill.
- [P2] Un plan n'est pas une image (miniature, pictogramme de valeur de plan, durée). Commandes : shape, bolder.
- [P2] Aucun repère pour la taille de plan (select natif, légende sous le champ). Commandes : clarify, harden.
- [P2] Annulation et clics répétés (DecoupageView.tsx:121 sans offerUndo, un seul undo, 8 s non suspendu). Commande : harden.
- [P3] Erreurs de FrameAnalysis hors système, pas de « Réessayer ». Commande : polish.

## Signaux rouges
Réalisateur·rice : ressaisie de PM/Fixe/35 mm, pas de durée, régie dans l'outil de mise en scène, enregistrement local invisible.
Clavier et lecteur d'écran : focus perdu dans le menu latéral, pas de lien d'évitement, annulation de 8 s inatteignable.
Enseignant·e : boutons IA sans mention d'envoi à un service externe, licence non commerciale discrète.

## Observations mineures
Écarts de palette (text-neutral-500, text-red-700, #c0392b) ; variables shadcn jaunes par défaut ; Google Fonts (RGPD) ; « Analyse en cours… » pour trois actions ; `<pre>` sans filet ; liens-boutons sous 44 px au tactile.

## Questions
Pourquoi un plan s'ouvre-t-il sur six champs plutôt que sur un cadre ? Le dépouillement de plan est-il la suite du découpage ? Un plan proposé, par défaut et décidé devrait-il se voir à l'état de la carte ?
