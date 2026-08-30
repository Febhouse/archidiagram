// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
  site: 'https://febhouse.com',
  server: { port: 4322 },
  redirects: {
    '/dynamic-symbols-for-architectural-diagram': 'https://archidiagram.com/dynamic-symbols',
    '/3d-symbol': 'https://archidiagram.com/dynamic-symbols',
    '/3d-symbols-for-architectural-diagram': 'https://archidiagram.com/dynamic-symbols',
    '/blog/2025-05-21-dynamic-symbols-for-architectural-diagram': 'https://archidiagram.com/dynamic-symbols',
    '/blog/2025-01-10-3d-symbol': 'https://archidiagram.com/dynamic-symbols',
    '/blog/2025-05-07-3d-symbols-for-architectural-diagram': 'https://archidiagram.com/dynamic-symbols',
    '/sun-path-diagram': 'https://archidiagram.com/sun-diagram',
    '/create-architectural-diagrams-using-sketchup': 'https://archidiagram.com/create-architectural-diagrams',
    '/blog/2025-06-20-create-architectural-diagrams-using-sketchup': 'https://archidiagram.com/create-architectural-diagrams',
    '/create-architectural-diagrams-updated-workflow-aug-2025': 'https://archidiagram.com/create-architectural-diagrams',
    '/straight-hand-drawn': 'https://archidiagram.com/sun-diagram',
    '/blog/2025-04-25-straight-hand-drawn': 'https://archidiagram.com/sun-diagram',
    '/pen-blue': 'https://archidiagram.com/sun-diagram',
    '/blog/2025-04-25-pen-blue': 'https://archidiagram.com/sun-diagram',
    '/negative': 'https://archidiagram.com/sun-diagram',
    '/blog/2025-04-25-negative': 'https://archidiagram.com/sun-diagram',
    '/clean-lines': 'https://archidiagram.com/sun-diagram',
    '/blog/2025-04-25-clean-lines': 'https://archidiagram.com/sun-diagram',
    '/sketchy-line': 'https://archidiagram.com/sun-diagram',
    '/blog/2025-04-25-sketchy-line': 'https://archidiagram.com/sun-diagram',
    '/shadow-slice': 'https://archidiagram.com/shadow-slice',
    '/sun-diagram': 'https://archidiagram.com/sun-diagram',
    '/dynamic-symbols': 'https://archidiagram.com/dynamic-symbols',
    '/custom-diagram-service': 'https://archidiagram.com/custom-diagram-service',
  },
  integrations: [mdx(), sitemap(), partytown()],

  fonts: [
      {
          provider: fontProviders.local(),
          name: 'Atkinson',
          cssVariable: '--font-atkinson',
          fallbacks: ['sans-serif'],
          options: {
              variants: [
                  {
                      src: ['./src/assets/fonts/atkinson-regular.woff'],
                      weight: 400,
                      style: 'normal',
                      display: 'swap',
                  },
                  {
                      src: ['./src/assets/fonts/atkinson-bold.woff'],
                      weight: 700,
                      style: 'normal',
                      display: 'swap',
                  },
              ],
          },
      },
	],

  vite: {
    plugins: [tailwindcss()],
  },
});