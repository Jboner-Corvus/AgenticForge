import { readdir, stat } from 'fs/promises';
import { join } from 'path';

async function searchFilesByPattern() {
  try {
    const testDir = join(__dirname, 'search_test');
    const files = await readdir(testDir);

    // Rechercher des fichiers avec différents motifs
    const txtFiles = files.filter((file) => file.endsWith('.txt'));
    const jsonFiles = files.filter((file) => file.endsWith('.json'));
    const logFiles = files.filter((file) => file.endsWith('.log'));

    console.log('Fichiers .txt trouvés:', txtFiles);
    console.log('Fichiers .json trouvés:', jsonFiles);
    console.log('Fichiers .log trouvés:', logFiles);
  } catch (err) {
    console.error('Erreur lors de la recherche de fichiers:', err);
  }
}

searchFilesByPattern();
