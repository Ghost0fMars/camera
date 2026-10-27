/** Théories de la mise en scène : synthèses rédigées pour l'application (pas des citations). Les ouvrages originaux font foi. */
export interface Theorie {
  auteur: string;
  oeuvre: string;
  annee: string;
  courant: string;
  resume: string;
  concepts: [nom: string, definition: string][];
}

export const COURANTS = ['Dramaturgie', 'Théâtre', 'Cinéma soviétique', 'Théorie du plan', 'Réalisme', 'Langage et sémiologie', 'Analyse et regard', 'Image et son', 'Pratique du cinéaste'] as const;

export const THEORIES: Theorie[] = [
  // — Dramaturgie —
  {
    auteur: 'Aristote', oeuvre: 'Poétique', annee: '~335 av. J.-C.', courant: 'Dramaturgie',
    resume: "Premier traité sur la représentation dramatique. Aristote range le spectacle (opsis) parmi les six parties de la tragédie, mais derrière l'intrigue : ce qui compte d'abord, c'est l'action et son enchaînement.",
    concepts: [
      ['Muthos (intrigue)', "L'agencement des actions est la première partie de la tragédie, avant les caractères : on est ce qu'on fait."],
      ['Opsis (spectacle)', "La mise en scène visible est une partie de la tragédie, mais la moins propre à l'art du poète : elle doit servir l'action, non la remplacer."],
      ['Unité d\'action', "Les épisodes s'enchaînent par nécessité ou vraisemblance ; retirer une partie doit défaire le tout."],
      ['Péripétie et reconnaissance', "Le renversement de la situation (péripétie) et le passage de l'ignorance à la connaissance (anagnorisis) sont les moments les plus forts quand ils coïncident."],
      ['Catharsis', "La représentation suscite pitié et crainte, et en opère l'épuration : l'effet recherché sur le spectateur oriente la composition."],
    ],
  },
  {
    auteur: 'Robert McKee', oeuvre: 'Story', annee: '1997', courant: 'Dramaturgie',
    resume: "Une scène existe parce qu'une valeur du personnage change de polarité. McKee donne au metteur en scène une unité de travail : le beat, et un critère : y a-t-il changement ?",
    concepts: [
      ['Changement de valeur', "À l'entrée et à la sortie d'une scène, la situation du personnage (sécurité/danger, amour/haine…) a basculé."],
      ['Beat', "Le plus petit échange d'action-réaction ; la scène est une suite de beats, et la mise en scène les rend lisibles."],
      ['Écart (gap)', "Entre ce que le personnage attend de son action et ce qu'il obtient s'ouvre un écart : c'est là que naissent la tension et le jeu."],
      ['Sous-texte', "Ce que le personnage pense ou veut sous ce qu'il dit : le cadre, le jeu et le silence le font passer."],
    ],
  },
  {
    auteur: 'àlaclé', oeuvre: "L'Intégrale dramatique", annee: '2024', courant: 'Dramaturgie',
    resume: "Modèle formel de la charge dramatique d'un récit, S(t) = ∫ [V(t) · P(t|τ)] · C(t) dt, qui sert de socle, avec Eisenstein, aux conseils de mise en scène de l'application.",
    concepts: [
      ['V(t) : registre des actions', "Chaque acte du personnage est une unité de la charge ; c'est le beat de McKee, libre, qui aurait pu être autre."],
      ['P(t|τ) : poids rétroactif', "Le poids d'un acte passé dépend du moment de lecture : une révélation recalcule les actes antérieurs (après-coup, anagnorisis)."],
      ['C(t) = Ci × Ce : contexte', "Le contexte interne (faille, arc du personnage) et le contexte externe (pression du monde) se multiplient : la tension vient de leur friction."],
      ['Régimes de l\'intégrale', "Tragédie (ouverte), comédie (cyclique), romance (amplitude maximale puis réconciliation), épopée (cumulative) : chaque forme a son régime de charge et de clôture."],
    ],
  },

  // — Théâtre —
  {
    auteur: 'André Antoine', oeuvre: 'Causerie sur la mise en scène', annee: '1903', courant: 'Théâtre',
    resume: "Fondateur du Théâtre-Libre (1887), Antoine fait du décor et du jeu la matière du naturalisme : le milieu façonne les personnages, la scène doit donner l'illusion d'un lieu réel.",
    concepts: [
      ['Quatrième mur', "Les acteurs jouent comme si la salle n'existait pas ; le spectateur regarde par un mur invisible."],
      ['Décor réel', "L'espace est construit comme un milieu habité (objets, matières, détails) et non comme une toile peinte : il agit sur les personnages."],
      ['Jeu naturel', "Les comédiens parlent et bougent comme dans la vie, en tournant le dos au public si la situation l'exige."],
    ],
  },
  {
    auteur: 'Adolphe Appia', oeuvre: 'La Mise en scène du drame wagnérien ; La Musique et la mise en scène', annee: '1895–1899', courant: 'Théâtre',
    resume: "Appia rejette le décor peint et fait de la lumière l'élément actif de la scène : elle sculpte le corps vivant de l'acteur dans un espace en volumes, sur le rythme de la musique.",
    concepts: [
      ['Hiérarchie des moyens', "L'acteur, corps vivant et mobile, est au centre ; l'espace, la lumière et le décor s'ordonnent autour de lui."],
      ['Lumière plastique', "La lumière ne sert pas à éclairer seulement : elle modèle les volumes, crée l'atmosphère et exprime le drame."],
      ['Espace rythmique', "Praticables, escaliers et volumes donnent à l'acteur des niveaux, sur lesquels le mouvement suit la durée musicale."],
    ],
  },
  {
    auteur: 'Edward Gordon Craig', oeuvre: "De l'art du théâtre", annee: '1905–1911', courant: 'Théâtre',
    resume: "Craig veut un art du théâtre autonome, dirigé par un seul artiste, le metteur en scène, qui compose geste, mot, ligne, couleur et rythme comme un tout.",
    concepts: [
      ['Le metteur en scène artiste', "Un seul esprit unifie tous les éléments du spectacle, comme le compositeur une partition."],
      ['Surmarionnette', "Pour échapper aux hasards de la personnalité et de l'émotion de l'acteur, Craig rêve d'une figure idéale et maîtrisée."],
      ['Scène d\'écrans mobiles', "Des écrans modulables transforment l'espace par la lumière et le mouvement, sans décor figuratif."],
    ],
  },
  {
    auteur: 'Constantin Stanislavski', oeuvre: "La Formation de l'acteur", annee: '1936', courant: 'Théâtre',
    resume: "Stanislavski fonde le jeu sur l'action vécue : l'acteur cherche ce que le personnage veut et fait, plutôt que d'exhiber un sentiment. La direction d'acteurs moderne en descend largement.",
    concepts: [
      ['Circonstances données', "Où, quand, avec qui, pourquoi : le contexte précis que l'acteur doit se rendre vraisemblable avant de jouer."],
      ['Le « si » magique', "« Que ferais-je si j\'étais dans cette situation ? » : la question qui engage l'acteur sans le tromper."],
      ['Objectif et super-objectif', "Chaque scène a un objectif concret pour le personnage ; tous convergent vers un super-objectif qui porte l'ensemble du rôle."],
      ['Ligne continue d\'action', "Les objectifs s'enchaînent sans rupture : le rôle est un fil, et non une suite de moments isolés."],
      ['Mémoire émotionnelle', "L'acteur ranime un vécu personnel pour nourrir une émotion ; Stanislavski la tempère ensuite au profit des actions physiques."],
    ],
  },
  {
    auteur: 'Vsevolod Meyerhold', oeuvre: 'Biomécanique et théâtre conventionnel', annee: '1910–1930', courant: 'Théâtre',
    resume: "Contre le naturalisme, Meyerhold met le corps de l'acteur et le rythme au centre : un jeu stylisé, précis, entraîné comme un sport, où le mouvement porte le sens. Eisenstein fut son élève.",
    concepts: [
      ['Biomécanique', "Entraînement du corps de l'acteur (acrobatie, gymnastique, cirque) pour un jeu précis, économe et expressif."],
      ['Théâtre conventionnel', "Le spectateur est invité à reconnaître la convention et à compléter par l'imagination, plutôt qu'à croire à une illusion."],
      ['Rythme et mouvement', "La partition de la mise en scène est celle des déplacements et des gestes ; l'espace est construit pour eux."],
    ],
  },
  {
    auteur: 'Antonin Artaud', oeuvre: 'Le Théâtre et son double', annee: '1938', courant: 'Théâtre',
    resume: "Artaud demande au théâtre de quitter la dictature du texte pour un langage propre à la scène (gestes, cris, lumières, espace) qui agisse sur le spectateur comme une secousse.",
    concepts: [
      ['Théâtre de la cruauté', "Un théâtre qui atteint le spectateur dans sa sensibilité, par une action violente de la représentation, et non par le discours."],
      ['Langage de la scène', "Les gestes, les sons, les lumières, les objets et l'espace forment un langage autonome, antérieur aux mots."],
      ['Spectacle total', "Le public est entouré par l'action : la disposition de la salle fait partie de la mise en scène."],
    ],
  },
  {
    auteur: 'Bertolt Brecht', oeuvre: 'Petit organon pour le théâtre', annee: '1948', courant: 'Théâtre',
    resume: "Brecht veut un théâtre qui fasse penser plutôt que s'identifier : la mise en scène montre que l'on montre, et laisse voir les causes sociales de ce qui arrive.",
    concepts: [
      ['Distanciation (Verfremdung)', "Rendre l'habituel étrange pour que le spectateur le questionne : rupture de l'illusion, jeu qui montre le personnage au lieu de le devenir."],
      ['Gestus social', "Un geste ou une attitude qui résume un rapport social (qui domine, qui se soumet) et que le spectateur peut lire."],
      ['Historisation', "Présenter les faits comme datés et transformables, non comme éternels."],
    ],
  },
  {
    auteur: 'Peter Brook', oeuvre: "L'Espace vide", annee: '1968', courant: 'Théâtre',
    resume: "Brook ramène le théâtre à l'essentiel : un espace vide, quelqu'un qui le traverse, quelqu'un qui regarde. Tout ajout doit gagner sa place.",
    concepts: [
      ['Espace vide', "Un lieu nu suffit pour qu'il y ait théâtre ; le décor et les accessoires doivent justifier leur présence."],
      ['Quatre théâtres', "Mortel (routine), sacré (invisible rendu visible), rude (populaire, direct) et immédiat (ce qui se joue ici et maintenant)."],
    ],
  },

  // — Cinéma soviétique —
  {
    auteur: 'Lev Kouléchov', oeuvre: "L'Art du cinéma ; ateliers", annee: '1917–1929', courant: 'Cinéma soviétique',
    resume: "Dans son atelier, Kouléchov établit par l'expérience que le sens naît du rapprochement des plans : le cinéma est d'abord montage.",
    concepts: [
      ['Effet Kouléchov', "Le même visage, juxtaposé à des images différentes (assiette, cercueil, enfant), semble exprimer des sentiments différents."],
      ['Géographie créatrice', "Des plans filmés en des lieux différents, montés ensemble, créent un seul espace fictif cohérent."],
      ['Acteur « modèle »', "L'acteur est choisi et dirigé comme un matériau expressif précis, et non pour un jeu psychologique."],
    ],
  },
  {
    auteur: 'Sergueï Eisenstein', oeuvre: 'Le Film : sa forme, son sens ; La Non-indifférente nature ; Leçons de mise en scène', annee: '1923–1948', courant: 'Cinéma soviétique',
    resume: "Pour Eisenstein, le conflit est le principe de toute forme : le sens jaillit de la collision des éléments, plan contre plan, image contre son. Son cours de mise en scène au VGIK relie composition, geste et idée.",
    concepts: [
      ['Montage des attractions', "Assembler des éléments choisis pour leur force sur la sensibilité du spectateur, afin de produire un choc émotionnel calculé."],
      ['Le montage comme conflit', "Deux plans ne s'additionnent pas, ils entrent en collision et produisent une idée nouvelle (par opposition à Poudovkine)."],
      ['Cinq méthodes de montage', "Métrique (durée des plans), rythmique (mouvement dans le plan), tonal (tonalité dominante), harmonique (résonance de toutes les dominantes) et intellectuel (collision de concepts)."],
      ['Montage vertical', "Avec le son, l'image et la musique se coordonnent point à point : le montage s'écrit en partition."],
      ['Pathos et sortie hors de soi', "Composer par bonds qualitatifs pour faire sortir le spectateur de son état ordinaire (extase) : la scène de l'escalier d'Odessa."],
      ['Typage', "Choisir pour l'écran des personnes dont le type incarne le rôle, plutôt que des acteurs de métier."],
      ['Mise en scène comme composition de l\'espace', "Le geste, le déplacement et la position des corps expriment l'idée de la scène avant même le cadrage."],
    ],
  },
  {
    auteur: 'Vsevolod Poudovkine', oeuvre: 'Technique du film', annee: '1926', courant: 'Cinéma soviétique',
    resume: "Poudovkine voit le montage comme une construction : le plan est une brique, et l'on bâtit la scène en les posant l'une après l'autre pour guider l'attention.",
    concepts: [
      ['Montage constructif', "Le plan est un élément de construction, sans sens fini ; le sens se bâtit par enchaînement progressif (linkage)."],
      ['Cinq procédés', "Contraste, parallélisme, symbolisme, simultanéité et leitmotiv : cinq façons d'associer des plans."],
      ['Matériau filmique', "Le réalisateur travaille sur un matériau (gestes, objets, lieux) qu'il découpe et recompose pour le spectateur."],
    ],
  },
  {
    auteur: 'Dziga Vertov', oeuvre: "Nous ; L'Homme à la caméra", annee: '1922–1929', courant: 'Cinéma soviétique',
    resume: "Vertov rejette le film joué et fait de la caméra un œil supérieur à l'œil humain : elle capte la vie « à l'improviste » et la recompose au montage.",
    concepts: [
      ['Ciné-œil (Kino-Glaz)', "La caméra voit ce que l'œil humain ne voit pas (ralenti, accéléré, positions impossibles) et le montre."],
      ['La vie à l\'improviste', "Filmer sans mise en scène préparée, sans acteurs ni décor."],
      ['Théorie des intervalles', "Le mouvement entre les plans, plus que les plans eux-mêmes, est la matière du montage."],
    ],
  },

  // — Théorie du plan —
  {
    auteur: 'Hugo Münsterberg', oeuvre: 'Le Cinéma : une étude psychologique', annee: '1916', courant: 'Théorie du plan',
    resume: "L'un des premiers théoriciens du cinéma : le film est une œuvre de l'esprit, qui réalise à l'écran des opérations mentales (attention, mémoire, imagination).",
    concepts: [
      ['Gros plan comme attention', "Le gros plan met en scène l'attention : il isole dans le monde ce que l'esprit retient."],
      ['Retour en arrière et anticipation', "Le flash-back figure la mémoire, l'anticipation l'imagination : la mise en scène visualise la vie mentale."],
    ],
  },
  {
    auteur: 'Jean Epstein', oeuvre: 'Bonjour cinéma ; L\'Intelligence d\'une machine', annee: '1921–1946', courant: 'Théorie du plan',
    resume: "Epstein croit à une intelligence propre à la machine caméra, qui révèle le monde par grossissement, ralenti et accéléré : c'est la photogénie.",
    concepts: [
      ['Photogénie', "Ce que la caméra ajoute à la chose filmée : une valeur, une présence que l'œil ne perçoit pas."],
      ['Gros plan', "Il fait changer d'échelle le drame : un visage ou un objet devient un événement."],
      ['Ralenti et accéléré', "Modifier le temps révèle des mouvements et des expressions invisibles à vitesse réelle."],
    ],
  },
  {
    auteur: 'Béla Balázs', oeuvre: "L'Homme visible ; L'Esprit du cinéma", annee: '1924–1930', courant: 'Théorie du plan',
    resume: "Balázs montre que le cinéma rend à l'homme sa visibilité : le visage et le geste redeviennent un langage, et le gros plan en révèle les nuances.",
    concepts: [
      ['Micro-physionomie', "Le gros plan révèle les mouvements du visage trop fins pour la scène théâtrale."],
      ['Physionomie des choses', "Les objets et les décors, filmés de près, ont un visage et une atmosphère."],
      ['Point de vue changeant', "La caméra déplace le spectateur : il ne regarde plus d'un siège fixe, mais d'où le plan le place."],
    ],
  },
  {
    auteur: 'Rudolf Arnheim', oeuvre: 'Le cinéma est un art ; Art et perception visuelle', annee: '1932 · 1954', courant: 'Théorie du plan',
    resume: "Pour Arnheim, le cinéma est un art parce qu'il diffère de la perception réelle. Ses analyses de l'équilibre et de la force visuelle servent encore à composer le cadre.",
    concepts: [
      ['Écarts avec le réel', "L'image est plate, cadrée, sans espace-temps continu : ces limites sont les ressources de l'art."],
      ['Équilibre et poids visuels', "Chaque élément du cadre pèse selon sa taille, sa place et son contraste ; la composition équilibre ou déséquilibre ces forces."],
      ['Tensions du cadre', "Le centre, les bords et les diagonales exercent des attractions et des tensions que la composition utilise."],
    ],
  },
  {
    auteur: 'Bruce Block', oeuvre: 'The Visual Story', annee: '2001', courant: 'Théorie du plan',
    resume: "Block fait de l'image une matière d'« histoire visuelle » avec des composantes mesurables dont on peut faire varier l'intensité au fil du récit.",
    concepts: [
      ['Composantes visuelles', "Espace, ligne et forme, tonalité, couleur, mouvement, rythme : les matériaux de base de l'image."],
      ['Contraste et affinité', "Un contraste (écart) crée de la tension, une affinité (accord) la détend ; l'intensité suit l'intrigue."],
      ['Espace du cadre', "Profondeur réelle ou apparente, plans étagés, perspectives : l'espace se compose comme une matière."],
    ],
  },

  // — Réalisme —
  {
    auteur: 'André Bazin', oeuvre: "Qu'est-ce que le cinéma ?", annee: '1945–1958', courant: 'Réalisme',
    resume: "Bazin défend un cinéma qui respecte l'unité de l'espace et l'ambiguïté du réel : le plan-séquence et la profondeur de champ laissent le spectateur voir et choisir.",
    concepts: [
      ['Ontologie de l\'image photographique', "La photographie, enregistrement mécanique, conserve une empreinte du réel : c'est le fondement de son pouvoir de conviction."],
      ['Plan-séquence et profondeur de champ', "Montrer une scène dans la durée et la profondeur respecte la continuité de l'espace et laisse le spectateur libre de son regard."],
      ['Montage interdit', "Quand l'essentiel dépend de la présence simultanée de plusieurs éléments dans l'espace, couper détruit le sens."],
      ['Ceux qui croient à l\'image, ceux qui croient à la réalité', "Deux familles de cinéastes : ceux qui transforment le réel par le plan et le montage, ceux qui le laissent apparaître."],
    ],
  },
  {
    auteur: 'Siegfried Kracauer', oeuvre: 'Théorie du film : la rédemption de la réalité matérielle', annee: '1960', courant: 'Réalisme',
    resume: "Kracauer attribue au cinéma une vocation : enregistrer et révéler la réalité physique. Les plus grands films sont ceux qui exploitent cette affinité sans la trahir.",
    concepts: [
      ['Affinités du médium', "Le cinéma est attiré par le non-arrangé, le fortuit, l'infini, l'indéterminé et le flux de la vie."],
      ['Tendances réaliste et formative', "Lumière (enregistrer) et Méliès (inventer) : deux pôles dont le meilleur cinéma tient l'équilibre."],
    ],
  },

  // — Langage et sémiologie —
  {
    auteur: 'Marcel Martin', oeuvre: 'Le Langage cinématographique', annee: '1955', courant: 'Langage et sémiologie',
    resume: "Ouvrage de référence en français pour apprendre la grammaire du plan : cadrage, angles, mouvements, ellipse et montage, avec leurs effets sur le spectateur.",
    concepts: [
      ['Échelle des plans', "Du plan général au gros plan, chaque valeur de plan a un rôle narratif et émotionnel."],
      ['Angles et mouvements', "Plongée, contre-plongée, panoramique, travelling : la position et le mouvement de la caméra prennent un sens."],
      ['Montage narratif et expressif', "Le premier raconte une suite d'événements, le second produit un effet de sens par le choc ou le rapprochement."],
      ['Ellipse', "Passer sous silence ce qui n'a pas besoin d'être vu : la durée du film n'est pas la durée de l'histoire."],
    ],
  },
  {
    auteur: 'Christian Metz', oeuvre: 'Essais sur la signification au cinéma', annee: '1968', courant: 'Langage et sémiologie',
    resume: "Metz analyse le cinéma comme un langage sans langue : il n'a pas de mots, mais une organisation du récit que l'on peut décrire.",
    concepts: [
      ['Grande syntagmatique', "Huit types de segments autonomes du film : plan autonome, syntagmes parallèle, en accolade, descriptif, alterné, scène, séquence par épisodes, séquence ordinaire."],
      ['Langage sans langue', "Le cinéma est une pratique signifiante organisée sans code strict comparable à la langue."],
    ],
  },
  {
    auteur: 'Noël Burch', oeuvre: 'Praxis du cinéma ; La Lucarne de l\'infini', annee: '1969 · 1990', courant: 'Langage et sémiologie',
    resume: "Burch inventorie les rapports d'espace et de temps entre les plans, puis montre comment le cinéma américain a institutionnalisé une façon de raconter.",
    concepts: [
      ['Espace hors champ', "Six segments invisibles : les quatre bords du cadre, l'espace derrière la caméra, l'espace derrière le décor."],
      ['Raccords spatio-temporels', "Types de liaison entre deux plans (de direction, de position, de mouvement) qui assurent ou rompent la continuité."],
      ['Mode de représentation institutionnel', "Un système de règles qui fait paraître le récit continu et transparent, apparu dans les années 1910."],
    ],
  },
  {
    auteur: 'Gilles Deleuze', oeuvre: "Cinéma 1 : L'Image-mouvement · Cinéma 2 : L'Image-temps", annee: '1983–1985', courant: 'Langage et sémiologie',
    resume: "Deleuze lit l'histoire du cinéma comme une pensée par les images : d'abord le mouvement qui enchaîne perception, affection et action, puis le temps qui affleure quand l'enchaînement se brise.",
    concepts: [
      ['Image-perception, -affection, -action', "Trois types d'images-mouvement : ce que le personnage voit, ce qu'il ressent (le gros plan, visage), ce qu'il fait."],
      ['Plan comme coupe mobile', "Le plan n'est pas une image fixe : il est une coupe dans une durée, qui bouge."],
      ['Image-temps', "Dans le cinéma moderne, des situations optiques et sonores pures rompent l'enchaînement action-réaction et montrent le temps."],
    ],
  },
  {
    auteur: 'André Gaudreault et François Jost', oeuvre: 'Le Récit cinématographique', annee: '1990', courant: 'Langage et sémiologie',
    resume: "Les deux auteurs appliquent la narratologie au film : le plan montre, le montage raconte, et un narrateur filmique orchestre l'ensemble.",
    concepts: [
      ['Monstration et narration', "Montrer (ce qui se déroule dans le plan) et raconter (ce que le montage organise) sont deux niveaux distincts du récit."],
      ['Grand imagier', "Instance qui choisit et ordonne les images : le narrateur filmique."],
    ],
  },

  // — Analyse et regard —
  {
    auteur: 'Éric Rohmer', oeuvre: "L'Organisation de l'espace dans le Faust de Murnau", annee: '1977', courant: 'Analyse et regard',
    resume: "Rohmer distingue trois espaces à l'œuvre dans un film et montre comment un cinéaste les compose ensemble.",
    concepts: [
      ['Espace pictural', "L'espace du cadre, plan à deux dimensions : composition, lumière, lignes."],
      ['Espace architectural', "L'espace représenté, tridimensionnel : le lieu où les personnages se déplacent."],
      ['Espace filmique', "L'espace que le montage construit entre les plans, sans qu'aucun plan ne le montre entier."],
    ],
  },
  {
    auteur: 'Laura Mulvey', oeuvre: 'Plaisir visuel et cinéma narratif', annee: '1975', courant: 'Analyse et regard',
    resume: "Mulvey montre que la mise en scène classique organise le regard : qui regarde, qui est regardé, et selon quel désir.",
    concepts: [
      ['Trois regards', "Celui de la caméra, des personnages entre eux et du spectateur : la mise en scène les fait converger."],
      ['Regard masculin (male gaze)', "Le cadrage et la mise en scène traitent souvent la femme comme objet de regard, l'homme comme sujet de l'action."],
    ],
  },
  {
    auteur: 'François Jost', oeuvre: "L'Œil-caméra", annee: '1987', courant: 'Analyse et regard',
    resume: "Jost précise ce que le spectateur voit et de qui : la caméra montre-t-elle ce que perçoit un personnage, ou regarde-t-elle d'ailleurs ?",
    concepts: [
      ['Ocularisation interne primaire', "Le plan reproduit la vision du personnage dans sa forme même : flou, tremblé, déformations."],
      ['Ocularisation interne secondaire', "Un raccord regard attribue le plan à un personnage qu'on vient de voir regarder."],
      ['Ocularisation zéro', "Le plan ne dépend d'aucun regard de personnage : c'est le regard du récit lui-même."],
    ],
  },
  {
    auteur: 'David Bordwell et Kristin Thompson', oeuvre: "L'Art du film", annee: '1979', courant: 'Analyse et regard',
    resume: "Manuel d'analyse des procédés du film : mise en scène, cadrage, montage, son. Bordwell décrit ensuite les styles historiques de découpage et de mise en scène (mise en scène en profondeur, continuité intensifiée).",
    concepts: [
      ['Mise en scène (au sens large)', "Ce qui est devant la caméra : décor, costumes, lumière et jeu des figures (leurs positions, leurs déplacements)."],
      ['Cadrage', "Distance, angle, hauteur, mobilité du cadre : ce qu'on voit et ce qu'on laisse hors champ."],
      ['Fabula et syuzhet', "L'histoire (chronologie des événements) et son agencement dans le récit : le film choisit l'ordre et la quantité d'information."],
      ['Mise en scène en profondeur', "Étager l'action dans plusieurs plans de l'espace pour que le geste et le cadre racontent sans coupe."],
      ['Continuité intensifiée', "Style contemporain : montage rapide, focales extrêmes, gros plans fréquents, caméra très mobile."],
    ],
  },

  // — Image et son —
  {
    auteur: 'Michel Chion', oeuvre: "L'Audio-vision", annee: '1990', courant: 'Image et son',
    resume: "Chion montre que nous ne voyons pas la même image selon le son qui l'accompagne : la mise en scène est audio-visuelle, jamais seulement visuelle.",
    concepts: [
      ['Valeur ajoutée', "Le son enrichit l'image d'une information ou d'une émotion qui semble venir d'elle seule."],
      ['Synchrèse', "La perception soude un son et une image qui coïncident, sans lien naturel."],
      ['Acousmêtre', "Voix sans corps visible (de l'écran), qui acquiert un pouvoir tant qu'on ne la voit pas."],
      ['Point d\'écoute', "Le son aussi a un point de vue : on peut entendre depuis la place du personnage ou d'un témoin."],
    ],
  },
  {
    auteur: 'Walter Murch', oeuvre: 'En un clin d\'œil', annee: '1995', courant: 'Image et son',
    resume: "Un monteur et sonorisateur donne une échelle de valeurs pour décider d'une coupe, avec l'émotion au premier rang.",
    concepts: [
      ['Six critères de coupe', "Émotion (51 %), histoire (23 %), rythme (10 %), trace de l'œil (7 %), plan à deux dimensions (5 %) et espace en trois dimensions (4 %)."],
      ['Trace de l\'œil', "Le point d'intérêt dans le cadre doit rester là où le regard est déjà, d'un plan à l'autre, pour une coupe invisible."],
    ],
  },

  // — Pratique du cinéaste —
  {
    auteur: 'Alexandre Astruc et les Cahiers du cinéma', oeuvre: 'La Caméra-stylo ; La politique des auteurs', annee: '1948–1960', courant: 'Pratique du cinéaste',
    resume: "Astruc fait de la caméra un stylo : le réalisateur écrit avec la mise en scène. Les critiques des Cahiers du cinéma en tirent une politique des auteurs, où le style d'un cinéaste se juge à sa mise en scène.",
    concepts: [
      ['Caméra-stylo', "Le cinéma devient un langage aussi souple que l'écriture ; le metteur en scène est l'auteur du film."],
      ['Politique des auteurs', "Juger un film par la cohérence d'une vision personnelle visible dans les choix de mise en scène."],
      ['Le travelling, affaire de morale', "Formule de la critique des Cahiers : un mouvement de caméra engage une éthique du regard."],
    ],
  },
  {
    auteur: 'Alfred Hitchcock et François Truffaut', oeuvre: 'Le Cinéma selon Hitchcock', annee: '1966', courant: 'Pratique du cinéaste',
    resume: "Entretien-fleuve où Hitchcock explique comment il construit les scènes pour contrôler ce que le spectateur sait, voit et ressent. Il prépare tout sur le papier avant de tourner.",
    concepts: [
      ['Suspense et surprise', "Une bombe sous la table : si le public la voit, c'est du suspense ; si elle explose sans qu'il l'ait vue, c'est de la surprise."],
      ['Cinéma pur', "Raconter par les images et leur enchaînement plutôt que par le dialogue."],
      ['Information donnée au public', "La mise en scène dose ce que le spectateur sait, souvent plus que les personnages."],
      ['Préparation sur papier', "Le film est écrit et dessiné en détail avant le tournage."],
    ],
  },
  {
    auteur: 'Robert Bresson', oeuvre: 'Notes sur le cinématographe', annee: '1975', courant: 'Pratique du cinéaste',
    resume: "Recueil d'aphorismes d'un cinéaste qui distingue le cinéma (théâtre filmé) du cinématographe (écriture avec des images et des sons).",
    concepts: [
      ['Modèles', "Des personnes, non des acteurs, que l'on dirige par la répétition mécanique, pour obtenir ce que le geste révèle sans le vouloir."],
      ['Cinématographe', "Écrire avec des images en mouvement et des sons : un langage qui n'imite pas le théâtre."],
      ['Image et son', "Ne pas doubler l'un par l'autre : si un son peut remplacer une image, on supprime l'image."],
      ['Ellipse', "Montrer l'effet plutôt que la cause : laisser au spectateur le travail de compléter."],
    ],
  },
  {
    auteur: 'Andreï Tarkovski', oeuvre: 'Le Temps scellé', annee: '1986', courant: 'Pratique du cinéaste',
    resume: "Pour Tarkovski, la matière première du cinéma n'est pas le montage mais le temps : le plan vaut par la pression du temps qui s'y écoule.",
    concepts: [
      ['Sculpter dans le temps', "Le cinéaste taille dans le temps réel, comme le sculpteur dans la pierre."],
      ['Rythme interne du plan', "Le rythme naît de la tension du temps à l'intérieur du plan, pas de la vitesse du montage."],
      ['Critique du montage-symbole', "Il s'oppose au montage dialectique d'Eisenstein : l'image doit être observation, non démonstration."],
    ],
  },
  {
    auteur: 'Sidney Lumet', oeuvre: 'Faire un film', annee: '1995', courant: 'Pratique du cinéaste',
    resume: "Un cinéaste de plateau raconte le métier : toute décision de style (cadre, optique, couleur) doit découler de ce dont parle le film.",
    concepts: [
      ['Le style découle du sujet', "Avant de choisir un plan, on décide de quoi parle le film et ce que le spectateur doit ressentir."],
      ['Optique et couleur comme évolution', "Le choix des focales et des couleurs peut évoluer au fil du récit pour accompagner la progression dramatique."],
      ['Répétition', "Le travail avec les acteurs avant le tournage fixe les déplacements, qui guident ensuite le découpage."],
    ],
  },
  {
    auteur: 'David Mamet', oeuvre: 'On Directing Film', annee: '1991', courant: 'Pratique du cinéaste',
    resume: "Mamet défend un découpage sobre : chaque scène répond à un objectif du personnage, et les plans neutres, mis bout à bout, racontent mieux que des plans démonstratifs.",
    concepts: [
      ['Objectif du personnage', "Chaque scène répond à la question : que veut le personnage, et qu'est-ce qui l'en empêche ?"],
      ['Plans non infléchis', "Un plan qui montre simplement un fait, sans commentaire de la caméra ; c'est la juxtaposition qui crée le sens."],
      ['Raconter par les coupes', "Le montage raconte ce que les dialogues n'ont pas à dire ; on coupe sur ce qui fait avancer l'histoire."],
    ],
  },
  {
    auteur: 'Steven D. Katz', oeuvre: 'Shot by Shot ; Film Directing: Cinematic Motion', annee: '1991–1992', courant: 'Pratique du cinéaste',
    resume: "Manuel de découpage par plans : storyboards, diagrammes de placement et stratégies de mouvement de caméra pour passer de l'idée à l'écran.",
    concepts: [
      ['Diagramme de placement', "Plan zénithal des positions des personnages et de la caméra : le découpage se prépare dans l'espace avant d'être cadré."],
      ['Plan-séquence ou couverture', "Choix entre raconter dans la durée d'un plan mobile et découper en plans multiples à monter."],
      ['Mouvement des personnages et de la caméra', "Le mouvement lie le jeu et le cadre ; le motiver par l'action le rend invisible."],
    ],
  },
  {
    auteur: 'Découpage classique hollywoodien', oeuvre: 'The Classical Hollywood Cinema (Bordwell, Staiger, Thompson)', annee: '1985', courant: 'Pratique du cinéaste',
    resume: "Le système de règles né dans les années 1910, qui rend le découpage transparent : le spectateur suit l'action sans remarquer les coupes.",
    concepts: [
      ['Règle des 180°', "La caméra reste du même côté d'un axe imaginaire entre les personnages, pour conserver leurs positions à l'écran."],
      ['Champ et contrechamp', "Alternance de plans de deux personnages en dialogue, souvent sur l'épaule de l'autre."],
      ['Établissement puis resserrement', "Un plan large situe l'espace, puis des plans plus serrés suivent l'action."],
      ['Raccords dans le mouvement et de regard', "Couper pendant un geste ou sur ce qu'un personnage regarde, pour que le passage reste fluide."],
      ['Couverture (coverage)', "Filmer la scène sous plusieurs angles et valeurs pour garder des choix au montage."],
    ],
  },
];
