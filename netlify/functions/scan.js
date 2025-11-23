const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { URL } = require("url");

exports.handler = async function (event) {
  let pageUrl = event.queryStringParameters.url;
  let assets = [];

  if (!pageUrl.startsWith("http")) pageUrl = "https://" + pageUrl;

  try {
    const pageRes = await fetch(pageUrl);
    const html = await pageRes.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    async function check(type, url) {
      try {
        const full = new URL(url, pageUrl).href;
        const res = await fetch(full, { method: "HEAD" });

        assets.push({
          type,
          url: full,
          ok: res.ok,
          statusCode: res.status,
          message: res.ok ? "Loaded OK" : "Failed to load"
        });
      } catch {
        assets.push({
          type,
          url,
          ok: false,
          statusCode: 0,
          message: "Network Failure"
        });
      }
    }

    for (const link of document.querySelectorAll("link[rel='stylesheet']"))
      await check("css", link.href);

    for (const script of document.querySelectorAll("script[src]"))
      await check("javascript", script.src);

    for (const img of document.querySelectorAll("img"))
      await check("image", img.src);

    return {
      statusCode: 200,
      body: JSON.stringify({ assets })
    };

  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ assets: [] })
    };
  }
};
