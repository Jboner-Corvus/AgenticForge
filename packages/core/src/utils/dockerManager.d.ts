/**
 * src/utils/dockerManager.ts
 *
 * Fournit des fonctions pour exécuter du code dans des conteneurs Docker sécurisés (sandbox).
 */
interface DockerMount {
  ReadOnly?: boolean;
  Source: string;
  Target: string;
  Type: 'bind' | 'tmpfs' | 'volume';
}
interface ExecutionResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}
interface SandboxOptions {
  mounts?: DockerMount[];
  workingDir?: string;
}
/**
 * Exécute une commande dans un conteneur Docker jetable.
 * @param imageName - L'image Docker à utiliser.
 * @param command - La commande à exécuter.
 * @param options - Options supplémentaires pour le sandbox (workingDir, mounts).
 * @returns Une promesse qui se résout avec le résultat de l'exécution.
 */
export declare function runInSandbox(
  imageName: string,
  command: string[],
  options?: SandboxOptions,
): Promise<ExecutionResult>;
export {};
//# sourceMappingURL=dockerManager.d.ts.map
