import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getProductBySlug, getProducts, ligaPath } from '../services/catalog.service';
import type { Product } from '../types/product';
import { ProductViewer } from '../components/product/ProductGallery';
import { ProductInfo } from '../components/product/ProductInfo';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { Helmet } from 'react-helmet-async';

function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="aspect-square bg-gray-100 dark:bg-white/5 rounded-[28px]" />
        <div className="flex flex-col gap-6">
          <div className="h-6 w-32 bg-gray-100 dark:bg-white/5 rounded" />
          <div className="h-10 w-3/4 bg-gray-100 dark:bg-white/5 rounded" />
          <div className="h-4 w-24 bg-gray-100 dark:bg-white/5 rounded" />
          <div className="h-px bg-gray-100 dark:bg-white/5" />
          <div className="h-32 bg-gray-100 dark:bg-white/5 rounded-xl" />
          <div className="h-14 bg-gray-100 dark:bg-white/5 rounded-xl" />
          <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    setIsLoading(true);
    setIsLightboxOpen(false); // reset on slug change

    getProductBySlug(slug).then(found => {
      if (!isMounted) return;

      if (!found) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setProduct(found);

      // Load related products (same team, excluding current)
      getProducts().then(all => {
        if (!isMounted) return;
        const rel = all
          .filter(p => p.equipo === found.equipo && p.id !== found.id)
          .slice(0, 4);
        setRelated(rel);
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) return <ProductSkeleton />;

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Producto no encontrado
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          El producto que buscas no existe o fue eliminado.
        </p>
        <Link
          to="/catalogo"
          className="text-sm font-medium underline underline-offset-4 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Helmet>
        <title>{product.nombre} | Club Kit</title>
        <meta name="description" content={`Compra el jersey ${product.nombre} del ${product.equipo} en Club Kit. ${product.tipo}. Envío garantizado a todo el mundo.`} />
        <meta property="og:title" content={`${product.nombre} | Club Kit`} />
        <meta property="og:description" content={`Compra el jersey ${product.nombre} del ${product.equipo} en Club Kit. ${product.tipo}.`} />
        {product.thumbnail && <meta property="og:image" content={product.thumbnail} />}
      </Helmet>

      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-10"
        aria-label="Breadcrumb"
      >
        <Link to="/catalogo" className="hover:text-gray-900 dark:hover:text-white transition-colors">
          Catálogo
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          to={ligaPath(product.liga)}
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {product.liga}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 dark:text-gray-300 font-medium line-clamp-1 max-w-[200px]">
          {product.nombre}
        </span>
      </nav>

      {/* Main grid — image + info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
        {/* Product image viewer (zoom + lightbox) */}
        <ProductViewer
          thumbnail={product.thumbnail}
          productName={product.nombre}
          isLightboxOpen={isLightboxOpen}
          onOpenLightbox={() => setIsLightboxOpen(true)}
          onCloseLightbox={() => setIsLightboxOpen(false)}
        />

        {/* Product info — passes lightbox trigger down */}
        <ProductInfo
          product={product}
          onOpenLightbox={() => setIsLightboxOpen(true)}
        />
      </div>

      {/* Related products */}
      <RelatedProducts products={related} />
    </div>
  );
}
