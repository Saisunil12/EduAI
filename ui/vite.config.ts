import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
  const plugins = [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean);

  return {
    server: {
      host: "localhost",
      port: 8080,
      strictPort: true,
      proxy: {
        // Handle Supabase auth endpoints
        '^/auth/v1': {
          target: SUPABASE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/auth\/v1/, '/auth/v1'),
          ws: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
          }
        },
        // Handle Supabase storage
        '^/storage/v1': {
          target: SUPABASE_URL,
          changeOrigin: true,
          secure: false,
          ws: false
        },
        // Block all WebSocket connections
        '^/realtime': {
          target: 'http://0.0.0.0',
          changeOrigin: true,
          secure: false,
          ws: false
        },
        // Handle API requests to the backend
        '^/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          ws: false
        },
        // Handle rest endpoints
        '^/rest/v1': {
          target: SUPABASE_URL,
          changeOrigin: true,
          secure: false,
          ws: false
        }
      },
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 8080,
        overlay: false,
      },
      // Disable file system polling
      watch: {
        usePolling: false,
      },
      // Enable CORS for development
      cors: true,
    },
    build: {
      target: 'esnext',
    },
    define: {
      // Polyfill for global object
      global: {},
      // Don't disable WebSocket globally
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
