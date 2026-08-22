// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  redirects: {
    '/dynamic-symbols-for-architectural-diagram': '/dynamic-symbols',
    '/3d-symbol': '/dynamic-symbols',
    '/3d-symbols-for-architectural-diagram': '/dynamic-symbols',
    '/blog/2025-05-21-dynamic-symbols-for-architectural-diagram': '/dynamic-symbols',
    '/blog/2025-01-10-3d-symbol': '/dynamic-symbols',
    '/blog/2025-05-07-3d-symbols-for-architectural-diagram': '/dynamic-symbols',
    '/sun-path-diagram': '/sun-diagram',
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