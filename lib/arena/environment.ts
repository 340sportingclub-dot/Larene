/**
 * Contexte de déploiement.
 *
 * Vercel expose `VERCEL_ENV` : « production », « preview » ou « development ».
 * Un déploiement Preview est compilé en mode production — `NODE_ENV` ne suffit
 * donc pas à les distinguer.
 */
export function isPreviewEnvironment(): boolean {
  const env = process.env.VERCEL_ENV;
  if (env) return env !== "production";
  return process.env.NODE_ENV !== "production";
}
