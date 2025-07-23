# TODO List: Résoudre les erreurs de vérification

Ce document liste les problèmes identifiés par nos vérifications automatisées (TypeCheck, Lint, Test).

La correction de chaque erreur doit se faire **uniquement en modifiant le code source** ; il est interdit d'exécuter des commandes bash.
Il est interdit de lancer une vérification.

Une fois la correction effectué, cochez la case `[x]`.

---

## Erreurs à corriger

1. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should handle /api/chat/stream/:jobId correctly
Error: Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
```

---

✗ 4 type(s) de vérification ont échoué : TypeCheck UI TypeCheck Core Lint Tests.
Veuillez consulter le fichier all-checks.md pour les 1 erreur(s) détaillée(s).

