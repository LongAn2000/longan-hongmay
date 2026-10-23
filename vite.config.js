import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/longan-hongmay/' : '/',
  // Keep CSS syntax older iPhones understand, e.g. (max-width: …) instead of (width <= …).
  build: { cssTarget: ['chrome87', 'edge88', 'firefox78', 'safari14', 'ios14'] },
}));
