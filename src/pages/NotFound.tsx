import { Link } from 'react-router-dom';
import { ArrowRight, Shirt } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <Helmet>
        <title>Página no encontrada | Club Kit</title>
        <meta name="description" content="La página que buscas no existe." />
      </Helmet>
      <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-8">
        <Shirt className="w-10 h-10 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
      </div>
      <h1 className="text-6xl font-black tracking-tighter text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
        Página no encontrada
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-10 leading-relaxed">
        La camiseta o sección que buscas no existe o ha sido movida. Explora nuestro catálogo para encontrar la camiseta ideal.
      </p>
      <Link to="/catalogo">
        <Button className="gap-2">
          Volver al catálogo
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
