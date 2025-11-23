const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

exports.handler = async function (event) {
  const url = event.queryStringParameters.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        errors: [{ type: "Input", issue: "No URL provided" }]
      })
    };
  }

  try {
    const res = await fetch(url);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    let errors = [];

    /* ===== CSS CHECK ===== */
    const cssLinks = document.querySelectorAll("link[rel='stylesheet']");

    if (cssLinks.length === 0) {
      errors.push({
        type: "CSS",
        issue: "No external CSS file detected on this page."
      });
    } else {
      cssLinks.forEach(link => {
        if (!link.href || link.href.trim() === "") {
          errors.push({
            type: "CSS",
            issue: "Stylesheet tag found with empty href."
          });
        }
      });
    }

    /* ===== JAVASCRIPT CHECK ===== */
    const scripts = document.querySelectorAll("script");

    if (scripts.length === 0) {
      errors.push({
        type: "JavaScript",
        issue: "No JavaScript detected on this page."
      });
    } else {
      scripts.forEach(script => {
        if (!script.src && !script.textContent.trim()) {
          errors.push({
            type: "JavaScript",
            issue: "Script tag present but empty."
          });
        }
      });
    }

    /* ===== IMAGE CHECK ===== */
    const images = document.querySelectorAll("img");

    images.forEach(img => {
      if (!img.src || img.src.trim() === "") {
        errors.push({
          type: "Image",
          issue: "Image tag found without source."
        });
      }
    });

    /* ===== RETURN ALL ERRORS TOGETHER ===== */
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        errors: [{
          type: "System",
          issue: "Scanning failed due to network / site restriction."
        }],
        message: err.message
      })
    };
  }
};
