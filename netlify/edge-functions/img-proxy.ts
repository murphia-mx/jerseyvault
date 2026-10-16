import { MIME_BY_FORMAT, classifyImageBytes } from "../shared/yupoo-image.ts";

// Respuestas válidas: caché de 1 año (las URLs de imágenes de Yupoo no mutan).
const CACHE_VALID = "public, max-age=31536000, s-maxage=31536000, immutable";
// Imagen inexistente o aviso de Yupoo: caché corta, por si el proveedor la restaura.
const CACHE_MISSING = "public, max-age=300, s-maxage=600";
// Fallos temporales (567, 429, 5xx, red): nunca se cachean.
const CACHE_NONE = "no-store";
const MAX_BODY_BYTES = 8 * 1024 * 1024;

function failure(status: number, cacheControl: string, reason: string): Response {
  return new Response("Image unavailable", {
    status,
    headers: { "Cache-Control": cacheControl, "X-JV-Image-Status": reason },
  });
}

export default async (request: Request) => {
  const url = new URL(request.url);

  // 1. Extraer la ruta base
  // /img-proxy/club-a/image.jpg -> /club-a/image.jpg
  const imagePath = url.pathname.replace(/^\/img-proxy/, "");

  if (!imagePath || imagePath === "/") {
    return new Response("Missing image path", { status: 400 });
  }

  // 2. Seguridad: Prevención estricta de SSRF
  // Eliminamos slashes iniciales para evitar que `new URL()` lo interprete como //evil.com
  const cleanPath = imagePath.replace(/^\/+/, "");

  let targetUrl: URL;
  try {
    targetUrl = new URL(`/${cleanPath}`, "https://photo.yupoo.com");
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  // Validación final paranoica
  if (targetUrl.hostname !== "photo.yupoo.com") {
    return new Response("Forbidden target", { status: 403 });
  }

  // 3. Proxying
  try {
    const response = await fetch(targetUrl.href, {
      method: "GET",
      headers: {
        "Referer": "https://x.yupoo.com/",
        "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
    });

    if (!response.ok) {
      await response.body?.cancel();
      // 404/403/410: la imagen no existe → 404 para que el frontend (onError) use otra imagen.
      // 567 (bloqueo de Yupoo), 429, 5xx: fallo temporal → 502 sin caché.
      return [403, 404, 410].includes(response.status)
        ? failure(404, CACHE_MISSING, `upstream_${response.status}`)
        : failure(502, CACHE_NONE, `upstream_${response.status}`);
    }

    if (Number(response.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
      await response.body?.cancel();
      return failure(502, CACHE_NONE, "too_large");
    }

    // 4. Validar el contenido real: Yupoo responde 200 con un PNG de aviso
    // ("图片暂时无法展示") cuando la foto ya no está disponible.
    const bytes = new Uint8Array(await response.arrayBuffer());
    const verdict = await classifyImageBytes(bytes, targetUrl.pathname);
    if (verdict.verdict === "placeholder") return failure(404, CACHE_MISSING, "yupoo_placeholder");
    if (verdict.verdict === "invalid") return failure(502, CACHE_NONE, verdict.reason);

    // 5. Caché agresivo solo para imágenes verificadas
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": MIME_BY_FORMAT[verdict.format],
        "Cache-Control": CACHE_VALID,
        "X-JV-Image-Status": "ok",
      },
    });
  } catch (error) {
    console.error("Img-Proxy Error:", error);
    return failure(502, CACHE_NONE, "proxy_error");
  }
};
