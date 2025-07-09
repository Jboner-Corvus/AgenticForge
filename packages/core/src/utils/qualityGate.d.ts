interface QualityResult {
  output: string;
  success: boolean;
}
/**
 * Exécute une série de vérifications de qualité (types, format, lint) dans un sandbox Docker.
 * @returns Un objet indiquant si toutes les vérifications ont réussi et la sortie combinée.
 */
export declare function runQualityGate(): Promise<QualityResult>;
/**
 * Exécute un test simple pour un outil donné dans un sandbox Docker.
 * Tente d'importer l'outil et d'appeler sa méthode `execute`.
 * @param toolAbsolutePath - Le chemin absolu du fichier de l'outil à tester.
 * @returns Un objet indiquant si le test a réussi et la sortie combinée.
 */
export declare function runToolTestsInSandbox(
  toolAbsolutePath: string,
): Promise<QualityResult>;
export {};
//# sourceMappingURL=qualityGate.d.ts.map
