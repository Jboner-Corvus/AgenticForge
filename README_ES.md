<p align="center">
  <img src="assets/title.png" alt="G-Forge Logo" width="250">
</p>

<h1 align="center">G-Forge</h1>

<p align="center">
  <img src="https://img.shields.io/badge/🔨-G_Forge-orange?style=for-the-badge" alt="G-Forge Logo">
</p>
<p align="center">
  <strong>🌐 Langues disponibles</strong><br>
  <a href="README_EN.md">English</a> • 
  <a href="README.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      Una alternativa privada y local a MANUS.
</h3>

<p align="center">
  <em>
    Un agente de IA 100% autónomo, gratuito y local que forja sus propias herramientas, escribe código y ejecuta tareas complejas, manteniendo todos los datos en su dispositivo. Basado en el protocolo MCP (Model Context Protocol) con FastMCP como motor, está diseñado para modelos de razonamiento locales y es adaptable a la API de su LLM favorito, garantizando privacidad total y sin dependencias de la nube.
  </em>
</p>
<br>
<p align="center">
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square&logo=opensource&logoColor=white" alt="MIT License"> <img src="https://img.shields.io/github/stars/Jboner-Corvus/AgenticForge?style=flat-square&logo=github&color=gold" alt="Stars"> <img src="https://img.shields.io/github/forks/Jboner-Corvus/AgenticForge?style=flat-square&logo=git&color=blue" alt="Forks"> <img src="https://img.shields.io/github/issues/Jboner-Corvus/AgenticForge?style=flat-square&logo=github" alt="Issues">
</p>
<p align="center">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
    <img src="https://img.shields.io/badge/MCP-000000?style=for-the-badge&logoColor=white" alt="MCP">
    <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
</p>

## ¿Por qué G-Forge?

🔒 **Completamente Local y Privado** - Todo funciona en su máquina — sin nube, sin compartir datos. Sus archivos, conversaciones y herramientas permanecen privados.

🛠️ **Auto-Forjado de Herramientas** - G-Forge puede crear sus propias herramientas — cuando le falta una capacidad, escribe el código para construirla.

💻 **Asistente de Codificación Autónomo** - ¿Necesita código? Puede escribir, depurar y ejecutar programas en Python, TypeScript, Bash y más — sin supervisión.

🧠 **Selección Inteligente de Herramientas** - Usted pregunta, automáticamente encuentra la mejor herramienta para el trabajo. Como tener una forja de expertos listos para ayudar.

📋 **Planifica y Ejecuta Tareas Complejas** - Desde gestión de archivos hasta web scraping — puede dividir grandes tareas en pasos y forjar las herramientas para realizar el trabajo.

🌐 **Navegación Web Inteligente** - G-Forge puede navegar por internet de forma autónoma — buscar, leer, extraer información, automatizar tareas — todo sin intervención.

🚀 **Impulsado por FastMCP** - Utiliza el protocolo MCP (Model Context Protocol) con FastMCP como framework ultra-performante — un verdadero cohete para interacciones LLM.

---

## Demo

> **"¿Puedes crear una herramienta para analizar mis archivos CSV y luego usarla para generar un informe de sales_data.csv?"**

---

## 🛠️ ⚠️ Trabajo Activo en Progreso

🙏 Este proyecto comenzó para demostrar que MCP era mejor que API y ha crecido más allá de las expectativas. Contribuciones, comentarios y paciencia son profundamente apreciados mientras forjamos hacia adelante.

---

## Prerrequisitos

Antes de comenzar, asegúrese de tener el siguiente software instalado:

- **Git**: Para clonar el repositorio. [Descargar Git](https://git-scm.com/)
- **Docker Engine & Docker Compose**: Para ejecutar los servicios agrupados.
  - [Instalar Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose V2): Windows | Mac | Linux
  - O instalar por separado: [Docker Engine](https://docs.docker.com/engine/install/) | [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+**: Para la interfaz web. [Descargar Node.js](https://nodejs.org/)
- **pnpm**: Gestor de paquetes. Instalar con `npm install -g pnpm`

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/your-username/agentic-forge.git
cd agentic-forge
```

## 2. Ejecutar el script de instalación

Haga ejecutable el script de gestión y ejecútelo.

```bash
chmod +x run.sh
./run.sh
```

En la primera ejecución, el script verificará si existe un archivo `.env`. Si no existe, lo creará automáticamente para usted.

## 3. Configurar su entorno

Una vez que se crea el archivo `.env`, ábralo y complete los valores con sus propias credenciales.

```env
# Copie este archivo a .env y complete los valores.
HOST_PORT=8080
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
AUTH_TOKEN=""
REDIS_HOST=redis
REDIS_PORT=6378
REDIS_HOST_PORT=6378
REDIS_PASSWORD=""
# La URL base ya no es necesaria para la API de Google, comente o elimínela.
# LLM_API_BASE_URL=
WEB_PORT=3000
# Use su clave de API de Google Gemini
LLM_API_KEY=""

# Especifique un modelo Gemini, ej: "gemini-1.5-pro-latest"
LLM_MODEL_NAME=gemini-2.5-flash
```

**Importante**:

- Establezca un `AUTH_TOKEN` fuerte (se recomiendan 32+ caracteres)
- Las claves API son opcionales si usa modelos locales

---

## 4. Iniciar Docker

Asegúrese de que Docker esté ejecutándose antes de continuar.

---

## Configuración LLM Local (Recomendado)

### Requisitos de Hardware

| Tamaño del Modelo | Memoria GPU | Rendimiento                            |
| ----------------- | ----------- | -------------------------------------- |
| 7B                | 8GB VRAM    | ⚠️ Solo tareas básicas                 |
| 14B               | 12GB VRAM   | ✅ La mayoría de tareas funcionan bien |
| 32B               | 24GB VRAM   | 🚀 Excelente rendimiento               |
| 70B+              | 48GB+ VRAM  | 💪 Calidad profesional                 |

### Configuración con Ollama (Recomendado)

1.  **Instalar Ollama**: [Descargar Ollama](https://ollama.ai/)
2.  **Iniciar Ollama**:
    ```bash
    ollama serve
    ```
3.  **Descargar un modelo de razonamiento**:
    ```bash
    ollama pull deepseek-r1:14b
    # o para más potencia: ollama pull deepseek-r1:32b
    ```
4.  **Actualizar configuración** en `.env`:
    ```env
    LLM_MODEL_NAME="deepseek-r1:14b"
    LLM_API_BASE_URL="http://localhost:11434"
    ```

### Alternativa: LM Studio

1.  Descargue e instale [LM Studio](https://lmstudio.ai/)
2.  Cargue un modelo como `deepseek-r1-distill-qwen-14b`
3.  Inicie el servidor local
4.  Actualice `.env`:
    ```env
    LLM_API_BASE_URL="http://localhost:1234"
    ```

---

## Configuración para Uso de API

Si prefiere modelos en la nube o carece de hardware suficiente:

### 1. Elegir un Proveedor de API

| Proveedor | Ejemplos de Modelos                  | Enlace de Clave API                                       |
| --------- | ------------------------------------ | --------------------------------------------------------- |
| OpenAI    | `gpt-4`, `o1`                        | [platform.openai.com](https://platform.openai.com/signup) |
| Google    | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com](https://aistudio.google.com/keys)   |
| Anthropic | `claude-4-sonnet`, `claude-4-opus`   | [console.anthropic.com](https://console.anthropic.com/)   |
| DeepSeek  | `deepseek-chat`, `deepseek-coder`    | [platform.deepseek.com](https://platform.deepseek.com)    |

### 2. Establecer su clave API

**Linux/macOS:**

```bash
export LLM_API_KEY="your_api_key_here"
# Agregue a ~/.bashrc o ~/.zshrc para persistencia
```

**Windows:**

```cmd
set LLM_API_KEY=your_api_key_here
```

### 3. Actualizar `.env`:

```env
LLM_API_KEY="your_api_key_here"
LLM_MODEL_NAME="gemini-1.5-pro"
```

---

## Iniciar Servicios y Ejecutar

### Usando la Consola de Gestión (`run.sh`)

Después de configurar su archivo `.env`, use la consola de gestión para iniciar la aplicación.

Lance la consola interactiva:

```bash
./run.sh
```

Desde el menú de la consola:

1.  **Iniciar** - Lanzar todos los servicios
2.  **Estado** - Verificar la salud de los servicios
3.  **Logs** - Monitorear logs en tiempo real

### Comandos Docker Manuales

Iniciar todos los servicios:

```bash
docker-compose up -d
```

Verificar estado:

```bash
docker-compose ps
```

Ver logs:

```bash
docker-compose logs -f
```

**⚠️ Advertencia**: El inicio inicial puede tomar 10-15 minutos ya que se descargan las imágenes Docker y se inicializan los servicios. Espere a ver `backend: "GET /health HTTP/1.1" 200 OK` en los logs.

---

## Puntos de Acceso

Una vez que los servicios están ejecutándose:

| Servicio                  | URL                                       | Descripción                      |
| ------------------------- | ----------------------------------------- | -------------------------------- |
| **Interfaz Web**          | http://localhost:3000                     | Interfaz principal del usuario   |
| **Endpoint de API**       | http://localhost:8080/api/v1/agent/stream | Acceso directo a la API          |
| **Verificación de Salud** | http://localhost:8080/health              | Estado de salud de los servicios |

### Prueba Rápida

```bash
# Verificación de salud
curl http://localhost:8080/health

# Prueba de API
curl -X POST http://localhost:8080/api/v1/agent/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"goal": "Crear un script Python hello world simple"}'
```

---

## Ejemplos de Uso

Una vez que sus servicios están
