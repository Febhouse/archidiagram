# FEBHOUSE V2 â€” Agent & Developer Guide

This document contains **mandatory design, architectural, UI/UX, and performance rules** for the **Febhouse V2** website (`febhouse.com`). All AI assistants and developers working on this codebase MUST strictly follow these rules without exception.

---

## 1. Core Tech Stack & Architecture

- **Framework**: [Astro 7](https://astro.build) (Static Site Generation / SSG).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + Global Vanilla CSS (`src/styles/global.css`).
- **Icons & Typography**: Atkinson Hyperlegible / Inter local font tokens, Heroicons / Tabler SVGs (zero external runtime script dependencies).
- **Content Engine**: Astro Content Collections (`src/content/blog/`) with markdown (`.md`, `.mdx`).

---

## 2. Mandatory UI / UX & Design System Specifications

### 2.1 Border Radius (Bo GÃ³c Standard `8px`)
- **Standard Radius**: All content cards, feature previews, diagram containers, code blocks, modal windows, and interactive buttons MUST use **`8px`** (`rounded-lg` / `border-radius: 8px !important;`).
- **Author Avatar Exception**: The author profile image (`.author-avatar`, `.rounded-full`) in the *"About The Author"* section and footer MUST ALWAYS remain **100% circular (`border-radius: 9999px !important;`)** and must never be overridden by general image rules.

### 2.2 Palette & Color Tokens
- **Primary Accent**: Amber (`bg-amber-400` / `bg-amber-500` / `#f59e0b`).
- **Dark Mode Backgrounds**: Slate 950 (`bg-slate-950` / `#020617`), Slate 900 (`bg-slate-900` / `#0f172a`).
- **Light Mode Backgrounds**: Slate 50 (`bg-slate-50` / `#f8fafc`), Pure White (`bg-white` / `#ffffff`).
- **Text Tokens**: `slate-900` (Light mode primary), `white` (Dark mode primary), `slate-600` / `slate-300` (Subtitles & descriptions).

### 2.3 Button Styling & Isolation Rules
- **Primary Action Buttons** (`.btn-primary`): `bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg px-6 py-3.5 shadow-sm transition-all`.
- **Secondary Action Buttons** (`.btn-secondary`): `bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-amber-500 font-bold rounded-lg px-6 py-3.5 transition-colors`.
- **Download Button Isolation**: Download buttons (`.download-btn`) inside articles MUST ALWAYS be rendered inside a standalone wrapper block:
  ```html
  <div class="download-btn-wrapper" style="display: flex; flex-direction: column; align-items: flex-start; clear: both; margin: 1rem 0;">
      <a href="..." class="download-btn">...</a>
  </div>
  ```
  Adjacent text or images MUST NEVER touch inline beside the button.

### 2.4 Image Shadows & Borders
- **Zero Drop-Shadow on Images**: All images within article content and feature preview wrappers MUST NOT have drop shadows (`box-shadow: none !important;`).
- **Zero Border on Feature Wrappers**: Feature preview images and case study image containers must NOT have surrounding border strokes (`border: none !important; border-0`).

---

## 3. High Performance & Image Optimization Rules

### 3.1 Hero Cover Slider Optimization (Progressive Loading)
- **Single `<img>` Tag**: Do NOT render separate light and dark `<img>` tags in the HTML. Use a single `<img class="hero-cover-img" data-dark="..." data-light="...">`.
- **Progressive Slide Fetching**:
  - **Slide 0 (First visible slide)**: Has real image `src` on initial load (`fetchpriority="high"`, `loading="eager"`).
  - **Slides 1, 2, 3 (Hidden slides)**: Initial `src` is set to `data:image/svg+xml,...` placeholder. Images are preloaded 800ms AFTER initial page load completes.
- **Image Format**: All cover images MUST be converted to WebP (`quality: 82`, max width `1920px`).

### 3.2 Content Images
- All content images must include `loading="lazy"` and `decoding="async"`.

---

## 4. Dify AI Chatbot Integration & UI Spec

### 4.1 HTTPS Protocol Enforcement
- All Dify AI Chatbot iframe sources MUST strictly use `https://` (e.g., `https://ai.febhouse.com/chat/WzxqYtwxpWEYecSx`).
- Never use `http://` to prevent browser mixed-content security blocks.

### 4.2 Floating AI Chat Trigger Button Spec (GÃ³c DÆ°á»›i BÃªn Pháº£i)
- **Position**: `fixed bottom-6 right-6 z-50`.
- **Styling**:
  ```html
  <button 
      id="global-ai-floating-btn"
      type="button"
      onclick="window.toggleMainAiChat()"
      aria-label="Open Febhouse AI Chat"
      class="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all border border-slate-700 dark:border-amber-400 cursor-pointer"
  >
      <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
      </span>
      <svg class="w-5 h-5 text-amber-400 dark:text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      <span class="tracking-wide">Ask Feb AI</span>
  </button>
  ```

### 4.3 Slide-Out Chat Modal Window Spec
- **Position & Dimensions**: `fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[82vh] z-50 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 hidden`.
- **Header Structure**:
  ```html
  <div id="main-ai-chat-window" class="hidden fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[82vh] z-50 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      <!-- Header -->
      <div class="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
                  ðŸ¤–
              </div>
              <div>
                  <div class="text-sm font-bold leading-tight">Febhouse AI Assistant</div>
                  <div class="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online 24/7
                  </div>
              </div>
          </div>
          <button type="button" onclick="window.toggleMainAiChat()" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer" aria-label="Close AI Chat">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
      </div>

      <!-- Lazy-Loaded Iframe -->
      <div class="flex-1 w-full h-full bg-slate-950">
          <iframe
              id="main-ai-iframe"
              data-src="https://ai.febhouse.com/chat/WzxqYtwxpWEYecSx"
              src="about:blank"
              class="w-full h-full border-0"
              allow="microphone; clipboard-write"
              title="Febhouse AI Chat"
          ></iframe>
      </div>
  </div>
  ```

### 4.4 TÃ­ch Há»£p Bot Dify VÃ o FAQ Accordion
In the FAQ Section (`src/components/FaqAccordion.astro`), place a direct action button in the section header alongside the title so users can trigger the AI Assistant directly:

```html
<section id="faq" class="mb-16">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-8 gap-4">
        <div>
            <span class="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">[ FAQ ]</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">Frequently Asked Questions</h2>
        </div>
        <!-- FAQ Direct AI Trigger Button -->
        <button 
            type="button" 
            onclick="window.toggleMainAiChat()" 
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/20 transition-colors self-start sm:self-auto cursor-pointer"
        >
            âœ¨ Ask Febhouse AI Bot
        </button>
    </div>
</section>
```

### 4.5 Universal Controller Script (Lazy-Loading Logic)
```html
<script is:inline>
window.toggleMainAiChat = function() {
    const win = document.getElementById('main-ai-chat-window');
    const iframe = document.getElementById('main-ai-iframe');
    if (win) {
        if (win.classList.contains('hidden')) {
            if (iframe && (!iframe.src || iframe.src.includes('about:blank'))) {
                iframe.src = iframe.getAttribute('data-src') || '';
            }
            win.classList.remove('hidden');
            win.classList.add('flex');
        } else {
            win.classList.add('hidden');
            win.classList.remove('flex');
        }
    }
};
</script>
```

---

## 5. Development & Deployment Commands

```bash
# Start dev server
npm run dev

# Test static SSG production build
npm run build

# Preview build output locally
npm run preview
```

