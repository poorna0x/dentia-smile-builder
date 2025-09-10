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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        // Additional optimizations
        passes: 2,
        unsafe: false, // Disable unsafe optimizations to prevent reference errors
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false
      },
      mangle: {
        // Mangle class names for smaller bundles
        keep_classnames: true, // Keep class names to prevent reference errors
        keep_fnames: true // Keep function names to prevent reference errors
      }
    },

    rollupOptions: {
      external: ['twilio', 'cloudinary'], // Mark server-side libraries as external
      output: {
        manualChunks: (id) => {
          // Core React (most stable, cache for long time)
          if (id.includes('react') && !id.includes('react-router')) {
            return 'react-core'
          }
          
          // Routing (stable, cache for long time)
          if (id.includes('react-router')) {
            return 'router'
          }
          
          // UI Components (grouped for better caching)
          if (id.includes('@radix-ui')) {
            return 'ui-components'
          }
          
          // Supabase (external dependency)
          if (id.includes('@supabase')) {
            return 'supabase'
          }
          
          // Forms and validation
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'forms'
          }
          
          // Charts and data visualization
          if (id.includes('recharts')) {
            return 'charts'
          }
          
          // Utilities (stable, cache for long time)
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('lucide-react')) {
            return 'utils'
          }
          
          // External services
          if (id.includes('axios') || id.includes('resend')) {
            return 'services'
          }
          
          // Large admin components - split into separate chunks
          if (id.includes('AdminPatientManagement')) {
            return 'admin-patient-management'
          }
          
          if (id.includes('SuperAdmin')) {
            return 'super-admin'
          }
          
          if (id.includes('Admin') && !id.includes('AdminPatientManagement') && !id.includes('AdminPaymentAnalytics')) {
            return 'admin'
          }
          
          if (id.includes('AdminPaymentAnalytics')) {
            return 'admin-payment-analytics'
          }
          
          // Large pages
          if (id.includes('Home')) {
            return 'home'
          }
          
          // Default chunk for other modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
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
    ]
  },
  // Enable experimental features for better performance
  esbuild: {
    // Remove console logs in production
    drop: ['console', 'debugger'],
    // Target modern browsers
    target: 'es2020',
    // Keep function names to prevent reference errors
    keepNames: true
  }
})
