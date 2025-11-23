const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { URL } = require("url");

exports.handler = async function (event) {
  let pageUrl = event.queryStringParameters.url;
  const assets = [];

  if (!pageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No URL provided" })
    };
  }

  if (!pageUrl.startsWith("http")) pageUrl = "https://" + pageUrl;

  try {
    const pageRes = await fetch(pageUrl, { timeout: 8000 });
    const html = await pageRes.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const assetList = [];

    document.querySelectorAll("link[rel='stylesheet']").forEach(l =>
      assetList.push({ type: "css", url: l.href })
    );

    document.querySelectorAll("script[src]").forEach(s =>
      assetList.push({ type: "javascript", url: s.src })
    );

    document.querySelectorAll("img").forEach(i =>
      assetList.push({ type: "image", url: i.src })
    );

    // LIMIT ASSET SCAN TO PREVENT FREEZING
    const limitedAssets = assetList.slice(0, 50);

    async function checkAsset(asset) {
      try {
        const full = new URL(asset.url, pageUrl).href;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(full, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow"
        });

        clearTimeout(timeout);

        assets.push({
          type: asset.type,
          url: full,
          ok: res.ok,
          statusCode: res.status,
          message: res.ok ? "Loaded OK" : `HTTP ${res.status}`
        });

      } catch {
        assets.push({
          type: asset.type,
          url: asset.url,
          ok: false,
          statusCode: 0,
          message: "Timeout or Network Failure"
        });
      }
    }

    // ✅ Parallel execution (NO more freezing)
    await Promise.all(limitedAssets.map(checkAsset));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        assets: [],
        error: "Page could not be scanned"
      })
    };
  }
};
