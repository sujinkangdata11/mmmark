import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        port: 5175,
        strictPort: true,
        // headers: {
        //   'Cross-Origin-Embedder-Policy': 'require-corp',
        //   'Cross-Origin-Opener-Policy': 'same-origin'
        // },
        proxy: {
          '/api/reddit': {
            target: 'https://www.reddit.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/reddit/, ''),
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; WebApp/1.0)'
            }
          }
        }
      }
    };
});
