import { defineConfig } from 'vite';

export default defineConfig({
  // Thiệp chạy ở tên miền riêng https://longanhongmay.online/ nên gốc luôn là '/'.
  base: '/',
  // Keep CSS syntax older iPhones understand, e.g. (max-width: …) instead of (width <= …).
  build: { cssTarget: ['chrome87', 'edge88', 'firefox78', 'safari14', 'ios14'] },
});
