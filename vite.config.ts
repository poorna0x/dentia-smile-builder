import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh for better development experience
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
      // Ensure React is properly imported
      include: "**/*.{jsx,tsx}",
    })
  ],
  build: {
    outDir: 'dist',
    // Disable minification temporarily to prevent reference errors
    minify: false,

    rollupOptions: {
      external: ['twilio', 'cloudinary'], // Mark server-side libraries as external
      output: {
        // Disable manual chunking to prevent React initialization issues
        manualChunks: undefined,
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000, // Increased to allow larger chunks for better caching
    // Increase inline limit for small assets
    assetsInlineLimit: 4096, // Reduced to prevent large assets from being inlined
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable source map for debugging in production (optional)
    sourcemap: false,
    // Optimize for production
    reportCompressedSize: true,
    // Enable tree shaking
    treeshake: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8083,
    host: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'lucide-react'
    ],
    // Exclude large dependencies from pre-bundling
    exclude: [
      '@radix-ui/react-dialog', 
      '@radix-ui/react-popover',
      'twilio', // Exclude Twilio as it's server-side only
      'cloudinary' // Exclude Cloudinary as it's server-side only
    ],
    // Force pre-bundling of React to ensure it loads first
    force: true
  },
  // Enable experimental features for better performance
  esbuild: {
    // Remove console logs in production
    drop: ['console', 'debugger'],
    // Target modern browsers
    target: 'es2020',
    // Keep function names to prevent reference errors
    keepNames: true,
    // Ultra conservative minification to prevent reference errors
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false, // Disable even whitespace minification
    // Additional options to prevent reference errors
    legalComments: 'none',
    treeShaking: false // Disable tree shaking to prevent reference issues
  }
})
