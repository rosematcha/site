import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function garagesaleRedirectPlugin(): Plugin {
  return {
    name: 'garagesale-trailing-slash-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // @ts-expect-error: url is present on req in Vite dev server
        if (req.url === '/garagesale') {
          res.writeHead(301, { Location: '/garagesale/' });
          res.end();
          return;
        }
        next();
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), garagesaleRedirectPlugin()],
  base: '/garagesale/',
})
