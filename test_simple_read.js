// Test simple de lecture de fichier
import { promises as fs } from 'fs';
import path from 'path';

async function testReadFile() {
  try {
    // Définir le chemin du workspace
    const workspacePath = '/home/demon/agenticforge-workspace';

    // Chemin complet du fichier
    const filePath = path.join(workspacePath, 'test1.txt');

    // Lire le fichier
    const content = await fs.readFile(filePath, 'utf-8');

    console.log('Contenu du fichier lu avec succès:');
    console.log(content);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
  }
}

testReadFile();
