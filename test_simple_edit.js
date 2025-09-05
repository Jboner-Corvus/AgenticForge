// Test simple de modification de fichier
import { promises as fs } from 'fs';
import path from 'path';

async function testEditFile() {
  try {
    // Définir le chemin du workspace
    const workspacePath = "/home/demon/agenticforge-workspace";
    
    // Chemin complet du fichier
    const filePath = path.join(workspacePath, "test1.txt");
    
    // Lire le contenu actuel
    let content = await fs.readFile(filePath, 'utf-8');
    console.log("Contenu actuel du fichier:");
    console.log(content);
    
    // Modifier le contenu (ajouter du texte)
    content = content + "\nContenu ajouté lors de la modification";
    
    // Écrire le nouveau contenu
    await fs.writeFile(filePath, content, 'utf-8');
    
    console.log("\nFichier modifié avec succès!");
    
    // Vérifier le nouveau contenu
    const newContent = await fs.readFile(filePath, 'utf-8');
    console.log("\nNouveau contenu du fichier:");
    console.log(newContent);
    
  } catch (error) {
    console.error("Erreur lors de la modification du fichier:", error);
  }
}

testEditFile();