# Interface Utilisateur AgenticForge

## Description

Cette interface utilisateur est le frontend de l'application AgenticForge, construit avec React, TypeScript et Vite. Elle fournit une interface riche pour interagir avec les agents AI.

## Composants Principaux

### 🎨 AgentOutputCanvas

Le composant **AgentOutputCanvas** est conçu pour afficher le contenu généré par l'agent. Il supporte plusieurs types de contenu :

- **Markdown** : Rendu avec syntaxe étendue (remark-gfm)
- **HTML** : Affichage sécurisé dans une iframe sandboxée
- **URL** : Chargement de pages web externes
- **Texte brut** : Pour les contenus simples

#### Fonctionnalités

- Historique de navigation
- Mode plein écran
- Épinglage du canvas
- Copie du contenu dans le presse-papiers
- Téléchargement du contenu
- Redimensionnement

### 📋 TodoList

Le composant **TodoList** permet de gérer les tâches de l'utilisateur. Il est complètement indépendant du canvas.

#### Fonctionnalités

- Ajout de nouvelles tâches avec priorité (basse, moyenne, haute)
- Modification du statut des tâches (À faire, En cours, Terminé)
- Suppression des tâches
- Statistiques en temps réel
- Tri automatique par statut
- Catégorisation des tâches

### 🔧 Indépendance des Composants

Les deux composants (canvas et todolist) sont maintenant complètement indépendants l'un de l'autre :

- **Canvas** : Affiche le contenu généré par l'agent
- **TodoList** : Gère les tâches de l'utilisateur

Cette séparation permet une meilleure organisation et une utilisation plus flexible de chaque composant.

## Technologies Utilisées

- React 18 avec Hooks
- TypeScript
- Vite (bundler)
- Tailwind CSS (styling)
- Framer Motion (animations)
- Zustand (gestion d'état)
- Lucide React (icônes)
- React Markdown (rendu Markdown)

## Développement

### Installation

```bash
pnpm install
```

### Lancement en mode développement

```bash
pnpm dev
```

### Build pour la production

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

### Tests

```bash
pnpm test
```

## Structure du Projet

```
src/
├── components/
│   ├── AgentOutputCanvas/     # Composant canvas
│   ├── TodoList/              # Composant todolist
│   └── ui/                    # Composants UI réutilisables
├── lib/
│   ├── store.ts               # Zustand store
│   └── hooks/                 # Hooks personnalisés
└── types/                     # Définitions de types
```

## Configuration

Le projet utilise :
- ESLint pour le linting
- Prettier pour le formatage
- TypeScript pour le typage
- Tailwind CSS pour le styling

## Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalité`)
3. Commitez vos changements (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`)
4. Poussez la branche (`git push origin feature/ma-fonctionnalité`)
5. Ouvrez une Pull Request

## License

MIT