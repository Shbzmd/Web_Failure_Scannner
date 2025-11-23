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
    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    let errors = [];

    // ✅ Check IMAGES
    const images = document.querySelectorAll("img");
    for (let img of images) {
      if (!img.src) {
        errors.push({ type: "Image", issue: "Missing image source" });
      } else {
        try {
          const imgCheck = await fetch(img.src);
          if (!imgCheck.ok) {
            errors.push({ type: "Image", issue: `Broken image: ${img.src}` });
          }
        } catch {
          errors.push({ type: "Image", issue: `Image not reachable: ${img.src}` });
        }
      }
    }

    // ✅ Check CSS FILES
    const stylesheets = document.querySelectorAll("link[rel='stylesheet']");
    for (let css of stylesheets) {
      if (!css.href) {
        errors.push({ type: "CSS", issue: "Stylesheet missing href" });
      } else {
        try {
          const cssCheck = await fetch(css.href);
          if (!cssCheck.ok) {
            errors.push({ type: "CSS", issue: `Broken CSS file: ${css.href}` });
          }
        } catch {
          errors.push({ type: "CSS", issue: `CSS not reachable: ${css.href}` });
        }
      }
    }

    // ✅ Check JS FILES
    const scripts = document.querySelectorAll("script[src]");
    for (let script of scripts) {
      try {
        const jsCheck = await fetch(script.src);
        if (!jsCheck.ok) {
          errors.push({ type: "JavaScript", issue: `Broken JS file: ${script.src}` });
        }
      } catch {
        errors.push({ type: "JavaScript", issue: `JS not reachable: ${script.src}` });
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
        errors: [{ type: "System", issue: "Website blocked scanning or failed to respond" }]
      })
    };
  }
};
