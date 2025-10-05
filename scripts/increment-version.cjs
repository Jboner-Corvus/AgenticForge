const fs = require('fs');
const path = require('path');

// Simple version increment script
const packageJsonPath = path.join(__dirname, '..', 'packages', 'core', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Increment patch version
const version = packageJson.version.split('.');
version[2] = String(parseInt(version[2]) + 1);
packageJson.version = version.join('.');

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log(`Version incremented to ${packageJson.version}`);
