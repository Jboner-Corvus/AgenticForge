# TODO List: Résoudre les erreurs de vérification

Ce document liste les problèmes identifiés par nos vérifications (TypeCheck, Lint, Test).

La correction de chaque erreur doit se faire **uniquement en modifiant le code source** 

Il est interdit d'exécuter des commandes bash..
Il est interdit de lancer une vérification.

Une fois la correction effectué, cochez la case `[x]`.

---

## Erreurs à corriger

1. [ ] **TypeCheck (Core):** `src/modules/agent/agent.ts(115,35): error TS2322: Type 'unknown' is not assignable to type 'string'.`

2. [ ] **TypeCheck (Core):** `src/modules/session/sessionManager.ts(231,41): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.`

3. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(81,17): error TS2554: Expected 3 arguments, but got 2.`

4. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(82,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

5. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(294,17): error TS2554: Expected 3 arguments, but got 2.`

6. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(295,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

7. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(479,17): error TS2554: Expected 3 arguments, but got 2.`

8. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(480,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

9. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(597,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

10. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(613,17): error TS2554: Expected 3 arguments, but got 2.`

11. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(647,17): error TS2554: Expected 3 arguments, but got 2.`

12. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(675,17): error TS2554: Expected 3 arguments, but got 2.`

13. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(711,17): error TS2554: Expected 3 arguments, but got 2.`

14. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(748,17): error TS2554: Expected 3 arguments, but got 2.`

15. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(766,17): error TS2554: Expected 3 arguments, but got 2.`

16. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(789,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

17. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(798,18): error TS2554: Expected 3 arguments, but got 2.`

18. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(816,17): error TS2554: Expected 3 arguments, but got 2.`

19. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(817,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

20. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(847,17): error TS2554: Expected 3 arguments, but got 2.`

21. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(848,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

22. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(895,17): error TS2554: Expected 3 arguments, but got 2.`

23. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(896,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

24. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(945,17): error TS2554: Expected 3 arguments, but got 2.`

25. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(946,5): error TS2322: Type 'MockInstance<[msg: string, ...args: any[]], void>' is not assignable to type 'MockInstance<unknown[], unknown>'.`

26. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(993,17): error TS2554: Expected 3 arguments, but got 2.`

27. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(1053,17): error TS2554: Expected 3 arguments, but got 2.`

28. [ ] **TypeCheck (Core):** `src/worker.ts(19,13): error TS2552: Cannot find name 'Client'. Did you mean 'PgClient'?`

29. [ ] **Lint:** `packages/core lint:   4:10  error  'redis' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

30. [ ] **Lint:** `packages/core lint:   1:10  error  'afterEach' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

31. [ ] **Lint:** `packages/core lint:   6:10  error  'redis' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

32. [ ] **Lint:** `packages/core lint:   7:10  error  'AppError' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

33. [ ] **Lint:** `packages/core lint:   13:10  error  'LlmKeyManager' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

34. [ ] **Lint:** `packages/core lint:   14:10  error  'redis' is defined but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars`

35. [ ] **Lint:** `packages/core lint:   193:21  error  Unnecessary escape character: \/  no-useless-escape`

36. [ ] **Lint:** `packages/core lint:    40:12  error  'job' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

37. [ ] **Lint:** `packages/core lint:    40:22  error  'tools' is defined but never used. Allowed unused args must match /^_/u              @typescript-eslint/no-unused-vars`

38. [ ] **Lint:** `packages/core lint:    40:34  error  'jobQueue' is defined but never used. Allowed unused args must match /^_/u           @typescript-eslint/no-unused-vars`

39. [ ] **Lint:** `packages/core lint:    40:49  error  'ctx' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

40. [ ] **Lint:** `packages/core lint:    53:21  error  'obj' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

41. [ ] **Lint:** `packages/core lint:    53:34  error  'msg' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

42. [ ] **Lint:** `packages/core lint:   173:14  error  'job' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

43. [ ] **Lint:** `packages/core lint:   203:14  error  'job' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

44. [ ] **Lint:** `packages/core lint:   204:9   error  Unnecessary try/catch wrapper                                                        no-useless-catch`

45. [ ] **Lint:** `packages/core lint:   289:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

46. [ ] **Lint:** `packages/core lint:   474:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

47. [ ] **Lint:** `packages/core lint:   811:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

48. [ ] **Lint:** `packages/core lint:   842:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

49. [ ] **Lint:** `packages/core lint:   890:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

50. [ ] **Lint:** `packages/core lint:   940:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

51. [ ] **Lint:** `packages/core lint: ✖ 22 problems (22 errors, 0 warnings)`

52. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should log an error if redis.incrby fails for tokensSaved
Error: Redis incrby failed
 ❯ src/webServer.integration.test.ts:197:7
    195|   it('should log an error if redis.incrby fails for tokensSaved', asyn…
    196|     vi.spyOn(redis, 'incrby').mockRejectedValue(
    197|       new Error('Redis incrby failed'),
       |       ^
    198|     );
    199|     const errorSpy = vi.spyOn(logger, 'error');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/89]⎯

```

53. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should log an error if redis.incr fails for successfulRuns
Error: Redis incr failed
 ❯ src/webServer.integration.test.ts:265:47
    263| 
    264|   it('should log an error if redis.incr fails for successfulRuns', asy…
    265|     vi.spyOn(redis, 'incr').mockRejectedValue(new Error('Redis incr fa…
       |                                               ^
    266|     const errorSpy = vi.spyOn(logger, 'error');
    267| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/89]⎯

```

54. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should save a session
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.integration.test.ts:311:28
    309|       .set('Authorization', 'Bearer test-api-key')
    310|       .send(sessionData);
    311|     expect(res.statusCode).toEqual(200);
       |                            ^
    312|     expect(res.body.message).toEqual('Session saved successfully.');
    313|     expect(redis.set).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/89]⎯

```

55. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should log an error if redis.set fails for session save
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]

Received: 

  1st spy call:

  Array [
-   ObjectContaining {
-     "err": Any<Error>,
+   Object {
+     "error": [TypeError: Cannot read properties of undefined (reading 'query')],
    },
-   "Error caught by error handling middleware",
+   "Error saving session",
  ]

  2nd spy call:

  Array [
-   ObjectContaining {
-     "err": Any<Error>,
+   Object {
+     "err": Object {
+       "message": "Cannot read properties of undefined (reading 'query')",
+       "name": "TypeError",
+       "stack": "TypeError: Cannot read properties of undefined (reading 'query')
+     at SessionManager.saveSession (/home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/modules/session/sessionManager.ts:222:27)
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.ts:355:35
+     at Layer.handleRequest (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)
+     at next (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:157:13)
+     at Route.dispatch (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:117:3)
+     at handle (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:435:11)
+     at Layer.handleRequest (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:295:15
+     at processParams (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)
+     at next (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)",
+     },
+     "method": "POST",
+     "url": "/api/sessions/save",
    },
    "Error caught by error handling middleware",
  ]


Number of calls: 2

 ❯ src/webServer.integration.test.ts:336:22
    334|       .send(sessionData);
    335| 
    336|     expect(errorSpy).toHaveBeenCalledWith(
       |                      ^
    337|       expect.objectContaining({ err: expect.any(Error) }),
    338|       'Error caught by error handling middleware',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/89]⎯

```

56. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should load a session
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.integration.test.ts:354:28
    352|       .get(`/api/sessions/${sessionData.id}`)
    353|       .set('Authorization', 'Bearer test-api-key');
    354|     expect(res.statusCode).toEqual(200);
       |                            ^
    355|     expect(res.body).toEqual(sessionData);
    356|     expect(redis.get).toHaveBeenCalledWith(`session:${sessionData.id}:…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/89]⎯

```

57. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should log an error if redis.get fails for session load
AssertionError: expected 'Cannot read properties of undefined (…' to contain 'Redis get failed'

- Expected
+ Received

- Redis get failed
+ Cannot read properties of undefined (reading 'query')

 ❯ src/webServer.integration.test.ts:369:36
    367| 
    368|     expect(res.statusCode).toEqual(500);
    369|     expect(res.body.error.message).toContain('Redis get failed');
       |                                    ^
    370|     expect(errorSpy).toHaveBeenCalledWith(
    371|       expect.objectContaining({ err: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/89]⎯

```

58. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should return 404 if session not found on load
AssertionError: expected 500 to deeply equal 404

- Expected
+ Received

- 404
+ 500

 ❯ src/webServer.integration.test.ts:382:28
    380|       .get('/api/sessions/non-existent-id')
    381|       .set('Authorization', 'Bearer test-api-key');
    382|     expect(res.statusCode).toEqual(404);
       |                            ^
    383|     expect(res.body.error.message).toEqual('Session not found');
    384|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/89]⎯

```

59. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should delete a session
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.integration.test.ts:393:28
    391|       .delete(`/api/sessions/${sessionId}`)
    392|       .set('Authorization', 'Bearer test-api-key');
    393|     expect(res.statusCode).toEqual(200);
       |                            ^
    394|     expect(res.body.message).toEqual('Session deleted successfully.');
    395|     expect(redis.del).toHaveBeenCalledWith(`session:${sessionId}:data`…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/89]⎯

```

60. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should log an error if redis.del fails for session delete
AssertionError: expected 'Cannot read properties of undefined (…' to contain 'Redis del failed'

- Expected
+ Received

- Redis del failed
+ Cannot read properties of undefined (reading 'query')

 ❯ src/webServer.integration.test.ts:408:36
    406| 
    407|     expect(res.statusCode).toEqual(500);
    408|     expect(res.body.error.message).toContain('Redis del failed');
       |                                    ^
    409|     expect(errorSpy).toHaveBeenCalledWith(
    410|       expect.objectContaining({ err: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/89]⎯

```

61. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should rename a session
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.integration.test.ts:431:28
    429|       .set('Authorization', 'Bearer test-api-key')
    430|       .send({ newName });
    431|     expect(res.statusCode).toEqual(200);
       |                            ^
    432|     expect(res.body.message).toEqual('Session renamed successfully.');
    433|     expect(redis.set).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/89]⎯

```

62. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should log an error if redis.get fails during session rename
AssertionError: expected 'Cannot read properties of undefined (…' to contain 'Redis get failed during rename'

- Expected
+ Received

- Redis get failed during rename
+ Cannot read properties of undefined (reading 'query')

 ❯ src/webServer.integration.test.ts:453:36
    451| 
    452|     expect(res.statusCode).toEqual(500);
    453|     expect(res.body.error.message).toContain('Redis get failed during …
       |                                    ^
    454|     expect(errorSpy).toHaveBeenCalledWith(
    455|       expect.objectContaining({ err: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/89]⎯

```

63. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should return 404 if session not found on rename
AssertionError: expected 500 to deeply equal 404

- Expected
+ Received

- 404
+ 500

 ❯ src/webServer.integration.test.ts:467:28
    465|       .set('Authorization', 'Bearer test-api-key')
    466|       .send({ newName: 'New Name' });
    467|     expect(res.statusCode).toEqual(404);
       |                            ^
    468|     expect(res.body.error.message).toEqual('Session not found');
    469|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/89]⎯

```

64. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should return 500 if LlmKeyManager.addKey throws an error
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]

Received: 

  1st spy call:

  Array [
-   ObjectContaining {
-     "_error": Any<Error>,
+   Object {
+     "err": Object {
+       "message": "Failed to add key",
+       "name": "Error",
+       "stack": "Error: Failed to add key
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.integration.test.ts:499:7
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
+     at runTest (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17)
+     at processTicksAndRejections (node:internal/process/task_queues:105:5)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runFiles (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:958:5)
+     at startTests (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:967:3)
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7",
+     },
+     "method": "POST",
+     "url": "/api/llm-api-keys",
    },
-   "Error adding LLM API key",
+   "Error caught by error handling middleware",
  ]


Number of calls: 1

 ❯ src/webServer.integration.test.ts:511:22
    509|     expect(res.statusCode).toEqual(500);
    510|     expect(res.body.error.message).toContain('Failed to add key');
    511|     expect(errorSpy).toHaveBeenCalledWith(
       |                      ^
    512|       expect.objectContaining({ _error: expect.any(Error) }),
    513|       'Error adding LLM API key',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/89]⎯

```

65. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should return 500 if LlmKeyManager.getKeysForApi throws an error
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]

Received: 

  1st spy call:

  Array [
-   ObjectContaining {
-     "_error": Any<Error>,
+   Object {
+     "err": Object {
+       "message": "Failed to retrieve keys",
+       "name": "Error",
+       "stack": "Error: Failed to retrieve keys
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.integration.test.ts:534:7
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
+     at runTest (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17)
+     at processTicksAndRejections (node:internal/process/task_queues:105:5)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runFiles (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:958:5)
+     at startTests (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:967:3)
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7",
+     },
+     "method": "GET",
+     "url": "/api/llm-api-keys",
    },
-   "Error retrieving LLM API keys",
+   "Error caught by error handling middleware",
  ]


Number of calls: 1

 ❯ src/webServer.integration.test.ts:543:22
    541|     expect(res.statusCode).toEqual(500);
    542|     expect(res.body.error.message).toContain('Failed to retrieve keys'…
    543|     expect(errorSpy).toHaveBeenCalledWith(
       |                      ^
    544|       expect.objectContaining({ _error: expect.any(Error) }),
    545|       'Error retrieving LLM API keys',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/89]⎯

```

66. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should return 500 if LlmKeyManager.removeKey throws an error
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]

Received: 

  1st spy call:

  Array [
-   ObjectContaining {
-     "_error": Any<Error>,
+   Object {
+     "err": Object {
+       "message": "Key not found",
+       "name": "Error",
+       "stack": "Error: Key not found
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.integration.test.ts:574:7
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
+     at runTest (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17)
+     at processTicksAndRejections (node:internal/process/task_queues:105:5)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runFiles (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:958:5)
+     at startTests (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:967:3)
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7",
+     },
+     "method": "DELETE",
+     "url": "/api/llm-api-keys/0",
    },
-   "Error removing LLM API key",
+   "Error caught by error handling middleware",
  ]


Number of calls: 1

 ❯ src/webServer.integration.test.ts:583:22
    581|     expect(res.statusCode).toEqual(500);
    582|     expect(res.body.error.message).toContain('Key not found');
    583|     expect(errorSpy).toHaveBeenCalledWith(
       |                      ^
    584|       expect.objectContaining({ _error: expect.any(Error) }),
    585|       'Error removing LLM API key',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/89]⎯

```

67. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should redirect to GitHub for OAuth initiation
AssertionError: expected 500 to deeply equal 302

- Expected
+ Received

- 302
+ 500

 ❯ src/webServer.integration.test.ts:618:28
    616|   it('should redirect to GitHub for OAuth initiation', async () => {
    617|     const res = await request(app).get('/api/auth/github');
    618|     expect(res.statusCode).toEqual(302);
       |                            ^
    619|     expect(res.headers.location).toContain(
    620|       'https://github.com/login/oauth/authorize',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/89]⎯

```

68. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should handle GitHub OAuth callback successfully
AssertionError: expected 400 to deeply equal 302

- Expected
+ Received

- 302
+ 400

 ❯ src/webServer.integration.test.ts:652:28
    650|       .get('/api/auth/github/callback?code=test_code')
    651|       .set('Cookie', 'agenticforge_session_id=test-session-id');
    652|     expect(res.statusCode).toEqual(302);
       |                            ^
    653|     expect(res.headers.location).toEqual('/?github_auth_success=true');
    654|     expect(redis.set).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/89]⎯

```

69. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should handle GitHub OAuth callback with error from GitHub
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]

Received: 

  1st spy call:

  Array [
-   ObjectContaining {
-     "_error": Any<Error>,
+   Object {
+     "err": Object {
+       "details": Object {
+         "statusCode": 400,
+       },
+       "message": "Missing code or GitHub credentials",
+       "name": "AppError",
+       "stack": "AppError: Missing code or GitHub credentials
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.ts:550:17
+     at Layer.handleRequest (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)
+     at next (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:157:13)
+     at Route.dispatch (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:117:3)
+     at handle (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:435:11)
+     at Layer.handleRequest (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:295:15
+     at processParams (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)
+     at next (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.ts:99:16",
      },
-   "GitHub OAuth callback error",
+     "method": "GET",
+     "url": "/api/auth/github/callback?code=bad_code",
+   },
+   "Error caught by error handling middleware",
  ]


Number of calls: 1

 ❯ src/webServer.integration.test.ts:692:22
    690|       'Missing code or GitHub credentials',
    691|     );
    692|     expect(errorSpy).toHaveBeenCalledWith(
       |                      ^
    693|       expect.objectContaining({ _error: expect.any(Error) }),
    694|       'GitHub OAuth callback error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/89]⎯

```

70. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should handle network errors during GitHub OAuth callback
AssertionError: expected 400 to deeply equal 500

- Expected
+ Received

- 500
+ 400

 ❯ src/webServer.integration.test.ts:721:28
    719|       '/api/auth/github/callback?code=test_code',
    720|     );
    721|     expect(res.statusCode).toEqual(500);
       |                            ^
    722|     expect(res.body.error.message).toContain('Network request failed');
    723|     expect(errorSpy).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/89]⎯

```

71. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should return 500 if GITHUB_CLIENT_ID is missing for OAuth initiation
AssertionError: expected undefined to deeply equal 'GitHub Client ID not configured.'

- Expected: 
"GitHub Client ID not configured."

+ Received: 
undefined

 ❯ src/webServer.integration.test.ts:752:36
    750|     const res = await request(app).get('/api/auth/github');
    751|     expect(res.statusCode).toEqual(500);
    752|     expect(res.body.error.message).toEqual('GitHub Client ID not confi…
       |                                    ^
    753|   });
    754| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[20/89]⎯

```

72. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should return 400 if GITHUB_CLIENT_SECRET is missing for OAuth callback
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]

Received: 



Number of calls: 0

 ❯ src/webServer.integration.test.ts:776:22
    774|       'Missing code or GitHub credentials',
    775|     );
    776|     expect(errorSpy).toHaveBeenCalledWith(
       |                      ^
    777|       expect.objectContaining({ _error: expect.any(Error) }),
    778|       'GitHub Client Secret not configured.',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[21/89]⎯

```

73. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Server Initialization > should handle initialization errors gracefully
AssertionError: promise resolved "[Function app]" instead of rejecting

- Expected: 
[Error: rejected promise]

+ Received: 
[Function app]

 ❯ src/webServer.integration.test.ts:798:68
    796| 
    797|     // We expect initializeWebServer to throw, so we wrap it in a try/…
    798|     await expect(initializeWebServer(redis as any, jobQueue as any)).r…
       |                                                                    ^
    799|       'Redis connection failed during initialization',
    800|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/89]⎯

```

74. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Chat API Backend > should return 500 if jobQueue.add fails
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]

Received: 

  1st spy call:

  Array [
-   ObjectContaining {
-     "_error": Any<Error>,
+   Object {
+     "err": Object {
+       "message": "Failed to add job to queue",
+       "name": "Error",
+       "stack": "Error: Failed to add job to queue
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.integration.test.ts:822:7
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
+     at runTest (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17)
+     at processTicksAndRejections (node:internal/process/task_queues:105:5)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runFiles (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:958:5)
+     at startTests (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:967:3)
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7",
+     },
+     "method": "POST",
+     "url": "/api/chat",
    },
-   "Error adding job to queue",
+   "Error caught by error handling middleware",
  ]


Number of calls: 1

 ❯ src/webServer.integration.test.ts:833:22
    831|     expect(res.statusCode).toEqual(500);
    832|     expect(res.body.error.message).toContain('Failed to add job to que…
    833|     expect(errorSpy).toHaveBeenCalledWith(
       |                      ^
    834|       expect.objectContaining({ _error: expect.any(Error) }),
    835|       'Error adding job to queue',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[23/89]⎯

```

75. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Job Management Backend > should return 500 if jobQueue.getJob fails in /api/interrupt
AssertionError: expected [] to include 'Failed to get job from queue'
 ❯ src/webServer.integration.test.ts:862:28
    860| 
    861|     expect(res.statusCode).toEqual(500);
    862|     expect(res.body.error).toContain('Failed to get job from queue');
       |                            ^
    863|     expect(errorSpy).toHaveBeenCalledWith(
    864|       expect.objectContaining({ _error: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[24/89]⎯

```

76. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Job Management Backend > should return 500 if jobQueue.getJob fails in /api/status
AssertionError: expected [] to include 'Failed to get job from queue'
 ❯ src/webServer.integration.test.ts:880:28
    878| 
    879|     expect(res.statusCode).toEqual(500);
    880|     expect(res.body.error).toContain('Failed to get job from queue');
       |                            ^
    881|     expect(errorSpy).toHaveBeenCalledWith(
    882|       expect.objectContaining({ _error: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[25/89]⎯

```

77. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Redis Publish Errors > should return 500 if redis.publish fails in /api/interrupt
AssertionError: expected [] to include 'Redis publish failed'
 ❯ src/webServer.integration.test.ts:911:28
    909| 
    910|     expect(res.statusCode).toEqual(500);
    911|     expect(res.body.error).toContain('Redis publish failed');
       |                            ^
    912|     expect(errorSpy).toHaveBeenCalledWith(
    913|       expect.objectContaining({ _error: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[26/89]⎯

```

78. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Redis Publish Errors > should return 500 if redis.publish fails in /api/display
AssertionError: expected [] to include 'Redis publish failed'
 ❯ src/webServer.integration.test.ts:930:28
    928| 
    929|     expect(res.statusCode).toEqual(500);
    930|     expect(res.body.error).toContain('Redis publish failed');
       |                            ^
    931|     expect(errorSpy).toHaveBeenCalledWith(
    932|       expect.objectContaining({ _error: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[27/89]⎯

```

79. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Memory API Backend > should return 500 if fs.promises.readdir fails
AssertionError: expected [] to include 'Failed to read directory'
 ❯ src/webServer.integration.test.ts:960:28
    958| 
    959|     expect(res.statusCode).toEqual(500);
    960|     expect(res.body.error).toContain('Failed to read directory');
       |                            ^
    961|     expect(errorSpy).toHaveBeenCalledWith(
    962|       expect.objectContaining({ _error: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[28/89]⎯

```

80. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Memory API Backend > should return 500 if fs.promises.readFile fails
AssertionError: expected [] to include 'Failed to read file'
 ❯ src/webServer.integration.test.ts:979:28
    977| 
    978|     expect(res.statusCode).toEqual(500);
    979|     expect(res.body.error).toContain('Failed to read file');
       |                            ^
    980|     expect(errorSpy).toHaveBeenCalledWith(
    981|       expect.objectContaining({ _error: expect.any(Error) }),

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[29/89]⎯

```

81. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Error Handling Middleware > should handle AppError and return custom status code and message
AssertionError: expected 500 to deeply equal 403

- Expected
+ Received

- 403
+ 500

 ❯ src/webServer.integration.test.ts:1005:28
    1003|       .set('Authorization', 'Bearer test-api-key');
    1004| 
    1005|     expect(res.statusCode).toEqual(403);
       |                            ^
    1006|     expect(res.body.error).toEqual('Custom App Error');
    1007|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[30/89]⎯

```

82. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Error Handling Middleware > should handle UserError and return custom status code and message
AssertionError: expected 500 to deeply equal 400

- Expected
+ Received

- 400
+ 500

 ❯ src/webServer.integration.test.ts:1018:28
    1016|       .set('Authorization', 'Bearer test-api-key');
    1017| 
    1018|     expect(res.statusCode).toEqual(400); // UserError defaults to 400
       |                            ^
    1019|     expect(res.body.error).toEqual('Custom User Error');
    1020|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[31/89]⎯

```

83. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Error Handling Middleware > should handle generic Error and return 500
AssertionError: expected undefined to deeply equal 'Generic Error Message'

- Expected: 
"Generic Error Message"

+ Received: 
undefined

 ❯ src/webServer.integration.test.ts:1032:28
    1030| 
    1031|     expect(res.statusCode).toEqual(500);
    1032|     expect(res.body.error).toEqual('Generic Error Message');
       |                            ^
    1033|   });
    1034| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[32/89]⎯

```

84. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should return 400 if prompt is missing in /api/chat
AssertionError: expected { …(4) } to deeply equal 'Le prompt est manquant.'

- Expected: 
"Le prompt est manquant."

+ Received: 
Object {
  "details": Object {
    "statusCode": 400,
  },
  "message": "Le prompt est manquant.",
  "name": "AppError",
  "stack": "AppError: Le prompt est manquant.
    at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.ts:142:17
    at Layer.handleRequest (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)
    at next (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:157:13)
    at Route.dispatch (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:117:3)
    at handle (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:435:11)
    at Layer.handleRequest (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)
    at /home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:295:15
    at processParams (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)
    at next (/home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)
    at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/webServer.ts:106:7",
}

 ❯ src/webServer.test.ts:103:28
    101|       .send({});
    102|     expect(res.statusCode).toEqual(400);
    103|     expect(res.body.error).toEqual('Le prompt est manquant.');
       |                            ^
    104|   });
    105| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[33/89]⎯

```

85. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should handle /api/chat/stream/:jobId correctly
TypeError: redis.duplicate.mockReturnValue is not a function
 ❯ src/webServer.test.ts:132:31
    130|       unsubscribe: vi.fn().mockResolvedValue(undefined),
    131|     };
    132|     (redis.duplicate as Mock).mockReturnValue(mockSubscriber);
       |                               ^
    133| 
    134|     const req = request(app)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[34/89]⎯

```

86. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should return 200 for /api/history
TypeError: redis.get.mockResolvedValue is not a function
 ❯ src/webServer.test.ts:180:25
    178| 
    179|   it('should return 200 for /api/history', async () => {
    180|     (redis.get as Mock).mockResolvedValue(
       |                         ^
    181|       JSON.stringify([{ content: 'test', role: 'user' }]),
    182|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[35/89]⎯

```

87. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should return 200 for /api/session
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:194:28
    192|       .post('/api/session')
    193|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    194|     expect(res.statusCode).toEqual(200);
       |                            ^
    195|     expect(res.body).toEqual({
    196|       message: 'Session gérée automatiquement via cookie.',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[36/89]⎯

```

88. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should return leaderboard stats for /api/leaderboard-stats
TypeError: redis.get.mockResolvedValueOnce is not a function
 ❯ src/webServer.test.ts:203:8
    201|   it('should return leaderboard stats for /api/leaderboard-stats', asy…
    202|     (redis.get as Mock)
    203|       .mockResolvedValueOnce('10') // sessionsCreated
       |        ^
    204|       .mockResolvedValueOnce('100') // tokensSaved
    205|       .mockResolvedValueOnce('5'); // successfulRuns

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[37/89]⎯

```

89. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should return memory contents for /api/memory
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:231:28
    229|       .get('/api/memory')
    230|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    231|     expect(res.statusCode).toEqual(200);
       |                            ^
    232|     expect(res.body).toEqual([
    233|       { content: 'content of file1', fileName: 'file1.txt' },

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[38/89]⎯

```

90. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should save a session via /api/sessions/save
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:249:28
    247|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
    248|       .send(sessionData);
    249|     expect(res.statusCode).toEqual(200);
       |                            ^
    250|     expect(res.body).toEqual({ message: 'Session saved successfully.' …
    251|     expect(redis.set).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[39/89]⎯

```

91. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should load a session via /api/sessions/:id
TypeError: redis.get.mockResolvedValue is not a function
 ❯ src/webServer.test.ts:264:25
    262|       timestamp: Date.now(),
    263|     };
    264|     (redis.get as Mock).mockResolvedValue(JSON.stringify(sessionData));
       |                         ^
    265|     const res = await request(app)
    266|       .get('/api/sessions/s1')

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[40/89]⎯

```

92. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should delete a session via /api/sessions/:id
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:276:28
    274|       .delete('/api/sessions/s1')
    275|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    276|     expect(res.statusCode).toEqual(200);
       |                            ^
    277|     expect(res.body).toEqual({ message: 'Session deleted successfully.…
    278|     expect(redis.del).toHaveBeenCalledWith('session:s1:data');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[41/89]⎯

```

93. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should rename a session via /api/sessions/:id/rename
TypeError: redis.get.mockResolvedValue is not a function
 ❯ src/webServer.test.ts:288:25
    286|       timestamp: Date.now(),
    287|     };
    288|     (redis.get as Mock).mockResolvedValue(JSON.stringify(sessionData));
       |                         ^
    289|     const res = await request(app)
    290|       .put('/api/sessions/s1/rename')

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[42/89]⎯

```

94. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should handle /api/interrupt/:jobId correctly
TypeError: [Function] is not a spy or a call to a spy!
 ❯ src/webServer.test.ts:338:27
    336|     expect(res.statusCode).toEqual(200);
    337|     expect(res.body).toEqual({ message: 'Interruption signal sent.' });
    338|     expect(redis.publish).toHaveBeenCalledWith(
       |                           ^
    339|       'job:mockJobId:interrupt',
    340|       'interrupt',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[43/89]⎯

```

95. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should handle /api/display correctly
TypeError: [Function] is not a spy or a call to a spy!
 ❯ src/webServer.test.ts:370:27
    368|     expect(res.statusCode).toEqual(200);
    369|     expect(res.body).toEqual({ message: 'Display event sent.' });
    370|     expect(redis.publish).toHaveBeenCalledWith(
       |                           ^
    371|       'job:display:events',
    372|       JSON.stringify({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[44/89]⎯

```

96. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should process a job successfully and return the final response
AssertionError: expected [ …(12) ] to deep equally contain { …(2) }

- Expected: 
Object {
  "content": "Agent final response",
  "role": "model",
}

+ Received: 
Array [
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "old message",
    "role": "user",
  },
  Object {
    "content": "Agent final response",
    "id": "682bfa16-a7a0-4f3f-ae86-15c993e2eae8",
    "timestamp": 1753366009799,
    "type": "agent_response",
  },
]

 ❯ src/worker.test.ts:120:37
    118|     );
    119|     expect((Agent as any).mock.results[0].value.run).toHaveBeenCalled(…
    120|     expect(mockSessionData.history).toContainEqual({
       |                                     ^
    121|       content: 'Agent final response',
    122|       role: 'model',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[45/89]⎯

```

97. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should handle AppError and publish an error event
AppError: This is an application error
 ❯ t.<anonymous> src/worker.test.ts:140:38
    138|     const errorMessage = 'This is an application error';
    139|     (Agent as any).mockImplementation(() => ({
    140|       run: vi.fn().mockRejectedValue(new AppError(errorMessage)),
       |                                      ^
    141|     }));
    142| 
 ❯ Module.processJob src/worker.ts:134:19
 ❯ src/worker.test.ts:143:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { details: undefined }
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[46/89]⎯

```

98. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should handle UserError and publish an error event
UserError: This is a user error
 ❯ t.<anonymous> src/worker.test.ts:171:38
    169|     const errorMessage = 'This is a user error';
    170|     (Agent as any).mockImplementation(() => ({
    171|       run: vi.fn().mockRejectedValue(new UserError(errorMessage)),
       |                                      ^
    172|     }));
    173| 
 ❯ Module.processJob src/worker.ts:134:19
 ❯ src/worker.test.ts:174:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { extras: undefined }
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[47/89]⎯

```

99. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should handle generic Error and publish an error event
Error: Something went wrong
 ❯ t.<anonymous> src/worker.test.ts:202:38
    200|     const errorMessage = 'Something went wrong';
    201|     (Agent as any).mockImplementation(() => ({
    202|       run: vi.fn().mockRejectedValue(new Error(errorMessage)),
       |                                      ^
    203|     }));
    204| 
 ❯ Module.processJob src/worker.ts:134:19
 ❯ src/worker.test.ts:205:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[48/89]⎯

```

100. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should handle "Quota exceeded" error specifically
Error: Quota exceeded
 ❯ t.<anonymous> src/worker.test.ts:233:38
    231|     const errorMessage = 'Quota exceeded';
    232|     (Agent as any).mockImplementation(() => ({
    233|       run: vi.fn().mockRejectedValue(new Error(errorMessage)),
       |                                      ^
    234|     }));
    235| 
 ❯ Module.processJob src/worker.ts:134:19
 ❯ src/worker.test.ts:236:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[49/89]⎯

```

101. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should handle "Gemini API request failed with status 500" error specifically
Error: Gemini API request failed with status 500
 ❯ t.<anonymous> src/worker.test.ts:259:38
    257|     const errorMessage = 'Gemini API request failed with status 500';
    258|     (Agent as any).mockImplementation(() => ({
    259|       run: vi.fn().mockRejectedValue(new Error(errorMessage)),
       |                                      ^
    260|     }));
    261| 
 ❯ Module.processJob src/worker.ts:134:19
 ❯ src/worker.test.ts:262:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[50/89]⎯

```

102. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should handle "is not found for API version v1" error specifically
Error: is not found for API version v1
 ❯ t.<anonymous> src/worker.test.ts:286:38
    284|     const errorMessage = 'is not found for API version v1';
    285|     (Agent as any).mockImplementation(() => ({
    286|       run: vi.fn().mockRejectedValue(new Error(errorMessage)),
       |                                      ^
    287|     }));
    288| 
 ❯ Module.processJob src/worker.ts:134:19
 ❯ src/worker.test.ts:289:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[51/89]⎯

```

103. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should handle unknown errors and publish a generic error event
Error: Unknown error type
 ❯ t.<anonymous> src/worker.test.ts:312:38
    310|   it('should handle unknown errors and publish a generic error event',…
    311|     (Agent as any).mockImplementation(() => ({
    312|       run: vi.fn().mockRejectedValue(new Error('Unknown error type')),
       |                                      ^
    313|     }));
    314| 
 ❯ Module.processJob src/worker.ts:134:19
 ❯ src/worker.test.ts:315:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[52/89]⎯

```

104. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should always publish a "close" event in the finally block
AssertionError: expected "spy" to be called with arguments: [ 'job:testJobId:events', …(1) ]

Received: 

  1st spy call:

  Array [
    "job:testJobId:events",
-   "{\"content\":\"Stream ended.\",\"type\":\"close\"}",
+   "{\"content\":\"Stream terminé.\",\"type\":\"close\"}",
  ]


Number of calls: 1

 ❯ src/worker.test.ts:347:33
    345|     );
    346| 
    347|     expect(redis.redis.publish).toHaveBeenCalledWith(
       |                                 ^
    348|       'job:testJobId:events',
    349|       JSON.stringify({ content: 'Stream ended.', type: 'close' }) as s…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[53/89]⎯

```

105. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should call summarizeHistory if history length exceeds max length
AssertionError: expected "spy" to be called at least once
 ❯ src/worker.test.ts:359:35
    357|     }); // Exceeds default 10
    358|     const _result = await processJob(mockJob as Job, mockTools, mockJo…
    359|     expect(summarizeTool.execute).toHaveBeenCalled();
       |                                   ^
    360|   });
    361| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[54/89]⎯

```

106. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should always publish a "close" event in the finally block, even on unhandled errors
AssertionError: expected "spy" to be called with arguments: [ 'job:testJobId:events', …(1) ]

Received: 

  1st spy call:

  Array [
    "job:testJobId:events",
-   "{\"content\":\"Stream ended.\",\"type\":\"close\"}",
+   "{\"message\":\"This is an unhandled error\",\"type\":\"error\"}",
  ]

  2nd spy call:

  Array [
    "job:testJobId:events",
-   "{\"content\":\"Stream ended.\",\"type\":\"close\"}",
+   "{\"content\":\"Stream terminé.\",\"type\":\"close\"}",
  ]


Number of calls: 2

 ❯ src/worker.test.ts:389:33
    387|     await processJob(mockJob as Job, mockTools, mockJobQueue, new Sess…
    388| 
    389|     expect(redis.redis.publish).toHaveBeenCalledWith(
       |                                 ^
    390|       'job:testJobId:events',
    391|       JSON.stringify({ content: 'Stream ended.', type: 'close' }) as s…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[55/89]⎯

```

107. [ ] **Test Failure:**
```text
 FAIL  src/utils/errorUtils.test.ts > errorUtils > handleError > should set status and json for AppError with custom statusCode
AssertionError: expected "spy" to be called with arguments: [ { …(4) } ]

Received: 

  1st spy call:

  Array [
    Object {
+     "error": Object {
        "details": Object {
          "statusCode": 404,
        },
-     "error": "Test App Error",
+       "message": "Test App Error",
        "name": "AppError",
-     "stack": Any<String>,
+       "stack": "AppError: Test App Error
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/utils/errorUtils.test.ts:109:21
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
+     at runTest (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runFiles (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:958:5)
+     at startTests (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:967:3)
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7",
+     },
    },
  ]


Number of calls: 1

 ❯ src/utils/errorUtils.test.ts:112:33
    110|       handleError(error, mockRequest, mockResponse, mockNext);
    111|       expect(mockResponse.status).toHaveBeenCalledWith(404);
    112|       expect(mockResponse.json).toHaveBeenCalledWith({
       |                                 ^
    113|         details: { statusCode: 404 },
    114|         error: 'Test App Error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[56/89]⎯

```

108. [ ] **Test Failure:**
```text
 FAIL  src/utils/errorUtils.test.ts > errorUtils > handleError > should set default status 500 for non-AppError
AssertionError: expected "spy" to be called with arguments: [ { error: 'Generic Error', …(2) } ]

Received: 

  1st spy call:

  Array [
    Object {
-     "error": "Generic Error",
+     "error": Object {
+       "message": "Generic Error",
        "name": "Error",
-     "stack": Any<String>,
+       "stack": "Error: Generic Error
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/utils/errorUtils.test.ts:122:21
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
+     at runTest (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runFiles (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:958:5)
+     at startTests (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:967:3)
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7",
+     },
    },
  ]


Number of calls: 1

 ❯ src/utils/errorUtils.test.ts:125:33
    123|       handleError(error, mockRequest, mockResponse, mockNext);
    124|       expect(mockResponse.status).toHaveBeenCalledWith(500);
    125|       expect(mockResponse.json).toHaveBeenCalledWith({
       |                                 ^
    126|         error: 'Generic Error',
    127|         name: 'Error',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[57/89]⎯

```

109. [ ] **Test Failure:**
```text
 FAIL  src/utils/errorUtils.test.ts > errorUtils > handleError > should include stack in development and exclude in production
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…} ]

Received: 

  1st spy call:

  Array [
-   ObjectContaining {
-     "error": "Stack Test",
-     "stack": Any<String>,
+   Object {
+     "error": Object {
+       "message": "Stack Test",
+       "name": "Error",
+       "stack": "Error: Stack Test
+     at /home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/src/utils/errorUtils.test.ts:134:21
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
+     at runTest (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runSuite (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15)
+     at runFiles (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:958:5)
+     at startTests (file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:967:3)
+     at file:///home/demon/agentforge/AgenticForge2/AgenticForge4/node_modules/.pnpm/vitest@1.6.1_@types+node@24.1.0_@vitest+ui@1.6.1_jsdom@24.1.3/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7",
+     },
    },
  ]


Number of calls: 1

 ❯ src/utils/errorUtils.test.ts:139:33
    137|       process.env.NODE_ENV = 'development';
    138|       handleError(error, mockRequest, mockResponse, mockNext);
    139|       expect(mockResponse.json).toHaveBeenCalledWith(
       |                                 ^
    140|         expect.objectContaining({
    141|           error: 'Stack Test',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[58/89]⎯

```

110. [ ] **Test Failure:**
```text
 FAIL  src/utils/errorUtils.test.ts > errorUtils > handleError > should call next if headers are already sent
AssertionError: expected "error" to be called at least once
 ❯ src/utils/errorUtils.test.ts:173:31
    171|       expect(mockResponse.json).not.toHaveBeenCalled();
    172|       expect(mockNext).toHaveBeenCalledWith(error);
    173|       expect(consoleErrorSpy).toHaveBeenCalled();
       |                               ^
    174|     });
    175|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[59/89]⎯

```

111. [ ] **Test Failure:**
```text
 FAIL  src/utils/llmProvider.test.ts > llmProvider > should call redis.incrby with estimated tokens
LlmError: No LLM API key available.
 ❯ GeminiProvider.getLlmResponse src/utils/llmProvider.ts:43:13
     41|       const errorMessage = 'No LLM API key available.';
     42|       log.error(errorMessage);
     43|       throw new LlmError(errorMessage);
       |             ^
     44|     }
     45| 
 ❯ src/utils/llmProvider.test.ts:86:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[60/89]⎯

```

112. [ ] **Test Failure:**
```text
 FAIL  src/utils/llmProvider.test.ts > llmProvider > should handle empty systemPrompt gracefully
LlmError: No LLM API key available.
 ❯ GeminiProvider.getLlmResponse src/utils/llmProvider.ts:43:13
     41|       const errorMessage = 'No LLM API key available.';
     42|       log.error(errorMessage);
     43|       throw new LlmError(errorMessage);
       |             ^
     44|     }
     45| 
 ❯ src/utils/llmProvider.test.ts:113:22

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[61/89]⎯

```

113. [ ] **Test Failure:**
```text
 FAIL  src/utils/llmProvider.test.ts > llmProvider > should handle empty messages array gracefully
LlmError: No LLM API key available.
 ❯ GeminiProvider.getLlmResponse src/utils/llmProvider.ts:43:13
     41|       const errorMessage = 'No LLM API key available.';
     42|       log.error(errorMessage);
     43|       throw new LlmError(errorMessage);
       |             ^
     44|     }
     45| 
 ❯ src/utils/llmProvider.test.ts:131:22

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[62/89]⎯

```

114. [ ] **Test Failure:**
```text
 FAIL  src/utils/llmProvider.test.ts > llmProvider > should handle valid LLM API response with empty content
LlmError: No LLM API key available.
 ❯ GeminiProvider.getLlmResponse src/utils/llmProvider.ts:43:13
     41|       const errorMessage = 'No LLM API key available.';
     42|       log.error(errorMessage);
     43|       throw new LlmError(errorMessage);
       |             ^
     44|     }
     45| 
 ❯ src/utils/llmProvider.test.ts:163:22

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[63/89]⎯

```

115. [ ] **Test Failure:**
```text
 FAIL  src/utils/llmProvider.test.ts > llmProvider > should log error and not interrupt main flow if redis.incrby fails
LlmError: No LLM API key available.
 ❯ GeminiProvider.getLlmResponse src/utils/llmProvider.ts:43:13
     41|       const errorMessage = 'No LLM API key available.';
     42|       log.error(errorMessage);
     43|       throw new LlmError(errorMessage);
       |             ^
     44|     }
     45| 
 ❯ src/utils/llmProvider.test.ts:189:22

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[64/89]⎯

```

116. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should load tools from default development path
AssertionError: expected [ { …(4) }, { …(4) }, { …(4) }, …(9) ] to have a length of 1 but got 12

- Expected
+ Received

- 1
+ 12

 ❯ src/utils/toolLoader.test.ts:63:19
     61| 
     62|     const tools = await getTools();
     63|     expect(tools).toHaveLength(1);
       |                   ^
     64|     expect(tools[0].name).toBe('testTool');
     65|     expect(path.resolve).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[65/89]⎯

```

117. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should load tools from default production path
AssertionError: expected [ { …(4) }, { …(4) }, { …(4) }, …(9) ] to have a length of 1 but got 12

- Expected
+ Received

- 1
+ 12

 ❯ src/utils/toolLoader.test.ts:85:19
     83| 
     84|     const tools = await getTools();
     85|     expect(tools).toHaveLength(1);
       |                   ^
     86|     expect(tools[0].name).toBe('prodTool');
     87|     expect(path.resolve).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[66/89]⎯

```

118. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should load tools from custom TOOLS_PATH
Error: Impossible de lire le répertoire des outils '/custom/tools'. Détails: ENOENT: no such file or directory, scandir '/custom/tools'
 ❯ findToolFiles src/utils/toolLoader.ts:125:11
    123|     // Re-throw ENOENT errors as they indicate a missing tools directo…
    124|     // which should be a fatal error for the application.
    125|     throw new Error(
       |           ^
    126|       `Impossible de lire le répertoire des outils '${dir}'. Détails: …
    127|     );
 ❯ _internalLoadTools src/utils/toolLoader.ts:68:17
 ❯ Module.getTools src/utils/toolLoader.ts:50:5
 ❯ src/utils/toolLoader.test.ts:106:19

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[67/89]⎯

```

119. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should throw an error if tools directory does not exist
AssertionError: expected [Function] to throw error including 'Impossible de lire le répertoire des …' but got 'Impossible de lire le répertoire des …'

- Expected
+ Received

- Impossible de lire le répertoire des outils /custom/tools. Détails: ENOENT: no such file or directory, scandir /custom/tools
+ Impossible de lire le répertoire des outils '/custom/tools'. Détails: ENOENT: no such file or directory, scandir '/custom/tools'

 ❯ src/utils/toolLoader.test.ts:118:5
    116|     );
    117|     process.env.TOOLS_PATH = '/custom/tools'; // Set a custom path to …
    118|     await expect(getTools()).rejects.toThrow(
       |     ^
    119|       'Impossible de lire le répertoire des outils /custom/tools. Déta…
    120|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[68/89]⎯

```

120. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should handle tool files with errors gracefully
AssertionError: expected [ { …(4) }, { …(4) }, { …(4) }, …(9) ] to have a length of 1 but got 12

- Expected
+ Received

- 1
+ 12

 ❯ src/utils/toolLoader.test.ts:133:19
    131| 
    132|     const tools = await getTools();
    133|     expect(tools).toHaveLength(1);
       |                   ^
    134|     expect(tools[0].name).toBe('errorTool');
    135|     // Expect the execute function to throw when called

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[69/89]⎯

```

121. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should reset loaded tools
AssertionError: expected [ { …(4) }, { …(4) }, { …(4) }, …(9) ] to have a length of 1 but got 12

- Expected
+ Received

- 1
+ 12

 ❯ src/utils/toolLoader.test.ts:161:19
    159| 
    160|     const tools = await getTools(); // Load again after reset
    161|     expect(tools).toHaveLength(1);
       |                   ^
    162|     expect(tools[0].name).toBe('tool2');
    163|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[70/89]⎯

```

122. [ ] **Test Failure:**
```text
 FAIL  src/utils/toolLoader.test.ts > toolLoader > should validate loaded tools against Tool interface
AssertionError: expected [ { …(4) }, { …(4) }, { …(4) }, …(9) ] to have a length of 1 but got 12

- Expected
+ Received

- 1
+ 12

 ❯ src/utils/toolLoader.test.ts:174:19
    172|     );
    173|     let tools = await getTools();
    174|     expect(tools).toHaveLength(1);
       |                   ^
    175|     expect(tools[0].name).toBe('validTool');
    176|     expect(typeof tools[0].execute).toBe('function');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[71/89]⎯

```

123. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should follow the thought-command-result loop
AssertionError: expected [ { …(4) }, { …(4) }, { …(5) }, …(2) ] to deeply equal [ { …(2) }, { …(2) }, { …(2) }, …(2) ]

- Expected
+ Received

  Array [
    Object {
      "content": "Test objective",
-     "role": "user",
+     "id": "4ff35cc9-0171-417e-ab28-5a29dc39121b",
+     "timestamp": 1753366009511,
+     "type": "user",
    },
    Object {
-     "content": "
- {
-           \"command\": { \"name\": \"test-tool\", \"params\": { \"arg\": \"value\" } },
-           \"thought\": \"I should use the test tool.\"
- }
- ",
-     "role": "model",
+     "content": "I should use the test tool.",
+     "id": "4d48ba3e-4ed2-40dc-b602-6a48864a5093",
+     "timestamp": 1753366009511,
+     "type": "agent_thought",
    },
    Object {
-     "content": "Tool result: \"tool result\"",
-     "role": "tool",
+     "id": "660b5556-25e1-4eea-90c4-031379fb7774",
+     "result": "tool result",
+     "timestamp": 1753366009511,
+     "toolName": "test-tool",
+     "type": "tool_result",
    },
    Object {
-     "content": "
- {
-           \"command\": { \"name\": \"finish\", \"params\": { \"response\": \"Final answer\" } },
-           \"thought\": \"I have finished.\"
- }
- ",
-     "role": "model",
+     "content": "I have finished.",
+     "id": "79755297-057a-4f02-98fd-d78191216de0",
+     "timestamp": 1753366009511,
+     "type": "agent_thought",
    },
    Object {
-     "content": "Tool result: {\"answer\":\"Final answer\"}",
-     "role": "tool",
+     "id": "80eaaaa2-8b03-427e-b608-d42ff7dd63b9",
+     "result": Object {
+       "answer": "Final answer",
+     },
+     "timestamp": 1753366009511,
+     "toolName": "finish",
+     "type": "tool_result",
    },
  ]

 ❯ src/modules/agent/agent.test.ts:209:33
    207|       expect.any(Object),
    208|     );
    209|     expect(mockSession.history).toEqual([
       |                                 ^
    210|       { content: 'Test objective', role: 'user' },
    211|       {

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[72/89]⎯

```

124. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should handle tool execution errors gracefully
AssertionError: expected [ { …(4) }, { …(4) }, { …(5) }, …(2) ] to deep equally contain { …(2) }

- Expected: 
Object {
  "content": "Tool result: \"Error executing tool test-tool: Error during tool execution\"",
  "role": "tool",
}

+ Received: 
Array [
  Object {
    "content": "Test objective",
    "id": "7f2656fd-53f0-4816-b9a8-97da637bdbd6",
    "timestamp": 1753366009600,
    "type": "user",
  },
  Object {
    "content": "I will try to use the tool, but it might fail.",
    "id": "9df2a877-1425-43ae-97ff-7ef61b2e26f2",
    "timestamp": 1753366009600,
    "type": "agent_thought",
  },
  Object {
    "id": "63887600-9fe2-428f-8771-a8bbc918d62c",
    "result": "Error executing tool test-tool: Error during tool execution",
    "timestamp": 1753366009600,
    "toolName": "test-tool",
    "type": "tool_result",
  },
  Object {
    "content": "The tool execution failed with the following error: Error executing tool test-tool: Error during tool execution. Please analyze the error and try a different approach. You can use another tool, or try to fix the problem with the previous tool.",
    "id": "ea32e11c-fd6d-46e7-80fd-ce6ac84852ef",
    "timestamp": 1753366009600,
    "type": "error",
  },
  Object {
    "content": "Recovered from tool error",
    "id": "d7ffc026-537f-4091-9a28-48e1b406786d",
    "timestamp": 1753366009600,
    "type": "agent_response",
  },
]

 ❯ src/modules/agent/agent.test.ts:330:33
    328|     expect(finalResponse).toBe('Recovered from tool error');
    329|     expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    330|     expect(mockSession.history).toContainEqual({
       |                                 ^
    331|       content: `Tool result: "Error executing tool test-tool: ${errorM…
    332|       role: 'tool',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[73/89]⎯

```

125. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should not loop indefinitely on repeated tool errors
AssertionError: expected 'Agent stuck in a loop.' to be 'Agent reached maximum iterations with…' // Object.is equality

- Expected
+ Received

- Agent reached maximum iterations without a final answer.
+ Agent stuck in a loop.

 ❯ src/modules/agent/agent.test.ts:352:27
    350|     const finalResponse = await agent.run();
    351| 
    352|     expect(finalResponse).toBe(
       |                           ^
    353|       'Agent reached maximum iterations without a final answer.',
    354|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[74/89]⎯

```

126. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should handle empty string response from LLM
AssertionError: expected 'Agent stopped due to persistent malfo…' to be 'Agent reached maximum iterations with…' // Object.is equality

- Expected
+ Received

- Agent reached maximum iterations without a final answer.
+ Agent stopped due to persistent malformed responses.

 ❯ src/modules/agent/agent.test.ts:364:27
    362|     const finalResponse = await agent.run();
    363| 
    364|     expect(finalResponse).toBe(
       |                           ^
    365|       'Agent reached maximum iterations without a final answer.',
    366|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[75/89]⎯

```

127. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should handle null response from LLM
AssertionError: expected 'Agent stopped due to persistent malfo…' to be 'Agent reached maximum iterations with…' // Object.is equality

- Expected
+ Received

- Agent reached maximum iterations without a final answer.
+ Agent stopped due to persistent malformed responses.

 ❯ src/modules/agent/agent.test.ts:379:27
    377|     const finalResponse = await agent.run();
    378| 
    379|     expect(finalResponse).toBe(
       |                           ^
    380|       'Agent reached maximum iterations without a final answer.',
    381|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[76/89]⎯

```

128. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should detect a loop and stop execution
AssertionError: expected "spy" to be called 4 times, but got 3 times
 ❯ src/modules/agent/agent.test.ts:407:39
    405|     // The agent should stop after detecting the loop (3 iterations)
    406|     expect(mockedGetLlmResponse).toHaveBeenCalledTimes(4);
    407|     expect(mockedToolRegistryExecute).toHaveBeenCalledTimes(4);
       |                                       ^
    408|   });
    409| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[77/89]⎯

```

129. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should add an error message to history if LLM provides no actionable response
AssertionError: expected [ { …(4) }, { …(4) }, { …(4) }, …(8) ] to deep equally contain { …(2) }

- Expected: 
Object {
  "content": "You must provide a command, a thought, a canvas output, or a final answer.",
  "role": "user",
}

+ Received: 
Array [
  Object {
    "content": "Test objective",
    "id": "0ef4e187-58ef-4d1a-901d-1e37a8c8e1ef",
    "timestamp": 1753366009664,
    "type": "user",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "2c7fd530-b1dd-48e4-a537-844cec9a7f0b",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "01f0a3c8-5150-478b-86d7-1f825fbb2854",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "149c9738-e26e-460a-b01d-1fc7d90ebfc5",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "77465b82-5970-4503-a0ca-7b3e8866adda",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "214a02bb-8f74-40c4-94df-5aac5dbd0c7f",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "46788692-32cb-4f6f-b30c-274754be264c",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "516b8b55-1f15-4e9a-ace8-4c683ff04aef",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "e17a13e3-c36b-4f0e-a8fc-950f54eeeab2",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "404b4059-2fe5-4eff-b98d-65b9c3429982",
    "timestamp": 1753366009664,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "30af7f3e-a244-4cd7-98a2-e1429a150118",
    "timestamp": 1753366009664,
    "type": "error",
  },
]

 ❯ src/modules/agent/agent.test.ts:418:33
    416|       'Agent reached maximum iterations without a final answer.',
    417|     );
    418|     expect(mockSession.history).toContainEqual({
       |                                 ^
    419|       content:
    420|         'You must provide a command, a thought, a canvas output, or a …

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[78/89]⎯

```

130. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should handle JSON parsing errors from LLM response
AssertionError: expected [ { …(4) }, { …(4) }, { …(4) } ] to deep equally contain { …(2) }

- Expected: 
Object {
  "content": "I was unable to parse your last response. Please ensure your response is a valid JSON object with the expected properties (`thought`, `command`, `canvas`, or `answer`). Check for syntax errors, missing commas, or unclosed brackets.",
  "role": "user",
}

+ Received: 
Array [
  Object {
    "content": "Test objective",
    "id": "08211b96-aafe-4281-8efd-f4b903d4a4b4",
    "timestamp": 1753366009687,
    "type": "user",
  },
  Object {
    "content": "I was unable to parse your last response. Please ensure your response is a valid JSON object with the expected properties (`thought`, `command`, `canvas`, or `answer`). Check for syntax errors, missing commas, or unclosed brackets.",
    "id": "ca2806d8-59ce-437c-875b-54cabb915c24",
    "timestamp": 1753366009687,
    "type": "error",
  },
  Object {
    "content": "Recovered from parsing error",
    "id": "d6d0b5dc-42e7-4fe5-9f82-760efb049b7d",
    "timestamp": 1753366009687,
    "type": "agent_response",
  },
]

 ❯ src/modules/agent/agent.test.ts:441:33


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[79/89]⎯

```

131. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should handle finish tool not returning an answer
AssertionError: expected 'Finish tool did not return a valid an…' to be 'Finish tool did not return a valid an…' // Object.is equality

- Expected
+ Received

- Finish tool did not return a valid answer object: {"not_an_answer":"something"}
+ Finish tool did not return a valid answer object: "loop result"

 ❯ src/modules/agent/agent.test.ts:464:27
    462|     const finalResponse = await agent.run();
    463| 
    464|     expect(finalResponse).toBe(
       |                           ^
    465|       'Finish tool did not return a valid answer object: {"not_an_answ…
    466|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[80/89]⎯

```

132. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/orchestrator.prompt.test.ts > getMasterPrompt > should correctly format the master prompt with all sections
AssertionError: expected '# Agent Persona and Core Directive
\…' to contain 'MODEL:
Hi there!'

- Expected
+ Received

- MODEL:
+ # Agent Persona and Core Directive
+
+ You are AgenticForge, a specialized and autonomous AI assistant. Your primary function is to achieve user goals by thinking step-by-step and exclusively using the tools available to you. You MUST NOT answer from your internal knowledge base. Every action or piece of information you provide must be the result of a tool execution.
+
+ # Mandated Workflow and Rules
+
+ 1.  **Analyze:** Carefully examine the user's request and the conversation history to understand the complete goal.
+ 2.  **Think:** In the `thought` field, formulate a concise, step-by-step plan. State the tool you will use and why it's the correct choice for this specific step.
+ 3.  **Final Answer:** When you have gathered enough information to answer the user's request, or when the user is just making conversation, you MUST output your final response in the `answer` field. This concludes your turn.
+ 4.  **Error Handling:** If a tool returns an error (e.g., `{"erreur": "Description du problème"}`), analyze the error message. In your `thought`, explain what went wrong and propose a new approach or corrected parameters for the tool.
+ 5.  **Format:** Structure your response as a single, valid JSON object, and nothing else.
+
+ # Response Format (Strict)
+
+ Your response MUST be a single, valid JSON object wrapped in `json ... `. There should be NO text or explanation outside of the JSON block.
+
+ The JSON object MUST conform to the following JSON schema:
+
+ ```json
+ {
+   "type": "object",
+   "properties": {
+     "answer": {
+       "type": "string",
+       "description": "The final answer to the user's request. Use this when you have completed the task and are ready to respond to the user."
+     },
+     "canvas": {
+       "type": "object",
+       "properties": {
+         "content": {
+           "type": "string",
+           "description": "The content to display on the canvas. Can be HTML, Markdown, or just text."
+         },
+         "contentType": {
+           "type": "string",
+           "enum": [
+             "html",
+             "markdown",
+             "text",
+             "url"
+           ],
+           "description": "The content type of the canvas content."
+         }
+       },
+       "required": [
+         "content",
+         "contentType"
+       ],
+       "additionalProperties": false,
+       "description": "The canvas is a visual workspace. Use it to display rich content to the user, like charts, tables, or interactive elements."
+     },
+     "command": {
+       "type": "object",
+       "properties": {
+         "name": {
+           "type": "string",
+           "description": "The name of the tool to execute."
+         },
+         "params": {
+           "description": "The parameters for the tool, as a JSON object."
+         }
+       },
+       "required": [
+         "name"
+       ],
+       "additionalProperties": false,
+       "description": "The command to execute. Use this to call a tool."
+     },
+     "thought": {
+       "type": "string",
+       "description": "Your internal monologue. Use it to reason about the task, process information, and plan your next steps. This is not shown to the user."
+     }
+   },
+   "additionalProperties": false,
+   "$schema": "http://json-schema.org/draft-07/schema#"
+ }
+ ```
+
+ # Example
+
+ USER:
+ Create a file named 'test.txt' with the content 'hello'.
+
+ ASSISTANT's turn. Your response:
+
+ ```json
+ {
+   "thought": "The user wants to create a file. The `writeFile` tool is the correct choice for this. I will set the path to 'test.txt' and the content to 'hello'.",
+   "command": {
+     "name": "writeFile",
+     "params": {
+       "path": "test.txt",
+       "content": "hello"
+     }
+   }
+ }
+ ```
+
+ USER:
+ List all files and folders in the working directory.
+
+ ASSISTANT's turn. Your response:
+
+ ```json
+ {
+   "thought": "The user wants to list all files and folders in the working directory. The `listFiles` tool is the correct choice for this. I will set the path to '.' to list the contents of the root directory.",
+   "command": {
+     "name": "listFiles",
+     "params": {
+       "path": "."
+     }
+   }
+ }
+ ```
+
+ USER:
+ Execute the shell command `ls -la` in the working directory.
+
+ ASSISTANT's turn. Your response:
+
+ ```json
+ {
+   "thought": "The user wants to execute a shell command. The `run_shell_command` tool is the correct choice for this. I will set the command to `ls -la`.",
+   "command": {
+     "name": "run_shell_command",
+     "params": {
+       "command": "ls -la"
+     }
+   }
+ }
+ ```
+
+ # Example of a multi-step task involving the canvas
+
+ USER:
+ Write the markdown '## My Document' into a file named 'doc.md' and then display it on the canvas.
+
+ ASSISTANT's turn. Your response:
+ '''json
+ {
+ "thought": "First, I need to create the file 'doc.md' with the specified content. I will use the `writeFile` tool for this.",
+ "command": {
+ "name": "writeFile",
+ "params": {
+ "path": "doc.md",
+ "content": "## My Document"
+ }
+ }
+ }
+ '''
+
+ ASSISTANT's turn. Your response:
+ '''json
+ {
+ "thought": "I have successfully created the file. Now, according to the rules, I must not use information from my memory. I need to read the file to get its content before I can display it. I will use the `readFile` tool.",
+ "command": {
+ "name": "readFile",
+ "params": {
+ "path": "doc.md"
+ }
+ }
+ }
+ '''
+
+ ASSISTANT's turn. Your response:
+ '''json
+ {
+ "thought": "I have read the file and now have its content. The file is a markdown file, so I will set the `contentType` to 'markdown'. I can now display it in the canvas.",
+ "canvas": {
+ "contentType": "markdown",
+ "content": "## My Document"
+ }
+ }
+ '''
+
+ # Agent Persona and Core Directive
+
+ ```
+
+ ```
+
+
+ ## Working Context:
+ {
+   "currentFile": "example.txt",
+   "lastAction": "mock-action"
+ }
+
+ ## Available Tools:
+ ### testTool
+ Description: A tool for testing
+ Parameters (JSON Schema):
+ {
+   "type": "object",
+   "properties": {
+     "param1": {
+       "description": "Description for param1",
+       "type": "string"
+     },
+     "param2": {
+       "type": "number"
+     }
+   },
+   "required": [
+     "param1",
+     "param2"
+   ]
+ }
+
+ ### anotherTool
+ Description: Another tool
+ Parameters: None
+
+ ### noParamsTool
+ Description: Tool with no parameters
+ Parameters: None
+
+
+ ## Conversation History:
+ USER:
+ Hello
+
+ ASSISTANT:
  Hi there!
+
+ ASSISTANT's turn. Your response:

 ❯ src/modules/agent/orchestrator.prompt.test.ts:102:20
    100|     expect(prompt).toContain('## Conversation History:');
    101|     expect(prompt).toContain('USER:
Hello');
    102|     expect(prompt).toContain('MODEL:
Hi there!');
       |                    ^
    103| 
    104|     // Check Assistant's turn

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[81/89]⎯

```

133. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/orchestrator.prompt.test.ts > getMasterPrompt > should correctly convert a Zod object with an array of objects to JSON schema
AssertionError: expected { type: 'object', …(4) } to deeply equal { properties: { …(2) }, …(2) }

- Expected
+ Received

  Object {
+   "$schema": "http://json-schema.org/draft-07/schema#",
+   "additionalProperties": false,
    "properties": Object {
      "count": Object {
        "type": "number",
      },
      "users": Object {
        "items": Object {
+         "additionalProperties": false,
          "properties": Object {
            "id": Object {
              "type": "string",
            },
            "name": Object {
              "type": "string",
            },
          },
          "required": Array [
            "id",
            "name",
          ],
          "type": "object",
        },
        "type": "array",
      },
    },
    "required": Array [
      "users",
    ],
    "type": "object",
  }

 ❯ src/modules/agent/orchestrator.prompt.test.ts:120:20
    118| 
    119|     const schema = zodToJsonSchema(complexSchema);
    120|     expect(schema).toEqual({
       |                    ^
    121|       properties: {
    122|         count: { type: 'number' },

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[82/89]⎯

```

134. [ ] **Test Failure:**
```text
 FAIL  src/modules/session/sessionManager.test.ts > SessionManager > should save a session to the database
AssertionError: expected "spy" to be called with arguments: [ StringContaining{…}, …(1) ]

Received: 

  1st spy call:

  Array [
-   StringContaining "INSERT INTO sessions",
+   "INSERT INTO sessions (id, name, messages, timestamp) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, messages = EXCLUDED.messages, timestamp = EXCLUDED.timestamp",
    Array [
      "session-to-save",
      "Session to Save",
      "[{\"content\":\"Test\",\"id\":\"1\",\"timestamp\":1753366010292,\"type\":\"user\"}]",
-     1753366010292,
+     "1753366010292",
    ],
  ]


Number of calls: 1

 ❯ src/modules/session/sessionManager.test.ts:105:32
    103|     mockPgClient.query.mockResolvedValue({ rows: [] });
    104|     await sessionManager.saveSession(session, mockJob, mockTaskQueue);
    105|     expect(mockPgClient.query).toHaveBeenCalledWith(
       |                                ^
    106|       expect.stringContaining('INSERT INTO sessions'),
    107|       [

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[83/89]⎯

```

135. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/ai/summarize.tool.test.ts > summarizeTool > should summarize the text successfully
AssertionError: expected { Object (erreur) } to deeply equal 'This is a summary.'

- Expected: 
"This is a summary."

+ Received: 
Object {
  "erreur": "Failed to summarize text: LLM returned empty response.",
}

 ❯ src/modules/tools/definitions/ai/summarize.tool.test.ts:45:20
     43|       mockCtx,
     44|     );
     45|     expect(result).toEqual('This is a summary.');
       |                    ^
     46|     expect(getLlmProvider().getLlmResponse).toHaveBeenCalled();
     47|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[84/89]⎯

```

136. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/ai/summarize.tool.test.ts > summarizeTool > should return an error object if summarization fails
AssertionError: expected { Object (erreur) } to deeply equal { erreur: 'No LLM API key available.' }

- Expected
+ Received

  Object {
-   "erreur": "No LLM API key available.",
+   "erreur": "Failed to summarize text: LLM returned empty response.",
  }

 ❯ src/modules/tools/definitions/ai/summarize.tool.test.ts:55:20
     53|       mockCtx,
     54|     );
     55|     expect(result).toEqual({ erreur: 'No LLM API key available.' });
       |                    ^
     56|   });
     57| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[85/89]⎯

```

137. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/code/executeShellCommand.tool.test.ts > executeShellCommandTool > should enqueue a detached command and return immediately
AssertionError: expected "spy" to be called with arguments: [ 'async-tasks', …(2) ]

Received: 

  1st spy call:

  Array [
-   "async-tasks",
-   ObjectContaining {
+   "execute-shell-command-detached",
+   Object {
      "command": "long-running-script.sh",
      "jobId": "test-job",
      "notificationChannel": "job:test-job:events",
    },
-   ObjectContaining {
-     "jobId": Any<String>,
+   Object {
+     "jobId": "shell-command-1753366009328-xzglued",
+     "removeOnComplete": true,
+     "removeOnFail": true,
    },
  ]


Number of calls: 1

 ❯ src/modules/tools/definitions/code/executeShellCommand.tool.test.ts:152:35
    150|     const result = await executeShellCommandTool.execute(args, mockCtx…
    151| 
    152|     expect(mockCtx.taskQueue.add).toHaveBeenCalledWith(
       |                                   ^
    153|       'async-tasks',
    154|       expect.objectContaining({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[86/89]⎯

```

138. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/code/executeShellCommand.tool.test.ts > executeShellCommandTool > should handle child process error event
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]

Received: 



Number of calls: 0

 ❯ src/modules/tools/definitions/code/executeShellCommand.tool.test.ts:193:31
    191|     );
    192|     expect((result as { stdout: string }).stdout).toBe('');
    193|     expect(mockCtx.log.error).toHaveBeenCalledWith(
       |                               ^
    194|       expect.objectContaining({ err: expect.any(Error) }),
    195|       `Failed to start shell command: ${command}`,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[87/89]⎯

```

139. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/code/executeShellCommand.tool.test.ts > executeShellCommandTool > should stream stdout and stderr to frontend via redis.publish
AssertionError: expected "spy" to be called with arguments: [ 'job:test-job:events', …(1) ]

Received: 



Number of calls: 0

 ❯ src/modules/tools/definitions/code/executeShellCommand.tool.test.ts:231:27
    229|     await executeShellCommandTool.execute({ command, detach: false }, …
    230| 
    231|     expect(redis.publish).toHaveBeenCalledWith(
       |                           ^
    232|       `job:${mockCtx.job!.id}:events`,
    233|       JSON.stringify({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[88/89]⎯

```

140. [ ] **Test Failure:**
```text
 FAIL  src/modules/tools/definitions/web/browser.tool.test.ts > browserTool > should return an error if navigation fails
AssertionError: expected { Object (content, url) } to have property "erreur"
 ❯ src/modules/tools/definitions/web/browser.tool.test.ts:67:20
     65| 
     66|     const result = await browserTool.execute({ url }, mockCtx);
     67|     expect(result).toHaveProperty('erreur');
       |                    ^
     68|     expect(
     69|       typeof result === 'object' && result !== null && 'erreur' in res…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[89/89]⎯

⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯

Vitest caught 49 unhandled errors during the test run.
This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:81:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ runTest ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:774:30

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return initial leaderboard stats". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:81:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should increment sessionsCreated when a new session is created". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: this.pgClient.query is not a function
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.test.ts:51:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:892:33

This error originated in "src/webServer.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 200 for /api/health". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:81:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should log an error if redis.incr fails for sessionsCreated". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:81:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should increment tokensSaved when an LLM response is generated". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:81:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should log an error if redis.incrby fails for tokensSaved". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:81:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should increment successfulRuns when a job completes successfully". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:81:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should save a session". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should save a session". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should log an error if redis.set fails for session save". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should load a session". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should log an error if redis.get fails for session load". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 404 if session not found on load". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should delete a session". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should log an error if redis.del fails for session delete". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should rename a session". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should log an error if redis.get fails during session rename". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:294:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 404 if session not found on rename". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:479:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should add an LLM API key". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:479:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if LlmKeyManager.addKey throws an error". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:479:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should retrieve LLM API keys". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:479:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if LlmKeyManager.getKeysForApi throws an error". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:479:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should delete an LLM API key". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:479:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 400 for invalid index on delete". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:479:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if LlmKeyManager.removeKey throws an error". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:613:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should redirect to GitHub for OAuth initiation". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:613:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle GitHub OAuth callback successfully". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:647:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ runTest ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle GitHub OAuth callback successfully". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:613:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle GitHub OAuth callback with error from GitHub". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:675:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ runTest ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle GitHub OAuth callback with error from GitHub". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:613:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle network errors during GitHub OAuth callback". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:711:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ runTest ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle network errors during GitHub OAuth callback". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:613:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle GitHub OAuth callback with missing code". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:613:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if GITHUB_CLIENT_ID is missing for OAuth initiation". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:748:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ runTest ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if GITHUB_CLIENT_ID is missing for OAuth initiation". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:613:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 400 if GITHUB_CLIENT_SECRET is missing for OAuth callback". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:766:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ runTest ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 400 if GITHUB_CLIENT_SECRET is missing for OAuth callback". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:798:18
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ runTest ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:781:17
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:909:15

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if jobQueue.add fails". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:816:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if jobQueue.add fails". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:847:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if jobQueue.getJob fails in /api/interrupt". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:847:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if jobQueue.getJob fails in /api/status". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:895:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if redis.publish fails in /api/interrupt". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:895:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if redis.publish fails in /api/display". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:945:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if fs.promises.readdir fails". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:945:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 500 if fs.promises.readFile fails". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:993:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle AppError and return custom status code and message". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:993:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle UserError and return custom status code and message". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:993:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle generic Error and return 500". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.

⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
TypeError: Cannot read properties of undefined (reading 'query')
 ❯ SessionManager.initDb src/modules/session/sessionManager.ts:244:25
    242| 
    243|   private async initDb() {
    244|     await this.pgClient.query(`
       |                         ^
    245|       CREATE TABLE IF NOT EXISTS sessions (
    246|         id VARCHAR(255) PRIMARY KEY,
 ❯ new SessionManager src/modules/session/sessionManager.ts:21:10
 ❯ Module.initializeWebServer src/webServer.ts:33:26
 ❯ src/webServer.integration.test.ts:1053:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:135:14
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5

This error originated in "src/webServer.integration.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should not require authentication if AUTH_API_KEY is not set". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
```

---

✗ 3 type(s) de vérification ont échoué : TypeCheck Core Lint Tests.
Veuillez consulter le fichier all-checks.md pour les 140 erreur(s) détaillée(s).

