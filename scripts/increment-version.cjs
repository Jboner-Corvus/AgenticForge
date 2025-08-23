#!/usr/bin/env node

// Simple script to increment version in package.json files
const fs = require('fs');
const path = require('path');

// Function to increment version
function incrementVersion(version) {
  const parts = version.split('.');
  const patch = parseInt(parts[2]) + 1;
  parts[2] = patch.toString();
  return parts.join('.');
}

// Update core package.json
const corePackagePath = path.join(__dirname, '..', 'packages', 'core', 'package.json');
if (fs.existsSync(corePackagePath)) {
  const corePackage = JSON.parse(fs.readFileSync(corePackagePath, 'utf8'));
  corePackage.version = incrementVersion(corePackage.version);
  fs.writeFileSync(corePackagePath, JSON.stringify(corePackage, null, 2));
  console.log(`Updated core package version to ${corePackage.version}`);
}

// Update UI package.json
const uiPackagePath = path.join(__dirname, '..', 'packages', 'ui', 'package.json');
if (fs.existsSync(uiPackagePath)) {
  const uiPackage = JSON.parse(fs.readFileSync(uiPackagePath, 'utf8'));
  uiPackage.version = incrementVersion(uiPackage.version);
  fs.writeFileSync(uiPackagePath, JSON.stringify(uiPackage, null, 2));
  console.log(`Updated UI package version to ${uiPackage.version}`);
}

// Update root package.json
const rootPackagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(rootPackagePath)) {
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
  rootPackage.version = incrementVersion(rootPackage.version);
  fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2));
  console.log(`Updated root package version to ${rootPackage.version}`);
}

console.log('Version increment completed.');