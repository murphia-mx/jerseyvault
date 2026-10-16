import { useState } from 'react';
import { Shirt } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getProxiedImageUrl } from '../../utils/imageProxy';

/** Images tried per product before showing the placeholder (each failure is a request to Yupoo). */
const MAX_ATTEMPTS = 4;

interface ProductImageProps {
  /** Primary image src (thumbnail or first URL from imagenes). Will be proxied automatically. */
  src?: string | null;
  /** Additional fallback URLs to try if src fails, in order. Will be proxied automatically. */
  fallbackSrcs?: string[];
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Robust image component for all Yupoo-hosted product images.
 *
 * Fallback chain:
 *   1. src (proxied)
 *   2. fallbackSrcs[0] (proxied)
 *   3. fallbackSrcs[1] (proxied)
 *   ...
 *   N. "Imagen temporalmente no disponible" placeholder (no broken-image browser icon ever)
 *
 * All URLs are automatically rewritten through getProxiedImageUrl() so that
 * the Yupoo hotlink protection is bypassed transparently. The proxy answers 404
 * for Yupoo's own "image unavailable" picture, so it is never shown.
 */
export function ProductImage({ src, fallbackSrcs = [], alt, className, loading = 'lazy' }: ProductImageProps) {
  const [errorCount, setErrorCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Build the ordered list of URLs to try, filtering out empties, then proxy each.
  // De-duplicated: the thumbnail is usually also imagenes[0], and retrying the same
  // URL would keep the same <img> (same key) and stall the fallback chain.
  const allSrcs = [src, ...fallbackSrcs]
    .filter((u): u is string => Boolean(u && u.trim() !== ''))
    .map(getProxiedImageUrl)
    .filter((u, i, list): u is string => Boolean(u) && list.indexOf(u) === i)
    .slice(0, MAX_ATTEMPTS);

  const currentSrc = allSrcs[errorCount];

  if (!currentSrc) return <ImageUnavailable alt={alt} className={className} />;

  return (
    <img
      key={currentSrc}
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn('bg-gray-100 dark:bg-white/[0.04]', className)}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        setErrorCount(prev => prev + 1);
        setIsLoaded(false);
      }}
      style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
    />
  );
}

/**
 * Shown while every image of a product fails (e.g. a temporary provider error).
 * Always dark, whatever the theme. Container queries keep it legible from
 * search-result thumbnails up to the product page.
 */
function ImageUnavailable({ alt, className }: { alt: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${alt}: imagen temporalmente no disponible`}
      className={cn(
        '@container relative flex flex-col items-center justify-center gap-3 overflow-hidden',
        'bg-[#0f0f10] bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.07),transparent_65%)]',
        className
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] @min-[9rem]:size-12">
        <Shirt className="size-4 text-white/55 @min-[9rem]:size-5" strokeWidth={1.25} aria-hidden="true" />
      </span>
      <span className="hidden max-w-[13rem] px-4 text-center text-[9px] font-semibold uppercase leading-relaxed tracking-[0.2em] text-white/50 @min-[9rem]:block @min-[20rem]:text-[10px]">
        Imagen temporalmente no disponible
      </span>
    </div>
  );
}
