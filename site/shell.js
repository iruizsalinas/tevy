// The HTML document around a rendered page, shared by the build and the dev server.

/** JSON that is safe inside a <script> element. */
const scriptJson = (value) => JSON.stringify(value).replace(/</g, '\u003c');

/**
 * @param {{ head: string, body: string, props: unknown }} page
 * @param {string} tags script, style and preload tags for the page's client entry
 */
export function shell(page, tags) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#6b4630" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/tevy.png" />
    ${tags}
    <script type="speculationrules">{"prefetch":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>
    ${page.head}
  </head>
  <body>
    <div id="app" style="display: contents">${page.body}</div>
    <script type="application/json" id="props">${scriptJson(page.props)}</script>
  </body>
</html>
`;
}
