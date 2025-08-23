# AgenticForge Core Package

## Description

The core package is the backbone of the AgenticForge platform, providing the essential backend functionality for the AI agent system. It handles agent orchestration, tool management, session handling, and communication with the frontend through a REST API and real-time event streaming.

## Key Components

### 🤖 Agent Orchestration
The core package implements the main AI agent logic that:
- Processes user requests and goals
- Orchestrates tool execution
- Manages conversation flow and context
- Handles complex task decomposition

### 🛠️ Tool System
The package includes a comprehensive tool management system:
- Dynamic tool loading and registration
- MCP (Model Context Protocol) tool integration
- Custom tool execution environment
- Real-time tool streaming to frontend

### 📝 Session Management
Handles user sessions and conversation history:
- Persistent session storage using PostgreSQL
- Conversation history management
- Session state tracking

### 🔧 Queue Processing
Implements background job processing:
- Redis-based job queue using BullMQ
- Concurrent task execution
- Worker process management

### 🔌 API Layer
Provides RESTful API endpoints:
- Session management endpoints
- Message submission and streaming
- Tool execution interfaces
- Health checks and monitoring

## Technologies Used

- **Node.js** with TypeScript
- **Express.js** for the web server
- **PostgreSQL** for persistent storage
- **Redis** for caching and message queuing
- **BullMQ** for job queue management
- **FastMCP** for MCP tool integration
- **Playwright** for web automation
- **Pino** for logging
- **Zod** for schema validation

## Architecture Overview

```
┌─────────────────┐    ┌──────────────┐    ┌────────────────┐
│   Frontend      │────│  Web Server  │────│  PostgreSQL    │
│   (React)       │    │  (Express)   │    │  (Sessions)    │
└─────────────────┘    └──────────────┘    └────────────────┘
                              │
                       ┌──────────────┐
                       │   Redis      │
                       │  (Queue &    │
                       │   Cache)     │
                       └──────────────┘
                              │
                       ┌──────────────┐
                       │   Worker     │
                       │  (Agent &    │
                       │   Tools)     │
                       └──────────────┘
```

## Development

### Installation

```bash
pnpm install
```

### Running in Development Mode

```bash
# Start the main server
pnpm dev

# Start the worker process
pnpm start:worker:dev
```

### Building for Production

```bash
pnpm build
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration
```

### Code Quality

```bash
# Lint the code
pnpm lint

# Type checking
pnpm typecheck

# Format the code
pnpm format
```

## API Endpoints

### Session Management
- `POST /api/v1/session` - Create a new session
- `GET /api/v1/session/:id` - Get session information
- `DELETE /api/v1/session/:id` - Delete a session

### Message Processing
- `POST /api/v1/agent/stream` - Submit a message and stream the response
- `GET /api/v1/agent/stream/:jobId/events` - Event stream for a specific job

### Tool Management
- `GET /api/v1/tools` - List available tools
- `POST /api/v1/tools` - Register a new tool
- `DELETE /api/v1/tools/:name` - Remove a tool

### System Information
- `GET /api/version/current` - Get current version information
- `GET /api/version/check` - Check for updates
- `GET /health` - Health check endpoint

## Configuration

The core package is configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_PORT` | Port for the main API server | 8080 |
| `REDIS_HOST` | Redis server hostname | localhost |
| `REDIS_PORT` | Redis server port | 6379 |
| `DATABASE_URL` | PostgreSQL connection string | postgresql://localhost/agenticforge |
| `LLM_API_KEY` | Default LLM API key | - |
| `LLM_PROVIDER` | Default LLM provider | gemini |
| `LLM_MODEL_NAME` | Default LLM model | gemini-2.5-pro |

## Logging

The package uses Pino for structured logging. Logs are output in JSON format for easy parsing and analysis.

## Error Handling

The core package implements comprehensive error handling:
- Custom error classes for different error types
- Graceful degradation for non-critical failures
- Detailed error reporting for debugging

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## License

MIT