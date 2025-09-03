// Test de validation d'une clé API Gemini
import { spawn } from 'child_process';

// Utiliser une des clés API Gemini du fichier .env
const apiKey = 'AIzaSyCiT7196B9kd_T51ADx__t5sWthI3QwhRg'; // Clé principale

// Commande curl pour tester la clé API
const curlCommand = `curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, world!"
      }]
    }]
  }'`;

console.log('Test de la clé API Gemini...');
console.log('Commande:', curlCommand);

// Exécuter la commande curl
const child = spawn('bash', ['-c', curlCommand]);

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

child.on('close', (code) => {
  console.log('Code de sortie:', code);
  console.log('Sortie standard:', output);
  if (errorOutput) {
    console.log('Sortie d\'erreur:', errorOutput);
  }
  
  // Vérifier si la réponse contient une erreur d'API key
  if (output.includes('API_KEY_INVALID') || output.includes('API key not valid')) {
    console.log('❌ La clé API est invalide');
  } else if (output.includes('generatedContent') || output.includes('candidates')) {
    console.log('✅ La clé API est valide');
  } else {
    console.log('❓ Réponse inattendue, impossible de déterminer la validité de la clé');
  }
});