---
name: Caméra
description: Application de préparation de tournage de l'association àlaclé : sobre, plate, ardoise et jaune de l'atelier.
colors:
  ardoise-alacle: "#222831"
  ardoise-douce: "#393E46"
  fond-atelier: "#EEEEEE"
  papier: "#FFFFFF"
  jaune-atelier: "#FFD369"
  filet: "#A3A3A3"
  filet-doux: "#D4D4D4"
  texte-secondaire: "#525252"
  alerte: "#991B1B"
  alerte-fond: "#FEF2F2"
typography:
  title:
    fontFamily: "Libre Baskerville, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  nav:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.1em"
  script:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.ardoise-alacle}"
    textColor: "{colors.papier}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 10px"
  button-primary-hover:
    backgroundColor: "{colors.ardoise-douce}"
  button-outline:
    backgroundColor: "{colors.papier}"
    textColor: "{colors.ardoise-alacle}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 10px"
  field:
    backgroundColor: "{colors.papier}"
    textColor: "{colors.ardoise-alacle}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
  plan-card:
    backgroundColor: "{colors.papier}"
    rounded: "{rounded.sm}"
    padding: "12px"
  nav-tab-active:
    backgroundColor: "{colors.jaune-atelier}"
    textColor: "{colors.ardoise-alacle}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  toast-undo:
    backgroundColor: "{colors.ardoise-alacle}"
    textColor: "{colors.papier}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
---

# Design System: Caméra

## Overview

**Creative North Star: "L'atelier àlaclé"**

Caméra est un établi, pas une vitrine : un poste de travail d'atelier où l'on prépare un film. Le système prolonge la charte du site de l'association : une ardoise bleutée pour la structure et le texte, un jaune réservé au repère, des titres en serif italique qui donnent au carnet de réalisation son ton cinéphile, et un corps de texte en Inter, comme dans Sigma. Rien n'y cherche l'attention : la lisibilité d'un plan, d'une rubrique ou d'une proposition de l'IA passe avant l'effet.

Les surfaces sont plates, claires et bordées d'un filet fin. La densité est celle d'un outil qu'on garde ouvert une journée : champs étiquetés en permanence, cartes empilées, volets qu'on déplie à la demande. L'identité vit dans les détails (le jaune de sélection, l'italique des titres, la sélection de texte colorée), jamais dans la décoration.

Refus confirmés : l'allure froide d'un logiciel de production générique, le décor tape-à-l'œil (dégradés, verre, ombres marquées, animations décoratives) et le gadget d'IA brillant (étoiles, éclats, ton magique autour des boutons d'assistance).

**Key Characteristics:**
- Fond d'atelier gris clair, surfaces blanches, filets fins ; aucune ombre au repos.
- Jaune de l'atelier réservé à la sélection et au titre de marque.
- Titres en serif italique, interface en Inter, texte de scénario en mono.
- Boutons et champs aux angles de 4 px, focus ardoise de 2 px très visible.
- Les propositions de l'IA se voient : marquées, jamais confondues avec une décision.

## Colors

Une palette d'ardoise et de papier, avec un seul jaune qui signale « vous êtes ici ».

### Primary
- **Jaune de l'atelier** (#FFD369) : sélection de la séquence active, onglet actif, sélection de texte, titre « Caméra » dans l'en-tête sombre. Jamais un fond de bouton d'action ni un état « ouvert ».

### Neutral
- **Ardoise àlaclé** (#222831) : en-tête, texte courant, bouton principal (« + Ajouter un plan »), bandeau d'annulation, anneau de focus.
- **Ardoise douce** (#393E46) : survol du bouton principal, bordure des boutons secondaires.
- **Fond d'atelier** (#EEEEEE) : fond de page et survol des éléments neutres.
- **Papier** (#FFFFFF) : cartes de plans, champs, panneaux.
- **Filet** (#A3A3A3) : bordure des champs et des boutons de volet, pour qu'ils restent visibles.
- **Filet doux** (#D4D4D4) : séparations entre blocs (cartes, volets).
- **Texte secondaire** (#525252) : aides, légendes, libellés complémentaires (contraste ≥ 4,5:1 sur blanc).

### Signal
- **Alerte** (#991B1B) sur **fond d'alerte** (#FEF2F2) : erreurs de l'IA et suppression ; le rouge n'a pas d'autre rôle.

### Named Rules
**The Selection-Only Yellow Rule.** Le jaune ne dit qu'une chose : « c'est la sélection ». Un volet ouvert, un bouton d'action ou une décoration n'en reçoivent jamais ; ils passent par un chevron ou par l'ardoise.

**The Slate Voice Rule.** Le texte et la structure sont en ardoise, jamais en noir pur ni en gris neutre sur fond coloré : les gris secondaires ne servent que sur blanc ou fond d'atelier.

## Typography

**Display Font:** Libre Baskerville italique (avec serif)
**Body Font:** Inter (avec ui-sans-serif, system-ui)
**Label/Mono Font:** JetBrains Mono, réservée au texte d'une séquence de scénario

**Character:** le serif italique donne la voix éditoriale d'un carnet de réalisation ; Inter, police de l'association, garde l'interface droite et lisible.

### Hierarchy
- **Title** (400 italique, 1.25rem, 1.4) : titre de la séquence courante et titres de vues.
- **Body** (400, 0.875rem, 1.5) : champs, boutons, listes, messages. Largeur de ligne limitée par les colonnes de l'interface.
- **Label** (500, 0.75rem) : libellés de champs, au-dessus de chaque champ, jamais en dessous de 12 px.
- **Nav** (400, 0.75rem, 0.1em, majuscules) : menu des sections uniquement.
- **Script** (400, mono 0.75rem) : texte d'une séquence repliable.

### Named Rules
**The Twelve Pixel Floor Rule.** Aucun texte fonctionnel sous 12 px ; les libellés restent visibles en permanence, jamais à l'état de placeholder seul.

## Layout

Un panneau latéral clair à gauche (13 rem, fixe), repris de Sigma, porte le titre, le menu des sections et, en bas, les trois exports Excel (dépouillement, plan de travail, découpage technique) ; à sa droite, la zone de travail, où la liste des séquences (14 rem) s'ajoute à gauche du contenu dans les vues par séquence. Les blocs se superposent dans une colonne unique avec un rythme de 12 à 16 px (`space-y-3` et `space-y-4`) ; les cartes de plans ont 12 px de remplissage : une vignette à gauche, puis une grille de cinq champs (trois sur tablette, deux sur téléphone) et, dessous, Description et Notes côte à côte. Dans le Découpage, l'en-tête se limite au titre de la séquence, à deux volets fermés (texte, assistance à la mise en scène) et à la barre des plans (« + Ajouter un plan » et le menu « Autres façons de créer »).

Sous 768 px, le panneau latéral devient un bandeau sombre en haut : les sections passent dans une liste déroulante, les exports dans un menu « Exporter (Excel) », et la liste des séquences devient une barre défilante horizontale. Sur écran tactile, boutons, champs et listes montent à 44 px de haut. Marge de page : 12 px sur téléphone, 20 px au-delà.

## Elevation & Depth

Le système est plat : la profondeur vient du contraste fond d'atelier / papier et des filets fins, pas de l'ombre. Aucune ombre n'existe aujourd'hui dans l'interface. La règle confirmée pour les ajouts : une ombre douce n'apparaît qu'en réponse à une action (survol, menu ouvert), jamais au repos.

### Named Rules
**The Flat Until Touched Rule.** Une surface est plate au repos. Si une ombre est introduite, elle est diffuse, décalée, et ne répond qu'à une interaction.

## Shapes

Angles de 4 px partout (boutons, champs, cartes, pastilles) : une forme de papier découpé, ni carrée ni arrondie. Les séparateurs sont des filets de 1 px. Les pastilles de statut (« Proposé par l'IA ») sont des rectangles à filet, pas des gélules colorées.

## Components

### Buttons
- **Shape:** angles de 4 px, hauteur 28 px (44 px sur écran tactile), texte 14 px.
- **Primary:** fond ardoise (#222831), texte blanc, survol ardoise douce (#393E46). Un seul bouton principal par zone (« + Ajouter un plan »).
- **Secondary (outline):** fond blanc, filet ardoise douce, texte ardoise ; survol fond d'atelier. Boutons d'assistance IA inclus : aucun éclat, aucune icône d'étoile.
- **Disclosure:** bouton à filet gris avec chevron (droite fermé, bas ouvert) et `aria-expanded` ; jamais jaune.
- **Icon:** carré de 36 px (44 px tactile), sans bordure au repos, filet et fond au survol, `aria-label` obligatoire.

### Inputs / Fields
- **Style:** fond blanc, filet gris (#A3A3A3), angles de 4 px, texte 14 px, libellé de 12 px au-dessus. La taille de plan est un menu natif (« PM · Plan moyen ») : une valeur saisie auparavant hors liste est conservée comme option.
- **Focus:** contour ardoise de 2 px décalé de 1 px ; jamais retiré. Sur fond ardoise (panneau latéral, en-tête mobile, bandeau d'annulation), le contour passe en jaune de l'atelier.
- **Error / Disabled:** les erreurs d'IA s'affichent dans un bandeau rouge sur fond d'alerte avec « Réessayer » ; les contrôles inactifs perdent de l'opacité sans changer de forme.

### Navigation
- **Menu latéral:** liste verticale dans le panneau clair de gauche, majuscules 12 px espacées ; la section active prend le jaune de l'atelier avec texte ardoise, avec `aria-current` ; chaque entrée a un numéro et une icône. Les exports Excel sont en bas du panneau. Sur téléphone : liste déroulante dans un bandeau.
- **Liste des séquences:** boutons pleine largeur ; la séquence active est en jaune, semi-gras, avec `aria-current`.

### Plan Card (composant signature)
Une carte blanche à filet doux par plan : ligne d'en-tête (numéro, statut, flèches, suppression), vignette (l'image analysée si elle existe, sinon le cadrage de la valeur de plan en pictogramme plat à filet), grille de champs étiquetés (taille, mouvement, optique, caméra, durée), pied avec deux volets dépliables (analyse du cadre, dépouillement). Le statut est lisible : « À décrire » en texte secondaire, « Proposé par l'IA » en pastille à filet avec « Garder ».

### Feedback Banners
Bandeau d'annulation ardoise avec texte blanc et « Annuler » souligné (12 secondes, suspendues au survol et au focus) ; ligne d'état pendant une analyse de l'IA ; bandeau d'information blanc à filet ; bandeau d'erreur rouge sur fond d'alerte. Tous dans une région `role="status"` placée juste au-dessus de la liste concernée.

## Do's and Don'ts

### Do:
- **Do** réserver le jaune de l'atelier (#FFD369) à la sélection (séquence, onglet) et au titre de marque.
- **Do** garder un libellé de 12 px minimum visible au-dessus de chaque champ.
- **Do** marquer toute proposition de l'IA (« Proposé par l'IA ») avec « Garder » et « Tout retirer », et offrir l'annulation de toute suppression.
- **Do** donner à chaque contrôle un contour de focus ardoise de 2 px et un `aria-label` quand il n'a pas de texte.
- **Do** rester plat au repos : surfaces blanches sur fond d'atelier, filets fins de 1 px.

### Don't:
- **Don't** ajouter de dégradés, d'effets de verre, d'ombres marquées ou d'animations décoratives.
- **Don't** habiller l'IA en gadget : ni étoile, ni éclat, ni ton magique autour des boutons d'assistance.
- **Don't** laisser un composant par défaut sans l'adapter (bouton gris générique, tableau sans filets) : l'interface doit rester celle de l'atelier àlaclé.
- **Don't** utiliser le jaune pour un volet ouvert, un bouton d'action ou une alerte.
- **Don't** descendre sous 12 px de texte fonctionnel ni supprimer un contour de focus.
