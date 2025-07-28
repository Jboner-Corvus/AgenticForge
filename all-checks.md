# TODO List: Résoudre les erreurs de vérification

Ce document liste les problèmes identifiés par nos vérifications (TypeCheck, Lint, Test).

La correction de chaque erreur doit se faire **uniquement en modifiant le code source** 

Il est interdit d'exécuter des commandes bash..
Il est interdit de lancer une vérification.

Une fois la correction effectué, cochez la case `[x]`.

---

## Erreurs à corriger

1. [x] **Test Failure:**
```text
 FAIL  src/worker.test.ts [ src/worker.test.ts ]
Error: ENOENT: no such file or directory, open '/usr/src/app/packages/core/dist/modules/agent/system.prompt.md'
 ❯ Proxy.readFileSync node:fs:435:20
 ❯ src/modules/agent/orchestrator.prompt.ts:43:26
     41| // --- END DEBUG LOGS ---
     42| 
     43| const PREAMBLE_CONTENT = readFileSync(promptFilePath, 'utf-8').replace(
       |                          ^
     44|   /`/g,
     45|   '`',
 ❯ src/modules/agent/agent.ts:7:31

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { errno: -2, code: 'ENOENT', syscall: 'open', path: '/usr/src/app/packages/core/dist/modules/agent/system.prompt.md' }
```

2. [x] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts [ src/modules/agent/agent.test.ts ]
Error: ENOENT: no such file or directory, open '/usr/src/app/packages/core/dist/modules/agent/system.prompt.md'
 ❯ Proxy.readFileSync node:fs:435:20
 ❯ src/modules/agent/orchestrator.prompt.ts:43:26
     41| // --- END DEBUG LOGS ---
     42| 
     43| const PREAMBLE_CONTENT = readFileSync(promptFilePath, 'utf-8').replace(
       |                          ^
     44|   /`/g,
     45|   '`',
 ❯ src/modules/agent/agent.ts:7:31

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { errno: -2, code: 'ENOENT', syscall: 'open', path: '/usr/src/app/packages/core/dist/modules/agent/system.prompt.md' }
```

3. [x] **Test Failure:**
```text
 FAIL  src/modules/agent/orchestrator.prompt.test.ts [ src/modules/agent/orchestrator.prompt.test.ts ]
Error: ENOENT: no such file or directory, open '/usr/src/app/packages/core/dist/modules/agent/system.prompt.md'
 ❯ Proxy.readFileSync node:fs:435:20
 ❯ src/modules/agent/orchestrator.prompt.ts:43:26
     41| // --- END DEBUG LOGS ---
     42| 
     43| const PREAMBLE_CONTENT = readFileSync(promptFilePath, 'utf-8').replace(
       |                          ^
     44|   /`/g,
     45|   '`',
 ❯ src/modules/agent/orchestrator.prompt.test.ts:6:31

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { errno: -2, code: 'ENOENT', syscall: 'open', path: '/usr/src/app/packages/core/dist/modules/agent/system.prompt.md' }
```

4. [x] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should handle /api/chat/stream/:jobId correctly
Error: Test timed out in 10000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
```

---

✗ 1 type(s) de vérification ont échoué : Tests.
Veuillez consulter le fichier all-checks.md pour les 4 erreur(s) détaillée(s).

