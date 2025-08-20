import { getLoggerInstance } from '../logger.ts';

/**
 * Valide si une chaîne de caractères est une URL HTTP/HTTPS valide.
 * @param urlString La chaîne à valider.
 * @param context Un contexte optionnel pour la journalisation (ex: nom de la fonction appelante).
 * @returns `true` si l'URL est valide, `false` sinon.
 */
export function isValidHttpUrl(
  urlString: null | string | undefined,
  context?: string,
): boolean {
  if (!urlString) {
    return false;
  }
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      if (context) {
        getLoggerInstance().warn(
          { context, reason: 'Protocole non supporté', url: urlString },
          "Tentative d'utilisation d'une URL avec un protocole non HTTP/HTTPS.",
        );
      }
      return false;
    }
    return true;
  } catch (e) {
    if (context) {
      getLoggerInstance().warn(
        { context, error: (e as Error).message, url: urlString },
        "Format d'URL invalide détecté.",
      );
    }
    return false;
  }
}

export function validateApiKey(
  apiKey: string | undefined,
  expectedApiKey: string | undefined,
): boolean {
  if (!apiKey || !expectedApiKey) {
    return false;
  }
  return apiKey === expectedApiKey;
}

export function validateWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  // This is a placeholder. Real validation would involve HMAC verification.
  // For now, we'll just check if signature and secret are present.
  return !!payload && !!signature && !!secret;
}
