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
      jsxRuntime: 'automatic'
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        // Additional optimizations
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true
      },
      mangle: {
        // Mangle class names for smaller bundles
        keep_classnames: false,
        keep_fnames: false
      }
    },

    rollupOptions: {
      external: ['twilio'], // Mark Twilio as external (server-side only)
      output: {
        manualChunks: {
          // Core React (most stable, cache for long time)
          'react-core': ['react', 'react-dom'],
          
          // Routing (stable, cache for long time)
          'router': ['react-router-dom'],
          
          // UI Components (grouped for better caching)
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-switch',
            '@radix-ui/react-toast',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-toggle',
            '@radix-ui/react-tooltip'
          ],
          
          // Utilities (stable, cache for long time)
          'utils': ['date-fns', 'clsx', 'tailwind-merge', 'lucide-react'],
          
          // Supabase (external dependency)
          'supabase': ['@supabase/supabase-js'],
          
          // Forms and validation
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Charts and data visualization
          'charts': ['recharts'],
          
          // External services
          'services': ['axios', 'resend', 'cloudinary']
        },
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
    chunkSizeWarningLimit: 500,
    // Increase inline limit for small assets
    assetsInlineLimit: 8192,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles
    target: 'es2020'
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
      'twilio' // Exclude Twilio as it's server-side only
    ]
  },
  // Enable experimental features for better performance
  esbuild: {
    // Remove console logs in production
    drop: ['console', 'debugger'],
    // Target modern browsers
    target: 'es2020'
  }
})
