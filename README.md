<p align="center">
  <img src="assets/title.png" alt="Agentic Forge Logo" width="250">
</p>

<h1 align="center">AgenticForge</h1>

<p align="center">
  <img src="https://img.shields.io/badge/🔨-Agentic_Forge-orange?style=for-the-badge" alt="Agentic Forge Logo">
</p>
<p align="center">
  <strong>🌐 Available Languages</strong><br>
  <a href="README.md">English</a> • 
  <a href="README_FR.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      A private and local alternative to MANUS.
</h3>

<p align="center">
  <em>
    A 100% autonomous, free and local AI agent that forges its own tools, writes code and executes complex tasks, while keeping all data on your device. Based on the MCP (Model Context Protocol) with FastMCP as engine, it is designed for local reasoning models and adaptable to your favorite LLM API, ensuring total privacy and no cloud dependencies.
  </em>
</p>
<br>
<p align="center">
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square&logo=opensource&logoColor=white" alt="MIT License"> <img src="https://img.shields.io/github/stars/Jboner-Corvus/AgenticForge?style=flat-square&logo=github&color=gold" alt="Stars"> <img src="https://img.shields.io/github/forks/Jboner-Corvus/AgenticForge?style=flat-square&logo=git&color=blue" alt="Forks"> <img src="https://img.shields.io/github/issues/Jboner-Corvus/AgenticForge?style=flat-square&logo=github" alt="Issues">
</p>
<p align="center">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
    <img src="https://img.shields.io/badge/MCP-000000?style=for-the-badge&logoColor=white" alt="MCP">
    <img src="https://img.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
</p>

## Why Agentic Forge?

🔒 **Fully Local and Private** - Everything runs on your machine — no cloud, no data sharing. Your files, conversations and tools remain private.

🛠️ **Self-Tool Forging** - Agentic Forge can create its own tools — when it lacks a capability, it writes the code to build it.

💻 **Autonomous Coding Assistant** - Need code? It can write, debug and execute programs in Python, TypeScript, Bash and more — without supervision.

🧠 **Intelligent Tool Selection** - You ask, it automatically finds the best tool for the job. Like having a forge of experts ready to help.

📋 **Plans and Executes Complex Tasks** - From file management to web scraping — it can divide large tasks into steps and forge the tools to accomplish the work.

🌐 **Smart Web Navigation** - Agentic Forge can browse the internet autonomously — search, read, extract info, automate tasks — all without intervention.

🚀 **Powered by FastMCP** - Uses the MCP (Model Context Protocol) with FastMCP as ultra-performant framework — a real rocket for LLM interactions.

---

## Demo

> **"Can you create a tool to analyze my CSV files, then use it to generate a report from sales_data.csv?"**

---

## 🛠️ ⚠️ Active Work in Progress

🙏 This project started to prove that MCP was better than API and has grown beyond expectations. Contributions, feedback and patience are deeply appreciated as we forge ahead.

---

## Prerequisites

Before starting, make sure you have the following software installed:

- **Git**: To clone the repository. [Download Git](https://git-scm.com/)
- **Node.js 20+**: For the web interface. [Download Node.js](https://nodejs.org/)
- **pnpm**: Package manager. Install with `npm install -g pnpm`
- **Redis**: To manage task queues and sessions. [Install Redis](https://redis.io/topics/installation)

---

## 1. Clone the repository

```bash
git clone https://github.com/your-username/agentic-forge.git
cd agentic-forge
```

## 2. Run the installation script

Make the management script executable and run it. This will guide you through the setup process.

```bash
chmod +x run.sh
./run.sh
```

On the first run, the script will:
1.  Check for a `.env` file and create one if it doesn't exist.
2.  Install all necessary dependencies using `pnpm`.
3.  Build the project.

## 3. Configure your environment

Once the `.env` file is created, open it and fill in the values with your own credentials.

```env
# Configuration for a LOCAL environment
HOST_PORT=8080
PORT=3001
WEB_PORT=3002
API_URL=http://localhost:3001
NODE_ENV=development
LOG_LEVEL=info
AUTH_TOKEN="votre-token-secret"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""
LLM_API_KEY="votre-cle-gemini"
LLM_MODEL_NAME=gemini-1.5-flash
```

**Important**:

- Set a strong `AUTH_TOKEN` (32+ characters recommended)
- API keys are optional if you use local models

---

## 4. Start the Application

Use the management console to start the application.

Launch the interactive console:

```bash
./run.sh
```

From the console menu, select option **1) 🟢 Démarrer Tous les Services**. This will start the backend server, the UI, the worker, and a local Redis instance.

---

## Local LLM Configuration (Recommended)

### Hardware Requirements

| Model Size | GPU Memory | Performance              |
| ---------- | ---------- | ------------------------ |
| 7B         | 8GB VRAM   | ⚠️ Basic tasks only      |
| 14B        | 12GB VRAM  | ✅ Most tasks work well  |
| 32B        | 24GB VRAM  | 🚀 Excellent performance |
| 70B+       | 48GB+ VRAM | 💪 Professional quality  |

### Setup with Ollama (Recommended)

1.  **Install Ollama**: [Download Ollama](https://ollama.ai/)
2.  **Start Ollama**:
    ```bash
    ollama serve
    ```
3.  **Download a reasoning model**:
    ```bash
    ollama pull deepseek-r1:14b
    # or for more power: ollama pull deepseek-r1:32b
    ```
4.  **Update configuration** in `.env`:
    ```env
    LLM_MODEL_NAME="deepseek-r1:14b"
    LLM_API_BASE_URL="http://localhost:11434"
    ```

---

## Access Points

Once services are running:

| Service           | URL                                       | Description           |
| ----------------- | ----------------------------------------- | --------------------- |
| **Web Interface** | http://localhost:3002                     | Main user interface   |
| **API Endpoint**  | http://localhost:3001/api/v1/agent/stream | Direct API access     |
| **Health Check**  | http://localhost:3001/api/health          | Service health status |

### Quick Test

```bash
# Health check
curl http://localhost:3001/api/health

# API test
curl -X POST http://localhost:3001/api/v1/agent/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"goal": "Create a simple Python hello world script"}'
```

---

## Management Console (`run.sh`)

The interactive console provides complete control over your Agentic Forge instance:

```
   ╔══════════════════════════════════╗
   ║      A G E N T I C  F O R G E    ║
   ╚══════════════════════════════════╝
           (Mode Local)
──────────────────────────────────────────
  Gestion de l'Application (Local)
   1) 🟢 Démarrer Tous les Services
   2) 🔄 Redémarrer Tous les Services
   3) 🔴 Arrêter Tous les Services
   4) ⚡ Statut des Services
   5) 📊 Consulter les Logs
   6) 🧹 Nettoyer (logs, pids)

  Développement & Qualité
  10) 🔍 Lint & Fix       12) 🧪 Tests
  11) ✨ Formater

  13) 🚪 Quitter
```

---

## Architecture Overview

Agentic Forge now runs as a set of local processes on your machine:

- **🧠 Server**: Central orchestration, LLM communication, and session management.
- **⚡ Worker**: Handles asynchronous tasks like code execution and web automation.
- **🌐 Web Interface**: The React-based user interface.
- **💾 Redis**: A local Redis server for task queuing, session storage, and caching.

All these processes are managed by the `run.sh` script.

---

## Development

### Project Structure

```
agentic-forge/
├── 📁 packages/
│   ├── 📁 core/              # Backend server and worker source code
│   └── 📁 ui/                # Frontend UI source code
├── 📄 run.sh                 # Management console
└── 📄 README.md              # This documentation
```

### Adding Custom Tools

The process for adding custom tools remains the same. Create your tool file in `packages/core/src/tools/` and register it in `packages/core/src/tools/index.ts`.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.