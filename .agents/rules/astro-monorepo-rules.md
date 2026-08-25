# Astro Monorepo & Deployment Best Practices

## 1. Windows Security & Node Native Bindings (WASM Fallback)
- **Problem**: Windows 11 Smart App Control / WDAC blocks C++ native `.node` binary modules (e.g. `@astrojs/compiler-binding` or `satteri`).
- **Rule**: Always include official WebAssembly (WASM) fallback packages (`@astrojs/compiler-binding-wasm32-wasi`, `@bruits/satteri-wasm32-wasi`) in `package.json` dependencies. Ensure loaders fall back to WASM if native `.node` binaries fail to load on Windows.

## 2. Monorepo Explicit Dev Ports Locking
- **Problem**: Running `pnpm --parallel dev` can cause dynamic port swapping between apps (e.g., Febhouse taking 4321 while ArchiDiagram gets pushed to 4322).
- **Rule**: Always lock explicit static server ports in `astro.config.mjs` for each app:
  - `apps/archidiagram`: `server: { port: 4321 }`
  - `apps/febhouse`: `server: { port: 4322 }`

## 3. Legacy Extension Update Endpoints & Cloudflare Workers
- **Problem**: Legacy SketchUp Ruby extensions/plugins make HTTP GET requests to check for update `.json` files. Standard HTTP 301 Moved Permanently redirects cause Ruby `Net::HTTP.get_response` to throw network connection errors.
- **Rule**: For legacy extension update endpoints (`/update.json` and `.zip` assets), DO NOT use 301 Redirect Rules! Use a **Cloudflare Worker** on the origin domain to proxy the request and return **HTTP 200 OK** directly with the JSON payload, while returning HTTP 301 for regular web visitors to redirect to the new landing page.

## 4. WordPress Export Content Sanitization
- **Problem**: Markdown exported from WordPress Gutenberg contains inline single-line HTML `<figure>![alt](url)</figure>` (which breaks Astro MDX image compilation) and raw navigation slider `<svg>` tags (which render as giant black unstyled arrows).
- **Rule**: Strip all raw `<figure>` wrappers and inline slider `<svg>` tags. Convert images to standard markdown syntax `![alt](url)` placed on clean, separate lines.

## 5. UI Design & Software Logo Consistency
- **Rule**: All card containers across apps must follow the unified design system: `rounded-[8px] p-[10px] border border-slate-200 dark:border-slate-800 shadow-sm`.
- **Rule**: Software badges on cards and post headers must use official SVG logo assets placed in `/images/LOGO/` (e.g. `SketchUp-logo.svg`, `Gemini_logo_2025.svg`, `SunDiagram-logo.svg`).
