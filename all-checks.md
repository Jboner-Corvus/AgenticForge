# TODO List: Résoudre les erreurs de vérification

Ce document liste les problèmes identifiés lors des vérifications automatisées (TypeCheck, Lint, Test, Format).
Veuillez résoudre ces éléments un par un, en cochant la case `[x]` une fois l'erreur corrigée.

---

## Erreurs à corriger

1. [ ] **TypeCheck (Core):** `src/webServer.test.ts(190,9): error TS2304: Cannot find name 'res'.`

2. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should handle /api/chat/stream/:jobId correctly
Error: Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
```

3. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should process a job successfully and return the final response
AssertionError: expected "spy" to be called at least once
 ❯ src/worker.test.ts:101:35
     99|       role: 'model',
    100|     });
    101|     expect(summarizeTool.execute).toHaveBeenCalled();
       |                                   ^
    102|     expect(SessionManager.saveSession).toHaveBeenCalledWith(
    103|       mockSessionData,

```

4. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should call summarizeHistory if history length exceeds max length
AssertionError: expected "spy" to be called at least once
 ❯ src/worker.test.ts:286:35
    284|     }); // Exceeds default 10
    285|     const _result = await processJob(mockJob as Job, mockTools);
    286|     expect(summarizeTool.execute).toHaveBeenCalled();
       |                                   ^
    287|   });
    288| 

```

5. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should follow the thought-command-result loop
AssertionError: expected 'Agent reached maximum iterations with…' to be 'Final answer' // Object.is equality

- Expected
+ Received

- Final answer
+ Agent reached maximum iterations without a final answer.

 ❯ src/modules/agent/agent.test.ts:180:27
    178|     const finalResponse = await agent.run();
    179| 
    180|     expect(finalResponse).toBe('Final answer');
       |                           ^
    181|     expect(mockedGetLlmResponse).toHaveBeenCalledTimes(3);
    182|     expect(mockedToolRegistryExecute).toHaveBeenCalledWith(

```

6. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should handle LLM response parsing errors gracefully
AssertionError: expected 'Agent reached maximum iterations with…' to be 'Success' // Object.is equality

- Expected
+ Received

- Success
+ Agent reached maximum iterations without a final answer.

 ❯ src/modules/agent/agent.test.ts:230:27
    228|     const finalResponse = await agent.run();
    229| 
    230|     expect(finalResponse).toBe('Success');
       |                           ^
    231|     expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    232|     expect(mockSession.history).toContainEqual({

```

7. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should stop if it reaches max iterations
AssertionError: expected "spy" to be called 10 times, but got 0 times
 ❯ src/modules/agent/agent.test.ts:256:34
    254|       'Agent reached maximum iterations without a final answer.',
    255|     );
    256|     expect(mockedGetLlmResponse).toHaveBeenCalledTimes(10);
       |                                  ^
    257|   });
    258| 

```

8. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should be interrupted by a signal
AssertionError: expected 'Agent reached maximum iterations with…' to be 'Agent execution interrupted.' // Object.is equality

- Expected
+ Received

- Agent execution interrupted.
+ Agent reached maximum iterations without a final answer.

 ❯ src/modules/agent/agent.test.ts:272:27
    270|     const finalResponse = await agent.run();
    271| 
    272|     expect(finalResponse).toBe('Agent execution interrupted.');
       |                           ^
    273|     expect(mockRedisSubscriber.unsubscribe).toHaveBeenCalledWith(
    274|       `job:${mockJob.id}:interrupt`,

```

9. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should handle tool execution errors gracefully
AssertionError: expected 'Agent reached maximum iterations with…' to be 'Recovered from tool error' // Object.is equality

- Expected
+ Received

- Recovered from tool error
+ Agent reached maximum iterations without a final answer.

 ❯ src/modules/agent/agent.test.ts:295:27
    293|     const finalResponse = await agent.run();
    294| 
    295|     expect(finalResponse).toBe('Recovered from tool error');
       |                           ^
    296|     expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    297|     expect(mockSession.history).toContainEqual({

```

10. [ ] **Test Failure:**
```text
⎯⎯⎯⎯⎯ Uncaught Exception ⎯⎯⎯⎯⎯
ReferenceError: res is not defined
 ❯ Timeout._onTimeout src/webServer.test.ts:190:9
    188|         }
    189|         // End the response to ensure the test completes
    190|         res.end();
       |         ^
    191|       }, 100);
    192|     });
 ❯ listOnTimeout node:internal/timers:608:17
 ❯ processTimers node:internal/timers:543:7

This error originated in "src/webServer.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should handle /api/chat/stream/:jobId correctly". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
```

---

✗ 2 type(s) de vérification ont échoué : TypeCheck Core Tests.
Veuillez consulter le fichier all-checks.md pour les 10 erreur(s) détaillée(s).

