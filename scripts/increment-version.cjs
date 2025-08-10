const fs = require('fs');
const path = require('path');
const semver = require('semver');

// Chemins des fichiers package.json
const corePackagePath = path.join(__dirname, '..', 'packages', 'core', 'package.json');
const rootPackagePath = path.join(__dirname, '..', 'package.json');

// Lecture des fichiers package.json
const corePackage = JSON.parse(fs.readFileSync(corePackagePath, 'utf8'));
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

// Incrémentation de la version
let version = rootPackage.version;
if (!process.env.SKIP_VERSION_INCREMENT) {
  version = semver.inc(version, 'patch');
  rootPackage.version = version;
  corePackage.version = version;
  
  // Écriture des fichiers package.json mis à jour
  fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2) + '\n');
  fs.writeFileSync(corePackagePath, JSON.stringify(corePackage, null, 2) + '\n');
}

// Génération du contenu du fichier VERSION.md
const versionContent = `# Version Actuelle

## AgenticForge v${version}

### Packages
- **@gforge/core**: v${corePackage.version}
- **g-forge-monorepo**: v${rootPackage.version}

### Dernière mise à jour
${new Date().toLocaleString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

### Informations de build
- **Date du build**: ${new Date().toLocaleString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
- **Statut**: Succès

### Services Docker
- **Interface Web**: http://localhost:3002
- **API**: http://localhost:8080
- **PostgreSQL**: port 5432
- **Redis**: port 6379

Ce fichier est automatiquement généré lors de chaque build réussi.`;

// Écriture du fichier VERSION.md
fs.writeFileSync(path.join(__dirname, '..', 'VERSION.md'), versionContent);

console.log(`Version incrémentée avec succès: ${version}`);