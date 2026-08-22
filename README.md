# ArchiDiagram V3

Official website for **ArchiDiagram (by Febhouse)** — Architectural Diagram Resources, SketchUp Extensions, Presentation Templates, and Analysis Workflows.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

---

## 📁 Project Architecture & Data Structure

```text
ARCHIDIAGRAM_V3/
├── public/                 # Static public assets (images, logos, favicon, GIFs)
│   ├── images/             # Optimized diagram images, previews & icons
│   │   ├── 2025/           # Historical case studies & diagram templates
│   │   ├── 2026/           # Extension GIFs & updated high-res assets
│   │   └── author-*.jpg    # Author portrait avatar
│   └── favicon.svg         # Brand favicon
│
├── src/
│   ├── assets/             # Bundled local fonts (Atkinson Hyperlegible)
│   ├── components/         # Reusable UI components
│   │   ├── BaseHead.astro          # SEO metadata, OpenGraph, Twitter tags
│   │   ├── Card.astro              # Article/Resource card component
│   │   ├── FaqAccordion.astro      # Interactive FAQ section
│   │   ├── Footer.astro            # Global footer with links & social
│   │   ├── Header.astro            # Navigation bar with dark mode toggle
│   │   ├── HeroCoverSlider.astro   # Hero showcase banner
│   │   ├── SampleGallery.astro     # Free sample project gallery
│   │   └── ToolsShowcase.astro     # Core Extensions showcase grid
│   │
│   ├── content/            # Content collections
│   │   ├── blog/           # Markdown articles, tutorials, and extensions
│   │   └── config.ts       # Content schema definitions
│   │
│   ├── layouts/            # Page layouts
│   │   ├── BlogPost.astro          # Editorial blog layout with Related Posts
│   │   └── LandingLayout.astro     # Dedicated extension landing layout
│   │
│   ├── pages/              # Routing tree
│   │   ├── [...slug].astro         # Dynamic blog article routing
│   │   ├── index.astro             # Home page (All resources + tools)
│   │   ├── dynamic-symbols.astro   # Dynamic Symbols landing page
│   │   ├── sun-diagram.astro       # Sun Diagram landing page
│   │   ├── shadow-slice.astro      # Shadow Slice landing page
│   │   ├── custom-diagram-service.astro # Custom diagram service page
│   │   ├── about.astro             # About ArchiDiagram page
│   │   └── rss.xml.js              # Automatic RSS feed generator
│   │
│   ├── styles/             # Stylesheets
│   │   └── global.css      # Core design tokens, button states & reset rules
│   │
│   └── consts.ts           # Site-wide constants, navigation, and route guards
│
├── astro.config.mjs        # Astro configuration & 301 legacy redirects
├── AGENTS.md               # Strict developer & AI coding guidelines
├── package.json            # Project dependencies & scripts
└── tsconfig.json           # TypeScript configuration
```

---

## 🎨 Design System Principles

- **Corner Radius**: `8px` (`rounded-lg`) standard for buttons, cards, and images.
- **Author Avatar**: `border-radius: 9999px !important;` (always 100% circular).
- **Images**: Zero drop shadows (`box-shadow: none !important;`) and zero borders on feature GIF wrappers.
- **Download Buttons**: Standalone flex column block rows with automatic word isolation.
- **Related Posts**: 3 automatic tag-matched cards under every article.
- **Redirects**: Legacy URLs seamlessly redirect to canonical extension landing pages.

---

## 📄 License
© 2026 Febhouse / ArchiDiagram. All rights reserved.
