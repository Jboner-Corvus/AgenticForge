import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '../config.js';
import { UserError } from './errorUtils.js';
import { runInSandbox } from './dockerManager.js';

// Mock de child_process pour éviter de vraies exécutions de commandes
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Importation du module mocké
import { exec } from 'child_process';

describe('LocalExecutionManager', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restaurer les timers après les tests de timeout
    vi.useRealTimers();
  });

  it('should execute a command and return stdout', async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    // Simuler une exécution réussie
    mockExec.mockImplementation((command, options, callback) => {
      callback(null, { stdout: 'hello world', stderr: '' });
      return {}; // Simule un objet ChildProcess
    });

    const result = await runInSandbox('ignored-image', ['echo', 'hello world']);

    expect(result.stdout).toBe('hello world');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  });

  it('should handle stderr correctly', async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    const errorMessage = 'ls: cannot access \'/nonexistent\': No such file or directory';
    // Simuler une commande qui échoue
    mockExec.mockImplementation((command, options, callback) => {
      const error = new Error(`Command failed: ${command}`) as any;
      error.code = 2;
      error.stderr = errorMessage;
      error.stdout = '';
      callback(error, { stdout: '', stderr: errorMessage });
      return {};
    });

    const result = await runInSandbox('ignored-image', ['ls', '/nonexistent']);

    expect(result.stderr).toContain(errorMessage);
    expect(result.stdout).toBe('');
    expect(result.exitCode).toBe(2);
  });

  it('should time out if execution takes too long', async () => {
    config.CODE_EXECUTION_TIMEOUT_MS = 50; // Timeout court pour le test
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;

    // Simuler une commande qui ne se termine jamais
    mockExec.mockImplementation((command, options, callback) => {
      const error = new Error('Timeout') as any;
      error.signal = 'SIGTERM';
      setTimeout(() => {
        callback(error, { stdout: '', stderr: '' });
      }, 100); // Délai supérieur au timeout
      return {};
    });

    await expect(runInSandbox('ignored-image', ['sleep', '1'])).rejects.toThrow(
      'Execution timed out',
    );
  });

  it('should use the specified working directory', async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((command, options, callback) => {
      // Vérifier que l'option `cwd` est bien passée
      expect(options.cwd).toBe('/tmp/test');
      callback(null, { stdout: 'content', stderr: '' });
      return {};
    });

    await runInSandbox('ignored-image', ['ls'], { workingDir: '/tmp/test' });

    expect(mockExec).toHaveBeenCalledWith(
      'ls',
      expect.objectContaining({
        cwd: '/tmp/test',
      }),
      expect.any(Function),
    );
  });
});