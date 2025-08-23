# Guide du Système d'Upgrade AgenticForge

## Vue d'ensemble

Le système d'upgrade AgenticForge permet aux utilisateurs de recevoir des notifications lorsque de nouvelles versions sont disponibles et de mettre à jour leur distribution directement depuis l'interface web.

## Architecture

Le système comprend trois couches principales :

### 1. Backend (API + Moteur d'upgrade)
- **VersionService** : Gestion des versions et intégration GitHub API
- **UpgradeEngine** : Orchestration Docker et processus d'upgrade
- **Endpoints API** : `/api/version/*` et `/api/upgrade/*`
- **Base de données** : Schéma pour tracking des upgrades et préférences

### 2. Frontend (Interface utilisateur)
- **VersionDisplay** : Affichage de version avec indicateurs de mise à jour
- **UpgradeNotification** : Notifications d'upgrade avec différents niveaux de sévérité
- **UpgradeModal** : Modal complet avec notes de release et options d'upgrade
- **VersionManager** : Composant orchestrateur principal

### 3. Infrastructure
- **Base de données PostgreSQL** : Stockage des sessions d'upgrade et préférences
- **Redis** : Cache pour les checks de version
- **Docker** : Orchestration des services et upgrades

## Installation et Configuration

### 1. Base de données

Exécutez le script SQL pour créer le schéma :

```sql
-- Exécuter le fichier packages/core/src/modules/version/version-schema.sql
```

### 2. Variables d'environnement

Ajoutez ces variables à votre `.env` :

```bash
# Configuration Version Check
VERSION_CHECK_ENABLED=true
VERSION_CHECK_INTERVAL=300000  # 5 minutes en ms
VERSION_CHECK_URL=https://api.github.com/repos/Jboner-Corvus/AgenticForge/releases/latest

# Configuration Upgrade
UPGRADE_ENABLED=true
UPGRADE_BACKUP_ENABLED=true
UPGRADE_ROLLBACK_TIMEOUT=86400000  # 24 heures en ms
UPGRADE_MAX_RETRIES=3
```

### 3. Frontend

Intégrez le VersionManager dans votre App.tsx :

```tsx
import { VersionManager } from './components/VersionManager';

function App() {
  return (
    <div className="App">
      {/* Votre contenu existant */}
      
      {/* Système d'upgrade */}
      <VersionManager />
    </div>
  );
}
```

## Utilisation

### 1. Affichage de Version

Le composant `VersionDisplay` affiche automatiquement :
- Version actuelle dans le coin inférieur droit
- Indicateur de mise à jour disponible
- Tooltip avec détails de la mise à jour

### 2. Notifications d'Upgrade

Quand une mise à jour est disponible :
- Notification automatique avec sévérité (patch/minor/major)
- Options : "Upgrade Now", "Remind Later", "Skip Version"
- Indicateurs visuels selon la sévérité

### 3. Modal d'Upgrade

Interface complète avec :
- **Onglet Overview** : Résumé des changements et sévérité
- **Onglet Release Notes** : Notes de release formatées
- **Onglet Options** : Configuration de l'upgrade (timing, backup, etc.)

### 4. Processus d'Upgrade

Étapes automatisées :
1. Vérifications pré-upgrade
2. Création de backup (optionnel)
3. Téléchargement de la nouvelle image
4. Arrêt des services
5. Mise à jour des containers
6. Redémarrage des services
7. Vérifications de santé

## API Endpoints

### Version Management

```bash
# Informations version actuelle
GET /api/version/current
Authorization: Bearer <token>

# Vérification de mises à jour
GET /api/version/check
Authorization: Bearer <token>

# Dernière release GitHub
GET /api/version/latest
Authorization: Bearer <token>

# Validation préconditions upgrade
POST /api/version/validate-upgrade
Authorization: Bearer <token>
Content-Type: application/json
{
  "fromVersion": "1.0.304",
  "toVersion": "1.0.314"
}
```

### Upgrade Operations

```bash
# Démarrer upgrade
POST /api/upgrade/initiate
Authorization: Bearer <token>
Content-Type: application/json
{
  "fromVersion": "1.0.304",
  "toVersion": "1.0.314",
  "options": {
    "immediate": true,
    "backupEnabled": true,
    "rollbackOnFailure": true,
    "notifyOnCompletion": true
  }
}

# Statut upgrade
GET /api/upgrade/{sessionId}/status
Authorization: Bearer <token>

# Annuler upgrade
POST /api/upgrade/{sessionId}/cancel
Authorization: Bearer <token>

# Rollback
POST /api/upgrade/{sessionId}/rollback
Authorization: Bearer <token>
```

## Configuration Utilisateur

### Préférences Stockées

Les préférences sont stockées dans localStorage :

```typescript
interface UserPreferences {
  autoCheckEnabled: boolean;
  showNotifications: boolean;
  notificationPosition: 'top' | 'center' | 'bottom';
  dismissedVersions: string[];
  skippedVersions: string[];
}
```

### Personnalisation

```tsx
<VersionDisplay
  showUpdateIndicator={true}
  position="bottom-right"
  enableAutoCheck={true}
  checkInterval={300000} // 5 minutes
/>
```

## Sécurité

### Authentification
- Toutes les API nécessitent un token Bearer
- Sessions d'upgrade liées aux sessions utilisateur

### Validation d'Images
- Vérification des signatures Docker
- Contrôle des SHA256
- Validation de la source registry

### Protection des Données
- Backup automatique avant upgrade
- Stockage chiffré des backups
- Nettoyage sécurisé des anciennes versions

## Monitoring et Logs

### Événements Trackés
- Checks de version
- Démarrages d'upgrade
- Progressions et étapes
- Erreurs et rollbacks
- Préférences utilisateur

### Structure des Logs

```sql
-- Table upgrade_logs
SELECT 
  timestamp,
  level,
  message,
  step,
  operation,
  metadata
FROM upgrade_logs 
WHERE upgrade_session_id = ?
ORDER BY timestamp DESC;
```

## Dépannage

### Problèmes Courants

**1. Échec de connexion GitHub API**
```bash
# Vérifier la connectivité
curl -I https://api.github.com/repos/Jboner-Corvus/AgenticForge/releases/latest
```

**2. Échec d'upgrade Docker**
```bash
# Vérifier Docker
docker info
docker-compose ps

# Vérifier les images
docker images | grep agenticforge
```

**3. Échec de backup**
```bash
# Vérifier l'espace disque
df -h

# Vérifier les permissions
ls -la /tmp/
```

### Logs de Débogage

Activez les logs détaillés :

```bash
export LOG_LEVEL=debug
```

## Tests

### Tests Unitaires

```bash
# Tests VersionService
cd packages/core
pnpm test VersionService.test.ts

# Tests UpgradeEngine  
pnpm test UpgradeEngine.test.ts
```

### Tests d'Intégration

```bash
# Test API endpoints
curl -X GET "http://localhost:3001/api/version/current" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Test interface utilisateur
# Ouvrir http://localhost:3000 et vérifier l'affichage de version
```

## Performance

### Optimisations
- Cache Redis pour les checks GitHub (TTL: 1 heure)
- Polling intelligent avec backoff
- Compression des logs d'upgrade
- Nettoyage automatique des anciens backups

### Métriques
- Temps moyen d'upgrade par sévérité
- Taux de succès des upgrades
- Utilisation du cache version
- Fréquence des checks automatiques

## Roadmap

### Fonctionnalités Futures
- [ ] Upgrades planifiés avec cron
- [ ] Rollback automatique basé sur health checks
- [ ] Notifications multi-canal (email, webhook)
- [ ] Clustering et upgrades blue-green
- [ ] Interface admin pour gestion des releases
- [ ] Métriques avancées et dashboards

### Améliorations Techniques
- [ ] WebSocket pour progress en temps réel
- [ ] Compression des données de session
- [ ] Support multi-environnement
- [ ] Tests end-to-end automatisés
- [ ] Documentation API OpenAPI/Swagger

## Support

Pour des questions ou problèmes :
1. Consultez les logs dans la base de données
2. Vérifiez la configuration des variables d'environnement
3. Testez la connectivité GitHub API
4. Vérifiez l'état des services Docker

---

**Note** : Ce système a été conçu pour être progressivement déployé. Commencez par tester en mode développement avant la production.