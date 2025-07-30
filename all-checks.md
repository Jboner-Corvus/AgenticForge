# TODO List: Résoudre les erreurs de vérification

Ce document liste les problèmes identifiés par nos vérifications (TypeCheck, Lint, Test).

La correction de chaque erreur doit se faire **uniquement en modifiant le code source** 

Les tests doivent etre unitaires.

Il est interdit d'exécuter des commandes bash..

Il est interdit de lancer une vérification.

Une fois la correction effectué, cochez la case `[x]`.

---

## Erreurs à corriger

1. [ ] **TypeCheck (Core):** `src/server-start.ts(37,5): error TS2304: Cannot find name 'logger'.`

2. [ ] **TypeCheck (Core):** `src/server-start.ts(42,5): error TS2304: Cannot find name 'logger'.`

3. [ ] **TypeCheck (Core):** `src/server-start.ts(49,5): error TS2304: Cannot find name 'logger'.`

4. [ ] **TypeCheck (Core):** `src/tools/generated/testTool.tool.ts(4,42): error TS2322: Type 'string' is not assignable to type 'ZodTypeAny'.`

5. [ ] **TypeCheck (Core):** `src/tools/generated/testTool.tool.ts(6,28): error TS2304: Cannot find name 'Tool'.`

6. [ ] **TypeCheck (Core):** `src/tools/generated/testTool.tool.ts(8,19): error TS7006: Parameter 'args' implicitly has an 'any' type.`

7. [ ] **TypeCheck (Core):** `src/tools/generated/testTool.tool.ts(8,30): error TS2304: Cannot find name 'Ctx'.`

8. [ ] **TypeCheck (Core):** `src/tools/generated/testTool.tool.ts(9,12): error TS7006: Parameter 'args' implicitly has an 'any' type.`

9. [ ] **TypeCheck (Core):** `src/tools/generated/testTool.tool.ts(9,18): error TS7006: Parameter 'ctx' implicitly has an 'any' type.`

10. [ ] **TypeCheck (Core):** `src/webServer.test.ts(80,32): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'Procedure | undefined'.`

11. [ ] **TypeCheck (Core):** `vitest.config.ts(12,5): error TS2769: No overload matches this call.`

12. [ ] **Lint:** `packages/core lint:   8:19  error  'args' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars`

13. [ ] **Lint:** `packages/core lint:   8:25  error  'ctx' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars`

14. [ ] **Lint:** `packages/core lint:   9:5   error  Expected an assignment or function call and instead saw an expression   @typescript-eslint/no-unused-expressions`

15. [ ] **Lint:** `packages/core lint:   9:12  error  'args' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars`

16. [ ] **Lint:** `packages/core lint:   9:18  error  'ctx' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars`

17. [ ] **Lint:** `packages/core lint: ✖ 5 problems (5 errors, 0 warnings)`

18. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer
Error: [vitest] No "getLoggerInstance" export is defined on the "./logger.js" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("./logger.js"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ watchConfig src/webServer.ts:725:3
    723|     '../../.env',
    724|   );
    725|   getLoggerInstance().info(
       |   ^
    726|     `[watchConfig] Watching for .env changes in: ${envPath}`,
    727|   );
 ❯ initializeWebServer src/webServer.ts:48:5
 ❯ src/webServer.test.ts:91:29

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/18]⎯

```

19. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts [ src/worker.test.ts ]
Error: [vitest] There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://vitest.dev/api/vi.html#vi-mock
 ❯ src/worker.test.ts:51:1
     49| });
     50| 
     51| import { config } from './config';
       | ^
     52| import { getLogger } from './logger';
     53| import { Agent } from './modules/agent/agent';

Caused by: Error: [vitest] There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://vitest.dev/api/vi.html#vi-mock
 ❯ src/modules/llm/LlmKeyManager.ts:2:31

Caused by: TypeError: getConfig is not a function
 ❯ getRedisClient src/modules/redis/redisClient.ts:9:20
 ❯ src/modules/redis/redisClient.ts:29:28
 ❯ src/worker.test.ts:7:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/18]⎯

```

20. [ ] **Test Failure:**
```text
 FAIL  src/modules/redis/redisClient.test.ts [ src/modules/redis/redisClient.test.ts ]
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("../../config"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ getRedisClient src/modules/redis/redisClient.ts:9:20
      7| function getRedisClient(): Redis {
      8|   if (!redisInstance) {
      9|     const config = getConfig();
       |                    ^
     10|     const redisHost = config.REDIS_HOST;
     11|     const redisUrl = `redis://${redisHost}:${config.REDIS_PORT}`;
 ❯ src/modules/redis/redisClient.ts:29:28
 ❯ src/modules/redis/redisClient.test.ts:3:1

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/18]⎯

```

21. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/code/executeShellCommand.tool.test.ts [ src/modules/tools/definitions/code/executeShellCommand.tool.test.ts ]
Error: Cannot find package '@/utils/shellUtils.js' imported from '/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/tools/definitions/code/executeShellCommand.tool.test.ts'
 ❯ src/modules/tools/definitions/code/executeShellCommand.tool.test.ts:5:1
      3| 
      4| import { Ctx } from '@/types';
      5| import * as shellUtils from '@/utils/shellUtils.js';
       | ^
      6| 
      7| import { executeShellCommandTool } from './executeShellCommand.tool'; …

Caused by: Error: Failed to load url @/utils/shellUtils.js (resolved id: @/utils/shellUtils.js) in /home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/tools/definitions/code/executeShellCommand.tool.test.ts. Does the file exist?
 ❯ loadAndTransform ../../node_modules/.pnpm/vite@5.4.19_@types+node@24.1.0/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:51968:17

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/18]⎯


⎯⎯⎯⎯⎯⎯ Failed Tests 14 ⎯⎯⎯⎯⎯⎯⎯

```

22. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/18]⎯

```

23. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/18]⎯

```

24. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/18]⎯

```

25. [ ] **Test Failure:**
```text
 FAIL  src/modules/queue/queue.test.ts > Queue Initialization and Error Handling > should log an error when jobQueue emits an error
AssertionError: expected "spy" to be called with arguments: [ { …(1) }, 'Job queue error' ]

Number of calls: 0

 ❯ src/modules/queue/queue.test.ts:50:39
     48|     const testError = new Error('Job queue test error');
     49|     jobQueue.emit('error', testError);
     50|     expect(getLoggerInstance().error).toHaveBeenCalledWith(
       |                                       ^
     51|       { err: testError },
     52|       'Job queue error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/18]⎯

```

26. [ ] **Test Failure:**
```text
 FAIL  src/modules/queue/queue.test.ts > Queue Initialization and Error Handling > should log an error when deadLetterQueue emits an error
AssertionError: expected "spy" to be called with arguments: [ { …(1) }, 'Dead-letter queue error' ]

Number of calls: 0

 ❯ src/modules/queue/queue.test.ts:59:39
     57|     const testError = new Error('Dead-letter queue test error');
     58|     deadLetterQueue.emit('error', testError);
     59|     expect(getLoggerInstance().error).toHaveBeenCalledWith(
       |                                       ^
     60|       { err: testError },
     61|       'Dead-letter queue error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/18]⎯

```

27. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/fs/writeFile.tool.test.ts > writeFileTool > should return an error if file writing fails
TypeError: [Function LOG] is not a spy or a call to a spy!
 ❯ src/modules/tools/definitions/fs/writeFile.tool.test.ts:120:31
    118|       throw new Error('Expected an object with an erreur property.');
    119|     }
    120|     expect(getLogger().error).toHaveBeenCalled();
       |                               ^
    121|   });
    122| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/18]⎯

```

28. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/search/webSearch.tool.test.ts > webSearchTool > should perform a web search and return a summary
AssertionError: expected "spy" to be called with arguments: [ Array(1) ]

Number of calls: 0

 ❯ src/modules/tools/definitions/search/webSearch.tool.test.ts:67:38
     65|     const result = await webSearchTool.execute({ query }, mockCtx);
     66| 
     67|     expect(getLoggerInstance().info).toHaveBeenCalledWith(
       |                                      ^
     68|       `Performing web search for: "${query}"`,
     69|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/18]⎯

```

29. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/search/webSearch.tool.test.ts > webSearchTool > should return an error message if fetch request fails
AssertionError: expected "spy" to be called at least once
 ❯ src/modules/tools/definitions/search/webSearch.tool.test.ts:110:39
    108|       erreur: 'DuckDuckGo API request failed: API error',
    109|     });
    110|     expect(getLoggerInstance().error).toHaveBeenCalled();
       |                                       ^
    111|   });
    112| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/18]⎯

```

30. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/search/webSearch.tool.test.ts > webSearchTool > should return an error message if the fetch call throws an exception
AssertionError: expected "spy" to be called at least once
 ❯ src/modules/tools/definitions/search/webSearch.tool.test.ts:123:39
    121|       erreur: `An unexpected error occurred: ${errorMessage}`,
    122|     });
    123|     expect(getLoggerInstance().error).toHaveBeenCalled();
       |                                       ^
    124|   });
    125| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/18]⎯

```

31. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/agentResponse.tool.test.ts > agentResponseTool > should return the response string
AssertionError: expected "spy" to be called with arguments: [ 'Responding to user', …(1) ]

Number of calls: 0

 ❯ src/modules/tools/definitions/system/agentResponse.tool.test.ts:34:38
     32|     const result = await agentResponseTool.execute({ response }, mockC…
     33|     expect(result).toBe(response);
     34|     expect(getLoggerInstance().info).toHaveBeenCalledWith(
       |                                      ^
     35|       'Responding to user',
     36|       {

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/18]⎯

```

32. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/createTool.tool.test.ts > createToolTool > should create a new tool file and pass quality gates
AssertionError: expected "spy" to be called with arguments: [ …(2) ]

Number of calls: 0

 ❯ src/modules/tools/definitions/system/createTool.tool.test.ts:62:21
     60|     const result = await createToolTool.execute(args, mockCtx);
     61| 
     62|     expect(warnSpy).toHaveBeenCalledWith('AGENT IS CREATING A NEW TOOL…
       |                     ^
     63|       tool: 'test-tool',
     64|     });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/18]⎯

```

33. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/finish.tool.test.ts > finishTool > should throw a FinishToolSignal with the final response when called with an object
AssertionError: expected "spy" to be called with arguments: [ 'Goal accomplished: Goal achieved!' ]

Number of calls: 0

 ❯ src/modules/tools/definitions/system/finish.tool.test.ts:79:46
     77|       new FinishToolSignal(response),
     78|     );
     79|     expect(getLoggerInstance().info as Mock).toHaveBeenCalledWith(
       |                                              ^
     80|       `Goal accomplished: ${response}`,
     81|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/18]⎯

```

34. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/finish.tool.test.ts > finishTool > should throw a FinishToolSignal with the final response when called with a string
AssertionError: expected "spy" to be called with arguments: [ Array(1) ]

Number of calls: 0

 ❯ src/modules/tools/definitions/system/finish.tool.test.ts:89:46
     87|       new FinishToolSignal(response),
     88|     );
     89|     expect(getLoggerInstance().info as Mock).toHaveBeenCalledWith(
       |                                              ^
     90|       `Goal accomplished: ${response}`,
     91|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/18]⎯

```

35. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/listTools.tool.test.ts > listToolsTool > should return an error if getAllTools fails
AssertionError: expected "spy" to be called at least once
 ❯ src/modules/tools/definitions/system/listTools.tool.test.ts:105:39
    103|       expect.fail('Expected an error object');
    104|     }
    105|     expect(getLoggerInstance().error).toHaveBeenCalled();
       |                                       ^
    106|   });
    107| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/18]⎯
```

---

✗ 3 type(s) de vérification ont échoué : TypeCheck Core Lint Tests.
Veuillez consulter le fichier all-checks.md pour les 35 erreur(s) détaillée(s).

