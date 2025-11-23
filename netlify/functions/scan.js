const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { URL } = require('url');

exports.handler = async function (event) {
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

    /* ================= CSS CHECK ================= */

    const cssLinks = [...document.querySelectorAll("link[rel='stylesheet']")];

    if (cssLinks.length === 0) {
      errors.push({
        type: "CSS",
        issue: "No CSS files found on this website."
      });
    } else {
      for (const link of cssLinks) {
        const cssUrl = new URL(link.href, pageUrl).href;

        try {
          const res = await fetch(cssUrl, { method: 'HEAD' });
          if (!res.ok) {
            errors.push({
              type: "CSS",
              issue: `CSS failed to load: ${cssUrl} (Status ${res.status})`
            });
          } else {
            reports.push({
              type: "CSS",
              issue: `CSS loaded successfully: ${cssUrl}`
            });
          }
        } catch {
          errors.push({
            type: "CSS",
            issue: `CSS unreachable: ${cssUrl}`
          });
        }
      }
    }

    /* ================= JAVASCRIPT CHECK ================= */

    const scripts = [...document.querySelectorAll("script[src]")];

    if (scripts.length === 0) {
      errors.push({
        type: "JavaScript",
        issue: "No JavaScript files found on this website."
      });
    } else {
      for (const script of scripts) {
        const jsUrl = new URL(script.src, pageUrl).href;

        try {
          const res = await fetch(jsUrl, { method: 'HEAD' });
          if (!res.ok) {
            errors.push({
              type: "JavaScript",
              issue: `JS failed to load: ${jsUrl} (Status ${res.status})`
            });
          } else {
            reports.push({
              type: "JavaScript",
              issue: `JS loaded successfully: ${jsUrl}`
            });
          }
        } catch {
          errors.push({
            type: "JavaScript",
            issue: `JS unreachable: ${jsUrl}`
          });
        }
      }
    }

    /* ================= IMAGE CHECK ================= */

    const images = [...document.querySelectorAll("img")];

    for (const img of images) {
      if (!img.src) {
        errors.push({
          type: "Image",
          issue: "Image tag found without src attribute."
        });
        continue;
      }

      const imgUrl = new URL(img.src, pageUrl).href;

      try {
        const res = await fetch(imgUrl, { method: 'HEAD' });
        if (!res.ok) {
          errors.push({
            type: "Image",
            issue: `Image failed to load: ${imgUrl} (Status ${res.status})`
          });
        } else {
          reports.push({
            type: "Image",
            issue: `Image loaded successfully: ${imgUrl}`
          });
        }
      } catch {
        errors.push({
          type: "Image",
          issue: `Image unreachable: ${imgUrl}`
        });
      }
    }

    /* ================= UI ELEMENT CHECK ================= */

    const buttons = document.querySelectorAll("button");
    if (buttons.length === 0) {
      errors.push({
        type: "UI",
        issue: "No <button> elements found on this website."
      });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reports, errors })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        errors: [{
          type: "System",
          issue: "Website blocked scanning or network error occurred."
        }]
      })
    };
  }
};
