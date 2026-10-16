import { defineConfig } from 'vite';
export default defineConfig({ build: { rollupOptions: { input: ['wallet.html', 'login.html', 'create.html', 'onboard.html'] } } });
