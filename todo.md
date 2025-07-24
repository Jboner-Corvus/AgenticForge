
23. [ ] **packages/ui/src/components/Message.tsx:2018** - Les composants `Message` sont rendus dans une boucle `.map()`. Sans mémorisation (`React.memo`), chaque `Message` sera rendu à nouveau chaque fois que la liste des messages change, ce qui est inefficace pour les longues conversations.
24. [ ] **packages/ui/src/lib/store.ts:2672** - L'hydratation initiale de la session se fait via `localStorage`, ce qui peut provoquer un "flash" de contenu obsolète avant que les données fraîches du backend ne soient chargées. Le flux de données devrait prioriser la récupération des données depuis le backend, en n'utilisant `localStorage` que comme un cache de secours. 
25. [ ] **Vite/React Build**: L'application UI est construite comme un bundle JavaScript unique. ]Pour une interface aussi complexe, la mise en place du **"code splitting"** (division du code) et du **chargement paresseux** (`React.lazy`) pour les composants non critiques (comme les modales ou les onglets du panneau de contrôle) réduirait considérablement la taille du bundle initial et améliorerait le temps de premier chargement. 
26. [ ] **packages/core/src/webServer.ts:800** - L'authentification est gérée par un simple Bearer Token statique dans la configuration. Le script `exec.bat` le stocke en clair. Une stratégie unifiée et plus sécurisée comme **OAuth2** (déjà initiée pour GitHub) devrait être appliquée à toutes les interactions API pour une meilleure gestion de la sécurité et des accès. 
27. [ ] **packages/core/src/modules/session/sessionManager.ts:683** - Le `SessionManager` charge l'historique complet de la session depuis Redis à chaque début de tâche. Pour des conversations très longues (même après résumé), cela reste inefficace. Une optimisation consisterait à n'extraire que les N messages les plus récents nécessaires au contexte.
28. [ ] **packages/core/src/utils/toolLoader.ts:2668** - L'application charge la configuration et les outils au démarrage. Toute modification du fichier `.env` ou l'ajout d'un nouvel outil nécessite un redémarrage complet du serveur. Mettre en place un mécanisme de **rechargement à chaud** de la configuration améliorerait grandement la flexibilité.
29. [ ] **docker-compose.yml:2795** - Redis est utilisé à la fois comme file d'attente et comme base de données pour les sessions. Pour assurer la durabilité et la scalabilité des données de session, il serait plus robuste d'utiliser une base de données transactionnelle comme **PostgreSQL** pour le stockage, en conservant Redis pour la mise en cache et les files d'attente. 
30. [ ] **packages/ui/src/lib/hooks/useAgentStream.ts:1990** - Lors de la mise à jour d'un `tool_result` avec des données de `tool_stream`, le contenu est concaténé côté client. Pour des flux très importants, cela implique de recréer l'objet message à chaque fois. Un flux optimisé enverrait des événements d'ajout ("append") pour une mise à jour plus efficace du DOM. 
31. [ ] **run.sh:1629** - La fonction `run_all_checks` génère un rapport en parsant la sortie texte des outils. Cette méthode est fragile. Utiliser des formateurs de sortie JSON (ex: `eslint --format json`) permettrait une analyse plus fiable. 
32. [ ] **docker-compose.yml:2765** - Le `healthcheck` pour le service `server` a un `start_period` de 120 secondes, suggérant un temps de démarrage lent qui pourrait être optimisé pour améliorer l'expérience de développement. 
33. [ ] **packages/core/src/modules/agent/agent.ts:543** - Un événement `tool.start` est émis par le backend mais n'est pas géré par l'interface, tandis que l'interface crée un message `tool_call` à partir de la réponse du LLM. Ce flux de données redondant devrait être unifié.





1. [ ] **packages/ui/src/lib/hooks/useAgentStream.ts:2046** - La logique de gestion des événements `tool_stream` est complexe car elle doit déduire le nom de l'outil en parcourant l'historique des messages. C'est une approche fragile. Le backend devrait inclure le `toolName` dans chaque événement `tool_stream` pour simplifier la logique client et la rendre plus robuste.
2. [ ] **packages/ui/src/components/ControlPanel.tsx:1581** - Le composant utilise les boîtes de dialogue natives du navigateur (`prompt`, `confirm`) pour sauvegarder et supprimer des sessions. Celles-ci sont bloquantes, non stylisables et offrent une mauvaise expérience utilisateur. Il faudrait utiliser systématiquement le composant `Modal` personnalisé, comme c'est déjà le cas pour le renommage.
3. [ ] **packages/ui/src/lib/store.ts:2356** - La fonction `loadSession` contient une logique complexe côté client pour analyser et reconstruire des messages typés à partir d'un rôle générique "assistant". Le backend devrait envoyer des objets messages entièrement typés pour éliminer cette logique d'analyse fragile et sujette aux erreurs.
4. [ ] **packages/ui/src/App.tsx:1470** - La persistance de la session et des messages est gérée directement avec `localStorage` dans des `useEffect`. Cette approche est peu sécurisée (vulnérable au XSS) et ne permet pas la portabilité des sessions entre appareils. Cette logique devrait être centralisée et utiliser un mécanisme plus sécurisé comme les cookies httpOnly gérés par le backend.
5. [ ] **packages/ui/src/App.tsx:1473** - La logique de redimensionnement des panneaux latéraux est implémentée directement dans le composant `App.tsx`. Elle devrait être extraite dans un hook personnalisé réutilisable (ex: `useResizablePanel`) pour améliorer l'organisation du code et sa réutilisabilité.

packages/core/src/modules/tools/definitions/code/executeShellCommand.tool.ts:67 - The tool's description explicitly states it can execute ANY shell command, which poses a significant security risk. The 

TODO comment acknowledges the lack of input sanitization, leaving the application vulnerable to shell injection attacks where a malicious actor could execute arbitrary commands on the host system.

[ ] packages/core/src/modules/tools/definitions/fs/readFile.tool.ts:173 - The file path validation relies on resolvedPath.startsWith(config.WORKSPACE_PATH). This check can be fragile and potentially bypassed with clever path manipulation (e.g., using symlinks or character encoding tricks), leading to path traversal vulnerabilities. A more robust sandboxing or chrooting mechanism is needed.

[ ] 

packages/ui/src/App.tsx:1470 - The application uses localStorage to store session IDs and message history. 



localStorage is accessible by any client-side JavaScript, making it a prime target for Cross-Site Scripting (XSS) attacks to steal session information. Secure, httpOnly cookies are the recommended best practice for session management.

[ ] 

packages/ui/src/lib/api.ts:2098 - The frontend API client sends the session ID as a custom X-Session-ID header. This confirms that session management is handled manually on the client-side, exposing the session ID to JavaScript and making it more vulnerable compared to using secure, 

httpOnly cookies that are handled automatically by the browser.

[ ] 

packages/ui/src/components/AgentOutputCanvas.tsx:1719 - The iframe used to display URL content has a sandbox attribute that includes allow-scripts and allow-same-origin. If the agent is tricked into loading a malicious URL, these permissions could be exploited for attacks like phishing or XSS within the context of the AgenticForge application. The sandbox attributes should be as restrictive as possible.

Performance & Efficiency
[ ] 

packages/core/src/modules/tools/definitions/web/browser.tool.ts:343 - A new Playwright browser instance is launched and closed for every single execution of the browser tool. This is highly inefficient and slow. For tasks requiring multiple web interactions, a persistent browser instance should be managed and reused across tool calls.


[ ] 

packages/core/src/modules/tools/definitions/fs/writeFile.tool.ts:209 - Before writing a file, the tool reads the entire existing file into memory to check if the content is identical. For large files, this is extremely memory-intensive and inefficient. A better approach for large files would be to compare file hashes or use a streaming comparison.

[ ] 

packages/core/src/modules/tools/definitions/fs/editFile.tool.ts:115 - For non-regex replacements, the code uses originalContent.split(args.content_to_replace).join(args.new_content). This method is less efficient than a simple 

string.replace() and can have unexpected behavior if the content to replace contains special characters.

[ ] 

packages/core/src/utils/toolLoader.ts:849 - The tool loader appends ?update=${Date.now()} to the import path to bypass the module cache for hot-reloading. This is a hacky approach that can lead to memory leaks over time, as old versions of the modules may not be properly garbage-collected. A more robust hot-reloading strategy, like restarting the worker process, should be used.

[ ] 

packages/core/src/utils/llmProvider.ts:651 - The GeminiProvider, HuggingFaceProvider, MistralProvider, and OpenAIProvider classes all contain significant amounts of duplicated code, especially for request/response logic, error handling, and token counting. This could be abstracted into a base class to reduce redundancy and improve maintainability.




Robustness & Error Handling
[ ] 

packages/core/src/modules/tools/definitions/system/finish.tool.ts:307 - The finishTool uses a custom FinishToolSignal error to signal the successful completion of the agent's task. Using exceptions for non-exceptional control flow is generally considered an anti-pattern. It can obscure the actual flow of logic and be confused with real errors.

[ ] 

packages/ui/src/lib/hooks/useAgentStream.ts:2258 - The frontend logic for handling tool_stream messages has to infer the current tool's name by searching backwards through the message history. This is unreliable, especially with concurrent tool calls. The backend should include the 

toolName within every tool_stream event to make the client-side logic simpler and more robust.

[ ] 

packages/core/src/modules/agent/agent.ts:1090 - The agent's loop detection is very basic, only checking if the exact same command is repeated more than three times. It would fail to detect more complex loops (e.g., alternating between two different failing commands). A more sophisticated loop detection mechanism that considers command patterns is needed.

[ ] 

packages/core/src/modules/session/sessionManager.ts:1369 - If the history summarization process fails, the error is simply logged, and the session is saved with its oversized history. There is no retry mechanism or strategy to handle this failure, which could lead to unbounded memory usage for a session over time.

[ ] 

packages/core/src/utils/qualityGate.ts:780 - The quality gate runs commands like pnpm run lint:fix and pnpm run format. A quality gate's purpose is to 

verify code quality, not to silently fix issues. Automatically fixing files can mask underlying problems and lead to unexpected changes in the codebase.

Maintainability & Code Quality
[ ] 

packages/core/src/modules/agent/orchestrator.prompt.ts:1171 - The file contains a hand-rolled implementation of a Zod to JSON Schema converter. This is complex and likely doesn't cover all edge cases. The project should use a dedicated, well-tested library like 

zod-to-json-schema, especially since the test files for this very module already mock it, indicating it was the intended approach.

[ ] 

packages/core/src/modules/tools/definitions/system/createTool.tool.ts:280 - The code for generating a new tool file uses a long chain of .replace() calls on a string template. This is hard to read, error-prone, and difficult to maintain. A simple templating engine would make the code cleaner and more robust.

[ ] 

packages/ui/src/lib/store.ts:2519 - The main Zustand store is a single, massive object containing UI state, data state, and actions. This monolithic approach makes the store difficult to manage and test. It should be refactored into smaller, more focused state slices (e.g., 

sessionSlice, uiSlice, agentSlice).

[ ] 

packages/ui/src/components/ControlPanel.tsx:1795 - The component uses window.prompt() to get a name when saving a session. This is a blocking, un-stylable browser default that provides a poor user experience. The application should consistently use its own custom 

Modal component for user input.

[ ] 

run.sh:2680 - The main run.sh script is a monolithic script over 400 lines long that handles Docker orchestration, local worker management, and development tasks (linting, testing, etc.) . This script should be broken down into smaller, more focused scripts (e.g., 

docker-ctl.sh, dev-tasks.sh) to improve readability and maintainability.

[ ] 

packages/core/src/modules/agent/agent.ts:1052 - The Agent constructor takes an optional tools array as an argument, but this array is immediately overwritten when the agent loads all tools from the toolRegistry inside the run method. The constructor parameter is misleading and should be removed.


[ ] 

packages/ui/src/lib/store.ts:2571 - The loadSession function contains complex logic to parse a generic "assistant" message from the backend and determine its specific type (e.g., tool_call, error, agent_response) on the client-side. This makes the frontend fragile. The backend should be responsible for sending messages with their definitive types, removing this guesswork from the client.









22. [ ] **packages/ui/src/lib/hooks/useAgentStream.ts:2371** - Le flux de données entre le client et le serveur utilise SSE (unidirectionnel). Pour des interactions plus complexes en temps réel (par exemple, envoyer des données à un outil en cours d'exécution), **WebSockets** (bidirectionnel) serait plus approprié.