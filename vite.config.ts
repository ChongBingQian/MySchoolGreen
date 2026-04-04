import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'src/client',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'modelence/client': path.resolve(__dirname, './src/client/lib/cloudflare/modelenceClient.ts'),
      '@modelence/react-query': path.resolve(
        __dirname,
        './src/client/lib/cloudflare/modelenceReactQuery.ts'
      ),
    }
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true
  }
});
