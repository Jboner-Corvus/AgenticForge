div align="center">

# Agentic Prometheus

**Une fusée agentique autonome, conçue pour raisonner, évoluer et construire ses propres outils.Une Alternative a Manus gratuite, local ready **

Propulsé par une architecture réactive en TypeScript, orchestrée par Docker et suralimentée par FastMCP.

<p>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="[Image du logo Docker]">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="[Image du logo Node.js]">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="[Image du logo TypeScript]">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="[Image du logo Redis]">
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="[Image du logo pnpm]">
</p>

</div>

---

## 📜 Table des Matières

- [🌟 Concept Fondamental](#-concept-fondamental--le-mode-prométhée)
- [🛰️ Architecture de la Fusée](#️-architecture-de-la-fusée)
- [📋 Prérequis](#-prérequis)
- [🚀 Installation et Décollage](#-installation-et-décollage)
- [🎛️ Console de Gestion (`run.sh`)](#️-console-de-gestion-runsh)
- [🤝 Contribution](#-contribution)

---

## 🌟 Concept Fondamental : Le Mode Prométhée

**Agentic Prometheus** n'est pas un agent ordinaire. C'est une plateforme multi Agent conçue pour l'**auto-amélioration radicale**. Comme le titan Prométhée qui a offert le feu de la connaissance à l'humanité, cet agent possède le "feu" de la création de code.

Lorsqu'il est confronté à une tâche pour laquelle il n'a pas d'outil, son instruction principale n'est pas d'échouer, mais de **construire la solution**. Il peut :
1.  **Planifier** la création d'un nouvel outil.
2.  **Écrire** son propre code source en TypeScript.
3.  **S'auto-redémarrer** pour charger ses nouvelles capacités.
4.  **Utiliser** l'outil qu'il vient de forger pour accomplir l'objectif initial.



---

## 🛰️ Architecture

Le système est un écosystème modulaire orchestré par `docker-compose` :

- **`server` (Le Cerveau de Vol)** : Le cœur de l'agent. Il communique avec le LLM, prend les décisions stratégiques et gère la conversation avec l'utilisateur.
- **`worker` (Les Propulseurs Auxiliaires)** : Dédié aux tâches lourdes et longues (scraping web, exécution de code complexe). Il assure que le cerveau de vol reste toujours réactif.
- **`redis` (La Mémoire de Bord)** : Le système nerveux central, utilisé pour la file d'attente des tâches et la gestion de la mémoire de session.

---

## 📋 Prérequis

Avant le lancement, assurez-vous que les systèmes suivants sont opérationnels sur votre station de contrôle :

- ![Badge Docker Engine](https://img.shields.io/badge/Docker_Engine-NÉCESSAIRE-blue?logo=docker)
- ![Badge Docker Compose](https://img.shields.io/badge/Docker_Compose_(v2+)-NÉCESSAIRE-blue?logo=docker)
- ![Badge pnpm](https://img.shields.io/badge/pnpm-RECOMMANDÉ-orange?logo=pnpm) (pour le développement local)

---

## 🚀 Installation et Décollage

La mise à feu est simple et entièrement gérée par la console de lancement.

1.  **Obtenez les plans de la fusée** :
    ```bash
    git clone [https://votre-repo/agentic-prometheus.git]
    cd agentic-prometheus
    ```

2.  **Activez la console de lancement** :
    Rendez le script `run.sh` exécutable. C'est votre unique point de contrôle.
    ```bash
    chmod +x run.sh
    ```

3.  **Initialisez les systèmes** :
    Lancez la console pour la première fois.
    ```bash
    ./run.sh
    ```
    - Le script détectera l'absence du fichier `.env` et le créera pour vous à partir de `.env.example`.
    - ⚠️ **Action Requise** : Ouvrez le fichier `.env` et personnalisez vos clés secrètes (`AUTH_TOKEN`, `REDIS_PASSWORD`). C'est comme la clé d'armement de votre fusée, gardez-la en sécurité.

4.  **Décollage !**
    - Dans le menu de `run.sh`, choisissez l'option **1) Démarrer**.
    - Docker va construire les étages de la fusée et mettre tous les systèmes en orbite.

---

## 🎛️ Console de Gestion (`run.sh`)

Votre script `run.sh` est une interface de commande interactive pour piloter Agentic Prometheus.

| Commande          | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| **1) Démarrer** | Lance tous les services de l'écosystème en arrière-plan.                  |
| **3) Arrêter** | Arrête proprement tous les conteneurs.                                      |
| **4) Statut** | Affiche l'état actuel de tous les services (en cours, arrêté, etc.).        |
| **5) Logs** | Affiche en temps réel les journaux de tous les services pour le débogage.   |
| **7) Rebuild** | Force la reconstruction des images Docker, utile après des changements majeurs. |
| **9) Type-Check** | Lance le compilateur TypeScript pour vérifier les erreurs de type dans le code. |
| **10) Clean** | Supprime le répertoire de build (`dist/`).                                 |

---

## 🤝 Contribution

Les contributions qui nous aident à atteindre de nouvelles galaxies sont les bienvenues. Veuillez ouvrir une *issue* pour discuter des nouvelles fonctionnalités ou des corrections de bugs que vous souhaitez apporter.
