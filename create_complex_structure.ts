import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';

async function createComplexFileStructure() {
  try {
    // Définir le chemin de base
    const baseDir = join(__dirname, 'complex_structure');

    // Supprimer la structure existante si elle existe
    try {
      await rm(baseDir, { recursive: true, force: true });
    } catch (err) {
      // Ignorer les erreurs si le répertoire n'existe pas
    }

    // Créer la structure de répertoires
    await mkdir(baseDir, { recursive: true });

    const dir1 = join(baseDir, 'dir1');
    await mkdir(dir1);

    const dir2 = join(baseDir, 'dir2');
    await mkdir(dir2);

    const subdir1 = join(dir1, 'subdir1');
    await mkdir(subdir1);

    // Créer les fichiers
    await writeFile(join(baseDir, 'file1.txt'), 'Contenu du fichier 1');
    await writeFile(join(dir1, 'file2.txt'), 'Contenu du fichier 2');
    await writeFile(join(dir2, 'file3.txt'), 'Contenu du fichier 3');
    await writeFile(join(subdir1, 'file4.txt'), 'Contenu du fichier 4');

    console.log('Arborescence de fichiers complexes créée avec succès');
  } catch (err) {
    console.error(
      "Erreur lors de la création de l'arborescence de fichiers:",
      err,
    );
  }
}

createComplexFileStructure();
