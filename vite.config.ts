import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** In development, serve /api/rpc with the same handler Vercel uses in production. */
function devApi(): Plugin {
  return {
    name: 'everlife-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/rpc', async (req, res) => {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const { handle } = await server.ssrLoadModule('/server/rpc.ts');
        let body: { action?: string; args?: Record<string, unknown> } = {};
        try { body = raw ? JSON.parse(raw) : {}; } catch { /* handled as unknown action */ }
        const out = await handle(body.action, body.args ?? {}, req.headers.authorization);
        res.statusCode = out.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(out.body));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
});
