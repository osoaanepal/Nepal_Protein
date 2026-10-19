
export async function onRequestGet() {
  try {
    const response = await fetch(
      "https://nepal-protein.onrender.com/sitemap.xml",
      {
        headers: {
          Accept: "application/xml",
        },
      }
    );

    if (!response.ok) {
      return new Response("Unable to generate sitemap", {
        status: 502,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const xml = await response.text();

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Sitemap temporarily unavailable", {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
