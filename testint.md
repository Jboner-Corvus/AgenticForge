# Guide des Tests d'Intégration - AgenticForge

Ce guide identifie les tests d'intégration existants et ceux à créer pour assurer une couverture complète du système.

## Instructions pour l'Agent Développeur 🤖

### Workflow de Développement des Tests

1. **Avant de commencer un test** :
   - [ ] Cocher le test comme `en cours` dans la liste : `- [⏳]`
   - [ ] Analyser les tests existants similaires pour comprendre les patterns
   - [ ] Vérifier les dépendances et services requis

2. **Développement du test** :
   - [ ] Créer le fichier de test dans le bon répertoire
   - [ ] Implémenter les cas de test suivant les standards du projet
   - [ ] Ajouter la documentation et les commentaires nécessaires
   - [ ] Suivre les conventions de nommage existantes

3. **Après création du test** :
   - [ ] **OBLIGATOIRE** : Exécuter `./run.sh all-checks` pour vérifier tests, lint et TSC
   - [ ] Vérifier que le nouveau test passe avec succès
   - [ ] Corriger les erreurs de lint/TypeScript si nécessaire
   - [ ] Re-tester jusqu'à ce que tous les checks passent

4. **Validation finale** :
   - [ ] Exécuter `./run.sh all-checks` pour validation complète
   - [ ] Vérifier que le test ne casse pas les tests existants
   - [ ] S'assurer qu'il n'y a pas d'erreurs de lint ou TypeScript
   - [ ] Marquer le test comme terminé : `- [x]`
   - [ ] Passer au test suivant dans la liste de priorités

### Commandes Essentielles

```bash
# Vérification complète (tests + lint + TSC) - OBLIGATOIRE après chaque test
./run.sh all-checks

# Vérifications rapides (lint + TSC uniquement, sans tests)
./run.sh small-checks

# Lancer tous les tests uniquement
./run.sh test

# Lancer tests unitaires uniquement
./run.sh test:unit

# Lancer tests d'intégration uniquement
./run.sh test:integration

# Vérifier le linting
./run.sh lint

# Vérifier TypeScript
./run.sh typecheck

# Formater le code
./run.sh format
```

### Standards de Qualité Requis

- ✅ **Couverture** : Minimum 90% pour chaque nouveau test
- ✅ **Performance** : Test doit s'exécuter en < 30 secondes
- ✅ **Isolation** : Chaque test doit être indépendant
- ✅ **Documentation** : Commentaires explicatifs pour les cas complexes
- ✅ **Nettoyage** : Cleanup des ressources après chaque test

### Légende des Statuts

- `[ ]` - Test à implémenter
- `[⏳]` - Test en cours de développement
- `[x]` - Test implémenté et validé
- `[❌]` - Test échoué, nécessite correction
- `[🔄]` - Test en cours de correction

## Tests d'Intégration Existants ✅

### Tests Agent (17 fichiers)
- [x] `agent.integration.test.ts` - Tests d'intégration agent de base
- [x] `agent.critical.integration.test.ts` - Tests critiques d'agent
- [x] `agent.comprehensive.test.ts` - Tests complets d'agent
- [x] `agent.conversation.test.ts` - Tests de conversation
- [x] `agent.showcase.test.ts` - Tests de démonstration
- [x] `orchestrator.advanced.test.ts` - Tests orchestrateur avancé
- [x] `responseSchema.advanced.test.ts` - Tests schéma de réponse
- [x] `e2e.integration.test.ts` - Tests end-to-end
- [x] `jobQueue.integration.test.ts` - Tests file d'attente
- [x] `llmProvider.integration.test.ts` - Tests fournisseur LLM
- [x] `monitoring.integration.test.ts` - Tests monitoring
- [x] `performance.integration.test.ts` - Tests performance
- [x] `security.integration.test.ts` - Tests sécurité
- [x] `session.integration.test.ts` - Tests session
- [x] `toolRegistry.integration.test.ts` - Tests registre d'outils
- [x] `websocket.integration.test.ts` - Tests WebSocket
- [x] `redis.integration.test.ts` - Tests Redis

### Tests Infrastructure (1 fichier)
- [x] `webServer.integration.test.ts` - Tests serveur web

## Tests d'Intégration à Créer 📋

### 1. Tests API/Routes (9 tests)
- [ ] `api.integration.test.ts` - Tests routes API REST de base
- [ ] `api.streaming.integration.test.ts` - Tests SSE et streaming responses
- [ ] `api.rate.limiting.integration.test.ts` - Tests rate limiting et throttling
- [ ] `api.cors.integration.test.ts` - Tests CORS et requêtes cross-origin
- [ ] `api.middleware.chain.integration.test.ts` - Tests pipeline middleware
- [ ] `api.error.handling.integration.test.ts` - Tests gestion erreurs API
- [ ] `api.session.persistence.integration.test.ts` - Tests persistence session
- [ ] `api.leaderboard.integration.test.ts` - Tests statistiques leaderboard
- [ ] `api.admin.integration.test.ts` - Tests endpoints administratifs

### 2. Tests LLM Providers Avancés (13 tests)
- [x] `llm.qwen.integration.test.ts` - Tests intégration Qwen basique
- [x] `llm.gemini.advanced.integration.test.ts` - Tests Gemini avancés, rate limiting
- [x] `llm.huggingface.integration.test.ts` - Tests Hugging Face endpoints
- [ ] `llm.openrouter.integration.test.ts` - Tests OpenRouter proxy
- [ ] `llm.multi-provider.integration.test.ts` - Tests basculement providers
- [ ] `llm.provider.failover.integration.test.ts` - Tests failover hiérarchique
- [ ] `llm.provider.concurrent.integration.test.ts` - Tests requêtes concurrentes
- [ ] `llm.provider.load.balancing.integration.test.ts` - Tests load balancing
- [ ] `llm.provider.circuit.breaker.integration.test.ts` - Tests circuit breaker

### 3. Tests Tools Integration Avancés (17 tests)
- [ ] `tools.fs.integration.test.ts` - Tests outils filesystem basiques
- [ ] `tools.code.integration.test.ts` - Tests exécution code basique
- [ ] `tools.search.integration.test.ts` - Tests recherche basique
- [ ] `tools.ai.integration.test.ts` - Tests outils IA basiques
- [ ] `tools.system.integration.test.ts` - Tests outils système basiques
- [ ] `tools.browser.integration.test.ts` - Tests automatisation browser
- [ ] `tools.canvas.integration.test.ts` - Tests affichage canvas
- [ ] `tools.file.permissions.integration.test.ts` - Tests permissions fichiers
- [ ] `tools.shell.security.integration.test.ts` - Tests sécurité shell
- [ ] `tools.search.api.integration.test.ts` - Tests APIs recherche externes
- [ ] `tools.web.navigation.integration.test.ts` - Tests navigation web
- [ ] `tools.async.helper.integration.test.ts` - Tests exécution async
- [ ] `tools.generated.integration.test.ts` - Tests génération dynamique
- [ ] `tools.quality.gate.integration.test.ts` - Tests validation qualité
- [ ] `tools.webhook.integration.test.ts` - Tests traitement webhooks
- [ ] `tools.docker.integration.test.ts` - Tests exécution Docker
- [ ] `tools.mcp.integration.test.ts` - Tests protocole MCP

### 4. Tests Infrastructure Avancés (15 tests)
- [ ] `database.integration.test.ts` - Tests base de données basiques
- [ ] `cache.integration.test.ts` - Tests cache basique
- [ ] `queue.advanced.integration.test.ts` - Tests queue avancés basiques
- [ ] `postgres.advanced.integration.test.ts` - Tests PostgreSQL avancés
- [ ] `redis.cluster.integration.test.ts` - Tests clustering Redis
- [ ] `otel.tracing.integration.test.ts` - Tests tracing OpenTelemetry
- [ ] `otel.metrics.integration.test.ts` - Tests métriques OpenTelemetry
- [ ] `prometheus.integration.test.ts` - Tests métriques Prometheus
- [ ] `nginx.reverse.proxy.integration.test.ts` - Tests reverse proxy Nginx
- [ ] `container.orchestration.integration.test.ts` - Tests orchestration containers
- [ ] `volume.persistence.integration.test.ts` - Tests persistence volumes
- [ ] `network.isolation.integration.test.ts` - Tests isolation réseau
- [ ] `healthcheck.cascade.integration.test.ts` - Tests health checks cascades
- [ ] `backup.restore.integration.test.ts` - Tests sauvegarde/restauration
- [ ] `migration.integration.test.ts` - Tests migrations données

### 5. Tests Workflows Complets (8 tests)
- [ ] `workflow.agent-creation.integration.test.ts` - Tests création agent
- [ ] `workflow.task-execution.integration.test.ts` - Tests exécution tâche
- [ ] `workflow.session-management.integration.test.ts` - Tests gestion session
- [ ] `workflow.multi.agent.integration.test.ts` - Tests multi-agents
- [ ] `workflow.task.delegation.integration.test.ts` - Tests délégation tâches
- [ ] `workflow.error.recovery.integration.test.ts` - Tests récupération erreurs
- [ ] `workflow.user.journey.integration.test.ts` - Tests parcours utilisateur
- [ ] `workflow.batch.processing.integration.test.ts` - Tests traitement batch

### 6. Tests Sécurité Avancés (12 tests)
- [ ] `security.auth.integration.test.ts` - Tests authentification basique
- [ ] `security.sandbox.integration.test.ts` - Tests sandbox basique
- [ ] `auth.jwt.lifecycle.integration.test.ts` - Tests lifecycle JWT
- [ ] `auth.session.hijacking.integration.test.ts` - Tests sécurité session
- [ ] `auth.api.key.rotation.integration.test.ts` - Tests rotation clés API
- [ ] `auth.oauth.state.machine.integration.test.ts` - Tests machine état OAuth
- [ ] `security.input.validation.integration.test.ts` - Tests validation entrées
- [ ] `security.xss.prevention.integration.test.ts` - Tests prévention XSS
- [ ] `security.csrf.protection.integration.test.ts` - Tests protection CSRF
- [ ] `security.sql.injection.integration.test.ts` - Tests prévention injection SQL
- [ ] `security.access.control.integration.test.ts` - Tests contrôle accès
- [ ] `security.audit.logging.integration.test.ts` - Tests logging audit

### 7. Tests UI/Frontend Avancés (12 tests)
- [ ] `ui.agent-interaction.integration.test.ts` - Tests interaction UI basique
- [ ] `ui.websocket.realtime.integration.test.ts` - Tests WebSocket temps réel
- [ ] `ui.store.persistence.integration.test.ts` - Tests persistence état frontend
- [ ] `ui.responsive.layout.integration.test.ts` - Tests design responsive
- [ ] `ui.theme.switching.integration.test.ts` - Tests changement thème
- [ ] `ui.language.switching.integration.test.ts` - Tests multi-langue
- [ ] `ui.drag.drop.integration.test.ts` - Tests drag & drop panneaux
- [ ] `ui.toast.notification.integration.test.ts` - Tests notifications toast
- [ ] `ui.modal.management.integration.test.ts` - Tests gestion modals
- [ ] `ui.keyboard.shortcuts.integration.test.ts` - Tests raccourcis clavier
- [ ] `ui.accessibility.integration.test.ts` - Tests accessibilité
- [ ] `ui.component.lazy.loading.integration.test.ts` - Tests lazy loading

### 8. Tests Performance & Monitoring (11 tests)
- [ ] `monitoring.metrics.integration.test.ts` - Tests métriques basiques
- [ ] `performance.load.integration.test.ts` - Tests charge basiques
- [ ] `performance.concurrent.users.integration.test.ts` - Tests utilisateurs concurrents
- [ ] `performance.memory.pressure.integration.test.ts` - Tests pression mémoire
- [ ] `performance.database.connection.pool.integration.test.ts` - Tests pool connexions
- [ ] `performance.caching.strategy.integration.test.ts` - Tests stratégies cache
- [ ] `performance.resource.cleanup.integration.test.ts` - Tests nettoyage ressources
- [ ] `performance.startup.time.integration.test.ts` - Tests temps démarrage
- [ ] `performance.garbage.collection.integration.test.ts` - Tests garbage collection
- [ ] `monitoring.alerting.integration.test.ts` - Tests système alerting
- [ ] `monitoring.dashboard.integration.test.ts` - Tests dashboards

### 9. Tests Worker & Queue Avancés (10 tests)
- [ ] `worker.job.priority.integration.test.ts` - Tests priorité jobs
- [ ] `worker.concurrent.processing.integration.test.ts` - Tests traitement concurrent
- [ ] `worker.memory.management.integration.test.ts` - Tests gestion mémoire
- [ ] `worker.detached.commands.integration.test.ts` - Tests commandes détachées
- [ ] `worker.job.failure.recovery.integration.test.ts` - Tests récupération échecs
- [ ] `worker.scaling.integration.test.ts` - Tests scaling workers
- [ ] `worker.job.scheduling.integration.test.ts` - Tests planification jobs
- [ ] `worker.distributed.processing.integration.test.ts` - Tests traitement distribué
- [ ] `worker.resource.limits.integration.test.ts` - Tests limites ressources
- [ ] `worker.graceful.shutdown.integration.test.ts` - Tests arrêt gracieux

### 10. Tests Configuration & Environment (10 tests)
- [ ] `config.environment.integration.test.ts` - Tests configuration basique
- [ ] `deployment.docker.integration.test.ts` - Tests Docker basique
- [ ] `config.hot.reload.integration.test.ts` - Tests rechargement config
- [ ] `config.validation.integration.test.ts` - Tests validation schéma
- [ ] `config.environment.switching.integration.test.ts` - Tests changement env
- [ ] `config.secrets.management.integration.test.ts` - Tests gestion secrets
- [ ] `config.feature.flags.integration.test.ts` - Tests feature flags
- [ ] `deployment.kubernetes.integration.test.ts` - Tests déploiement Kubernetes
- [ ] `deployment.scaling.integration.test.ts` - Tests scaling horizontal
- [ ] `deployment.rollback.integration.test.ts` - Tests rollback déploiement

### 11. Tests External APIs & Integration (8 tests)
- [ ] `external.webhooks.integration.test.ts` - Tests webhooks basiques
- [ ] `external.oauth.integration.test.ts` - Tests OAuth basiques
- [ ] `external.api.rate.limiting.integration.test.ts` - Tests rate limiting APIs externes
- [ ] `external.api.retry.logic.integration.test.ts` - Tests logique retry
- [ ] `external.api.circuit.breaker.integration.test.ts` - Tests circuit breaker
- [ ] `external.payment.integration.test.ts` - Tests intégration paiement
- [ ] `external.email.integration.test.ts` - Tests envoi emails
- [ ] `external.sms.integration.test.ts` - Tests envoi SMS

### 12. Tests Error Handling & Logging (8 tests)
- [ ] `error.propagation.integration.test.ts` - Tests propagation erreurs
- [ ] `logging.structured.integration.test.ts` - Tests logging structuré
- [ ] `error.recovery.integration.test.ts` - Tests récupération automatique
- [ ] `logging.performance.integration.test.ts` - Tests impact performance logging
- [ ] `error.correlation.integration.test.ts` - Tests corrélation erreurs
- [ ] `logging.aggregation.integration.test.ts` - Tests agrégation logs
- [ ] `error.notification.integration.test.ts` - Tests notifications erreurs
- [ ] `logging.retention.integration.test.ts` - Tests rétention logs

### 13. Tests Business Logic & Domain (6 tests)
- [ ] `business.user.onboarding.integration.test.ts` - Tests onboarding utilisateur
- [ ] `business.subscription.integration.test.ts` - Tests gestion abonnements
- [ ] `business.billing.integration.test.ts` - Tests facturation
- [ ] `business.analytics.integration.test.ts` - Tests analytics métier
- [ ] `business.compliance.integration.test.ts` - Tests conformité
- [ ] `business.data.export.integration.test.ts` - Tests export données

## Priorités de Développement

### Phase 1 - Infrastructure Critique (Semaines 1-3)
**Priorité 1 - Fondations**
1. `[x]` `postgres.advanced.integration.test.ts` - Base données avancée
2. `[x]` `redis.cluster.integration.test.ts` - Clustering Redis
3. `[x]` `api.streaming.integration.test.ts` - Streaming API
4. `[x]` `auth.jwt.lifecycle.integration.test.ts` - Authentification JWT
5. `[x]` `security.input.validation.integration.test.ts` - Validation sécurisée
4. `auth.jwt.lifecycle.integration.test.ts` - Authentification JWT
5. `security.input.validation.integration.test.ts` - Validation sécurisée

**Priorité 2 - Core Services**
**Priorité 2 - Core Services**
6. `[x]` `worker.concurrent.processing.integration.test.ts` - Workers concurrents
7. `[x]` `llm.provider.failover.integration.test.ts` - Failover LLM
8. `[x]` `otel.tracing.integration.test.ts` - Tracing distribué
9. `[⏳]` `tools.browser.integration.test.ts` - Automatisation browser
7. `llm.provider.failover.integration.test.ts` - Failover LLM
8. `otel.tracing.integration.test.ts` - Tracing distribué
9. `tools.browser.integration.test.ts` - Automatisation browser
10. `ui.websocket.realtime.integration.test.ts` - WebSocket temps réel

### Phase 2 - Fonctionnalités Avancées (Semaines 4-6)
**Priorité 3 - Performance**
11. `performance.concurrent.users.integration.test.ts` - Charge utilisateurs
12. `performance.memory.pressure.integration.test.ts` - Pression mémoire
13. `worker.scaling.integration.test.ts` - Scaling workers
14. `api.rate.limiting.integration.test.ts` - Rate limiting API
15. `cache.integration.test.ts` - Stratégies cache

**Priorité 4 - Sécurité Avancée**
16. `security.xss.prevention.integration.test.ts` - Prévention XSS
17. `security.csrf.protection.integration.test.ts` - Protection CSRF
18. `auth.session.hijacking.integration.test.ts` - Sécurité sessions
19. `tools.shell.security.integration.test.ts` - Sécurité shell
20. `security.access.control.integration.test.ts` - Contrôle accès

### Phase 3 - Écosystème Complet (Semaines 7-10)
**Priorité 5 - Intégrations Externes**
21. `external.api.circuit.breaker.integration.test.ts` - Circuit breaker
22. `llm.openai.integration.test.ts` - OpenAI avancé
23. `tools.canvas.integration.test.ts` - Canvas avancé
24. `workflow.multi.agent.integration.test.ts` - Multi-agents
25. `config.hot.reload.integration.test.ts` - Config dynamique

**Priorité 6 - Expérience Utilisateur**
26. `ui.theme.switching.integration.test.ts` - Thèmes dynamiques
27. `ui.accessibility.integration.test.ts` - Accessibilité
28. `business.user.onboarding.integration.test.ts` - Onboarding
29. `monitoring.alerting.integration.test.ts` - Système alerting
30. `deployment.kubernetes.integration.test.ts` - Déploiement K8s

### Phase 4 - Optimisation & Robustesse (Semaines 11+)
**Priorité 7 - Providers LLM**
- Tests providers spécifiques (Mistral, Hugging Face, etc.)
- Tests load balancing avancé
- Tests circuit breakers providers

**Priorité 8 - Outils Spécialisés**
- Tests outils génération dynamique
- Tests MCP protocol
- Tests Docker execution
- Tests webhooks avancés

**Priorité 9 - Déploiement & Ops**
- Tests scaling horizontal
- Tests rollback automatique
- Tests backup/restore
- Tests migrations

**Priorité 10 - Business Logic**
- Tests métier complets
- Tests compliance
- Tests analytics
- Tests facturation
