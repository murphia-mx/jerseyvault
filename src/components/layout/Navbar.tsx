import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Heart, Menu, X, ChevronDown } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";
import { APP_CONFIG } from "../../config/app.config";
import { cn } from "../../utils/cn";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";

const COLLECTIONS = [
  { id: "retro", name: "Retro Collection" },
  { id: "player-version", name: "Player Version" },
  { id: "novedades", name: "Novedades" },
  { id: "premier-league", name: "Premier League" },
  { id: "la-liga", name: "La Liga" },
  { id: "serie-a", name: "Serie A" },
  { id: "bundesliga", name: "Bundesliga" },
  { id: "ligue-1", name: "Ligue 1" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCollectionsOpen, setIsMobileCollectionsOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalItems, openCart } = useCart();
  const { totalWishlist } = useWishlist();
  const location = useLocation();

  // Scroll detection for Navbar elevation
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu and desktop dropdown on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDesktopDropdownOpen(false);
    setIsMobileCollectionsOpen(false);
  }, [location.pathname]);

  // Close desktop dropdown on Escape
  useEffect(() => {
    if (!isDesktopDropdownOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDesktopDropdownOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isDesktopDropdownOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const isCollectionActive = isActive("/coleccion");
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileCollectionsOpen(false);
  };

  return (
    <>
      {/* Mobile menu backdrop — closes on tap */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/20"
          aria-hidden="true"
          onClick={closeMobileMenu}
        />
      )}

      <header
        className={cn(
          "sticky top-0 z-40 w-full backdrop-blur-md border-b transition-all duration-300",
          isScrolled
            ? "bg-white/95 dark:bg-[#0a0a0a]/95 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-[0_1px_20px_rgba(0,0,0,0.5)]"
            : "bg-white/80 dark:bg-[#0a0a0a]/80 border-gray-100 dark:border-white/5",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 flex-shrink-0 transition-opacity hover:opacity-80 group"
            >
              <span className="text-xl font-black tracking-tighter text-gray-900 dark:text-white transition-colors">
                {APP_CONFIG.store.name}
              </span>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center justify-center space-x-1 absolute left-1/2 -translate-x-1/2 h-full">
              <Link
                to="/"
                className={cn(
                  "relative px-4 py-2 text-[13px] font-bold tracking-wide uppercase transition-colors duration-200 rounded-lg",
                  isActive("/") &&
                    !isActive("/catalogo") &&
                    !isActive("/coleccion")
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5",
                )}
              >
                Inicio
                {isActive("/") &&
                  !isActive("/catalogo") &&
                  !isActive("/coleccion") && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-900 dark:bg-white rounded-full" />
                  )}
              </Link>

              <Link
                to="/catalogo"
                className={cn(
                  "relative px-4 py-2 text-[13px] font-bold tracking-wide uppercase transition-colors duration-200 rounded-lg",
                  isActive("/catalogo") && !isCollectionActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5",
                )}
              >
                Catálogo
                {isActive("/catalogo") && !isCollectionActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-900 dark:bg-white rounded-full" />
                )}
              </Link>

              {/* Colecciones — click-toggled dropdown */}
              <div className="relative h-full flex items-center">
                <button
                  type="button"
                  onClick={() => setIsDesktopDropdownOpen((o) => !o)}
                  aria-expanded={isDesktopDropdownOpen}
                  aria-haspopup="true"
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold tracking-wide uppercase transition-colors duration-200 rounded-lg",
                    isCollectionActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5",
                  )}
                >
                  Colecciones
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      isDesktopDropdownOpen && "rotate-180",
                    )}
                  />
                  {isCollectionActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-900 dark:bg-white rounded-full" />
                  )}
                </button>

                {/* Dropdown panel */}
                <div
                  className={cn(
                    "absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-56 rounded-2xl overflow-hidden z-50",
                    "bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10",
                    "shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]",
                    "transition-all duration-200 origin-top",
                    isDesktopDropdownOpen
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
                  )}
                >
                  <div className="p-2">
                    {COLLECTIONS.map((c) => (
                      <Link
                        key={c.id}
                        to={`/coleccion/${c.id}`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors",
                          location.pathname === `/coleccion/${c.id}`
                            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white",
                        )}
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            {/* ── Action Icons ── */}
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <GlobalSearch />

              <Link
                to="/favoritos"
                className="relative flex items-center justify-center p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20"
                aria-label="Mis favoritos"
              >
                <Heart className="w-5 h-5" />
                {totalWishlist > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a]">
                    {totalWishlist > 9 ? "9+" : totalWishlist}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={openCart}
                className="relative flex items-center justify-center p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20"
                aria-label={`Abrir pedido${totalItems > 0 ? `, ${totalItems} artículos` : ""}`}
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-full border-2 border-white dark:border-[#0a0a0a]">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                type="button"
                className="md:hidden p-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 ml-1 transition-colors"
                onClick={() => setIsMobileMenuOpen((o) => !o)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Menú principal"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu Panel ── */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isMobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <nav className="flex flex-col py-3 px-3 gap-1 overflow-y-auto max-h-[80vh]">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors",
                isActive("/") &&
                  !isActive("/catalogo") &&
                  !isActive("/coleccion")
                  ? "bg-gray-950 dark:bg-white text-white dark:text-gray-900"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5",
              )}
            >
              Inicio
            </Link>

            <Link
              to="/catalogo"
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors",
                isActive("/catalogo") && !isCollectionActive
                  ? "bg-gray-950 dark:bg-white text-white dark:text-gray-900"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5",
              )}
            >
              Catálogo
            </Link>

            {/* Colecciones accordion */}
            <div>
              <button
                type="button"
                onClick={() => setIsMobileCollectionsOpen((o) => !o)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-colors",
                  isCollectionActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5",
                )}
              >
                <span>Colecciones</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                    isMobileCollectionsOpen && "rotate-180",
                  )}
                />
              </button>

              {/* Accordion body */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-250 ease-in-out",
                  isMobileCollectionsOpen
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0",
                )}
              >
                <div className="pl-4 py-1 flex flex-col gap-0.5">
                  {COLLECTIONS.map((c) => (
                    <Link
                      key={c.id}
                      to={`/coleccion/${c.id}`}
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center px-4 py-2.5 text-sm rounded-xl transition-colors",
                        location.pathname === `/coleccion/${c.id}`
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white",
                      )}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-white/10 my-1 mx-2" />

            <Link
              to="/favoritos"
              onClick={closeMobileMenu}
              className="flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="flex items-center gap-3">
                <Heart className="w-4 h-4" />
                Mis Favoritos
              </span>
              {totalWishlist > 0 && (
                <span className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  {totalWishlist}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
