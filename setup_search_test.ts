import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function searchFilesByPattern() {
  try {
    // Créer un répertoire pour le test
    const testDir = join(__dirname, 'search_test');
    await mkdir(testDir, { recursive: true });

    // Créer quelques fichiers avec différents motifs
    await writeFile(join(testDir, 'file1.txt'), 'Contenu du fichier 1');
    await writeFile(join(testDir, 'file2.log'), 'Contenu du fichier 2');
    await writeFile(join(testDir, 'data1.json'), '{"name": "data1"}');
    await writeFile(join(testDir, 'data2.json'), '{"name": "data2"}');
    await writeFile(join(testDir, 'readme.md'), '# Readme');

    console.log('Fichiers de test créés pour la recherche par motif');
  } catch (err) {
    console.error('Erreur lors de la création des fichiers de test:', err);
  }
}

searchFilesByPattern();
