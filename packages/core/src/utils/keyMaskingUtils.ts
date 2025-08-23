/**
 * Masque une clé API en ne montrant que le début et la fin
 * @param key La clé API à masquer
 * @param visibleStart Le nombre de caractères visibles au début (par défaut 3)
 * @param visibleEnd Le nombre de caractères visibles à la fin (par défaut 4)
 * @returns La clé masquée
 */
export function maskApiKey(
  key: string,
  visibleStart: number = 3,
  visibleEnd: number = 4,
): string {
  if (!key || key.length <= visibleStart + visibleEnd) {
    // Si la clé est trop courte, on masque tout sauf le premier et dernier caractère
    return key ? `${key.charAt(0)}...${key.charAt(key.length - 1)}` : '';
  }

  const start = key.substring(0, visibleStart);
  const end = key.substring(key.length - visibleEnd);
  return `${start}...${end}`;
}
