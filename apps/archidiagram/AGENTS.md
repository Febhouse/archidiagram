# ARCHIDIAGRAM V3 — Agent & Developer Guide

This document contains **mandatory design, architectural, and development rules** for the **ArchiDiagram** website. All future AI assistants and developers MUST strictly follow these rules without exception.

---

## 1. Core Tech Stack & Architecture

- **Framework**: [Astro 7](https://astro.build) (Static Site Generation / SSG).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + Global Vanilla CSS (`src/styles/global.css`).
- **Icons & Typography**: Atkinson Hyperlegible / Inter local font tokens, Heroicons / Tabler SVGs (no external runtime script dependencies).
- **Content Engine**: Astro Content Collections (`src/content/blog/`) with markdown (`.md`, `.mdx`).

---

## 2. Mandatory UI / UX & Design System Rules

### 2.1 Border Radius (Bo Góc)
- **Standard Radius**: All content images, feature cards, diagram previews, and interactive buttons MUST use **`8px`** (`rounded-lg` / `border-radius: 8px !important;`).
- **Author Avatar Exception**: The author profile image (`.author-avatar`, `.rounded-full`) in the *"About The Author"* section and footer MUST ALWAYS remain **100% circular (`border-radius: 9999px !important;`)** and must never be overridden by general image rules.

### 2.2 Image Shadows & Borders (Bóng Đổ & Viền Ảnh)
- **Zero Drop-Shadow on Images**: All images within article content and feature preview wrappers MUST NOT have drop shadows (`box-shadow: none !important;`).
- **Zero Border on Feature GIF Wrappers**: Feature preview images and case study image containers must NOT have surrounding border strokes (`border: none !important; border-0`). They must blend cleanly and seamlessly with the background.

### 2.3 Download & Action Buttons Isolation (Nút Bấm Cách Ly)
- **No Inline Touching Text**: Download buttons (`.download-btn`) inside articles MUST ALWAYS be rendered as standalone block elements (`.download-btn-wrapper` with `display: flex; flex-direction: column; align-items: flex-start; clear: both; margin: 1rem 0;`).
- Adjacent text (e.g., `and`, `or`, `và`, `hoặc`) or following images MUST NEVER stick inline beside the button.

---

## 3. SketchUp Extension Routes & Landing Pages

### 3.1 Three Core Extensions
1. **Dynamic Symbols**:
   - Dedicated Landing Page: `src/pages/dynamic-symbols.astro` (`/dynamic-symbols/`)
   - Preview GIF: `/images/2026/01/DYNAMICSYMBOLS.gif`
   - Features: 1. One-Click Symbol Change, 2. One-Click Color Change, 3. Create Animation.
2. **Sun Diagram**:
   - Dedicated Landing Page: `src/pages/sun-diagram.astro` (`/sun-diagram/`)
   - Preview GIF: `/images/2026/01/SHADOWANALYSIS-DEC-CROPlogo.gif`
   - Features: 1. Create Sunpath (Feature 1), 2. Shadow Analysis (Feature 2), 3. Batch Export Shadows (Feature 3), 4. Diagram Styles (Feature 4).
3. **Shadow Slice**:
   - Dedicated Landing Page: `src/pages/shadow-slice.astro` (`/shadow-slice/`)
   - Preview GIF: `/images/2026/06/Feature02.gif`
   - Features: 1. 1-Click Slicing, 2. Centralized Visual Dashboard, 3. Smart Style Management.

### 3.2 Dynamic Route Collision Prevention & 301 Redirects
- Dedicated landing pages (`sun-diagram`, `dynamic-symbols`, `shadow-slice`) have their own `.astro` files in `src/pages/`.
- In `src/consts.ts`:
  - `DEDICATED_LANDING_PAGE_SLUGS = ['sun-diagram', 'dynamic-symbols', 'shadow-slice']`
  - `isDynamicSlugRoute(post)` ensures `src/pages/[...slug].astro` never generates duplicate static routes that collide with `src/pages/{slug}.astro`.
- Legacy URLs (e.g., `/3d-symbol/`, `/dynamic-symbols-for-architectural-diagram/`, `/sun-path-diagram/`) are listed in `REDIRECTED_LEGACY_SLUGS` and redirect to the canonical extension landing page via `astro.config.mjs` and client `<meta http-equiv="refresh">`.

---

## 4. Blog Layout & Related Posts

- **Related Posts Section**: At the bottom of every article in `src/layouts/BlogPost.astro`, automatically display **3 related post cards** (`<Card />`) filtered by matching tags, falling back to recent posts if fewer than 3 match.
- **YouTube Video Embeds**:
  - Horizontal videos (16:9) expand to 100% full article width.
  - YouTube Shorts (9:16) float to the top right of their respective section.

---

## 5. Development & Build Commands

```bash
# Start background dev server
astro dev --background
# Or standard dev server
npm run dev

# Production build test
npm run build

# Preview build output
npm run preview
```
