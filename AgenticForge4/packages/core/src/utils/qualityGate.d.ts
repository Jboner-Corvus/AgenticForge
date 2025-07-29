interface QualityResult {
  output: string;
  success: boolean;
}
/**
 * Exécute une série de vérifications de qualité (types, format, lint) dans un sandbox Docker.
 * @returns Un objet indiquant si toutes les vérifications ont réussi et la sortie combinée.
 */
export declare function runQualityGate(): Promise<QualityResult>;

export {};
//# sourceMappingURL=qualityGate.d.ts.map
