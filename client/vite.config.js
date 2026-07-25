import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer (only in build mode)
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable sourcemaps for debugging
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'icons': ['react-icons/fa', 'react-icons/io', 'react-icons/ci', 'react-icons/md'],
          'utils': ['axios', 'react-hot-toast'],
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Optimize assets
    assetsInlineLimit: 4096, // 4kb - inline small assets
    chunkSizeWarningLimit: 500,
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  // Dev server configuration for mobile testing via ngrok
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to backend - enables mobile testing via ngrok
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '',
        cookiePathRewrite: {
          '*': '/',
        },
      },
      // Proxy Socket.io connections
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
