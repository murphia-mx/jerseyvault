import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Info } from "lucide-react";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        style={{ animation: 'lbFadeIn 220ms ease-out forwards' }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-md bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        style={{ animation: 'lbScaleIn 220ms ease-out forwards' }}
        onClick={(e: ReactMouseEvent) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <X strokeWidth={2} className="w-4 h-4" />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Info className="w-5 h-5 text-gray-100" />
          </div>
          
          <h3 className="text-xl font-bold tracking-tight text-white mb-3">
            Archivo Documental
          </h3>
          
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Esta plataforma es un proyecto de exploración visual y de diseño creado exclusivamente por <strong className="font-semibold text-gray-200">Murphia</strong>.
            No somos una tienda comercial, no vendemos artículos ni realizamos cotizaciones reales.
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-white text-black text-sm font-semibold tracking-wide rounded-full hover:scale-[1.02] transition-transform duration-300"
          >
            Entendido, volver al archivo
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Reuse the animations from ImageLightbox or inject our own if not present
if (typeof document !== 'undefined' && !document.getElementById('lb-keyframes')) {
  const style = document.createElement('style');
  style.id = 'lb-keyframes';
  style.textContent = `
    @keyframes lbFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes lbScaleIn {
      from { opacity: 0; transform: scale(0.96) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
