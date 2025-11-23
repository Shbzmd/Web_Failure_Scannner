const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

exports.handler = async function(event) {
  const url = event.queryStringParameters.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ errors: ["No URL provided"] })
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 sec limit

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    let errors = [];

    document.querySelectorAll("img").forEach(img => {
      if (!img.src || img.src.trim() === "") {
        errors.push({ type: "Image", issue: "Missing image source" });
      }
    });

    document.querySelectorAll("link[rel='stylesheet']").forEach(link => {
      if (!link.href) {
        errors.push({ type: "CSS", issue: "Stylesheet missing href" });
      }
    });

    document.querySelectorAll("script").forEach(script => {
      if (!script.src && !script.textContent.trim()) {
        errors.push({ type: "JavaScript", issue: "Empty script tag" });
      }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        errors: [
          { type: "System", issue: "Failed to scan website or blocked by server" }
        ],
        message: err.message
      })
    };
  }
};
