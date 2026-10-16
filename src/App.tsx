import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { ScrollToTop } from './components/layout/ScrollToTop';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import Collection from './pages/Collection';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          {/* The store opens directly on the catalog */}
          <Route index element={<Navigate to="/catalogo" replace />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/catalogo/:liga" element={<Catalog />} />
          <Route path="/coleccion/:id" element={<Collection />} />
          <Route path="/producto/:slug" element={<Product />} />
          <Route path="/favoritos" element={<Wishlist />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
