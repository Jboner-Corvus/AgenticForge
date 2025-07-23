# Project Data Flow and Architecture Overview

This document outlines the core data flow and architectural components of the AgenticForge project, based on a deep scan of the `packages/core/src` directory.

## Core Components and Their Interactions:

1.  **Web Server (`webServer.ts`):**
    *   **Role:** The primary entry point for all external interactions, handling HTTP requests and serving the frontend.
    *   **Inputs:** HTTP requests from users (e.g., chat prompts, API key management, session operations, GitHub OAuth callbacks).
    *   **Outputs:** HTTP responses (JSON data, redirects, static files), real-time updates via Server-Sent Events (SSE).
    *   **Key Interactions:**
        *   **Session Management:** Uses cookies and `x-agenticforge-session-id` header to manage user sessions. Session data (history, context) is stored in **Redis**.
        *   **Job Queueing:** Adds new chat prompts as "jobs" to the `jobQueue` (BullMQ, backed by **Redis**).
        *   **Real-time Updates (SSE):** Subscribes to Redis Pub/Sub channels (`job:${jobId}:events`) to stream real-time updates (agent thoughts, tool outputs, errors) from the worker back to the frontend.
        *   **API Key Management:** Exposes endpoints for adding, retrieving, and deleting LLM API keys, interacting with `LlmKeyManager` (which uses **Redis**).
        *   **Session Persistence:** Provides API endpoints for saving, loading, deleting, and renaming user sessions, all interacting directly with **Redis**.
        *   **Leaderboard Statistics:** Retrieves and exposes statistics (sessions created, tokens saved, successful runs) from **Redis**.
        *   **File Memory:** Reads and serves content from the local `workspace` directory.
        *   **GitHub OAuth:** Initiates and handles GitHub OAuth callbacks, storing the obtained access token in **Redis** associated with the session ID.

2.  **Worker (`worker.ts`):**
    *   **Role:** The background process responsible for executing long-running tasks, primarily processing chat prompts.
    *   **Inputs:** Jobs from the `tasks` queue (BullMQ, backed by **Redis**).
    *   **Outputs:** Agent responses, real-time progress updates, and error messages.
    *   **Key Interactions:**
        *   **Job Processing:** Listens to and processes jobs from the `tasks` queue.
        *   **Session Retrieval:** Fetches session data from **Redis** using `SessionManager`.
        *   **Agent Execution:** Initializes and runs the `Agent` for each job. The `Agent` orchestrates LLM calls and tool executions.
        *   **Real-time Event Publishing:** Publishes updates (e.g., agent thoughts, tool outputs, errors) to **Redis** channels (`job:${jobId}:events`), which are then consumed by the Web Server for SSE.
        *   **History Summarization:** Uses the `summarizeTool` (which involves an LLM call) to summarize conversation history when it exceeds a configured length.
        *   **Session Saving:** Saves updated session data (including new messages and summaries) back to **Redis** via `SessionManager`.
        *   **Leaderboard Updates:** Increments `leaderboard:successfulRuns` in **Redis** upon successful job completion.
        *   **Detached Shell Commands:** Initiates a `shellCommandWorker` for executing shell commands in a separate process.

3.  **LLM Module (`llm-types.ts`, `LlmKeyManager.ts`, `llmProvider.ts`):**
    *   **Role:** Manages LLM API keys and provides an interface for interacting with various Large Language Models.
    *   **`llm-types.ts`:** Defines the structure for LLM messages (`LLMContent`).
    *   **`LlmKeyManager.ts`:**
        *   **Role:** Handles the lifecycle of LLM API keys.
        *   **Storage:** Stores API keys in **Redis**.
        *   **Features:** Manages key rotation, tracks error counts (temporary vs. permanent disabling), and selects the next available key based on usage and error status.
    *   **`llmProvider.ts`:**
        *   **Role:** Abstracts interactions with different LLM providers (Gemini, OpenAI, Mistral, HuggingFace).
        *   **Interactions:** Uses `LlmKeyManager` to obtain valid API keys and makes `fetch` requests to the respective LLM APIs.
        *   **Leaderboard Updates:** Increments `leaderboard:tokensSaved` in **Redis** based on estimated token usage.

4.  **Queue Module (`queue.ts`, `shellCommandWorker.ts`):**
    *   **Role:** Manages asynchronous job processing using BullMQ.
    *   **`queue.ts`:**
        *   **Role:** Defines the main BullMQ job queue (`tasks`) and a `dead-letters` queue.
        *   **Backend:** Both queues are backed by **Redis**.
    *   **`shellCommandWorker.ts`:**
        *   **Role:** A specialized worker for executing shell commands in a detached child process.
        *   **Inputs:** Jobs of type `execute-shell-command-detached` from the queue.
        *   **Outputs:** Streams `stdout` and `stderr` of the executed commands back to the Web Server via **Redis** Pub/Sub.

5.  **Redis (`redisClient.ts`):**
    *   **Role:** The central, high-performance in-memory data store for the entire application.
    *   **Data Stored:**
        *   **Session Data:** User session history and context.
        *   **LLM API Keys:** Managed by `LlmKeyManager`.
        *   **Job Queues:** The backbone for BullMQ (`tasks`, `dead-letters`).
        *   **Real-time Events:** Used for Pub/Sub to stream updates from workers to the Web Server (SSE).
        *   **Leaderboard Statistics:** Stores counts for `sessionsCreated`, `tokensSaved`, and `successfulRuns`.
        *   **GitHub Access Tokens:** Temporarily stores GitHub OAuth access tokens.

6.  **Configuration (`config.ts`):**
    *   **Role:** Centralized management of application settings and environment variables.
    *   **Validation:** Uses Zod for schema validation of environment variables.
    *   **Key Settings:** Includes LLM provider and model names, API keys, Redis connection details, worker concurrency, history length, and paths.

7.  **Tools Module (`utils/toolLoader.ts`, `modules/tools/definitions`):**
    *   **Role:** Provides the set of capabilities (tools) that the `Agent` can utilize. These tools should be designed to operate anywhere within the system and interact with various system resources.
    *   **`toolLoader.ts`:** Dynamically discovers and loads tool definitions from the `modules/tools/definitions` directory.
    *   **`modules/tools/definitions`:** Contains the actual implementations of various tools (e.g., `summarize.tool.ts`, `shell.tool.ts`, `read_file.tool.ts`, `write_file.tool.ts`). These tools encapsulate specific functionalities that the LLM can invoke.

## Overall Data Flow Summary:

The system operates as a reactive, event-driven architecture centered around Redis. User requests are received by the **Web Server**, which often queues them as jobs in **Redis** for asynchronous processing by the **Worker**. The **Worker** then orchestrates the `Agent`, which leverages **LLMs** (managed by `LlmKeyManager` and `llmProvider`) and various **Tools** (including shell commands processed by `shellCommandWorker`). Real-time feedback and results are published back to **Redis** and streamed to the user via SSE. All critical application state, configuration, and metrics are persistently stored in **Redis**.

## TODO: Deeper Analysis and Potential Improvements

*   **Data Structures in Redis:**
    *   **Sessions:** Currently stored as JSON strings (`session:${id}:data`). Consider using Redis Hashes for more granular updates and potentially better performance for large session objects.
    *   **LLM API Keys:** Stored as a Redis List (`llmApiKeys`) of JSON strings. This works, but could be optimized for frequent updates/deletions if the list grows very large. Consider a Redis Hash where keys are `provider:key_value` for direct access.
    *   **Leaderboard:** Simple string increments (`leaderboard:sessionsCreated`, `leaderboard:tokensSaved`, `leaderboard:successfulRuns`). This is efficient for simple counters.
    *   **GitHub Access Tokens:** Stored as simple strings with an expiry (`github:accessToken:${req.sessionId}`). This is appropriate for temporary tokens.

*   **Error Handling Flow:**
    *   **Centralized Error Handling:** `handleError` in `webServer.ts` catches most API errors. Ensure consistent error logging and user-friendly messages across all API endpoints.
    *   **Worker Error Handling:** `worker.ts` catches errors during agent execution and publishes them to Redis. Review if all potential error types (e.g., tool execution failures, LLM API errors) are adequately categorized and communicated to the frontend.
    *   **Retry Mechanisms:** BullMQ provides built-in retry mechanisms. Verify that job configurations leverage these appropriately for transient errors (e.g., temporary LLM API outages).
    *   **Dead Letter Queue:** Jobs that fail after all retries go to the `dead-letters` queue. Implement monitoring and alerting for this queue to ensure failed jobs are investigated.

*   **Security Considerations:**
    *   **Redis Security:** `LlmKeyManager` stores keys in Redis. While Redis can be secured, ensure Redis itself is properly secured (e.g., strong passwords, network isolation) in production environments.

*   **Scalability Aspects:**
    *   **Redis as Bottleneck:** While Redis is fast, it can become a bottleneck if not properly scaled. Consider Redis clustering or sharding for very high-throughput scenarios.
    *   **Worker Concurrency:** `WORKER_CONCURRENCY` in `config.ts` controls parallel job processing. Optimize this based on available CPU/memory resources and LLM API rate limits.
    *   **LLM API Rate Limits:** `LlmKeyManager` attempts to manage this by disabling bad keys, but explicit rate limiting at the application level (e.g., using a token bucket algorithm) might be beneficial.
    *   **SSE Scalability:** For a very large number of concurrent users, managing SSE connections directly from the Node.js server might become resource-intensive. Consider dedicated SSE services or WebSockets for higher scalability.

*   **Frontend Interaction (Briefly):**
    *   The frontend (UI package) consumes the backend APIs and SSE streams to provide a dynamic user experience.
    *   It sends chat prompts to `/api/chat` and then subscribes to `/api/chat/stream/:jobId` for real-time updates.
    *   It interacts with session management, API key management, and leaderboard APIs to display relevant information.

*   **Tool Execution Flow (More Granular):**
    *   **Agent Orchestration:** The `Agent` in `worker.ts` receives the user prompt and conversation history.
    *   **LLM Call:** The `Agent` constructs a prompt (including persona, tools, and history) and sends it to the `llmProvider`.
    *   **Tool Selection/Parameters:** The LLM's response is expected to be a JSON object containing a `command` (tool name and parameters) or an `answer`.
    *   **Tool Invocation:** If a `command` is returned, the `Agent` dynamically invokes the corresponding tool's `execute` method.
    *   **Tool Output Handling:** The output of the tool execution is then added to the conversation history and potentially streamed back to the frontend via Redis Pub/Sub.
    *   **Iterative Process:** The `Agent` can continue this loop (LLM call -> tool execution -> LLM call) until a final `answer` is generated or a maximum iteration limit is reached.

*   **Existing Tool Optimization (TODO):**
    *   **Refine Tool Capabilities:** Enhance the existing tools (`summarize.tool.ts`, `shell.tool.ts`, `read_file.tool.ts`, `write_file.tool.ts`, etc.) to improve their efficiency, robustness, and flexibility.
        *   **`readFolder` Tool:** Implement a new tool to read the contents of any specified directory, including hidden files, and return a structured list of its contents.
    *   **Error Handling in Tools:** Implement more granular error handling within each tool to provide clearer feedback to the agent and the user.
    *   **Input/Output Validation:** Strengthen input validation for tool parameters and ensure consistent output formats.
    *   **Performance Improvements:** Identify and address any performance bottlenecks within tool implementations.
    *   **Location Agnostic Operation:** Ensure all tools are designed to operate effectively regardless of their execution environment or current working directory, leveraging absolute paths and robust error handling where applicable.

This expanded analysis provides a more detailed understanding of the project's internal workings and highlights areas for future development and optimization.