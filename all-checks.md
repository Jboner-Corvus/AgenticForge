# TODO List: Résoudre les erreurs de vérification

Ce document liste les problèmes identifiés par nos vérifications (TypeCheck, Lint, Test).

La correction de chaque erreur doit se faire **uniquement en modifiant le code source** 

Il est interdit d'exécuter des commandes bash..
Il est interdit de lancer une vérification.

Une fois la correction effectué, cochez la case `[x]`.

---

## Erreurs à corriger

1. [ ] **TypeCheck (Core):** `src/modules/tools/definitions/system/agentResponse.tool.test.ts(17,10): error TS2304: Cannot find name 'getLogger'.`

2. [ ] **TypeCheck (Core):** `src/modules/tools/definitions/system/agentResponse.tool.test.ts(28,12): error TS2304: Cannot find name 'loggerMock'.`

3. [ ] **TypeCheck (Core):** `src/modules/tools/definitions/system/listTools.tool.test.ts(37,10): error TS2304: Cannot find name 'getLogger'.`

4. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(533,9): error TS2353: Object literal may only specify known properties, and 'apiKey' does not exist in type 'LlmApiKey'.`

5. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(838,9): error TS2353: Object literal may only specify known properties, and 'apiKey' does not exist in type 'LlmApiKey'.`

6. [ ] **TypeCheck (Core):** `src/webServer.test.ts(105,39): error TS2304: Cannot find name 'config'.`

7. [ ] **TypeCheck (Core):** `src/webServer.test.ts(114,39): error TS2304: Cannot find name 'config'.`

8. [ ] **TypeCheck (Core):** `src/webServer.test.ts(135,39): error TS2304: Cannot find name 'config'.`

9. [ ] **TypeCheck (Core):** `src/webServer.test.ts(147,39): error TS2304: Cannot find name 'config'.`

10. [ ] **Lint:** `packages/core lint:   24:10  error  'initializeWebServer' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

11. [ ] **Lint:** `packages/core lint:   65:13  error  'config' is assigned a value but never used. Allowed unused vars must match /^_/u      @typescript-eslint/no-unused-vars`

12. [ ] **Lint:** `packages/core lint: ✖ 2 problems (2 errors, 0 warnings)`

13. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer
Error: [vitest] No "default" export is defined on the "chokidar" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("chokidar", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ watchConfig src/webServer.ts:712:19
    710|   getLogger().info(`[watchConfig] Watching for .env changes in: ${envP…
    711| 
    712|   configWatcher = chokidar.watch(envPath, {
       |                   ^
    713|     ignoreInitial: true,
    714|     persistent: true,
 ❯ initializeWebServer src/webServer.ts:49:5
 ❯ src/webServer.test.ts:67:29

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/33]⎯

```

14. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer
TypeError: Cannot read properties of undefined (reading 'close')
 ❯ src/webServer.test.ts:78:14
     76|   afterAll(async () => {
     77|     await new Promise<void>((resolve, reject) => {
     78|       server.close((err) => {
       |              ^
     79|         if (err) {
     80|           return reject(err);
 ❯ src/webServer.test.ts:77:11

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/33]⎯

```

15. [ ] **Test Failure:**
```text
 FAIL  src/utils/errorUtils.test.ts [ src/utils/errorUtils.test.ts ]
```

16. [ ] **Test Failure:**
```text
 FAIL  src/utils/validationUtils.test.ts [ src/utils/validationUtils.test.ts ]
```

17. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/toolRegistry.test.ts [ src/modules/tools/toolRegistry.test.ts ]
```

18. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/fs/editFile.tool.test.ts [ src/modules/tools/definitions/fs/editFile.tool.test.ts ]
```

19. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/fs/listDirectory.tool.test.ts [ src/modules/tools/definitions/fs/listDirectory.tool.test.ts ]
```

20. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/fs/readFile.tool.test.ts [ src/modules/tools/definitions/fs/readFile.tool.test.ts ]
TypeError: Cannot read properties of undefined (reading 'REDIS_HOST')
 ❯ src/modules/redis/redisClient.ts:19:26
     17| // Si le worker est local (pas dans Docker), il doit utiliser 'localho…
     18| // Si le worker est dans Docker, il doit utiliser le nom de service 'r…
     19| const redisHost = config.REDIS_HOST;
       |                          ^
     20| const redisUrl = `redis://${redisHost}:${config.REDIS_PORT}`;
     21| 
 ❯ src/modules/llm/LlmKeyManager.ts:2:31

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/33]⎯

```

21. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/agentResponse.tool.test.ts [ src/modules/tools/definitions/system/agentResponse.tool.test.ts ]
ReferenceError: getLogger is not defined
 ❯ src/modules/tools/definitions/system/agentResponse.tool.test.ts:17:10
     15|   const mockCtx: Ctx = {
     16|     llm: {} as ILlmProvider,
     17|     log: getLogger(),
       |          ^
     18|     reportProgress: vi.fn(),
     19|     session: {} as SessionData,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/33]⎯

```

22. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/listTools.tool.test.ts [ src/modules/tools/definitions/system/listTools.tool.test.ts ]
ReferenceError: getLogger is not defined
 ❯ src/modules/tools/definitions/system/listTools.tool.test.ts:37:10
     35|   const mockCtx: Ctx = {
     36|     llm: {} as ILlmProvider,
     37|     log: getLogger(),
       |          ^
     38|     reportProgress: vi.fn(),
     39|     session: {} as SessionData,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/33]⎯

⎯⎯⎯⎯⎯⎯ Failed Tests 23 ⎯⎯⎯⎯⎯⎯⎯

```

23. [ ] **Test Failure:**
```text
 FAIL  src/logger.test.ts > Logger > should instantiate a pino logger with debug level
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining {"level": "debug"} ]

Received: 



Number of calls: 0

 ❯ src/logger.test.ts:50:22
     48|     // Re-import logger.js to ensure it picks up the mock
     49|     await import('./logger.ts');
     50|     expect(pinoMock).toHaveBeenCalledWith(
       |                      ^
     51|       expect.objectContaining({
     52|         level: 'debug',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/33]⎯

```

24. [ ] **Test Failure:**
```text
 FAIL  src/logger.test.ts > Logger > should set the log level based on LOG_LEVEL environment variable
AssertionError: expected undefined to be 'warn' // Object.is equality

- Expected: 
"warn"

+ Received: 
undefined

 ❯ src/logger.test.ts:71:34
     69|     vi.resetModules();
     70|     const { getLogger: newGetLogger } = await import('./logger.ts');
     71|     expect(newGetLogger().level).toBe('warn');
       |                                  ^
     72|     delete process.env.LOG_LEVEL;
     73|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/33]⎯

```

25. [ ] **Test Failure:**
```text
 FAIL  src/logger.test.ts > Logger > should configure pino-pretty transport in development environment
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…} ]

Received: 



Number of calls: 0

 ❯ src/logger.test.ts:89:22
     87|     await import('./logger.ts');
     88| 
     89|     expect(pinoMock).toHaveBeenCalledWith(
       |                      ^
     90|       expect.objectContaining({
     91|         level: 'debug',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/33]⎯

```

26. [ ] **Test Failure:**
```text
 FAIL  src/logger.test.ts > Logger > should not configure pino-pretty transport in non-development environment
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining {"level": "debug"} ]

Received: 



Number of calls: 0

 ❯ src/logger.test.ts:120:22
    118|     await import('./logger.ts');
    119| 
    120|     expect(pinoMock).toHaveBeenCalledWith(
       |                      ^
    121|       expect.objectContaining({
    122|         level: 'debug',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/33]⎯

```

27. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should process a job successfully and return the final response
AssertionError: expected "Agent" to be called with arguments: [ { …(3) }, …(5) ]

Received: 

  1st Agent call:

  Array [
    Object {
      "data": Object {
        "sessionId": "testSessionId",
      },
      "id": "testJobId",
      "name": "testJob",
    },
    Object {
      "history": Array [
        Object {
          "content": "Summarized conversation",
          "id": "72388a21-7c54-4150-88a9-94fab47ebc1c",
          "timestamp": 1753846241322,
          "type": "agent_response",
        },
      ],
    },
    Object {
      "add": [Function spy],
    },
    Array [],
-   "gemini",
+   undefined,
    Object {
      "getSession": [Function spy],
      "saveSession": [Function spy],
    },
+   undefined,
+   undefined,
+   undefined,
  ]


Number of calls: 1

 ❯ src/worker.test.ts:142:19
    140|       'testSessionId',
    141|     );
    142|     expect(Agent).toHaveBeenCalledWith(
       |                   ^
    143|       mockJob,
    144|       mockSessionData,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/33]⎯

```

28. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should handle AppError and publish an error event
AssertionError: expected "spy" to be called with arguments: [ Any<Object>, …(1) ]

Received: 



Number of calls: 0

 ❯ src/worker.test.ts:190:41
    188|       sessionId: 'testSessionId',
    189|     });
    190|     expect(getLogger().child({}).error).toHaveBeenCalledWith(
       |                                         ^
    191|       expect.any(Object),
    192|       `Erreur dans l'exécution de l'agent`,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/33]⎯

```

29. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should discover and load tool files correctly
Error: [vitest] No "getLogger" export is defined on the "../logger" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../logger", async (importOriginal) => {
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
 ❯ src/utils/toolLoader.test.ts:87:25

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/33]⎯

```

30. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should handle errors during file loading gracefully
Error: [vitest] No "getLogger" export is defined on the "../logger" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../logger", async (importOriginal) => {
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
 ❯ src/utils/toolLoader.test.ts:139:25

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/33]⎯

```

31. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should not register invalid tools
Error: [vitest] No "getLogger" export is defined on the "../logger" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../logger", async (importOriginal) => {
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
 ❯ src/utils/toolLoader.test.ts:161:25

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/33]⎯

```

32. [ ] **Test Failure:**
```text
 FAIL  src/modules/queue/queue.test.ts > Queue Initialization and Error Handling > should log an error when jobQueue emits an error
AssertionError: expected "spy" to be called with arguments: [ { …(1) }, 'Job queue error' ]

Received: 



Number of calls: 0

 ❯ src/modules/queue/queue.test.ts:52:31
     50|     const testError = new Error('Job queue test error');
     51|     jobQueue.emit('error', testError);
     52|     expect(getLogger().error).toHaveBeenCalledWith(
       |                               ^
     53|       { err: testError },
     54|       'Job queue error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/33]⎯

```

33. [ ] **Test Failure:**
```text
 FAIL  src/modules/queue/queue.test.ts > Queue Initialization and Error Handling > should log an error when deadLetterQueue emits an error
AssertionError: expected "spy" to be called with arguments: [ { …(1) }, 'Dead-letter queue error' ]

Received: 



Number of calls: 0

 ❯ src/modules/queue/queue.test.ts:61:31
     59|     const testError = new Error('Dead-letter queue test error');
     60|     deadLetterQueue.emit('error', testError);
     61|     expect(getLogger().error).toHaveBeenCalledWith(
       |                               ^
     62|       { err: testError },
     63|       'Dead-letter queue error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/33]⎯

```

34. [ ] **Test Failure:**
```text
 FAIL  src/modules/session/sessionManager.test.ts > SessionManager > should create a new session if one does not exist in the database
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.getSession src/modules/session/sessionManager.ts:182:7
 ❯ src/modules/session/sessionManager.test.ts:68:21

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/33]⎯

```

35. [ ] **Test Failure:**
```text
 FAIL  src/modules/session/sessionManager.test.ts > SessionManager > should load an existing session from the database
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.getSession src/modules/session/sessionManager.ts:204:5
 ❯ src/modules/session/sessionManager.test.ts:87:21

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/33]⎯

```

36. [ ] **Test Failure:**
```text
 FAIL  src/modules/session/sessionManager.test.ts > SessionManager > should save a session to the database
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.saveSession src/modules/session/sessionManager.ts:260:7
 ❯ src/modules/session/sessionManager.test.ts:106:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/33]⎯

```

37. [ ] **Test Failure:**
```text
 FAIL  src/modules/session/sessionManager.test.ts > SessionManager > should summarize history if it exceeds HISTORY_MAX_LENGTH
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.saveSession src/modules/session/sessionManager.ts:260:7
 ❯ src/modules/session/sessionManager.test.ts:139:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[20/33]⎯

```

38. [ ] **Test Failure:**
```text
 FAIL  src/modules/session/sessionManager.test.ts > SessionManager > should delete a session from the database
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.deleteSession src/modules/session/sessionManager.ts:124:5
 ❯ src/modules/session/sessionManager.test.ts:151:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[21/33]⎯

```

39. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/search/webSearch.tool.test.ts > webSearchTool > should perform a web search and return a summary
```

40. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/search/webSearch.tool.test.ts > webSearchTool > should return a message if no direct answer is found
```

41. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/search/webSearch.tool.test.ts > webSearchTool > should return an error message if fetch request fails
```

42. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/search/webSearch.tool.test.ts > webSearchTool > should return an error message if the fetch call throws an exception
TypeError: getLogger is not a function
 ❯ src/modules/tools/definitions/search/webSearch.tool.test.ts:30:12
     28|       },
     29|       llm: {} as ILlmProvider,
     30|       log: getLogger(),
       |            ^
     31|       reportProgress: vi.fn(),
     32|       session: {} as SessionData,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/33]⎯

```

43. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/system/finish.tool.test.ts > finishTool > should return an error message if args are invalid
AssertionError: expected [Function] to throw error including 'An unexpected error occurred in finis…' but got 'Invalid arguments provided to finishT…'

- Expected
+ Received

- An unexpected error occurred in finishTool: Invalid arguments provided to finishTool. A final answer is required.
+ Invalid arguments provided to finishTool. A final answer is required.

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[23/33]⎯

```

44. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/web/browser.tool.test.ts > browserTool > should navigate to a URL and return its content
AssertionError: expected "spy" to be called with arguments: [ Array(1) ]

Received: 



Number of calls: 0

 ❯ src/modules/tools/definitions/web/browser.tool.test.ts:82:29
     80|     expect(chromium.launch).toHaveBeenCalled();
     81|     expect(result).toEqual({ content: 'Mocked page content', url });
     82|     expect(loggerMock.info).toHaveBeenCalledWith(`Navigating to URL: $…
       |                             ^
     83|   });
     84| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[24/33]⎯

```

45. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/web/browser.tool.test.ts > browserTool > should return an error if navigation fails
AssertionError: expected "spy" to be called at least once
 ❯ src/modules/tools/definitions/web/browser.tool.test.ts:100:30
     98|         : result,
     99|     ).toContain(`Error while Browse ${url}: ${errorMessage}`);
    100|     expect(loggerMock.error).toHaveBeenCalled();
       |                              ^
    101|     expect(mockPage.goto).toHaveBeenCalledWith(url, expect.any(Object)…
    102|     expect(mockPage.close).toHaveBeenCalled();

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[25/33]⎯

```

46. [ ] **Test Failure:**
```text
⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯

Vitest caught 6 unhandled errors during the test run.
This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.

```

47. [ ] **Test Failure:**
```text
⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ VitestMocker.createError ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:79:19
 ❯ Object.get ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:153:22
 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:276:5

This error originated in "src/modules/session/sessionManager.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.

```

48. [ ] **Test Failure:**
```text
⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ VitestMocker.createError ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:79:19
 ❯ Object.get ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:153:22
 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:276:5

This error originated in "src/modules/session/sessionManager.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.

```

49. [ ] **Test Failure:**
```text
⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ VitestMocker.createError ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:79:19
 ❯ Object.get ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:153:22
 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:276:5

This error originated in "src/modules/session/sessionManager.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.

```

50. [ ] **Test Failure:**
```text
⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ VitestMocker.createError ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:79:19
 ❯ Object.get ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:153:22
 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:276:5

This error originated in "src/modules/session/sessionManager.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.

```

51. [ ] **Test Failure:**
```text
⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ VitestMocker.createError ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:79:19
 ❯ Object.get ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:153:22
 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:276:5

This error originated in "src/modules/session/sessionManager.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.

```

52. [ ] **Test Failure:**
```text
⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
Error: [vitest] No "getConfig" export is defined on the "../../config" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ VitestMocker.createError ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:79:19
 ❯ Object.get ../../node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:153:22
 ❯ Module.getLogger src/logger.ts:10:20
      8| export function getLogger(): Logger {
      9|   if (!loggerInstance) {
     10|     const config = getConfig();
       |                    ^
     11|     loggerInstance = pino({
     12|       level: config.LOG_LEVEL || 'debug',
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:276:5

This error originated in "src/modules/session/sessionManager.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
```

---

✗ 4 type(s) de vérification ont échoué : TypeCheck UI TypeCheck Core Lint Tests.
Veuillez consulter le fichier all-checks.md pour les 52 erreur(s) détaillée(s).

