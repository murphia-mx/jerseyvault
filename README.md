# Club Kit

### Premium football jersey catalog experience

A non-commercial React experience designed to showcase a large football jersey catalog through a premium, editorial-style interface.

The project was originally conceived as the foundation for a commercial football jersey store. It was later repositioned as a standalone portfolio demonstration, focused on catalog exploration, visual presentation, filtering, collections and product discovery rather than active commerce.

**React · TypeScript · Vite · Tailwind CSS · React Router · React 19**

---

## Overview

Club Kit is a front-end catalog experience for exploring football jerseys from clubs and national teams around the world.

The project was designed to answer a simple product question:

> How can a large product catalog feel curated, premium and easy to explore instead of looking like a traditional e-commerce grid?

The result is a visual experience centered around:

**Discover → Explore → Filter → Inspect → Save**

The current version is presented strictly as a **non-commercial portfolio demonstration**. It is not an active retail operation and does not represent a live store.

---

## Project Context

The project started as a concept for a football jersey store and was initially structured with commerce-oriented functionality.

As the project evolved, its purpose changed.

Instead of launching it as a commercial storefront, the experience was retained as a personal portfolio project and repositioned around the quality of the interface, catalog architecture and overall product experience.

This change in direction allowed the project to focus on the parts most relevant to the portfolio:

- Product discovery
- Catalog architecture
- Search and filtering
- League-based navigation
- Product detail experiences
- Collection pages
- Wishlist interactions
- Responsive design
- Premium visual presentation
- Reusable frontend architecture

The repository should therefore be understood as a **design and engineering demonstration**, not as an operating football jersey business.

---

## The Challenge

Football jersey catalogs can become difficult to navigate quickly.

A large collection may contain:

- Multiple leagues
- Multiple clubs
- National teams
- Different jersey types
- Home and away versions
- Retro products
- Player versions
- Different seasons and editions

A conventional product grid can easily become visually repetitive and difficult to explore.

The challenge was to create an interface that could handle a large catalog while still feeling:

- Curated
- Fast
- Visual
- Premium
- Easy to navigate
- Consistent across screen sizes

The experience also needed to make individual products feel important without turning every interaction into a complicated flow.

---

## The Approach

The project was approached as a **catalog-first digital experience** rather than a traditional storefront.

The interface uses a combination of:

- Editorial hero sections
- Curated discovery modules
- League navigation
- Search
- Catalog filters
- Product cards
- Product detail pages
- Related products
- Collections
- Wishlist interactions
- Lightboxes and image-focused UI

Instead of overwhelming visitors with the entire catalog immediately, the home experience creates a visual path into the collection.

---

## Key Features

### Discovery Experience

- Cinematic hero section
- Curated football imagery
- Bento-style discovery layout
- League navigation
- Featured products
- Trending content
- Editorial manifesto section
- Responsive CTA sections

### Catalog

- Large local product dataset
- Dynamic product loading
- League filtering
- Team filtering
- Jersey type filtering
- Text search
- Active filter states
- Empty states
- Responsive product grid
- Product pagination/page sizing
- URL-based league routes

### Product Experience

- Dedicated product detail pages
- Image gallery
- Product information
- Size selection
- Related products
- Image lightbox
- Responsive product presentation
- SEO metadata through `react-helmet-async`

### Collections

- Collection-based routes
- Curated product groupings
- Collection browsing experience
- Reusable product presentation components

### Wishlist

- Add/remove wishlist interactions
- Persistent client-side wishlist state
- Dedicated wishlist page
- Wishlist buttons integrated into product cards

### Interface

- Responsive navigation
- Dark/light theme support
- Theme toggle
- Reusable buttons, cards, inputs and badges
- Scroll-to-top behavior
- Responsive layouts
- Micro-interactions
- Image-focused presentation

---

## Catalog Architecture

The catalog is intentionally separated from the UI through a dedicated service layer.

```text
src/
├── data/
│   └── catalog.json
│
├── services/
│   └── catalog.service.ts
│
├── hooks/
│   └── useCatalog.ts
│
├── types/
│   ├── catalog.ts
│   └── product.ts
│
└── components/
    └── catalog/
```

The catalog service is responsible for loading and querying product data rather than having individual UI components directly manipulate the raw dataset.

The service exposes operations for:

- Loading products
- Finding products by slug
- Filtering products by league
- Extracting available leagues
- Extracting teams within a league
- Filtering products using multiple criteria

This keeps the catalog logic reusable across the home page, catalog pages, collections and product views.

---

## Data Strategy

The current demonstration uses a local JSON dataset rather than a remote commerce backend.

```text
catalog.json
     │
     ▼
catalog.service.ts
     │
     ▼
useCatalog
     │
     ├── Home
     ├── Catalog
     ├── Collection
     ├── Product
     └── Wishlist
```

This approach keeps the demonstration self-contained and makes the project easy to run locally without requiring an external database or commerce platform.

The architecture also leaves a clear path for replacing the local dataset with an API or database-backed catalog in a future production implementation.

---

## Technical Architecture

The application uses a lightweight React architecture organized around pages, domain-specific components, services, hooks, types and shared UI primitives.

```text
src/
├── assets/
│   └── images/
│
├── components/
│   ├── cart/
│   ├── catalog/
│   ├── home/
│   ├── layout/
│   ├── product/
│   ├── ui/
│   └── wishlist/
│
├── config/
├── context/
├── data/
├── hooks/
├── pages/
├── services/
├── types/
└── utils/
```

### Routing

React Router provides the application's page-level navigation.

Current routes include:

```text
/
├── /catalogo
├── /catalogo/:liga
├── /coleccion/:id
├── /producto/:slug
└── /favoritos
```

This allows the catalog to remain navigable through meaningful URLs rather than relying entirely on client-side state.

---

## UX & Design

The visual direction is inspired by premium sportswear, editorial commerce and modern digital product design.

The objective is to make the catalog feel more like a curated collection than a generic online store.

### Visual principles

- Strong typography hierarchy
- Large editorial imagery
- Controlled whitespace
- High-contrast surfaces
- Consistent card geometry
- Restrained use of accents
- Clear interaction states
- Product imagery as the primary visual element

### Discovery before density

Rather than presenting hundreds of products immediately, the homepage establishes context through curated sections before directing users into the complete catalog.

This creates a more intentional browsing experience and helps reduce the perceived complexity of a large dataset.

### Responsive behavior

The interface adapts across:

- Desktop
- Laptop
- Tablet
- Mobile

Responsive behavior was considered for navigation, grids, filters, product galleries, typography, spacing and touch interactions.

---

## Theme System

The project supports light and dark presentation modes through a dedicated theme provider and reusable theme controls.

The goal is to allow the same product catalog to maintain visual hierarchy and readability across both environments without duplicating component logic.

Theme-related components include:

- `ThemeProvider`
- `ThemeToggle`
- Shared theme-aware UI components

---

## Engineering Decisions

### Local catalog instead of a commerce backend

Because the final project is a portfolio demonstration rather than a live store, a local JSON catalog provides several advantages:

- No external backend dependency
- Fast local setup
- Predictable data
- Easy demonstrations
- Simple deployment
- Clear separation between presentation and data access

For a production commerce platform, this layer could be replaced with an API, database or commerce service without requiring the UI architecture to be completely rewritten.

### Service layer for catalog operations

Catalog querying is isolated in `catalog.service.ts`.

This prevents product filtering and lookup logic from being scattered throughout React components.

For example, the service handles:

```text
getProducts()
getProductBySlug()
getProductsByLiga()
getLigas()
getEquiposByLiga()
filterProducts()
```

This makes the data layer easier to test, replace and extend.

### Reusable UI primitives

Common visual patterns are represented through reusable components such as:

- `Button`
- `Card`
- `Badge`
- `Input`
- `Container`
- `SectionTitle`
- `ProductImage`
- `ImageLightbox`

This reduces duplicated styling and helps keep the interface consistent.

### Client-side state for wishlist interactions

Wishlist behavior is handled through React context and hooks, keeping the interaction lightweight and independent from any backend.

This is appropriate for the current non-commercial demonstration.

---

## Performance Considerations

The application is built with Vite and uses code splitting through the application's build pipeline.

The catalog service also caches the loaded JSON dataset in memory:

```text
First request
    ↓
Load catalog.json
    ↓
Cache products
    ↓
Subsequent queries reuse cached data
```

This prevents repeated loading of the same catalog dataset during the current application session.

Further production-oriented optimization opportunities include:

- Responsive image formats
- WebP/AVIF conversion
- Image dimension optimization
- More granular lazy loading
- Catalog pagination or virtualization for very large datasets
- Bundle analysis
- CDN-based image delivery

Numerical performance claims are intentionally omitted until they are measured against the deployed production build.

---

## Accessibility & Interaction

The interface was designed with common accessibility considerations in mind, including:

- Semantic navigation
- Keyboard-friendly controls
- Visible interaction states
- Form labels and inputs
- Responsive text sizing
- Clear empty states
- High-contrast interface states

A full accessibility audit remains a future improvement area.

---

## Project Structure

```text
Club Kit/
├── public/
│   └── favicon.png
│
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── cart/
│   │   ├── catalog/
│   │   ├── home/
│   │   ├── layout/
│   │   ├── product/
│   │   ├── ui/
│   │   └── wishlist/
│   ├── config/
│   ├── context/
│   ├── data/
│   │   └── catalog.json
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── netlify.toml
├── vercel.json
└── README.md
```

---

## Tech Stack

| Layer           | Technology                              |
| --------------- | --------------------------------------- |
| Framework       | React 19                                |
| Language        | TypeScript                              |
| Build Tool      | Vite                                    |
| Styling         | Tailwind CSS                            |
| Routing         | React Router                            |
| Metadata / SEO  | React Helmet Async                      |
| Icons           | Lucide React                            |
| Utility Styling | clsx                                    |
| State           | React Context + Hooks                   |
| Data            | Local JSON catalog                      |
| Deployment      | Vercel / Netlify configuration included |
| Version Control | Git / GitHub                            |

---

## Development

### Requirements

- Node.js
- npm

### Installation

```bash
npm install
```

### Development server

```bash
npm run dev
```

The application will start using the Vite development server.

### Production build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Preview production build

```bash
npm run preview
```

---

## Deployment

The project is configured for modern static frontend deployment.

Configuration files are included for:

- Vercel
- Netlify

The application does not require a traditional backend server for the current demonstration because the catalog data is bundled with the frontend.

For a future production implementation, the catalog and transactional functionality could be connected to a dedicated backend or commerce platform.

---

## Engineering Challenges

### Handling a large catalog

A large football catalog can quickly become difficult to navigate.

The solution was to centralize catalog querying and expose reusable filtering operations so the same dataset can power multiple parts of the application.

### Maintaining visual consistency

The project contains several distinct experiences — homepage, catalog, collection, product detail and wishlist.

Reusable UI primitives and shared layout components help keep typography, spacing, buttons, cards and interaction patterns consistent across the application.

### Balancing commerce patterns with a portfolio objective

The original concept included commerce-oriented interactions.

After the project's purpose changed, the interface was repositioned around catalog exploration and product presentation instead of treating the experience as an active retail storefront.

This created an opportunity to preserve useful product-discovery patterns while removing the pressure to implement a full commercial operation.

---

## Lessons Learned

This project reinforced several practical frontend principles:

- A large catalog needs strong information architecture, not just a good grid.
- Product discovery should be designed as a journey rather than a collection of isolated pages.
- Separating data access from UI logic makes a catalog easier to evolve.
- Reusable UI primitives significantly improve consistency across a multi-page experience.
- Local data can be a deliberate architectural choice when the objective is a self-contained demonstration.
- Changing the business objective can be an opportunity to simplify the technical scope and focus on product quality.
- Visual polish has more impact when it is supported by clear navigation and information hierarchy.

---

## Future Improvements

If this concept were developed into a production commerce platform, potential next steps would include:

- Backend-powered product catalog
- Database-backed inventory
- Product availability
- Authentication
- Persistent user accounts
- Server-side wishlist persistence
- Checkout
- Payment processing
- Order management
- Inventory management
- Advanced search
- Product recommendations
- Analytics
- Structured data for product SEO
- Image CDN and responsive image delivery
- Automated testing
- Full accessibility audit

These features are intentionally outside the scope of the current portfolio demonstration.

---

## Portfolio Context

Club Kit is presented as a **non-commercial portfolio project**.

The project demonstrates the design and engineering of a premium football jersey catalog experience, with an emphasis on:

**Visual design · Product discovery · Frontend architecture · Responsive UI · Catalog data handling**

It should not be interpreted as an active retail store, marketplace or authorized football merchandise business.

---

## Disclaimer

This project is a frontend demonstration created for educational and portfolio purposes.

Football club names, league names, team references, jersey designs, trademarks, logos and related imagery belong to their respective rights holders.

The project does not claim affiliation with, sponsorship by, authorization from or endorsement by any football club, league, federation, manufacturer or other rights holder.

No commercial transactions are represented by this portfolio demonstration.

---

## License

This repository is maintained as a portfolio and demonstration project.

Source code may be reviewed for educational and professional evaluation.

Brand assets, third-party imagery, football-related trademarks and product references remain subject to their respective owners' rights.
