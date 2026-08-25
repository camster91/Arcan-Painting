/**
 * The detailed error is captured server-side. This public fallback deliberately
 * includes no exception details or debug controls.
 */
export const getHTMLForErrorPage = (): string => `
<html>
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Temporarily unavailable | Arcan Painting</title>
  </head>
  <body style="font-family: system-ui, sans-serif; margin: 3rem; color: #1f2937;">
    <main>
      <h1>We’re temporarily unavailable</h1>
      <p>Please try again in a few minutes.</p>
      <p><a href="/">Return to Arcan Painting</a></p>
    </main>
  </body>
</html>`;
