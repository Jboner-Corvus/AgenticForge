// Test de chargement de la configuration
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fonction pour charger la configuration comme dans config.ts
function loadConfig() {
  console.log('DEBUG: process.cwd():', process.cwd());

  // Try multiple possible .env file locations to handle different execution contexts
  let envPath = resolve(__dirname, '..', '.env');
  if (!existsSync(envPath)) {
    // If running from dist/, try going up one more level
    envPath = resolve(__dirname, '..', '..', '.env');
  }
  if (!existsSync(envPath)) {
    // If still not found, try from current working directory
    envPath = resolve(process.cwd(), '.env');
  }

  console.log('DEBUG: Resolved .env path:', envPath);
  const result = dotenv.config({
    path: envPath,
  });

  if (result.error) {
    console.warn(
      'Could not find .env file, using environment variables only.',
      result.error,
    );
  } else if (result.parsed) {
    console.log(
      'DEBUG: .env file loaded successfully. Keys loaded:',
      Object.keys(result.parsed),
    );
  } else {
    console.log(
      'DEBUG: .env file loaded, but no keys parsed (might be empty or malformed).',
    );
  }

  // Afficher la configuration WORKSPACE_PATH
  console.log('WORKSPACE_PATH from process.env:', process.env.WORKSPACE_PATH);
  
  return process.env;
}

loadConfig();