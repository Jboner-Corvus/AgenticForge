# TODO List: Résoudre les erreurs de vérification

Ce document liste les problèmes identifiés par nos vérifications (TypeCheck, Lint, Test).

La correction de chaque erreur doit se faire **uniquement en modifiant le code source** 

Il est interdit d'exécuter des commandes bash..
Il est interdit de lancer une vérification.

Une fois la correction effectué, cochez la case `[x]`.

---

## Erreurs à corriger

1. [ ] **TypeCheck (Core):** `src/index.ts(18,1): error TS2308: Module './modules/llm/LlmKeyManager.js' has already exported a member named 'LlmKeyErrorType'. Consider explicitly re-exporting to resolve the ambiguity.`

2. [ ] **TypeCheck (Core):** `src/modules/agent/agent.ts(108,35): error TS2322: Type 'unknown' is not assignable to type 'string'.`

3. [ ] **TypeCheck (Core):** `src/modules/session/sessionManager.ts(231,41): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.`

4. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(13,10): error TS2416: Property 'getErrorType' in type 'GeminiProvider' is not assignable to the same property in base type 'ILlmProvider'.`

5. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(16,7): error TS2820: Type '"PERMANENT"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.PERMANENT'?`

6. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(19,7): error TS2820: Type '"TEMPORARY"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.TEMPORARY'?`

7. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(22,7): error TS2820: Type '"TEMPORARY"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.TEMPORARY'?`

8. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(27,7): error TS2820: Type '"PERMANENT"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.PERMANENT'?`

9. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(219,11): error TS2345: Argument of type '"PERMANENT" | "TEMPORARY"' is not assignable to parameter of type 'LlmKeyErrorType'.`

10. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(239,11): error TS2345: Argument of type '"PERMANENT" | "TEMPORARY"' is not assignable to parameter of type 'LlmKeyErrorType'.`

11. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(285,10): error TS2416: Property 'getErrorType' in type 'MistralProvider' is not assignable to the same property in base type 'ILlmProvider'.`

12. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(288,7): error TS2820: Type '"PERMANENT"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.PERMANENT'?`

13. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(291,7): error TS2820: Type '"TEMPORARY"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.TEMPORARY'?`

14. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(294,7): error TS2820: Type '"TEMPORARY"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.TEMPORARY'?`

15. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(415,10): error TS2416: Property 'getErrorType' in type 'OpenAIProvider' is not assignable to the same property in base type 'ILlmProvider'.`

16. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(418,7): error TS2820: Type '"PERMANENT"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.PERMANENT'?`

17. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(421,7): error TS2820: Type '"TEMPORARY"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.TEMPORARY'?`

18. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(424,7): error TS2820: Type '"TEMPORARY"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.TEMPORARY'?`

19. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(429,7): error TS2820: Type '"PERMANENT"' is not assignable to type 'LlmKeyErrorType'. Did you mean 'LlmKeyErrorType.PERMANENT'?`

20. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(554,7): error TS2322: Type 'GeminiProvider' is not assignable to type 'ILlmProvider'.`

21. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(560,7): error TS2322: Type 'MistralProvider' is not assignable to type 'ILlmProvider'.`

22. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(563,7): error TS2322: Type 'OpenAIProvider' is not assignable to type 'ILlmProvider'.`

23. [ ] **TypeCheck (Core):** `src/utils/llmProvider.ts(569,7): error TS2322: Type 'GeminiProvider' is not assignable to type 'ILlmProvider'.`

24. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(73,17): error TS2554: Expected 3 arguments, but got 2.`

25. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(73,55): error TS2304: Cannot find name 'jobQueue'.`

26. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(74,25): error TS2304: Cannot find name 'logger'.`

27. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(166,37): error TS2304: Cannot find name 'jobQueue'.`

28. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(183,31): error TS2304: Cannot find name 'logger'.`

29. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(200,37): error TS2304: Cannot find name 'jobQueue'.`

30. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(232,7): error TS2304: Cannot find name 'jobQueue'.`

31. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(246,31): error TS2304: Cannot find name 'logger'.`

32. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(256,7): error TS2304: Cannot find name 'jobQueue'.`

33. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(274,17): error TS2554: Expected 3 arguments, but got 2.`

34. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(274,55): error TS2304: Cannot find name 'jobQueue'.`

35. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(275,25): error TS2304: Cannot find name 'logger'.`

36. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(309,31): error TS2304: Cannot find name 'logger'.`

37. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(342,31): error TS2304: Cannot find name 'logger'.`

38. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(381,31): error TS2304: Cannot find name 'logger'.`

39. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(425,31): error TS2304: Cannot find name 'logger'.`

40. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(459,17): error TS2554: Expected 3 arguments, but got 2.`

41. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(459,55): error TS2304: Cannot find name 'jobQueue'.`

42. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(460,25): error TS2304: Cannot find name 'logger'.`

43. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(483,31): error TS2304: Cannot find name 'logger'.`

44. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(516,31): error TS2304: Cannot find name 'logger'.`

45. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(556,31): error TS2304: Cannot find name 'logger'.`

46. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(577,25): error TS2304: Cannot find name 'logger'.`

47. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(593,17): error TS2554: Expected 3 arguments, but got 2.`

48. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(593,55): error TS2304: Cannot find name 'jobQueue'.`

49. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(627,17): error TS2554: Expected 3 arguments, but got 2.`

50. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(627,55): error TS2304: Cannot find name 'jobQueue'.`

51. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(655,17): error TS2554: Expected 3 arguments, but got 2.`

52. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(655,55): error TS2304: Cannot find name 'jobQueue'.`

53. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(691,17): error TS2554: Expected 3 arguments, but got 2.`

54. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(691,55): error TS2304: Cannot find name 'jobQueue'.`

55. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(696,31): error TS2304: Cannot find name 'logger'.`

56. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(728,17): error TS2554: Expected 3 arguments, but got 2.`

57. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(728,55): error TS2304: Cannot find name 'jobQueue'.`

58. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(746,17): error TS2554: Expected 3 arguments, but got 2.`

59. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(746,55): error TS2304: Cannot find name 'jobQueue'.`

60. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(751,31): error TS2304: Cannot find name 'logger'.`

61. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(769,25): error TS2304: Cannot find name 'logger'.`

62. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(778,18): error TS2554: Expected 3 arguments, but got 2.`

63. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(778,52): error TS2304: Cannot find name 'jobQueue'.`

64. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(796,17): error TS2554: Expected 3 arguments, but got 2.`

65. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(796,55): error TS2304: Cannot find name 'jobQueue'.`

66. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(797,25): error TS2304: Cannot find name 'logger'.`

67. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(801,15): error TS2304: Cannot find name 'jobQueue'.`

68. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(804,31): error TS2304: Cannot find name 'logger'.`

69. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(827,17): error TS2554: Expected 3 arguments, but got 2.`

70. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(827,55): error TS2304: Cannot find name 'jobQueue'.`

71. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(828,25): error TS2304: Cannot find name 'logger'.`

72. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(832,15): error TS2304: Cannot find name 'jobQueue'.`

73. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(835,31): error TS2304: Cannot find name 'logger'.`

74. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(850,15): error TS2304: Cannot find name 'jobQueue'.`

75. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(853,31): error TS2304: Cannot find name 'logger'.`

76. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(875,17): error TS2554: Expected 3 arguments, but got 2.`

77. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(875,55): error TS2304: Cannot find name 'jobQueue'.`

78. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(876,25): error TS2304: Cannot find name 'logger'.`

79. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(880,15): error TS2304: Cannot find name 'jobQueue'.`

80. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(884,31): error TS2304: Cannot find name 'logger'.`

81. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(903,31): error TS2304: Cannot find name 'logger'.`

82. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(925,17): error TS2554: Expected 3 arguments, but got 2.`

83. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(925,55): error TS2304: Cannot find name 'jobQueue'.`

84. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(926,25): error TS2304: Cannot find name 'logger'.`

85. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(933,31): error TS2304: Cannot find name 'logger'.`

86. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(952,31): error TS2304: Cannot find name 'logger'.`

87. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(973,17): error TS2554: Expected 3 arguments, but got 2.`

88. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(973,55): error TS2304: Cannot find name 'jobQueue'.`

89. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(1033,17): error TS2554: Expected 3 arguments, but got 2.`

90. [ ] **TypeCheck (Core):** `src/webServer.integration.test.ts(1033,55): error TS2304: Cannot find name 'jobQueue'.`

91. [ ] **TypeCheck (Core):** `src/webServer.test.ts(42,9): error TS7022: 'mockRedisClient' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.`

92. [ ] **TypeCheck (Core):** `src/webServer.test.ts(45,22): error TS7024: Function implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.`

93. [ ] **TypeCheck (Core):** `src/webServer.test.ts(74,17): error TS2554: Expected 3 arguments, but got 2.`

94. [ ] **TypeCheck (Core):** `src/worker.test.ts(108,27): error TS2554: Expected 4 arguments, but got 3.`

95. [ ] **TypeCheck (Core):** `src/worker.test.ts(130,12): error TS2304: Cannot find name 'mockRedis'.`

96. [ ] **TypeCheck (Core):** `src/worker.test.ts(158,12): error TS2304: Cannot find name 'mockRedis'.`

97. [ ] **TypeCheck (Core):** `src/worker.test.ts(162,12): error TS2304: Cannot find name 'mockRedis'.`

98. [ ] **TypeCheck (Core):** `src/worker.test.ts(189,12): error TS2304: Cannot find name 'mockRedis'.`

99. [ ] **TypeCheck (Core):** `src/worker.test.ts(193,12): error TS2304: Cannot find name 'mockRedis'.`

100. [ ] **TypeCheck (Core):** `src/worker.test.ts(220,12): error TS2304: Cannot find name 'mockRedis'.`

101. [ ] **TypeCheck (Core):** `src/worker.test.ts(224,12): error TS2304: Cannot find name 'mockRedis'.`

102. [ ] **TypeCheck (Core):** `src/worker.test.ts(243,12): error TS2304: Cannot find name 'mockRedis'.`

103. [ ] **TypeCheck (Core):** `src/worker.test.ts(250,12): error TS2304: Cannot find name 'mockRedis'.`

104. [ ] **TypeCheck (Core):** `src/worker.test.ts(269,12): error TS2304: Cannot find name 'mockRedis'.`

105. [ ] **TypeCheck (Core):** `src/worker.test.ts(277,12): error TS2304: Cannot find name 'mockRedis'.`

106. [ ] **TypeCheck (Core):** `src/worker.test.ts(296,12): error TS2304: Cannot find name 'mockRedis'.`

107. [ ] **TypeCheck (Core):** `src/worker.test.ts(304,12): error TS2304: Cannot find name 'mockRedis'.`

108. [ ] **TypeCheck (Core):** `src/worker.test.ts(322,12): error TS2304: Cannot find name 'mockRedis'.`

109. [ ] **TypeCheck (Core):** `src/worker.test.ts(329,12): error TS2304: Cannot find name 'mockRedis'.`

110. [ ] **TypeCheck (Core):** `src/worker.test.ts(347,12): error TS2304: Cannot find name 'mockRedis'.`

111. [ ] **TypeCheck (Core):** `src/worker.test.ts(358,27): error TS2554: Expected 4 arguments, but got 3.`

112. [ ] **TypeCheck (Core):** `src/worker.test.ts(367,27): error TS2554: Expected 4 arguments, but got 3.`

113. [ ] **TypeCheck (Core):** `src/worker.test.ts(376,27): error TS2554: Expected 4 arguments, but got 3.`

114. [ ] **TypeCheck (Core):** `src/worker.test.ts(387,11): error TS2554: Expected 4 arguments, but got 3.`

115. [ ] **TypeCheck (Core):** `src/worker.test.ts(389,12): error TS2304: Cannot find name 'mockRedis'.`

116. [ ] **TypeCheck (Core):** `src/worker.ts(19,13): error TS2552: Cannot find name 'Client'. Did you mean 'PgClient'?`

117. [ ] **Lint:** `packages/core lint:   4:10  error  'redis' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

118. [ ] **Lint:** `packages/core lint:   1:10  error  'afterEach' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

119. [ ] **Lint:** `packages/core lint:   6:10  error  'redis' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

120. [ ] **Lint:** `packages/core lint:   7:10  error  'AppError' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

121. [ ] **Lint:** `packages/core lint:   13:10  error  'LlmKeyManager' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

122. [ ] **Lint:** `packages/core lint:   14:10  error  'redis' is defined but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars`

123. [ ] **Lint:** `packages/core lint:   193:21  error  Unnecessary escape character: \/  no-useless-escape`

124. [ ] **Lint:** `packages/core lint:    33:28  error  'job' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

125. [ ] **Lint:** `packages/core lint:    33:38  error  'tools' is defined but never used. Allowed unused args must match /^_/u              @typescript-eslint/no-unused-vars`

126. [ ] **Lint:** `packages/core lint:    33:50  error  'jobQueue' is defined but never used. Allowed unused args must match /^_/u           @typescript-eslint/no-unused-vars`

127. [ ] **Lint:** `packages/core lint:    33:65  error  'ctx' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

128. [ ] **Lint:** `packages/core lint:   157:14  error  'job' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

129. [ ] **Lint:** `packages/core lint:   187:14  error  'job' is defined but never used. Allowed unused args must match /^_/u                @typescript-eslint/no-unused-vars`

130. [ ] **Lint:** `packages/core lint:   188:9   error  Unnecessary try/catch wrapper                                                        no-useless-catch`

131. [ ] **Lint:** `packages/core lint:   269:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

132. [ ] **Lint:** `packages/core lint:   454:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

133. [ ] **Lint:** `packages/core lint:   791:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

134. [ ] **Lint:** `packages/core lint:   822:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

135. [ ] **Lint:** `packages/core lint:   870:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

136. [ ] **Lint:** `packages/core lint:   920:7   error  'errorSpy' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars`

137. [ ] **Lint:** `packages/core lint: ✖ 20 problems (20 errors, 0 warnings)`

138. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should return initial leaderboard stats
```

139. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should increment sessionsCreated when a new session is created
```

140. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should log an error if redis.incr fails for sessionsCreated
```

141. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should increment tokensSaved when an LLM response is generated
```

142. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should log an error if redis.incrby fails for tokensSaved
```

143. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should increment successfulRuns when a job completes successfully
```

144. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Leaderboard Statistics Backend > should log an error if redis.incr fails for successfulRuns
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:73:55
     71|     vi.clearAllMocks();
     72|     mockRedis._resetStore();
     73|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
     74|     errorSpy = vi.spyOn(logger, 'error');
     75|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/98]⎯

```

145. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should save a session
```

146. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should log an error if redis.set fails for session save
```

147. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should load a session
```

148. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should log an error if redis.get fails for session load
```

149. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should return 404 if session not found on load
```

150. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should delete a session
```

151. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should log an error if redis.del fails for session delete
```

152. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should rename a session
```

153. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should log an error if redis.get fails during session rename
```

154. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Session Management Backend > should return 404 if session not found on rename
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:274:55
    272|     vi.clearAllMocks();
    273|     mockRedis._resetStore();
    274|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
    275|     errorSpy = vi.spyOn(logger, 'error');
    276|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/98]⎯

```

155. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should add an LLM API key
```

156. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should return 500 if LlmKeyManager.addKey throws an error
```

157. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should retrieve LLM API keys
```

158. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should return 500 if LlmKeyManager.getKeysForApi throws an error
```

159. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should delete an LLM API key
```

160. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should return 400 for invalid index on delete
```

161. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > LLM API Key Management Backend > should return 500 if LlmKeyManager.removeKey throws an error
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:459:55
    457|     vi.clearAllMocks();
    458|     mockRedis._resetStore();
    459|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
    460|     errorSpy = vi.spyOn(logger, 'error');
    461|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/98]⎯

```

162. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should redirect to GitHub for OAuth initiation
```

163. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should handle GitHub OAuth callback successfully
```

164. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should handle GitHub OAuth callback with error from GitHub
```

165. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should handle network errors during GitHub OAuth callback
```

166. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should handle GitHub OAuth callback with missing code
```

167. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should return 500 if GITHUB_CLIENT_ID is missing for OAuth initiation
```

168. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > GitHub OAuth Backend > should return 400 if GITHUB_CLIENT_SECRET is missing for OAuth callback
ReferenceError: logger is not defined
 ❯ src/webServer.integration.test.ts:577:25
    575|     vi.clearAllMocks();
    576|     mockRedis._resetStore();
    577|     errorSpy = vi.spyOn(logger, 'error');
       |                         ^
    578|     vi.clearAllMocks();
    579|     mockRedis._resetStore();

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/98]⎯

```

169. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Server Initialization > should handle initialization errors gracefully
ReferenceError: logger is not defined
 ❯ src/webServer.integration.test.ts:769:25
    767|     vi.clearAllMocks();
    768|     mockRedis._resetStore();
    769|     errorSpy = vi.spyOn(logger, 'error');
       |                         ^
    770|   });
    771| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/98]⎯

```

170. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Chat API Backend > should return 500 if jobQueue.add fails
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:796:55
    794|     vi.clearAllMocks();
    795|     mockRedis._resetStore();
    796|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
    797|     errorSpy = vi.spyOn(logger, 'error');
    798|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/98]⎯

```

171. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Job Management Backend > should return 500 if jobQueue.getJob fails in /api/interrupt
```

172. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Job Management Backend > should return 500 if jobQueue.getJob fails in /api/status
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:827:55
    825|     vi.clearAllMocks();
    826|     mockRedis._resetStore();
    827|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
    828|     errorSpy = vi.spyOn(logger, 'error');
    829|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/98]⎯

```

173. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Redis Publish Errors > should return 500 if redis.publish fails in /api/interrupt
```

174. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Redis Publish Errors > should return 500 if redis.publish fails in /api/display
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:875:55
    873|     vi.clearAllMocks();
    874|     mockRedis._resetStore();
    875|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
    876|     errorSpy = vi.spyOn(logger, 'error');
    877|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/98]⎯

```

175. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Memory API Backend > should return 500 if fs.promises.readdir fails
```

176. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Memory API Backend > should return 500 if fs.promises.readFile fails
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:925:55
    923|     vi.clearAllMocks();
    924|     mockRedis._resetStore();
    925|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
    926|     errorSpy = vi.spyOn(logger, 'error');
    927|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/98]⎯

```

177. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Error Handling Middleware > should handle AppError and return custom status code and message
```

178. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Error Handling Middleware > should handle UserError and return custom status code and message
```

179. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Error Handling Middleware > should handle generic Error and return 500
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:973:55
    971|     vi.clearAllMocks();
    972|     mockRedis._resetStore();
    973|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
    974|   });
    975| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/98]⎯

```

180. [ ] **Test Failure:**
```text
 FAIL  src/webServer.integration.test.ts > Authentication Backend > should not require authentication if AUTH_API_KEY is not set
ReferenceError: jobQueue is not defined
 ❯ src/webServer.integration.test.ts:1033:55
    1031|       };
    1032|     });
    1033|     app = await initializeWebServer(mockRedis as any, jobQueue);
       |                                                       ^
    1034|   });
    1035| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/98]⎯

```

181. [ ] **Test Failure:**
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

 ❯ src/webServer.test.ts:128:28
    126|       .send({});
    127|     expect(res.statusCode).toEqual(400);
    128|     expect(res.body.error).toEqual('Le prompt est manquant.');
       |                            ^
    129|   });
    130| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/98]⎯

```

182. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should handle /api/chat/stream/:jobId correctly
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/98]⎯

```

183. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should return 200 for /api/session
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:219:28
    217|       .post('/api/session')
    218|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    219|     expect(res.statusCode).toEqual(200);
       |                            ^
    220|     expect(res.body).toEqual({
    221|       message: 'Session gérée automatiquement via cookie.',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/98]⎯

```

184. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should return memory contents for /api/memory
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:256:28
    254|       .get('/api/memory')
    255|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    256|     expect(res.statusCode).toEqual(200);
       |                            ^
    257|     expect(res.body).toEqual([
    258|       { content: 'content of file1', fileName: 'file1.txt' },

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/98]⎯

```

185. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should save a session via /api/sessions/save
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:274:28
    272|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
    273|       .send(sessionData);
    274|     expect(res.statusCode).toEqual(200);
       |                            ^
    275|     expect(res.body).toEqual({ message: 'Session saved successfully.' …
    276|     expect(redis.set).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/98]⎯

```

186. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should load a session via /api/sessions/:id
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:293:28
    291|       .get('/api/sessions/s1')
    292|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    293|     expect(res.statusCode).toEqual(200);
       |                            ^
    294|     expect(res.body).toEqual(sessionData);
    295|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/98]⎯

```

187. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should delete a session via /api/sessions/:id
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:301:28
    299|       .delete('/api/sessions/s1')
    300|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    301|     expect(res.statusCode).toEqual(200);
       |                            ^
    302|     expect(res.body).toEqual({ message: 'Session deleted successfully.…
    303|     expect(redis.del).toHaveBeenCalledWith('session:s1:data');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/98]⎯

```

188. [ ] **Test Failure:**
```text
 FAIL  src/webServer.test.ts > webServer > should rename a session via /api/sessions/:id/rename
AssertionError: expected 500 to deeply equal 200

- Expected
+ Received

- 200
+ 500

 ❯ src/webServer.test.ts:318:28
    316|       .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
    317|       .send({ newName: 'newName' });
    318|     expect(res.statusCode).toEqual(200);
       |                            ^
    319|     expect(res.body).toEqual({ message: 'Session renamed successfully.…
    320|     expect(redis.set).toHaveBeenCalledWith(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/98]⎯

```

189. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should process a job successfully and return the final response
TypeError: Cannot read properties of undefined (reading 'getSession')
 ❯ Module.processJob src/worker.ts:133:42
    131| 
    132|   try {
    133|     const session = await sessionManager.getSession(job.data.sessionId…
       |                                          ^
    134|     const agent = new Agent(job, session, jobQueue, tools);
    135|     const finalResponse = await agent.run();
 ❯ src/worker.test.ts:108:27

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[20/98]⎯

```

190. [ ] **Test Failure:**
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
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[21/98]⎯

```

191. [ ] **Test Failure:**
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
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/98]⎯

```

192. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[23/98]⎯

```

193. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[24/98]⎯

```

194. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[25/98]⎯

```

195. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[26/98]⎯

```

196. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[27/98]⎯

```

197. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should always publish a "close" event in the finally block
ReferenceError: mockRedis is not defined
 ❯ src/worker.test.ts:347:12
    345|     );
    346| 
    347|     expect(mockRedis.publish).toHaveBeenCalledWith(
       |            ^
    348|       'job:testJobId:events',
    349|       JSON.stringify({ content: 'Stream ended.', type: 'close' }) as s…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[28/98]⎯

```

198. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should call summarizeHistory if history length exceeds max length
TypeError: Cannot read properties of undefined (reading 'getSession')
 ❯ Module.processJob src/worker.ts:133:42
    131| 
    132|   try {
    133|     const session = await sessionManager.getSession(job.data.sessionId…
       |                                          ^
    134|     const agent = new Agent(job, session, jobQueue, tools);
    135|     const finalResponse = await agent.run();
 ❯ src/worker.test.ts:358:27

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[29/98]⎯

```

199. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should not call summarizeHistory if history length does not exceed max length
TypeError: Cannot read properties of undefined (reading 'getSession')
 ❯ Module.processJob src/worker.ts:133:42
    131| 
    132|   try {
    133|     const session = await sessionManager.getSession(job.data.sessionId…
       |                                          ^
    134|     const agent = new Agent(job, session, jobQueue, tools);
    135|     const finalResponse = await agent.run();
 ❯ src/worker.test.ts:367:27

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[30/98]⎯

```

200. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should not call summarizeHistory if history length is exactly max length
TypeError: Cannot read properties of undefined (reading 'getSession')
 ❯ Module.processJob src/worker.ts:133:42
    131| 
    132|   try {
    133|     const session = await sessionManager.getSession(job.data.sessionId…
       |                                          ^
    134|     const agent = new Agent(job, session, jobQueue, tools);
    135|     const finalResponse = await agent.run();
 ❯ src/worker.test.ts:376:27

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[31/98]⎯

```

201. [ ] **Test Failure:**
```text
 FAIL  src/worker.test.ts > processJob > should always publish a "close" event in the finally block, even on unhandled errors
ReferenceError: mockRedis is not defined
 ❯ src/worker.test.ts:389:12
    387|     await processJob(mockJob as Job, mockTools, mockJobQueue).catch(()…
    388| 
    389|     expect(mockRedis.publish).toHaveBeenCalledWith(
       |            ^
    390|       'job:testJobId:events',
    391|       JSON.stringify({ content: 'Stream ended.', type: 'close' }) as s…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[32/98]⎯

```

202. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[33/98]⎯

```

203. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[34/98]⎯

```

204. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[35/98]⎯

```

205. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[36/98]⎯

```

206. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[37/98]⎯

```

207. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[38/98]⎯

```

208. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[39/98]⎯

```

209. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[40/98]⎯

```

210. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[41/98]⎯

```

211. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[42/98]⎯

```

212. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[43/98]⎯

```

213. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[44/98]⎯

```

214. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[45/98]⎯

```

215. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[46/98]⎯

```

216. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[47/98]⎯

```

217. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[48/98]⎯

```

218. [ ] **Test Failure:**
```text
 FAIL  src/modules/agent/agent.test.ts > Agent Integration Tests > should follow the thought-command-result loop
AssertionError: expected [ { …(4) }, { …(4) }, { …(5) }, …(2) ] to deeply equal [ { …(2) }, { …(2) }, { …(2) }, …(2) ]

- Expected
+ Received

  Array [
    Object {
      "content": "Test objective",
-     "role": "user",
+     "id": "63600748-7805-4621-88d6-6dcf5abbe570",
+     "timestamp": 1753364077918,
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
+     "id": "887a427c-e5e4-4182-b6be-73bec7946e3a",
+     "timestamp": 1753364077918,
+     "type": "agent_thought",
    },
    Object {
-     "content": "Tool result: \"tool result\"",
-     "role": "tool",
+     "id": "897a15ce-6ce9-4eb8-a5c6-1a429b3eea27",
+     "result": "tool result",
+     "timestamp": 1753364077918,
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
+     "id": "7e589c8f-17a9-43e2-b9b4-5f1ce12546e8",
+     "timestamp": 1753364077918,
+     "type": "agent_thought",
    },
    Object {
-     "content": "Tool result: {\"answer\":\"Final answer\"}",
-     "role": "tool",
+     "id": "1b64eb44-1b5b-48bc-a3b5-4e1d2f7d04da",
+     "result": Object {
+       "answer": "Final answer",
+     },
+     "timestamp": 1753364077918,
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[49/98]⎯

```

219. [ ] **Test Failure:**
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
    "id": "815148f4-bea8-4bfe-b1e8-c2ef8369efc7",
    "timestamp": 1753364078026,
    "type": "user",
  },
  Object {
    "content": "I will try to use the tool, but it might fail.",
    "id": "b40c24cd-0ea9-4db6-9265-90667db94cc5",
    "timestamp": 1753364078026,
    "type": "agent_thought",
  },
  Object {
    "id": "c1b0d0e8-ff9d-457e-825b-9874d4a781c0",
    "result": "Error executing tool test-tool: Error during tool execution",
    "timestamp": 1753364078026,
    "toolName": "test-tool",
    "type": "tool_result",
  },
  Object {
    "content": "The tool execution failed with the following error: Error executing tool test-tool: Error during tool execution. Please analyze the error and try a different approach. You can use another tool, or try to fix the problem with the previous tool.",
    "id": "df297b20-d476-402c-8715-8867dfa59b25",
    "timestamp": 1753364078026,
    "type": "error",
  },
  Object {
    "content": "Recovered from tool error",
    "id": "961a31be-4d40-486d-9b5b-c0fb09ddb059",
    "timestamp": 1753364078026,
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[50/98]⎯

```

220. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[51/98]⎯

```

221. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[52/98]⎯

```

222. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[53/98]⎯

```

223. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[54/98]⎯

```

224. [ ] **Test Failure:**
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
    "id": "19b7cce6-ceb9-4ca2-a35f-e85b5398a8d3",
    "timestamp": 1753364078078,
    "type": "user",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "82eed826-7457-4c01-9a23-81a9d1cdf7d7",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "ede4fe8c-8e2a-4679-8d80-5c49196484aa",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "c24917df-cf7b-46ba-9820-cede48b5b972",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "2cde036b-fc13-4d63-ac7f-366cb494a8f2",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "204ac6ef-a92c-4b17-84bc-a805d1693838",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "ad16abe4-5f7c-4b63-8b25-56eb8b74b0b8",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "08a3ffd0-fc64-477a-a4f4-9b9f620f0402",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "4037c227-b0a2-4a94-a747-f680ee7832be",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "4fb4b7f3-9969-4e32-95b6-793b2b5a8ac8",
    "timestamp": 1753364078078,
    "type": "error",
  },
  Object {
    "content": "You must provide a command, a thought, a canvas output, or a final answer.",
    "id": "e650393f-e44b-45a6-8597-6f9f536d363a",
    "timestamp": 1753364078078,
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[55/98]⎯

```

225. [ ] **Test Failure:**
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
    "id": "e2af80d8-5716-4af4-b44c-fa0daebdd5c2",
    "timestamp": 1753364078103,
    "type": "user",
  },
  Object {
    "content": "I was unable to parse your last response. Please ensure your response is a valid JSON object with the expected properties (`thought`, `command`, `canvas`, or `answer`). Check for syntax errors, missing commas, or unclosed brackets.",
    "id": "02a666e1-3ddb-4350-85f0-9451ba185c58",
    "timestamp": 1753364078103,
    "type": "error",
  },
  Object {
    "content": "Recovered from parsing error",
    "id": "a0b09793-dd6f-44bc-83ff-632fca0967e2",
    "timestamp": 1753364078103,
    "type": "agent_response",
  },
]

 ❯ src/modules/agent/agent.test.ts:441:33


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[56/98]⎯

```

226. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[57/98]⎯

```

227. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[58/98]⎯

```

228. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[59/98]⎯

```

229. [ ] **Test Failure:**
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
      "[{\"content\":\"Test\",\"id\":\"1\",\"timestamp\":1753364078709,\"type\":\"user\"}]",
-     1753364078709,
+     "1753364078709",
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[60/98]⎯

```

230. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[61/98]⎯

```

231. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[62/98]⎯

```

232. [ ] **Test Failure:**
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
+     "jobId": "shell-command-1753364077659-u8kmis2",
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[63/98]⎯

```

233. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[64/98]⎯

```

234. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[65/98]⎯

```

235. [ ] **Test Failure:**
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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[66/98]⎯

⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯

Vitest caught 1 unhandled error during the test run.
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
 ❯ src/webServer.test.ts:74:17
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:60:26
 ❯ ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:59
 ❯ callSuiteHook ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:700:47
 ❯ runSuite ../../node_modules/.pnpm/@vitest+runner@1.6.1/node_modules/@vitest/runner/dist/index.js:892:33

This error originated in "src/webServer.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
The latest test that might've caused the error is "should return 200 for /api/health". It might mean one of the following:
- The error was thrown, while Vitest was running this test.
- If the error occurred after the test had been completed, this was the last documented test before it was thrown.
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
```

---

✗ 3 type(s) de vérification ont échoué : TypeCheck Core Lint Tests.
Veuillez consulter le fichier all-checks.md pour les 235 erreur(s) détaillée(s).

