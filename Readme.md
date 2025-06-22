# Agentic Forge

**Une forge agentique autonome, conçue pour raisonner, évoluer et construire ses propres outils.**

Propulsé par une architecture réactive en TypeScript, orchestrée par Docker et suralimentée par FastMCP.

## 📜 Table des Matières

* [🌟 Concept Fondamental](#-concept-fondamental--le-mode-forge)

* [🛰️ Architecture de la Forge](#️-architecture-de-la-forge)

* [📋 Prérequis](#-prérequis)

* [🚀 Installation et Démarrage](#-installation-et-démarrage)

* [🎛️ Console de Gestion (`run.sh`)](#️-console-de-gestion-runsh)

* [🤝 Contribution](#-contribution)

## 🌟 Concept Fondamental : Le Mode Forge

**Agentic Forge** n'est pas un agent ordinaire. C'est une plateforme conçue pour l'**auto-amélioration radicale**. Comme un forgeron mythique qui crée des armes légendaires, cet agent possède la capacité de forger ses propres outils.

Lorsqu'il est confronté à une tâche pour laquelle il n'a pas d'outil, son instruction principale n'est pas d'échouer, mais de **construire la solution**. Il peut :

1. **Planifier** la création d'un nouvel outil.

2. **Écrire** son propre code source en TypeScript.

3. **S'auto-redémarrer** pour charger ses nouvelles capacités.

4. **Utiliser** l'outil qu'il vient de forger pour accomplir l'objectif initial.

## 🛰️ Architecture de la Forge

Le système est un écosystème modulaire orchestré par `docker-compose` :

* **`server` (Le Cœur de la Forge)** : Le cerveau de l'agent. Il communique avec le LLM, prend les décisions stratégiques et gère la conversation avec l'utilisateur.

* **`worker` (Les Marteaux de la Forge)** : Dédié aux tâches lourdes et longues (scraping web, exécution de code complexe). Il assure que le cerveau reste toujours réactif.

* **`redis` (La Mémoire Ancestrale)** : Le système nerveux central, utilisé pour la file d'attente des tâches et la gestion de la mémoire de session.

## 📋 Prérequis

Avant de démarrer la forge, assurez-vous que les systèmes suivants sont opérationnels sur votre station de contrôle :

* (pour le développement local)

## 🚀 Installation et Démarrage

L'allumage de la forge est simple et entièrement géré par la console de lancement.

1. **Obtenez les plans de la forge** :

   ```
   git clone [https://votre-repo/agentic-forge.git]
   cd agentic-forge
   
   ```

2. **Activez la console de lancement** :
   Rendez le script `run.sh` exécutable. C'est votre unique point de contrôle.

   ```
   chmod +x run.sh
   
   ```

3. **Initialisez les systèmes** :
   Lancez la console pour la première fois.

   ```
   ./run.sh
   
   ```

   * Le script détectera l'absence du fichier `.env` et le créera pour vous à partir de `.env.example`.

   * ⚠️ **Action Requise** : Ouvrez le fichier `.env` et personnalisez vos clés secrètes (`AUTH_TOKEN`, `REDIS_PASSWORD`). C'est la clé de votre forge, gardez-la en sécurité.

4. **Allumez la Forge !**

   * Dans le menu de `run.sh`, choisissez l'option **1) Démarrer**.

   * Docker va construire les différents modules et mettre tous les systèmes en marche.

## 🎛️ Console de Gestion (`run.sh`)

Votre script `run.sh` est une interface de commande interactive pour piloter Agentic Forge.

| Commande | Description | 
 | ----- | ----- | 
| **1) Démarrer** | Lance tous les services de l'écosystème en arrière-plan. | 
| **3) Arrêter** | Arrête proprement tous les conteneurs. | 
| **4) Statut** | Affiche l'état actuel de tous les services (en cours, arrêté, etc.). | 
| **5) Logs** | Affiche en temps réel les journaux de tous les services pour le débogage. | 
| **7) Rebuild** | Force la reconstruction des images Docker, utile après des changements majeurs. | 
| **14) Vérifier les Types** | Lance le compilateur TypeScript pour vérifier les erreurs de type dans le code. | 
| **15) Nettoyer** | Supprime le répertoire de build (`dist/`). | 

## 🤝 Contribution

Les contributions qui nous aident à forger de nouvelles capacités sont les bienvenues. Veuillez ouvrir une *issue* pour discuter des nouvelles fonctionnalités ou des corrections de bugs que vous souhaitez apporter.
