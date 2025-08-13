export const demoMarkdownContent = `
# Démonstration du Canvas

## Bienvenue dans l'AgentOutputCanvas

Ce composant est conçu pour afficher le contenu généré par l'agent, comme :

### Fonctionnalités prises en charge

- **Markdown** : Rendu avec syntaxe étendue
- **HTML** : Affichage sécurisé dans une iframe
- **URL** : Chargement de pages web externes
- **Texte brut** : Pour les contenus simples

### Exemple de code

\`\`\`typescript
interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}
\`\`\`

### Liste à puces

1. Première étape
2. Deuxième étape
3. Troisième étape

### Tableau

| Fonctionnalité | Statut |
|---------------|--------|
| Canvas HTML   | ✅     |
| Canvas Markdown | ✅   |
| Canvas URL    | ✅     |
| Historique    | ✅     |

> **Note** : Le canvas et la todolist sont maintenant complètement indépendants l'un de l'autre.
`;

export const demoHtmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Démonstration Canvas HTML</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature-card {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.25);
        }
        .feature-icon {
            font-size: 2em;
            margin-bottom: 15px;
        }
        .note {
            background: rgba(255, 255, 255, 0.2);
            border-left: 4px solid #fff;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .status-grid {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            text-align: center;
        }
        .status-item {
            padding: 15px;
        }
        .status-value {
            font-size: 2em;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Canvas HTML Démonstration</h1>
        
        <p>Ce contenu HTML est affiché de manière sécurisée dans une iframe sandboxée.</p>
        
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">📄</div>
                <h3>Markdown</h3>
                <p>Rendu avec syntaxe étendue</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🌐</div>
                <h3>HTML</h3>
                <p>Affichage sécurisé</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔗</div>
                <h3>URL</h3>
                <p>Chargement de pages externes</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📜</div>
                <h3>Texte Brut</h3>
                <p>Pour les contenus simples</p>
            </div>
        </div>
        
        <div class="note">
            <strong>ℹ️ Note importante :</strong> 
            <p>Le canvas et la todolist sont maintenant complètement indépendants l'un de l'autre.</p>
        </div>
        
        <div class="status-grid">
            <div class="status-item">
                <div class="status-value">4</div>
                <div>Fonctionnalités</div>
            </div>
            <div class="status-item">
                <div class="status-value">100%</div>
                <div>Indépendance</div>
            </div>
            <div class="status-item">
                <div class="status-value">✅</div>
                <div>Opérationnel</div>
            </div>
        </div>
    </div>
</body>
</html>
`;