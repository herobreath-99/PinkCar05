import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => {
  // Preserve Express (server.ts) as the dev server inside Google AI Studio;
  // enable the Cloudflare Vite plugin for builds, previews, and standalone Cloudflare Vite runs.
  const isExpressDevServer = process.argv.some(
    (arg) => arg.endsWith('server.ts') || arg.endsWith('server.js'),
  );
  const enableCloudflarePlugin =
    !isExpressDevServer &&
    (command === 'build' || Boolean(isPreview) || process.env.CLOUDFLARE_VITE !== 'false');

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(enableCloudflarePlugin ? [cloudflare()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

