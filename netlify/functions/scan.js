const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

exports.handler = async function (event) {
  const url = event.queryStringParameters.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ errors: [{ type: "Input", issue: "No URL provided" }] }),
    };
  }

  try {
    // Fetch the page HTML
    const res = await fetch(url);
    const html = await res.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    let errors = [];

    // 🔹 CSS checks
    const cssLinks = Array.from(document.querySelectorAll("link[rel='stylesheet']"));

    if (cssLinks.length === 0) {
      // 👉 This is the part that will catch your 'removed CSS' case
      errors.push({
        type: "CSS",
        issue: "No <link rel=\"stylesheet\"> found on this page (no external CSS detected).",
      });
    } else {
      cssLinks.forEach((link) => {
        if (!link.href || link.href.trim() === "") {
          errors.push({
            type: "CSS",
            issue: "Stylesheet tag found but href is missing or empty.",
          });
        }
      });
    }

    // 🔹 JS checks
    const scripts = Array.from(document.querySelectorAll("script"));
    const externalScripts = scripts.filter((s) => s.src);

    if (scripts.length === 0) {
      errors.push({
        type: "JavaScript",
        issue: "No <script> tags found on this page (no JS detected).",
      });
    }

    externalScripts.forEach((script) => {
      if (!script.src || script.src.trim() === "") {
        errors.push({
          type: "JavaScript",
          issue: "External script tag with empty or missing src.",
        });
      }
    });

    // 🔹 Image checks
    const images = Array.from(document.querySelectorAll("img"));
    images.forEach((img) => {
      if (!img.src || img.src.trim() === "") {
        errors.push({
          type: "Image",
          issue: "<img> tag found with empty or missing src.",
        });
      }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors }),
    };
  } catch (err) {
    // If fetch / parsing failed
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        errors: [
          {
            type: "System",
            issue:
              "Failed to scan website (network error, CORS, or site blocked the request).",
          },
        ],
        message: err.message,
      }),
    };
  }
};
