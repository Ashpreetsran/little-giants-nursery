const retiredCartPage = `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#0d3b46">
    <link rel="icon" href="/icon.png" type="image/png">
    <title>Page retired | Little Giants Nursery</title>
    <style>
      * { box-sizing: border-box; }
      body { align-items: center; background: #f8f4ea; color: #103b46; display: flex; font-family: Arial, sans-serif; justify-content: center; margin: 0; min-height: 100vh; padding: 24px; }
      main { background: #fff; border: 1px solid #d7e6e3; border-radius: 28px; box-shadow: 0 22px 60px rgba(13, 59, 70, 0.12); max-width: 680px; padding: clamp(32px, 7vw, 64px); text-align: center; width: 100%; }
      img { height: 84px; margin-bottom: 24px; width: 84px; }
      .eyebrow { color: #0d6f77; font-size: 13px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
      h1 { font-size: clamp(34px, 7vw, 58px); letter-spacing: -0.04em; line-height: 1.02; margin: 18px 0; }
      p { color: #526d72; font-size: 18px; line-height: 1.65; margin: 0 auto; max-width: 520px; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 30px; }
      a { border: 2px solid #0d3b46; border-radius: 999px; color: #0d3b46; font-weight: 700; padding: 13px 20px; text-decoration: none; }
      a:first-child { background: #0d3b46; color: #fff; }
      a:focus-visible { outline: 3px solid #f28b5b; outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main>
      <img src="/icon.png" alt="Little Giants Nursery">
      <p class="eyebrow">410: Page retired</p>
      <h1>This page is no longer available</h1>
      <p>Little Giants Nursery does not operate an online shop. You can return to our nursery website or contact the team for help.</p>
      <div class="actions"><a href="/">Return home</a><a href="/contact">Contact the nursery</a></div>
    </main>
  </body>
</html>`;

export function GET() {
  return new Response(retiredCartPage, {
    status: 410,
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
