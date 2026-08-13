export const APP_CONFIG = {
  store: {
    name: "Club Kit",
    tagline: "La mejor colección de camisetas de fútbol",
    description:
      "Más de 2,000 camisetas de clubes y selecciones de todo el mundo.",
  },

  whatsapp: {
    number: "5219991215998", // ← Reemplazar con número definitivo
    messageHeader:
      "¡Hola! Quisiera solicitar una cotización para el siguiente pedido:",
    messageFooter:
      "¿Me pueden confirmar disponibilidad y el precio de cada artículo?\n¡Gracias! 🙌",
  },

  tallas: ["S", "M", "L", "XL"] as const, // ← Ampliar aquí para futuras versiones

  contact: {
    whatsapp: "5219991215998", // ← Mismo número que arriba
  },

  social: {
    instagram: "https://instagram.com/Club Kit_mid", // ← Actualizar
    facebook: "https://Club Kitstore.netlify.app/404", // ← Actualizar
    tiktok: "https://Club Kitstore.netlify.app/404", // ← Actualizar
  },

  catalog: {
    pageSize: 24,
  },
} as const;

export type Talla = (typeof APP_CONFIG.tallas)[number];
