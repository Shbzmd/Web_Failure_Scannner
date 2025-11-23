const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const path = require('path');
const { URL } = require('url');

exports.handler = async function(event) {
  const pageUrl = event.queryStringParameters.url;

  if (!pageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ errors: [{ type: "Input", issue: "No URL provided" }] })
    };
  }

  try {
    const response = await fetch(pageUrl);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    let errors = [];

    // ================= CSS CHECK =================
    const cssLinks = [...document.querySelectorAll("link[rel='stylesheet']")];

    if (cssLinks.length === 0) {
      errors.push({ type: "CSS", issue: "No CSS file detected on page." });
    } else {
      for (const link of cssLinks) {
        const cssUrl = new URL(link.href, pageUrl).href;
        try {
          const res = await fetch(cssUrl);
          if (!res.ok) {
            errors.push({
              type: "CSS",
              issue: `CSS file failed to load (${cssUrl}) - Status ${res.status}`
            });
          }
        } catch {
          errors.push({
            type: "CSS",
            issue: `CSS file unreachable: ${cssUrl}`
          });
        }
      }
    }

    // ================= JAVASCRIPT CHECK =================
    const scripts = [...document.querySelectorAll("script[src]")];

    if (scripts.length === 0) {
      errors.push({ type: "JavaScript", issue: "No JavaScript file detected on page." });
    } else {
      for (const script of scripts) {
        const jsUrl = new URL(script.src, pageUrl).href;
        try {
          const res = await fetch(jsUrl);
          if (!res.ok) {
            errors.push({
              type: "JavaScript",
              issue: `JS file failed to load (${jsUrl}) - Status ${res.status}`
            });
          }
        } catch {
          errors.push({
            type: "JavaScript",
            issue: `JS file unreachable: ${jsUrl}`
          });
        }
      }
    }

    // ================= IMAGE CHECK =================
    const images = [...document.querySelectorAll("img")];

    for (const img of images) {
      if (!img.src) {
        errors.push({ type: "Image", issue: "Image tag found without src" });
        continue;
      }

      const imgUrl = new URL(img.src, pageUrl).href;
      try {
        const res = await fetch(imgUrl);
        if (!res.ok) {
          errors.push({
            type: "Image",
            issue: `Image failed to load (${imgUrl}) - Status ${res.status}`
          });
        }
      } catch {
        errors.push({
          type: "Image",
          issue: `Image unreachable: ${imgUrl}`
        });
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        errors: [
          { type: "System", issue: "Website blocked scanning or failed to load." }
        ],
        message: error.message
      })
    };
  }
};
