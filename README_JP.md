<p align="center">
  <img src="assets/title.png" alt="AgenticForge Logo" width="250">
</p>

<h1 align="center">AgenticForge</h1>
<p align="center">
  <strong>🌐 利用可能な言語</strong><br>
  <a href="README_EN.md">English</a> • 
  <a href="README.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      新しい100%自律的で無料のローカルAIエージェント
</h3>

<p align="center">
  <em>
    新しい100%自律的で無料のローカルAIエージェントで、完全なプライバシーを確保。MCPプロトコルで完全に設計され、複雑なタスクを実行し、コードを書き、独自のツールを鍛造し、ユーザーインターフェースに直接表示して完全な透明性を実現。設定可能な階層に従うインテリジェントなAPIキールータにより、リクエストを使い果たすことがないように自動的に切り替えます。プライベートAIの未来を探求する準備はできていますか？
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

## なぜAgenticForgeを選ぶのか？

🔒 **完全ローカルかつプライベート** - すべてがあなたのマシン上で実行されます — クラウドなし、データ共有なし。あなたのファイル、会話、ツールはプライベートのままです。

🛠️ **MCP自己ツール鍛造** - AgenticForgeはTypeScriptとZodスキーマでカスタムMCPツールを直接コーディングし、リアルタイムでワーカーに統合し、インターフェースに完全な透明性で表示します。

💰 **長期無料運用** - キー管理のテクニック、特にQwenにより、AgenticForgeは数日間コストなしで継続的に実行できます。

🤖 **サブエージェント制御** - 複雑なタスクを委任および並列化するために、他のコマンドラインインターフェース(CLI)エージェントを編成および制御できます。

💻 **自律的コーディングアシスタント** - コードが必要ですか？Python、TypeScript、Bashなどでプログラムを書き、デバッグし、実行できます — 監督なしで。

🧠 **インテリジェントツール選択** - あなたが尋ねると、自動的に仕事に最適なツールを見つけます。専門家の鍛冶場がいつでも助ける準備ができているようなものです。

📋 **複雑なタスクの計画と実行** - ファイル管理からWebスクレイピングまで — 大きなタスクをステップに分割し、作業を達成するためのツールを鍛造できます。

🌐 **スマートWebナビゲーション** - AgenticForgeは自律的にインターネットを閲覧できます — 検索、読み取り、情報抽出、タスクの自動化 — すべて介入なしで。

🔄 **インテリジェントLlmKeyManager** - 自動フェイルオーバー、パフォーマンス監視、不良キーの一時的な無効化機能を備えた高度なAPIキー管理システム。

🚀 **ネイティブMCP鍛造** - FastMCPでMCPプロトコルを使用して、カスタムツールをリアルタイムで作成、変更、デプロイ。各ツールはコーディング、テスト、ワーカーへの自動統合が行われます。

---

## 🛠️ ⚠️ 積極的な作業進行中

🙏 このプロジェクトは、MCPがAPIより優れていることを証明するために始まり、期待を超えて成長しました。私たちが前進する中で、貢献、フィードバック、そして忍耐は深く感謝されています。

---

## 📋 前提条件

**インストールに必要なもの：**

- **Docker Engine & Docker Compose**：主要サービス用
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/)（推奨）：Windows | Mac | Linux
  - または [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+**：ビルドとローカルワーカー用
  - [Node.jsをダウンロード](https://nodejs.org/)
- **pnpm**：パッケージマネージャー
  ```bash
  npm install -g pnpm
  ```
- **Git**：プロジェクトをクローンするため

### 🖥️ システム互換性

> **AgenticForge**は**Linux**または**macOS**でのデプロイ用に設計されています。  
> **Windowsは公式にサポートされていません**。

---

## 🚀 本番環境インストール

### 🤖 超簡単インストール（100%自動）

**オプション1：1行インストール**
```bash
curl -fsSL https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
```

**オプション2：クラシックインストール**
```bash
# 1. プロジェクトをクローン
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. 完全自動インストール
chmod +x run-v2.sh
./run-v2.sh install
```

**オプション3：インタラクティブインストール**
```bash
# 1. プロジェクトをクローン
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. AgenticForge管理コンソールを起動
chmod +x run-v2.sh
./run-v2.sh
```

**本番環境管理コンソール：**

```
    ╔══════════════════════════════════╗
    ║        A G E N T I C F O R G E   ║
    ╚══════════════════════════════════╝
──────────────────────────────────────────
    Docker & サービス
    1) 🟢 サービス開始            5) 📊 ワーカーログ
    2) 🔄 すべて再起動             6) 🐚 コンテナシェル
    3) 🔴 サービス停止             7) 🔨 すべて再構築
    4) ⚡ ステータス               8) 🐳 Dockerログ

    テスト & 品質
    9) 🔬 ユニットテストのみ       12) 🔍 Lintコード
   10) 🔗 統合テスト               13) ✨ コードフォーマット
   11) 🧪 すべてのテスト          14) 📘 型チェック

   15) 🚪 終了
```

**「1) 🟢 サービス開始」を選択して自動インストール**

**🔧 初回起動時、システムは：**
- デフォルト値で`.env`ファイルを自動作成
- 必要なpnpm依存関係をインストール  
- コアおよびUIパッケージをビルド
- すべてのDockerサービスを起動
- 本番環境を設定

## ⚙️ クイック設定

### 初期設定

初回起動時、`.env`ファイルがデフォルト値で作成されます。クイックスタートのために最初のAPIキーをそこで設定できます。

```env
# === AGENTIC FORGE 設定 ===

# アクセスポート
PUBLIC_PORT=8080          # APIおよびメインサーバー
WEB_PORT=3002             # ユーザーインターフェース

# データベースとキャッシュ
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""         # ローカル使用時は空のまま

# 人工知能 - スタートアップキー
LLM_API_KEY="お好みのAPIキー"
LLM_PROVIDER="gemini"          # または "openai", "anthropic", "grok" など
LLM_MODEL_NAME="gemini-2.5-pro"   # プロバイダーに対応するモデル
LLM_API_BASE_URL=""            # オプション、提供されない場合は自動検出

# セキュリティ
AUTH_TOKEN="$(openssl rand -hex 32)"     # 自動生成

# 環境
NODE_ENV=production
LOG_LEVEL=info
```

### 🔑 WebインターフェースによるマルチAPIキー管理

AgenticForgeは、Webインターフェースから直接アクセスできる、APIキーを集中かつ動的に管理する強力な**LlmKeyManager**を統合しています。

1.  **インターフェースにアクセス**：ブラウザで[http://localhost:3002](http://localhost:3002)を開く。
2.  **「LLMキー管理」に移動**：メニューを使用してキー管理ページに移動。

#### LlmKeyManagerの機能：

-   **リアルタイムでのキー追加/削除**：異なるプロバイダー（OpenAI、Gemini、Anthropicなど）のAPIキーを、システムを再起動せずに追加または削除。
-   **有効化/無効化**：その場でキーを有効化または無効化。
-   **自動フェイルオーバー**：APIキーが失敗した場合（リクエスト制限に達した、エラーなど）、システムはサービスの継続性を確保するために自動的に次の有効なキーに切り替えます。
-   **監視と統計**：キーの使用状況、アクティブなキーの数、設定されたプロバイダーの数を追跡。
-   **有効性テスト**：インターフェースから直接各キーの有効性をテスト。

#### 追加キーの追加
1. **Webインターフェース経由**：[localhost:3002](http://localhost:3002) → 「APIキー」タブ
2. **機能**：
   - ✅ リアルタイムでのキー追加/削除
   - ✅ エラー時の自動フェイルオーバー
   - ✅ キーごとのパフォーマンス監視
   - ✅ 不良キーの一時的な無効化
   - ✅ 同時マルチプロバイダーサポート

#### 自動階層
システムは信頼性の順序でキーをテストし、キーが失敗した場合は自動的に切り替えます。

---

## 🤖 AI設定

### オプション1：クラウドAPI（開始に推奨）

| プロバイダー | 推奨モデル (2025) | APIキーの取得 |
|-------------|---------------------|---------------------|
| **Google AI** | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com](https://aistudio.google.com/keys) |
| **OpenAI** | `gpt-5`, `gpt-4o`, `gpt-4.1` | [platform.openai.com](https://platform.openai.com/signup) |
| **Anthropic** | `claude-4-opus`, `claude-4-sonnet` | [console.anthropic.com](https://console.anthropic.com/) |
| **DeepSeek** | `deepseek-v3`, `deepseek-r1` | [platform.deepseek.com](https://platform.deepseek.com) |

### オプション2：ローカルAI（プライバシー用）

#### Ollama
1. **Ollamaをインストール**：[ollama.ai](https://ollama.ai/)
2. **モデルをダウンロード**：
   ```bash
   ollama pull deepseek-r1:14b  # ほとんどのタスクに推奨
   ollama serve
   ```

#### LM Studio
1. **LM Studioをインストール**：[lmstudio.ai](https://lmstudio.ai/)
2. **モデルをダウンロード**してローカルサーバーを起動
3. **設定**： 
   ```env
   LLM_PROVIDER="openai"
   LLM_API_BASE_URL="http://localhost:1234/v1"
   LLM_API_KEY="lm-studio"  # 任意の値
   LLM_MODEL_NAME="あなたのローカルモデル"
   ```

**注**：システムはローカルサーバーを自動検出します

---

## 🚀 システム管理

### インタラクティブ管理コンソール

```bash
# コンソール経由ですべての機能にアクセス
./run-v2.sh
```

### クイック本番コマンド

```bash
# 完全起動
./run-v2.sh start

# サービスステータスの確認
./run-v2.sh status

# システムログの表示
./run-v2.sh logs

# 設定変更後の再起動
./run-v2.sh restart

# システムのクリーンシャットダウン
./run-v2.sh stop
```

### 🧪 完全APIテスト

AgenticForgeには、API経由でエージェント機能を検証するための完全なテストスイートが含まれています：

```bash
# インタラクティブテストインターフェース
./run-tests.sh

# クイックキャンバスとToDoリストテスト
./run-tests.sh canvas

# 完全機能テスト
./run-tests.sh full
```

**利用可能なテストタイプ：**
- ✅ **キャンバスとToDoリスト**：図とタスクリストの作成と管理
- ✅ **MCPツール**：カスタムツールの作成と実行
- ✅ **コード生成**：TypeScript、Python、その他の言語
- ✅ **計画**：複雑なタスクの分解と実行
- ✅ **セッション管理**：履歴と会話の継続性
- ✅ **セキュリティ**：エラー処理と危険なコマンド

**すべてのテストは`tests/agent-test-logs/`に保存され、詳細な分析が可能です。**

### 🔧 コード品質管理

コード品質ツール（lint、TypeScript、フォーマット）は管理コンソールに統合されています：

```bash
# 完全管理コンソール
./run-v2.sh

# または直接：
pnpm run lint      # コード品質検証
pnpm run typecheck # TypeScript型検証
pnpm run format    # 自動フォーマット
```

---

## 🌐 AgenticForgeへのアクセス

### メインインターフェース

| インターフェース | URL | 説明 |
|-----------|-----|-------------|
| **🎨 Webインターフェース** | [localhost:3002](http://localhost:3002) | エージェントと対話するメインインターフェース |
| **🛠️ APIサーバー** | [localhost:8080](http://localhost:8080) | バックエンドAPIおよびメインサーバー |

---

## 🎯 使用例とサンプル

### 🚀 クイックスタート

1. **アクセス** [localhost:3002](http://localhost:3002) 
2. **テスト** リアルタイムMCPツール鍛造：
   ```
   "システムログを分析するカスタムMCPツールを作成し、
   TypeScriptでコーディングし、ワーカーに統合して即座にテスト"
   ```
3. **またはテスト** 直接システム実行：
   ```
   "私のシステムを分析し、新しいフォルダにREST APIを作成、
   npmで依存関係をインストールし、テストを実行してサーバーを起動"
   ```

### 🔧 カスタムMCPツール鍛造

#### ⚡ 高度なシステムツール
```bash
"リアルタイムで監視するMCPツールを鍛造：
- TypeScriptとZodスキーマでツールをコーディング  
- AgenticForgeワーカーに直接統合
- CPU/RAM/プロセスを監視するインターフェース
- Webインターフェースでのリアルタイム表示
- すべての機能の即時テスト"
```

#### 🌐 スマートWebツール  
```bash
"インテリジェントなMCPスクレイピングツールを作成：
- セッション管理付きのコード生成
- ワーカーに統合されたPlaywrightインターフェース
- スクレイピングデータの検証スキーマ
- リアルタイム結果ダッシュボード
- ローカルデータベースへの自動保存"
```

### 🌐 フルスタックアプリケーション

#### ⚙️ システム自動化と監視
```bash
"このYAML設定ファイルを読み取り、Pythonデーモンを作成：
- 定義されたシステムプロセスを監視
- cronタスクを自動実行  
- ログを/var/log/automation.logに送信
- 障害時にサービスを再起動
- systemctl --userでデーモンを起動"
```

### 📊 パフォーマンスツール

#### 🏃‍♂️ 完全システムベンチマーク
```bash
"このマシンの完全ベンチマークを実行：
- stress-ngでCPU/RAM/ディスクをテスト
- iperf3で8.8.8.8へのネットワークベンチマーク
- ローカルAPIのパフォーマンスを測定
- ./benchmarks/にHTMLレポートを生成
- ローカルに保存された以前の結果と比較"
```

#### 📚 自動生成ドキュメント
```bash
"プロジェクトを再帰的にスキャンし、ソースコードを分析して生成：
- アーキテクチャ図付きの詳細なREADME.md
- Swagger/OpenAPIによるAPIドキュメント
- UMLクラス図（PlantUML使用）
- このマシンでテストされたインストールガイド
- docsifyでローカルサーバーにすべてを公開"
```

### 🔧 プロジェクト管理

#### 🌳 Gitワークフローと自動デプロイ
```bash
"このリポジトリに完全なGitワークフローを設定：
- フック付きのGitFlowをインストールおよび設定
- 自動テスト付きのpre-commitスクリプトを作成
- ローカルでGitHub ActionsまたはGitLab CIを設定  
- ビルド、テスト、サービス再起動を行うデプロイスクリプト
- 機能ブランチで完全なワークフローをテスト"
```

### 🎯 専門化プロジェクト

#### 🤖 カスタムMCPツールスイート付きエージェント
```bash
"AgenticForgeをクローンし、独自のMCPツールを持つ専門化エージェントを作成：
- 5つのMCPツールを鍛造：監視、デプロイ、バックアップ、アラート、分析
- 各ツールはTypeScriptでコーディングされ、完全なZodインターフェースを備える
- ポート3001のWebインターフェースですべてのツールの動作を表示
- 永続化用のSQLiteベース + 管理用のMCPツール
- 自動鍛造ツールスイートの完全テスト"
```

#### 💻 インテリジェントシステム管理  
```bash
"このLinuxサーバーを分析し、管理ダッシュボードを作成：
- リアルタイム監視：CPU、RAM、ディスク、ネットワーク
- Webインターフェース付きのsystemdサービス管理
- 重要な設定の自動バックアップ
- 問題発生時のメール/Slackアラート
- スケジュールされたメンテナンススクリプト
- ポート8080のnginx経由でアクセス可能なインターフェース"
```

**🔥 独自のパワー**: 
- **🛠️ MCP鍛造**：TypeScriptでカスタムMCPツールを作成し、ワーカーに統合して即座にテスト
- **⚡ 直接実行**：完全なシステムアクセス - インストール、設定、テスト、自動デプロイ
- **🎯 完全透明性**：Webインターフェースで鍛造されたMCPツールの動作を直接表示

---

### 高度なシステム管理

| 操作 | コマンド | 使用法 |
|--------|----------|-----------|
| **完全コンソール** | `./run-v2.sh` | メイン管理インターフェース |
| **クイック起動** | `./run-v2.sh start` | 直接システム起動 |
| **監視** | `./run-v2.sh status` | Dockerサービスステータス |
| **ライブログ** | `./run-v2.sh logs` | リアルタイム監視 |
| **再起動** | `./run-v2.sh restart` | 設定変更後 |
| **メンテナンス** | `./run-v2.sh` → オプション7-14 | テスト、lint、フォーマット、再構築 |

---

## ⚙️ 本番アーキテクチャ

### 技術スタック

- **🧠 メインサーバー**：REST API、AIオーケストレーション、セッション管理
- **🌐 Webインターフェース**：リアルタイムストリーミング付きのReactアプリケーション
- **💾 Redis**：高性能キャッシュおよびメッセージブローカー
- **🗄️ PostgreSQL**：セッションおよびツールの永続ストレージ
- **🐳 Docker Compose**：完全なサービスオーケストレーション
- **📊 OpenTelemetry**：可観測性および監視

### ツール鍛造プロセス

1. **分析** → AIがユーザーのニーズを理解
2. **設計** → TypeScript/Pythonコード生成
3. **検証** → 自動テストおよび検証
4. **統合** → ツールカタログへの追加
5. **実行** → インターフェースでの即時利用可能

---

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細は`LICENSE`ファイルを参照してください。

---

## 謝辞

- **[FastMCP](https://github.com/punkpeye/fastmcp)**：超高性能MCPフレームワーク - AgenticForgeを推進するロケット 🚀
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**：LLM相互作用のための革命的プロトコル
- **[Docker](https://docker.com)**：コンテナ化および分離
- **[Redis](https://redis.io)**：高性能データ構造
- **[Playwright](https://playwright.dev)**：現代的なWeb自動化
- **オープンソースコミュニティ**：インスピレーションと協力

---

## サポート

- **🚨 問題**：[GitHub Issues](https://github.com/votre-username/g-forge/issues)
- **💬 議論**：[GitHub Discussions](https://github.com/votre-username/g-forge/discussions)
- **📚 ドキュメント**：[プロジェクトWiki](https://github.com/votre-username/g-forge/wiki)
- **🎮 Discord**：[コミュニティに参加](https://discord.gg/VNtXQByKfg) - *創作を共有し、リアルタイムで助けを得て、最新ニュースをいち早く発見*

---

<div align="center">

**🔨 鍛冶屋は自分のハンマーを鍛造する。** **🤖 AgenticForgeは自分の能力を鍛造する。**

_テクノロジーの未来を鍛造する。_

[![開始](https://img.shields.io/badge/🚀_開始-brightgreen?style=for-the-badge)](./run-v2.sh)

</div>