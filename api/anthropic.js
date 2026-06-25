// Vercel serverless funkcia — bezpečný proxy na Anthropic API.
// Klient (appka) volá /api/anthropic; kľúč ostáva na serveri a nikdy sa nedostane do prehliadača.
// V nastaveniach Vercel projektu pridaj env premennú:  ANTHROPIC_API_KEY = sk-ant-...

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Použi POST." } });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: { message: "Chýba ANTHROPIC_API_KEY v nastaveniach Vercel projektu (Settings → Environment Variables)." },
    });
    return;
  }

  try {
    // Telo môže prísť ako objekt (Vercel ho parsuje) alebo ako string.
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body,
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(500).json({ error: { message: "Proxy chyba: " + e.message } });
  }
}
