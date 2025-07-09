// src/utils/validationUtils.ts
import logger from '../logger.js'; // Pour la journalisation interne si nécessaire
/**
 * Valide si une chaîne de caractères est une URL HTTP/HTTPS valide.
 * @param urlString La chaîne à valider.
 * @param context Un contexte optionnel pour la journalisation (ex: nom de la fonction appelante).
 * @returns `true` si l'URL est valide, `false` sinon.
 */
export function isValidHttpUrl(urlString, context) {
  if (!urlString) {
    return false;
  }
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      if (context) {
        logger.warn(
          { context, reason: 'Protocole non supporté', url: urlString },
          "Tentative d'utilisation d'une URL avec un protocole non HTTP/HTTPS.",
        );
      }
      return false;
    }
    return true;
  } catch (e) {
    if (context) {
      logger.warn(
        { context, error: e.message, url: urlString },
        "Format d'URL invalide détecté.",
      );
    }
    return false;
  }
}
export function validateApiKey(apiKey, expectedApiKey) {
  if (!apiKey || !expectedApiKey) {
    return false;
  }
  return apiKey === expectedApiKey;
}
export function validateWebhook(payload, signature, secret) {
  // This is a placeholder. Real validation would involve HMAC verification.
  // For now, we'll just check if signature and secret are present.
  return !!payload && !!signature && !!secret;
}
//# sourceMappingURL=validationUtils.js.map
