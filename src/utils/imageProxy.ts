/**
 * `?v=` is ignored by the proxy but busts browser caches: before v2 the proxy
 * cached Yupoo's "image unavailable" PNG for a year. Bump to invalidate again.
 */
const PROXY_CACHE_VERSION = "2";

/**
 * Rewrites a Yupoo image URL to go through our proxy route.
 *
 * WHY THIS IS NECESSARY:
 * photo.yupoo.com enforces a Referer-based hotlink protection.
 * It returns HTTP 567 (a custom rejection code) for any request
 * whose Referer header doesn't belong to a whitelisted set of domains.
 *
 * Whitelisted by Yupoo: http://localhost (any port), https://*.x.yupoo.com
 * Blocked by Yupoo: empty Referer, any external production domain.
 *
 * STRATEGY:
 * - In development (Vite dev server): Vite's proxy rewrites /img-proxy/* to
 *   photo.yupoo.com/* and injects `Referer: https://x.yupoo.com/` on the
 *   server-to-server request. The browser sees localhost as the origin, which
 *   also works, but the proxy-injected Referer is what matters in production.
 *
 * - In production: The hosting platform (Vercel/Netlify) must configure an
 *   equivalent rewrite rule. See /vercel.json or /netlify.toml for the config.
 *   Without it, images will fail in production. This is a deployment concern,
 *   not a code concern — the proxy URL format is identical in both environments.
 *
 * USAGE: Always use this function when building <img src>. Never use raw Yupoo URLs.
 */
export function getProxiedImageUrl(url: string | undefined | null): string | undefined {
  if (!url || url.trim() === "") return undefined;

  // Only proxy photo.yupoo.com URLs — leave any other domain untouched
  if (!url.includes("photo.yupoo.com")) return url;

  // Extract the path after the hostname and rewrite to our proxy route
  try {
    const parsed = new URL(url);
    return `/img-proxy${parsed.pathname}?v=${PROXY_CACHE_VERSION}`;
  } catch {
    // If URL parsing fails, return undefined so the fallback chain activates
    return undefined;
  }
}
