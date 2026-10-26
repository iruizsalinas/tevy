// Dev server: renders pages and generated files from site/src/render.ts on request, like the build.
import { shell } from './shell.js';

export function devPages() {
  return {
    name: 'tevy-dev-pages',
    apply: 'serve',
    configureServer(server) {
      // Runs after Vite has had its chance to serve modules and site/public files.
      return () =>
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = new URL(req.url ?? '/', 'http://localhost');
            const path = url.pathname;
            // Like the host (html_handling: drop-trailing-slash): /models/ redirects to /models.
            if (path.length > 1 && path.endsWith('/')) {
              res.writeHead(307, { location: path.slice(0, -1) + url.search });
              res.end();
              return;
            }
            const { outputs } = await server.ssrLoadModule('/site/src/render.ts');
            const all = outputs();
            const found = all.find((o) => o.path === path);
            const out = found ?? all.find((o) => o.path === '/404.html');
            if (out.redirect) {
              res.writeHead(302, { location: out.redirect });
              res.end();
              return;
            }
            res.statusCode = found ? 200 : 404;
            if (out.text !== undefined) {
              res.setHeader('content-type', out.type);
              res.end(out.text);
              return;
            }
            const page = out.page();
            const tags = `<script type="module" src="/site/src/client/${page.entry}.ts"></script>`;
            res.setHeader('content-type', 'text/html; charset=utf-8');
            res.end(await server.transformIndexHtml(path, shell(page, tags)));
          } catch (error) {
            server.ssrFixStacktrace(error);
            next(error);
          }
        });
    },
  };
}
