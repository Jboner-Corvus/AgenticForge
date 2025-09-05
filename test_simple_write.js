// Test simple de création de fichier
import { promises as fs } from 'fs';
import path from 'path';

async function testWriteFile() {
  try {
    // Définir le chemin du workspace
    const workspacePath = "/home/demon/agenticforge-workspace";
    
    // Créer le répertoire s'il n'existe pas
    await fs.mkdir(workspacePath, { recursive: true }).catch(console.error);
    
    // Chemin complet du fichier
    const filePath = path.join(workspacePath, "test1.txt");
    
    // Contenu du fichier
    const content = "Contenu du test 1";
    
    // Écrire le fichier
    await fs.writeFile(filePath, content, 'utf-8');
    
    console.log("Fichier créé avec succès:", filePath);
    
    // Vérifier que le fichier existe
    const stats = await fs.stat(filePath);
    console.log("Taille du fichier:", stats.size, "octets");
    
  } catch (error) {
    console.error("Erreur lors de la création du fichier:", error);
  }
}

testWriteFile();