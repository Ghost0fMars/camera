# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Réalisateur·rice indépendant·e qui prépare un court ou un long métrage seul·e ou avec une petite équipe : il ou elle part d'un scénario, doit le découper en séquences, produire les documents de préparation (dépouillement, plan de travail), puis penser la mise en scène et le découpage en plans. D'autres publics (élèves et étudiants en atelier, équipe de tournage) peuvent s'y retrouver mais ne sont pas l'utilisateur principal confirmé.

## Product Purpose

Caméra aide à préparer le tournage d'un film, du scénario au plan de travail et au découpage technique. Elle importe un scénario (.docx, .md, .txt, .fountain), le découpe en séquences, produit les documents de préparation en Excel, et accompagne la réflexion de mise en scène : plan de scène en vue du dessus, liste de plans, analyse de cadre. Le succès : le réalisateur sort avec des documents exploitables et un découpage qu'il a pensé, l'IA proposant sans décider à sa place.

## Positioning

Là où les logiciels de dépouillement classiques s'arrêtent à la logistique, Caméra relie la préparation à une pensée de la mise en scène : le socle théorique de l'IA est le texte d'Eisenstein (« Leçons de mise en scène ») et l'intégrale dramatique, la théorie de l'auteur de l'application. Un même outil va du scénario à la vue du dessus (caméras, personnages, déplacements) puis à la liste de plans, avec une estimation de la valeur de plan à partir d'une image.

## Operating Context

- Documents de référence du métier : le dépouillement par séquence (feuille « SEQ n », quinze rubriques), le plan de travail par jour, le séquencier. Exemples réels fournis : `Dépouillement - La Clé.xlsx` et `PDT - La Clé.xlsx`, scénario de court métrage *La Clé*.
- Usage dans le navigateur, sur le site de l'association àlaclé (camera.alacle.org), aux côtés des autres applications SIGMA, SAGE, SOCRATE et ITÉRATION.
- Les projets sont enregistrés dans le navigateur (localStorage), sans compte ni serveur de stockage ; les exports Excel et PNG sont le moyen de conserver et partager son travail.
- Le texte d'une séquence n'est envoyé au service d'IA (Albert, API de l'État) que lorsque l'utilisateur déclenche un bouton d'assistance.

## Capabilities and Constraints

- Fonctions : import et découpage du scénario, séquencier, fiches de dépouillement (15 rubriques), plan de travail par jour, exports Excel (dépouillement, plan de travail, découpage technique), vue du dessus (dessin, murs, meubles, caméras orientées, personnages, déplacements liés à un personnage ou une caméra, export PNG), découpage technique (plans numérotés, taille, mouvement, optique, caméra, dépouillement par plan), analyse du cadre d'une image (prototype). Assistances IA, toujours proposées avant d'être appliquées : esquisse du plan de scène en vue du dessus (éléments en transparence, à corriger), prompt image / vidéo (en anglais) pour chaque plan, calendrier de tournage (nombre de jours et répartition des séquences, calculé selon le lieu, jour ou nuit et la durée des journées, révisé par l'IA, contrôlé par le serveur ; disponibilités des comédiens non prises en compte).
- L'IA propose, ne remplace jamais ce que l'utilisateur a saisi : dépouillement, découpage en plans, conseils de mise en scène citant Eisenstein et les termes de l'intégrale dramatique.
- Contraintes techniques : React, Vite, TypeScript, Tailwind ; fonctions serveur sur Vercel ; clé Albert côté serveur uniquement.
- Contrainte de licence : l'analyse du cadre repose sur LocateAnything (NVIDIA), sous licence non commerciale (recherche et usage non lucratif).
- Décision ouverte : l'accès est aujourd'hui public et en bêta, ce qui expose le quota Albert et se concilie mal avec la licence non commerciale de LocateAnything ; la restriction d'accès n'est pas tranchée.
- Le texte d'Eisenstein (FEMIS, 1989) est sous droits : il est utilisé dans un dépôt privé, côté serveur seulement.
- Terminologie : séquence (et non « scène ») pour l'unité du scénario ; plan pour l'unité du découpage technique ; valeurs de plan PG, PE, PA, PM, PR, GP.

## Brand Commitments

Nom : Caméra. Application de l'association àlaclé (cinéma et éducation), en français. L'IA ne décide pas à la place du réalisateur : elle propose et justifie.

## Evidence on Hand

- `Dépouillement - La Clé.xlsx`, `PDT - La Clé.xlsx` : documents réels servant de modèle aux exports.
- `data/eisenstein.json`, `data/integrale.json` : passages du texte d'Eisenstein et de l'article « L'intégrale dramatique » (alacle.org/pages/articles/theorie/integrale-dramatique.html).
- Aucun témoignage d'utilisateur, aucune donnée d'usage ni cas d'étude : à ne pas inventer.

## Product Principles

1. L'IA propose, le réalisateur décide : rien de ce qu'il a saisi n'est remplacé.
2. Du scénario au plateau : chaque document de préparation se déduit de la séquence, sans ressaisie.
3. La mise en scène se pense : les propositions s'appuient sur une théorie explicitée (Eisenstein, intégrale dramatique), citée et discutable.
4. Les données restent chez l'utilisateur : stockage local, exports ouverts (Excel, PNG), IA appelée à la demande.
