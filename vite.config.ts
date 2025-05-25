import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Ensure proper assets handling
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure consistent chunk naming
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            return 'vendor';
          }
          if (id.includes('components/teacher')) {
            return 'teacher';
          }
          if (id.includes('components/student')) {
            return 'student';
          }
          if (id.includes('components/auth')) {
            return 'auth';
          }
        },
        // Ensure proper MIME types
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    // Improve CSP compatibility
    sourcemap: true,
    // Use esbuild for minification instead of terser
    minify: 'esbuild',
    target: 'es2015'
  },
  // This is important: set the base URL to '/' for proper asset loading
  base: '/',
  server: {
    // Increase HMR timeout to allow for more time during development
    hmr: {
      timeout: 5000,
    },
    // Open browser automatically
    open: true,
  },
  // Clear the cache on startup to prevent stale modules
  optimizeDeps: {
    force: true
  }
})
