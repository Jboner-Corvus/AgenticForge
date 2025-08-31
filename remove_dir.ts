import { rmdir } from 'fs/promises';
import { join } from 'path';

async function removeDirectory() {
  try {
    const dirPath = join(__dirname, 'test_dir');
    await rmdir(dirPath);
    console.log('Répertoire test_dir supprimé avec succès');
  } catch (err) {
    console.error('Erreur lors de la suppression du répertoire:', err);
  }
}

removeDirectory();
