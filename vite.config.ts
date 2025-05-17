import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // Ensure proper assets handling
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure consistent chunk naming
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
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
        }
      }
    }
  },
  // This is important: set the base URL to '/' for proper asset loading
  base: '/'
})
