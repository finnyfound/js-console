import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  root: 'src', // Use src as root directory
  base: './', // Use relative paths for deployment flexibility
  build: {
    outDir: '../dist', // Output to dist folder at project root
    emptyOutDir: true,
    minify: 'terser', // Use terser for minification
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
      mangle: true,
    },
    rollupOptions: {
      output: {
        // Clean file naming
        entryFileNames: 'js/[name].min.js',
        chunkFileNames: 'js/[name].min.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name].min.css';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3001,
  },
});
