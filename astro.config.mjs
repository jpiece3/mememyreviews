// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://mememyreviews.com',
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap(), react()],
});