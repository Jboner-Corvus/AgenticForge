# TODO List: Résoudre les erreurs de vérification

Ce document liste les problèmes identifiés par nos vérifications (TypeCheck, Lint, Test).

La correction de chaque erreur doit se faire **uniquement en modifiant le code source** 

Les tests doivent etre unitaires.

Il est interdit d'exécuter des commandes bash..

Il est interdit de lancer une vérification.

Une fois la correction effectué, cochez la case `[x]`.

---

## Erreurs à corriger

1. [ ] **TypeCheck (Core):** `src/modules/tools/definitions/system/listTools.tool.test.ts(86,1): error TS1005: '}' expected.`

2. [ ] **Lint:** `packages/core lint:   86:0  error  Parsing error: '}' expected`

3. [ ] **Lint:** `packages/core lint:   8:19  error  'args' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars`

4. [ ] **Lint:** `packages/core lint:   8:25  error  'ctx' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars`

5. [ ] **Lint:** `packages/core lint:   9:5   error  Expected an assignment or function call and instead saw an expression   @typescript-eslint/no-unused-expressions`

6. [ ] **Lint:** `packages/core lint:   9:12  error  'args' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars`

7. [ ] **Lint:** `packages/core lint:   9:18  error  'ctx' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars`

8. [ ] **Lint:** `packages/core lint:   10:10  error  'mockLogger' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

9. [ ] **Lint:** `packages/core lint:   51:10  error  'getConfig' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

10. [ ] **Lint:** `packages/core lint: ✖ 8 problems (8 errors, 0 warnings)`

11. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer
Error: Server is not running.
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/11]⎯

```

12. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts [ src/worker.test.ts ]
Error: [vitest] There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://vitest.dev/api/vi.html#vi-mock
 ❯ src/worker.test.ts:52:1
     50| 
     51| import { getConfig } from './config';
     52| import { getLogger } from './logger';
       | ^
     53| import { Agent } from './modules/agent/agent';
     54| import * as _redis from './modules/redis/redisClient';

Caused by: Error: [vitest] There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://vitest.dev/api/vi.html#vi-mock
 ❯ src/logger.ts:2:31

Caused by: Error: [vitest] There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://vitest.dev/api/vi.html#vi-mock
 ❯ src/modules/llm/LlmKeyManager.ts:2:31

Caused by: TypeError: getConfig is not a function
 ❯ getRedisClient src/modules/redis/redisClient.ts:9:20
 ❯ src/modules/redis/redisClient.ts:29:28
 ❯ src/worker.test.ts:7:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/11]⎯

```

13. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/code/executeShellCommand.tool.test.ts [ src/modules/tools/definitions/code/executeShellCommand.tool.test.ts ]
Error: Cannot find module '../../../utils/shellUtils.js' imported from '/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/tools/definitions/code/executeShellCommand.tool.test.ts'
 ❯ src/modules/tools/definitions/code/executeShellCommand.tool.test.ts:6:1
      4| import { Ctx } from '@/types';
      5| 
      6| import * as shellUtils from '../../../utils/shellUtils.js';
       | ^
      7| import { executeShellCommandTool } from './executeShellCommand.tool'; …
      8| 

Caused by: Error: Failed to load url ../../../utils/shellUtils.js (resolved id: ../../../utils/shellUtils.js) in /home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/tools/definitions/code/executeShellCommand.tool.test.ts. Does the file exist?
 ❯ loadAndTransform ../../node_modules/.pnpm/vite@5.4.19_@types+node@24.1.0/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:51968:17

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/11]⎯

```

14. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/listTools.tool.test.ts [ src/modules/tools/definitions/system/listTools.tool.test.ts ]
Error: Transform failed with 1 error:
/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/tools/definitions/system/listTools.tool.test.ts:86:0: ERROR: Unexpected end of file
  Plugin: vite:esbuild
  File: /home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/tools/definitions/system/listTools.tool.test.ts:86:0
  
  Unexpected end of file
  84 |      vi.spyOn(mockLoggerInstance, 'error');
  85 |    });
  86 |  
     |  ^
  
 ❯ failureErrorWithLog ../../node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.js:1472:15
 ❯ ../../node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.js:755:50
 ❯ responseCallbacks.<computed> ../../node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.js:622:9
 ❯ handleIncomingPacket ../../node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.js:677:12
 ❯ Socket.readFromStdout ../../node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.js:600:7

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/11]⎯


⎯⎯⎯⎯⎯⎯⎯ Failed Tests 7 ⎯⎯⎯⎯⎯⎯⎯

```

15. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should discover and load tool files correctly
Error: [vitest] No "getLogger" export is defined on the "../logger" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("../logger"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.getToolsDir src/utils/toolLoader.ts:96:3
     94| // Fonction pour obtenir dynamiquement le répertoire des outils
     95| export function getToolsDir(): string {
     96|   getLogger().debug(`[getToolsDir] Running in dist: ${runningInDist}`);
       |   ^
     97|   getLogger().debug(`[getToolsDir] __dirname: ${__dirname}`);
     98|   const toolsPath =
 ❯ src/utils/toolLoader.test.ts:93:25

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/11]⎯

```

16. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should handle errors during file loading gracefully
Error: [vitest] No "getLogger" export is defined on the "../logger" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("../logger"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.getToolsDir src/utils/toolLoader.ts:96:3
     94| // Fonction pour obtenir dynamiquement le répertoire des outils
     95| export function getToolsDir(): string {
     96|   getLogger().debug(`[getToolsDir] Running in dist: ${runningInDist}`);
       |   ^
     97|   getLogger().debug(`[getToolsDir] __dirname: ${__dirname}`);
     98|   const toolsPath =
 ❯ src/utils/toolLoader.test.ts:145:25

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/11]⎯

```

17. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should not register invalid tools
Error: [vitest] No "getLogger" export is defined on the "../logger" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("../logger"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.getToolsDir src/utils/toolLoader.ts:96:3
     94| // Fonction pour obtenir dynamiquement le répertoire des outils
     95| export function getToolsDir(): string {
     96|   getLogger().debug(`[getToolsDir] Running in dist: ${runningInDist}`);
       |   ^
     97|   getLogger().debug(`[getToolsDir] __dirname: ${__dirname}`);
     98|   const toolsPath =
 ❯ src/utils/toolLoader.test.ts:167:25

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/11]⎯

```

18. [ ] **Test Failure:**
```text
 FAIL  src/modules/queue/queue.test.ts > Queue Initialization and Error Handling > should log an error when jobQueue emits an error
AssertionError: expected "spy" to be called with arguments: [ { …(1) }, 'Job queue error' ]

Number of calls: 0

 ❯ src/modules/queue/queue.test.ts:56:38
     54|     const testError = new Error('Job queue test error');
     55|     jobQueue.emit('error', testError);
     56|     expect(mockLoggerInstance.error).toHaveBeenCalledWith(
       |                                      ^
     57|       { err: testError },
     58|       'Job queue error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/11]⎯

```

19. [ ] **Test Failure:**
```text
 FAIL  src/modules/queue/queue.test.ts > Queue Initialization and Error Handling > should log an error when deadLetterQueue emits an error
AssertionError: expected "spy" to be called with arguments: [ { …(1) }, 'Dead-letter queue error' ]

Number of calls: 0

 ❯ src/modules/queue/queue.test.ts:65:38
     63|     const testError = new Error('Dead-letter queue test error');
     64|     deadLetterQueue.emit('error', testError);
     65|     expect(mockLoggerInstance.error).toHaveBeenCalledWith(
       |                                      ^
     66|       { err: testError },
     67|       'Dead-letter queue error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/11]⎯

```

20. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/fs/writeFile.tool.test.ts > writeFileTool > should return an error if file writing fails
AssertionError: expected "spy" to be called at least once
 ❯ src/modules/tools/definitions/fs/writeFile.tool.test.ts:130:39
    128|       throw new Error('Expected an object with an erreur property.');
    129|     }
    130|     expect(getLoggerInstance().error).toHaveBeenCalled();
       |                                       ^
    131|   });
    132| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/11]⎯

```

21. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/createTool.tool.test.ts > createToolTool > should create a new tool file and pass quality gates
ReferenceError: createToolTool is not defined
 ❯ src/modules/tools/definitions/system/createTool.tool.test.ts:47:20
     45|     const warnSpy = vi.spyOn(mockLoggerInstance, 'warn');
     46| 
     47|     const result = await createToolTool.execute(args, mockCtx);
       |                    ^
     48| 
     49|     expect(warnSpy).toHaveBeenCalledWith('AGENT IS CREATING A NEW TOOL…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/11]⎯
```

---

✗ 3 type(s) de vérification ont échoué : TypeCheck Core Lint Tests.
Veuillez consulter le fichier all-checks.md pour les 21 erreur(s) détaillée(s).

