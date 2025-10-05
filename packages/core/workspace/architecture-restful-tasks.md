# Architecture RESTful - Application de Gestion de Tâches

## Vue d'ensemble

Cette architecture RESTful conçoit une application complète de gestion de tâches avec authentification utilisateur, assignation de tâches et système de notifications.

## 1. Modèles de Données

### User (Utilisateur)
```json
{
  "id": "uuid",
  "username": "string (unique)",
  "email": "string (unique)",
  "passwordHash": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "enum [admin, user]",
  "avatar": "string (URL)",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "lastLoginAt": "datetime"
}
```

### Task (Tâche)
```json
{
  "id": "uuid",
  "title": "string (required)",
  "description": "string",
  "status": "enum [todo, in_progress, completed, cancelled]",
  "priority": "enum [low, medium, high, urgent]",
  "dueDate": "datetime",
  "estimatedHours": "number",
  "actualHours": "number",
  "assignedTo": "uuid (User.id)",
  "createdBy": "uuid (User.id)",
  "projectId": "uuid (optional)",
  "tags": "array[string]",
  "attachments": "array[string]",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "completedAt": "datetime"
}
```

### Notification (Notification)
```json
{
  "id": "uuid",
  "userId": "uuid (User.id)",
  "taskId": "uuid (Task.id)",
  "type": "enum [task_assigned, task_updated, task_completed, task_overdue, mention]",
  "title": "string",
  "message": "string",
  "isRead": "boolean",
  "createdAt": "datetime",
  "readAt": "datetime"
}
```

### Project (Projet) - Optionnel
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "ownerId": "uuid (User.id)",
  "members": "array[uuid]",
  "status": "enum [active, completed, archived]",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## 2. Endpoints HTTP

### Authentification
- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion d'un utilisateur
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/refresh` - Rafraîchir le token JWT
- `POST /api/auth/forgot-password` - Demande de réinitialisation de mot de passe
- `POST /api/auth/reset-password` - Réinitialisation du mot de passe

### Utilisateurs
- `GET /api/users/profile` - Obtenir le profil utilisateur
- `PUT /api/users/profile` - Mettre à jour le profil utilisateur
- `GET /api/users` - Lister les utilisateurs (admin)
- `GET /api/users/{id}` - Obtenir un utilisateur spécifique
- `PUT /api/users/{id}` - Mettre à jour un utilisateur (admin)
- `DELETE /api/users/{id}` - Supprimer un utilisateur (admin)

### Tâches (CRUD)
- `GET /api/tasks` - Lister les tâches (avec filtres)
- `POST /api/tasks` - Créer une nouvelle tâche
- `GET /api/tasks/{id}` - Obtenir une tâche spécifique
- `PUT /api/tasks/{id}` - Mettre à jour une tâche
- `DELETE /api/tasks/{id}` - Supprimer une tâche
- `PATCH /api/tasks/{id}/status` - Mettre à jour le statut d'une tâche
- `POST /api/tasks/{id}/assign` - Assigner une tâche à un utilisateur

### Projets
- `GET /api/projects` - Lister les projets
- `POST /api/projects` - Créer un nouveau projet
- `GET /api/projects/{id}` - Obtenir un projet spécifique
- `PUT /api/projects/{id}` - Mettre à jour un projet
- `DELETE /api/projects/{id}` - Supprimer un projet
- `GET /api/projects/{id}/tasks` - Lister les tâches d'un projet

### Notifications
- `GET /api/notifications` - Lister les notifications de l'utilisateur
- `PUT /api/notifications/{id}/read` - Marquer une notification comme lue
- `PUT /api/notifications/read-all` - Marquer toutes les notifications comme lues
- `DELETE /api/notifications/{id}` - Supprimer une notification

### Statistiques et Dashboard
- `GET /api/dashboard/stats` - Statistiques générales
- `GET /api/dashboard/tasks-by-status` - Tâches par statut
- `GET /api/dashboard/tasks-by-priority` - Tâches par priorité
- `GET /api/dashboard/user-performance` - Performance utilisateur

## 3. Détails des Endpoints

### Authentification

#### POST /api/auth/register
```json
// Request
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

// Response 201
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### POST /api/auth/login
```json
// Request
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response 200
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### Tâches

#### GET /api/tasks
Query Parameters:
- `status`: todo, in_progress, completed, cancelled
- `priority`: low, medium, high, urgent
- `assignedTo`: userId
- `createdBy`: userId
- `projectId`: projectId
- `dueDate`: date range
- `search`: text search
- `page`: pagination
- `limit`: items per page

#### POST /api/tasks
```json
// Request
{
  "title": "Implémenter l'authentification",
  "description": "Créer les endpoints d'authentification JWT",
  "priority": "high",
  "dueDate": "2024-01-15T10:00:00Z",
  "estimatedHours": 8,
  "assignedTo": "user_uuid",
  "projectId": "project_uuid",
  "tags": ["backend", "auth", "security"]
}

// Response 201
{
  "id": "task_uuid",
  "title": "Implémenter l'authentification",
  "status": "todo",
  "createdAt": "2024-01-10T09:00:00Z",
  "createdBy": "current_user_uuid"
}
```

#### PATCH /api/tasks/{id}/status
```json
// Request
{
  "status": "in_progress",
  "comment": "Commencé l'implémentation"
}
```

## 4. Logique Métier

### Règles de Gestion des Tâches

1. **Création de Tâche**
   - Seuls les utilisateurs authentifiés peuvent créer des tâches
   - Le créateur est automatiquement défini comme `createdBy`
   - Une tâche doit avoir au minimum un titre
   - La date d'échéance ne peut être antérieure à la date de création

2. **Assignation de Tâches**
   - Seul le créateur ou un admin peut assigner/réassigner une tâche
   - Une tâche ne peut être assignée qu'à des utilisateurs actifs
   - L'utilisateur assigné reçoit automatiquement une notification

3. **Changement de Statut**
   - `todo` → `in_progress`: accessible à l'utilisateur assigné ou au créateur
   - `in_progress` → `completed`: accessible à l'utilisateur assigné
   - `completed` → `in_progress`: accessible au créateur ou admin
   - `cancelled`: accessible au créateur ou admin

4. **Suppression de Tâche**
   - Seul le créateur ou un admin peut supprimer une tâche
   - Les tâches terminées depuis plus de 30 jours ne peuvent être supprimées (archivage)

### Règles de Notifications

1. **Déclenchement Automatique**
   - `task_assigned`: lors de l'assignation d'une tâche
   - `task_updated`: lors de la modification d'une tâche assignée
   - `task_completed`: lors de la completion d'une tâche
   - `task_overdue`: 24h avant la date d'échéance
   - `mention`: lors d'une mention dans un commentaire

2. **Gestion des Notifications**
   - Les notifications non lues sont conservées 90 jours
   - Les notifications lues sont archivées après 30 jours
   - Limite de 1000 notifications par utilisateur

### Règles de Sécurité

1. **Authentification**
   - Token JWT valide requis pour toutes les routes sauf authentification
   - Token refresh après 15 minutes d'inactivité
   - Mot de passe minimum 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial

2. **Autorisations**
   - Lecture: utilisateur assigné, créateur, ou membre du projet
   - Modification: créateur ou utilisateur assigné (pour statut)
   - Suppression: créateur ou admin
   - Administration: rôle admin requis

## 5. Validation des Données

### User Validation
```javascript
{
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  email: {
    required: true,
    format: 'email',
    unique: true
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/$
  }
}
```

### Task Validation
```javascript
{
  title: {
    required: true,
    minLength: 1,
    maxLength: 200
  },
  description: {
    maxLength: 2000
  },
  priority: {
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    enum: ['todo', 'in_progress', 'completed', 'cancelled'],
    default: 'todo'
  },
  dueDate: {
    type: 'datetime',
    after: 'createdAt'
  },
  estimatedHours: {
    type: 'number',
    minimum: 0.5,
    maximum: 1000
  }
}
```

## 6. Architecture Technique

### Structure du Projet
```
/api
  /auth
    - register.js
    - login.js
    - refresh.js
  /users
    - profile.js
    - management.js
  /tasks
    - crud.js
    - assignment.js
    - status.js
  /projects
    - management.js
  /notifications
    - management.js
  /dashboard
    - stats.js
/middleware
  - auth.js
  - validation.js
  - permissions.js
  - rateLimiting.js
/models
  - User.js
  - Task.js
  - Notification.js
  - Project.js
/services
  - authService.js
  - taskService.js
  - notificationService.js
  - emailService.js
/utils
  - jwt.js
  - validation.js
  - database.js
```

### Base de Données
- **PostgreSQL** pour les données relationnelles
- **Redis** pour le cache et les sessions
- **Index** sur les champs fréquemment recherchés
- **Soft delete** pour la conservation des données

### Performance
- **Pagination** pour toutes les listes
- **Cache Redis** pour les données fréquemment accédées
- **Compression Gzip** pour les réponses
- **Rate limiting** pour prévenir les abus

### Sécurité
- **HTTPS** obligatoire en production
- **CORS** configuré pour les domaines autorisés
- **Helmet.js** pour les headers de sécurité
- **Input validation** et **sanitization**
- **SQL injection prevention** avec paramétrisation

## 7. API Versioning

- Version actuelle: `/api/v1/`
- Rétrocompatibilité maintenue pour 2 versions
- Documentation OpenAPI/Swagger pour chaque version

## 8. Monitoring et Logging

- **Winston** pour le logging structuré
- **Morgan** pour les logs HTTP
- **Prometheus** pour les métriques
- **Sentry** pour le tracking d'erreurs

## 9. Tests

- **Unit tests** avec Jest
- **Integration tests** avec Supertest
- **E2E tests** avec Cypress
- **Coverage minimum**: 80%

## 10. Déploiement

- **Docker** pour la containerisation
- **CI/CD** avec GitHub Actions
- **Environment variables** pour la configuration
- **Health checks** pour monitoring

Cette architecture RESTful fournit une base solide et évolutive pour une application de gestion de tâches complète, avec toutes les fonctionnalités demandées et des bonnes pratiques de développement.