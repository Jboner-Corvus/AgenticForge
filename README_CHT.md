<p align="center">
  <img src="assets/title.png" alt="AgenticForge Logo" width="250">
</p>

<h1 align="center">AgenticForge</h1>
<p align="center">
  <strong>🌐 可用語言</strong><br>
  <a href="README_EN.md">English</a> • 
  <a href="README.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      您全新的100%自主、免費和本地AI代理
</h3>

<p align="center">
  <em>
    您全新的100%自主、免費和本地AI代理，確保完全隱私。完全基於MCP協議設計，執行複雜任務，編寫程式碼並鍛造自己的工具，直接在使用者介面中顯示以實現完全透明。藉助其智慧API金鑰路由器（遵循可設定的階層結構），它會自動切換以確保不會用完請求。準備好探索私人AI的未來了嗎？
  </em>
</p>
<br>
<p align="center">
    <a href="https://discord.gg/VNtXQByKfg"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
    <img src="https://img.shields.io/badge/MCP-000000?style=for-the-badge&logoColor=white" alt="MCP">
    <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
</p>

## 為什麼選擇AgenticForge？

🔒 **完全本地和私有** - 所有內容都在您的機器上執行 — 無雲端，無資料分享。您的檔案、對話和工具保持私有。

🛠️ **MCP自工具鍛造** - AgenticForge直接用TypeScript和Zod模式編寫自訂MCP工具，即時整合到工作器並在介面中顯示，實現完全透明。

💰 **延長免費執行** - 透過金鑰管理技巧，特別是使用Qwen，AgenticForge可以連續執行數天而無需費用。

🤖 **子代理控制** - 能夠編排和控制其他命令列介面(CLI)代理，以委派和並行處理複雜任務。

💻 **自主程式設計助手** - 需要程式碼嗎？它可以編寫、除錯和執行Python、TypeScript、Bash等程式 — 無需監督。

🧠 **智慧工具選擇** - 您提問，它會自動找到最佳工具來完成工作。就像擁有一群隨時準備幫助的專家。

📋 **計畫和執行複雜任務** - 從檔案管理到網頁抓取 — 它可以將大任務分解為步驟並鍛造工具來完成工作。

🌐 **智慧網頁導航** - AgenticForge可以自主瀏覽網際網路 — 搜尋、閱讀、提取資訊、自動化任務 — 全部無需干預。

🔄 **智慧LlmKeyManager** - 高級API金鑰管理系統，具有自動故障轉移、效能監控和臨時停用故障金鑰功能。

🚀 **原生MCP鍛造** - 使用MCP協議和FastMCP即時建立、修改和部署自訂工具。每個工具都經過編碼、測試並自動整合到工作器中。使用MCP創建的工具可直接供n8n代理訪問。

---

## 🛠️ ⚠️ 積極進行中的工作

🙏 這個專案最初是為了證明MCP比API更好而開始的，現在已經超出了預期。我們非常感謝您在我們繼續前進的過程中提供的貢獻、回饋和耐心。

---

## 📋 先決條件

**安裝所需：**

- **Docker Engine & Docker Compose**：用於主要服務
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/)（推薦）：Windows | Mac | Linux
  - 或 [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+**：用於建置和本地工作器
  - [下載 Node.js](https://nodejs.org/)
- **pnpm**：套件管理器
  ```bash
  npm install -g pnpm
  ```
- **Git**：用於複製專案

### 🖥️ 系統相容性

> **AgenticForge** 設計為在 **Linux** 或 **macOS** 上部署。  
> **Windows 不被官方支援**。

---

## 🚀 生產安裝

### 🤖 超簡單安裝（100% 自動）

**選項 1：一行安裝**
```bash
curl -fsSL https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
```

**選項 2：經典安裝**
```bash
# 1. 複製專案
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. 完全自動安裝
chmod +x run-v2.sh
./run-v2.sh install
```

**選項 3：互動式安裝**
```bash
# 1. 複製專案
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. 啟動 AgenticForge 管理控制台
chmod +x run-v2.sh
./run-v2.sh
```

**生產管理控制台：**

```
    ╔══════════════════════════════════╗
    ║        A G E N T I C F O R G E   ║
    ╚══════════════════════════════════╝
──────────────────────────────────────────
    Docker & 服務
    1) 🟢 啟動服務            5) 📊 工作器日誌
    2) 🔄 重啟所有            6) 🐚 容器Shell
    3) 🔴 停止服務            7) 🔨 重建所有
    4) ⚡ 狀態                8) 🐳 Docker日誌

    測試 & 品質
    9) 🔬 僅單元測試         12) 🔍 Lint程式碼
   10) 🔗 整合測試           13) ✨ 格式化程式碼
   11) 🧪 所有測試           14) 📘 類型檢查

   15) 🚪 退出
```

**選擇 "1) 🟢 啟動服務" 進行自動安裝**

**🔧 首次啟動時，系統：**
- 自動建立帶有預設值的 `.env` 檔案
- 安裝必要的 pnpm 相依項目  
- 建置核心和UI套件
- 啟動所有 Docker 服務
- 設定生產環境

## ⚙️ 快速設定

### 初始設定

首次啟動時，`.env` 檔案會使用預設值建立。您可以在那裡設定第一個API金鑰以快速啟動。

```env
# === AGENTIC FORGE 設定 ===

# 存取埠口
PUBLIC_PORT=8080          # API和主伺服器
WEB_PORT=3002             # 使用者介面

# 資料庫和快取
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""         # 本地使用時留空

# 人工智慧 - 啟動金鑰
LLM_API_KEY="您的首選API金鑰"
LLM_PROVIDER="gemini"          # 或 "openai", "anthropic", "grok" 等
LLM_MODEL_NAME="gemini-2.5-pro"   # 與提供者對應的模型
LLM_API_BASE_URL=""            # 可選，如果未提供則自動偵測

# 安全
AUTH_TOKEN="$(openssl rand -hex 32)"     # 自動產生

# 環境
NODE_ENV=production
LOG_LEVEL=info
```

### 🔑 透過Web介面管理多API金鑰

AgenticForge整合了強大的 **LlmKeyManager**，用於集中和動態管理您的API金鑰，可直接從Web介面存取。

1.  **存取介面**：在瀏覽器中開啟 [http://localhost:3002](http://localhost:3002)。
2.  **轉到"LLM金鑰管理器"**：使用選單導航到金鑰管理頁面。

#### LlmKeyManager 功能：

-   **即時新增/刪除金鑰**：新增或刪除不同提供者（OpenAI、Gemini、Anthropic等）的API金鑰，無需重啟系統。
-   **啟用/停用**：即時啟用或停用金鑰。
-   **自動故障轉移**：如果API金鑰失敗（達到請求限制、錯誤），系統會自動切換到下一個有效金鑰以確保服務連續性。
-   **監控和統計**：追蹤您的金鑰使用情況、活動金鑰數量和設定的提供者數量。
-   **有效性測試**：直接從介面測試每個金鑰的有效性。

#### 新增額外金鑰
1. **透過Web介面**：[localhost:3002](http://localhost:3002) → "API金鑰"分頁
2. **功能**：
   - ✅ 即時新增/刪除金鑰
   - ✅ 錯誤時自動故障轉移
   - ✅ 每個金鑰的效能監控
   - ✅ 臨時停用故障金鑰
   - ✅ 同時支援多提供者

#### 自動階層結構
系統按可靠性順序測試金鑰，並在金鑰失敗時自動切換。

---

## 🤖 AI設定

### 選項 1：雲端API（推薦用於入門）

| 提供者 | 推薦模型 (2025) | 取得API金鑰 |
|-------------|---------------------|---------------------|
| **Google AI** | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com](https://aistudio.google.com/keys) |
| **OpenAI** | `gpt-5`, `gpt-4o`, `gpt-4.1` | [platform.openai.com](https://platform.openai.com/signup) |
| **Anthropic** | `claude-4-opus`, `claude-4-sonnet` | [console.anthropic.com](https://console.anthropic.com/) |
| **DeepSeek** | `deepseek-v3`, `deepseek-r1` | [platform.deepseek.com](https://platform.deepseek.com) |

### 選項 2：本地AI（用於隱私）

#### Ollama
1. **安裝 Ollama**：[ollama.ai](https://ollama.ai/)
2. **下載模型**：
   ```bash
   ollama pull deepseek-r1:14b  # 推薦用於大多數任務
   ollama serve
   ```

#### LM Studio
1. **安裝 LM Studio**：[lmstudio.ai](https://lmstudio.ai/)
2. **下載模型**並啟動本地伺服器
3. **設定**： 
   ```env
   LLM_PROVIDER="openai"
   LLM_API_BASE_URL="http://localhost:1234/v1"
   LLM_API_KEY="lm-studio"  # 任意值
   LLM_MODEL_NAME="您的本地模型"
   ```

**注意**：系統會自動偵測本地伺服器

---

## 🚀 系統管理

### 互動式管理控制台

```bash
# 透過控制台存取所有功能
./run-v2.sh
```

### 快速生產命令

```bash
# 完整啟動
./run-v2.sh start

# 檢查服務狀態
./run-v2.sh status

# 查看系統日誌
./run-v2.sh logs

# 設定修改後重啟
./run-v2.sh restart

# 幹淨關閉系統
./run-v2.sh stop
```

### 🧪 完整API測試

AgenticForge包含完整的測試套件，透過API驗證代理功能：

```bash
# 互動式測試介面
./run-tests.sh

# 快速畫布和待辦事項清單測試
./run-tests.sh canvas

# 完整功能測試
./run-tests.sh full
```

**可用測試類型：**
- ✅ **畫布和待辦事項清單**：圖表和任務清單的建立和管理
- ✅ **MCP工具**：自訂工具的建立和執行
- ✅ **程式碼產生**：TypeScript、Python和其他語言
- ✅ **規劃**：複雜任務的分解和執行
- ✅ **會話管理**：歷史記錄和對話連續性
- ✅ **安全**：錯誤處理和危險命令

**所有測試都儲存在 `tests/agent-test-logs/` 中以供詳細分析。**

### 🔧 程式碼品質控制

程式碼品質工具（lint、TypeScript、格式化）已整合到管理控制台中：

```bash
# 完整管理控制台
./run-v2.sh

# 或直接：
pnpm run lint      # 程式碼品質驗證
pnpm run typecheck # TypeScript類型驗證
pnpm run format    # 自動格式化
```

---

## 🌐 存取AgenticForge

### 主要介面

| 介面 | URL | 描述 |
|-----------|-----|-------------|
| **🎨 Web介面** | [localhost:3002](http://localhost:3002) | 與代理互動的主介面 |
| **🛠️ API伺服器** | [localhost:8080](http://localhost:8080) | 後端API和主伺服器 |

---

## 🎯 使用案例和範例

### 🚀 快速開始

1. **存取** [localhost:3002](http://localhost:3002) 
2. **測試** 即時MCP工具鍛造：
   ```
   "建立一個自訂MCP工具來分析系統日誌，
   用TypeScript編碼，整合到工作器並立即測試"
   ```
3. **或測試** 直接系統執行：
   ```
   "分析我的系統，在新資料夾中建立REST API，
   使用npm安裝相依項目，執行測試並啟動伺服器"
   ```

### 🔧 自訂MCP工具鍛造

#### ⚡ 高級系統工具
```bash
"鍛造一個即時監控的MCP工具：
- 用TypeScript和Zod模式編碼工具  
- 直接整合到AgenticForge工作器
- 監控CPU/RAM/程序的介面
- Web介面中的即時顯示
- 所有功能的即時測試"
```

#### 🌐 智慧Web工具  
```bash
"建立一個智慧MCP抓取工具：
- 產生帶會話管理的程式碼
- 整合到工作器的Playwright介面
- 資料抓取驗證模式
- 即時結果儀表板
- 自動儲存到本地資料庫"
```

### 🌐 全端應用程式

#### ⚙️ 系統自動化和監控
```bash
"讀取此YAML設定檔案，建立一個Python守護程序：
- 監控定義的系統程序
- 自動執行cron任務  
- 將日誌傳送到/var/log/automation.log
- 故障時重啟服務
- 使用systemctl --user啟動守護程序"
```

### 📊 效能工具

#### 🏃‍♂️ 完整系統基準測試
```bash
"執行此機器的完整基準測試：
- 使用stress-ng測試CPU/RAM/磁碟
- 使用iperf3到8.8.8.8進行網路基準測試
- 測量本地API的效能
- 在./benchmarks/中產生HTML報告
- 與本地儲存的先前結果進行比較"
```

#### 📚 自動產生文件
```bash
"遞迴掃描我的專案，分析原始碼，產生：
- 帶架構圖的詳細README.md
- 帶Swagger/OpenAPI的API文件
- UML類別圖（使用PlantUML）
- 在此機器上測試的安裝指南
- 使用docsify在本地伺服器上發布所有內容"
```

### 🔧 專案管理

#### 🌳 Git工作流和自動部署
```bash
"在此儲存庫中設定完整的Git工作流：
- 安裝和設定帶鉤子的GitFlow
- 建立帶自動測試的預提交腳本
- 在本地設定GitHub Actions或GitLab CI  
- 部署腳本，建置、測試和重啟服務
- 使用功能分支測試完整工作流"
```

### 🎯 專業化專案

#### 🤖 帶自訂MCP工具套件的代理
```bash
"複製AgenticForge，建立一個具有自己MCP工具的專業化代理：
- 鍛造5個MCP工具：監控、部署、備份、警報、分析
- 每個工具都用TypeScript編碼，具有完整的Zod介面
- 在埠口3001的Web介面顯示所有工具的實際操作
- 用於持久化的SQLite資料庫 + 用於管理它的MCP工具
- 自動鍛造工具套件的完整測試"
```

#### 💻 智慧系統管理  
```bash
"分析此Linux伺服器並建立管理儀表板：
- 即時監控：CPU、RAM、磁碟、網路
- 帶Web介面的systemd服務管理
- 重要設定的自動備份
- 出現問題時的電子郵件/Slack警報
- 預定的維護腳本
- 可透過埠口8080上的nginx存取的介面"
```

**🔥 獨特功能**: 
- **🛠️ MCP鍛造**：在TypeScript中建立自訂MCP工具，整合到工作器並立即測試
- **⚡ 直接執行**：完整的系統存取 - 安裝、設定、測試、自動部署
- **🎯 完全透明**：直接在Web介面中查看鍛造的MCP工具的實際操作

---

### 高級系統管理

| 操作 | 命令 | 用途 |
|--------|----------|-----------|
| **完整控制台** | `./run-v2.sh` | 主管理介面 |
| **快速啟動** | `./run-v2.sh start` | 直接系統啟動 |
| **監控** | `./run-v2.sh status` | Docker服務狀態 |
| **即時日誌** | `./run-v2.sh logs` | 即時監控 |
| **重啟** | `./run-v2.sh restart` | 設定修改後 |
| **維護** | `./run-v2.sh` → 選項 7-14 | 測試、lint、格式化、重建 |

---

## ⚙️ 生產架構

### 技術堆疊

- **🧠 主伺服器**：REST API、AI編排、會話管理
- **🌐 Web介面**：帶即時串流的React應用程式
- **💾 Redis**：高效能快取和訊息代理
- **🗄️ PostgreSQL**：會話和工具的持久化儲存
- **🐳 Docker Compose**：完整服務編排
- **📊 OpenTelemetry**：可觀察性和監控

### 工具鍛造過程

1. **分析** → AI理解使用者需求
2. **設計** → TypeScript/Python程式碼產生
3. **驗證** → 自動測試和驗證
4. **整合** → 新增到工具目錄
5. **執行** → 在介面中即時可用

---

## 授權

本專案根據MIT授權條款授權。有關詳細資訊，請參閱 `LICENSE` 檔案。

---

## 致謝

- **[FastMCP](https://github.com/punkpeye/fastmcp)**：高效能MCP框架 - 推動AgenticForge的火箭 🚀
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**：LLM互動的革命性協議
- **[Docker](https://docker.com)**：容器化和隔離
- **[Redis](https://redis.io)**：高效能資料結構
- **[Playwright](https://playwright.dev)**：現代Web自動化
- **開源社群**：靈感和協作

---

## 支援

- **🚨 問題**：[GitHub Issues](https://github.com/votre-username/g-forge/issues)
- **💬 討論**：[GitHub Discussions](https://github.com/votre-username/g-forge/discussions)
- **📚 文件**：[專案Wiki](https://github.com/votre-username/g-forge/wiki)
- **🎮 Discord**：[加入社群](https://discord.gg/VNtXQByKfg) - *分享您的創作，獲得即時幫助並提前了解最新消息*

---

<div align="center">

**🔨 鐵匠鍛造他的錘子。** **🤖 AgenticForge鍛造自己的能力。**

_鍛造您的技術未來。_

[![開始](https://img.shields.io/badge/🚀_開始-brightgreen?style=for-the-badge)](./run-v2.sh)

</div>