const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { URL } = require("url");

exports.handler = async function (event) {
  let pageUrl = event.queryStringParameters.url;

  if (!pageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        assets: [
          {
            type: "system",
            url: "",
            ok: false,
            statusCode: 0,
            message: "No URL provided",
          },
        ],
      }),
    };
  }

  // Normalize URL (add https:// if missing)
  if (!/^https?:\/\//i.test(pageUrl)) {
    pageUrl = "https://" + pageUrl;
  }

  const assets = [];

  try {
    // Fetch main page
    let pageResponse;
    try {
      pageResponse = await fetch(pageUrl, { redirect: "follow" });
    } catch (err) {
      assets.push({
        type: "page",
        url: pageUrl,
        ok: false,
        statusCode: 0,
        message: "Failed to load page: " + err.message,
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets }),
      };
    }

    assets.push({
      type: "page",
      url: pageUrl,
      ok: pageResponse.ok,
      statusCode: pageResponse.status,
      message: pageResponse.ok
        ? "Page loaded successfully."
        : "Page responded with error status.",
    });

    const html = await pageResponse.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    async function checkAsset(type, rawUrl) {
      if (!rawUrl) return;

      let absoluteUrl;
      try {
        absoluteUrl = new URL(rawUrl, pageUrl).href;
      } catch (e) {
        assets.push({
          type,
          url: rawUrl,
          ok: false,
          statusCode: 0,
          message: "Invalid asset URL.",
        });
        return;
      }

      try {
        const res = await fetch(absoluteUrl, {
          method: "HEAD",
          redirect: "follow",
        });

        assets.push({
          type,
          url: absoluteUrl,
          ok: res.ok,
          statusCode: res.status,
          message: res.ok
            ? "Asset loaded successfully."
            : `Asset failed with status ${res.status}.`,
        });
      } catch (err) {
        assets.push({
          type,
          url: absoluteUrl,
          ok: false,
          statusCode: 0,
          message: "Network error while requesting asset.",
        });
      }
    }

    // CSS
    const cssLinks = Array.from(
      document.querySelectorAll("link[rel='stylesheet']")
    );
    if (cssLinks.length === 0) {
      assets.push({
        type: "css",
        url: "(no CSS files found)",
        ok: false,
        statusCode: null,
        message: "No <link rel=\"stylesheet\"> tags found on this page.",
      });
    } else {
      for (const link of cssLinks) {
        await checkAsset("css", link.href);
      }
    }

    // JavaScript
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    if (scripts.length === 0) {
      assets.push({
        type: "javascript",
        url: "(no JavaScript files found)",
        ok: false,
        statusCode: null,
        message: "No <script src=\"...\"> tags found on this page.",
      });
    } else {
      for (const script of scripts) {
        await checkAsset("javascript", script.src);
      }
    }

    // Images
    const images = Array.from(document.querySelectorAll("img"));
    if (images.length === 0) {
      assets.push({
        type: "image",
        url: "(no <img> tags found)",
        ok: false,
        statusCode: null,
        message: "No <img> tags found on this page.",
      });
    } else {
      for (const img of images) {
        await checkAsset("image", img.src);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets }),
    };
  } catch (err) {
    assets.push({
      type: "system",
      url: pageUrl,
      ok: false,
      statusCode: 0,
      message: "Unexpected error during scan: " + err.message,
    });

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets }),
    };
  }
};
