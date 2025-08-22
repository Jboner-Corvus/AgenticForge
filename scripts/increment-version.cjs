#!/usr/bin/env node

// Simple version incrementer script
const fs = require('fs');
const path = require('path');

// Get package.json path
const packagePath = path.join(process.cwd(), 'package.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Increment version (patch)
const versionParts = packageJson.version.split('.');
versionParts[2] = parseInt(versionParts[2]) + 1;
packageJson.version = versionParts.join('.');

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version incremented to ${packageJson.version}`);