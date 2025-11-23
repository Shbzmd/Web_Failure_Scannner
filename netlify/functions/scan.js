const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
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
    let reports = [];

    // ================= CSS FILE CHECK =================
    const cssLinks = [...document.querySelectorAll("link[rel='stylesheet']")];

    for (const link of cssLinks) {
      const cssUrl = new URL(link.href, pageUrl).href;

      try {
        const res = await fetch(cssUrl);
        if (!res.ok) {
          errors.push({
            type: "CSS",
            issue: `CSS file failed: ${cssUrl} (Status ${res.status})`
          });
        } else {
          reports.push({
            type: "CSS",
            issue: `CSS file working: ${cssUrl}`
          });
        }
      } catch {
        errors.push({
          type: "CSS",
          issue: `CSS unreachable: ${cssUrl}`
        });
      }
    }

    if (cssLinks.length === 0) {
      errors.push({ type: "CSS", issue: "No CSS files found" });
    }

    // ================= JAVASCRIPT FILE CHECK =================
    const scripts = [...document.querySelectorAll("script[src]")];

    for (const script of scripts) {
      const jsUrl = new URL(script.src, pageUrl).href;

      try {
        const res = await fetch(jsUrl);
        if (!res.ok) {
          errors.push({
            type: "JavaScript",
            issue: `JS file failed: ${jsUrl} (Status ${res.status})`
          });
        } else {
          reports.push({
            type: "JavaScript",
            issue: `JS file working: ${jsUrl}`
          });
        }
      } catch {
        errors.push({
          type: "JavaScript",
          issue: `JS unreachable: ${jsUrl}`
        });
      }
    }

    if (scripts.length === 0) {
      errors.push({ type: "JavaScript", issue: "No JS files found" });
    }

    // ================= IMAGE CHECK =================
    const images = [...document.querySelectorAll("img")];

    for (const img of images) {
      const imgUrl = new URL(img.src, pageUrl).href;

      try {
        const res = await fetch(imgUrl);
        if (!res.ok) {
          errors.push({
            type: "Image",
            issue: `Image failed: ${imgUrl} (Status ${res.status})`
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
      body: JSON.stringify({ errors, reports })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        errors: [
          { type: "System", issue: "Website blocked or cannot be reached." }
        ],
        message: error.message
      })
    };
  }
};
