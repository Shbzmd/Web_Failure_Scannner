async function check(type, url) {
  try {
    const full = new URL(url, pageUrl).href;

    // Timeout controller (8 seconds max)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res;
    try {
      res = await fetch(full, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow"
      });
    } catch {
      // Fallback to GET if HEAD fails
      res = await fetch(full, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow"
      });
    }

    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    let validType = true;

    if (type === "css" && !contentType.includes("text/css")) validType = false;
    if (type === "javascript" && !contentType.includes("javascript")) validType = false;
    if (type === "image" && !contentType.includes("image")) validType = false;

    assets.push({
      type,
      url: full,
      ok: res.ok && validType,
      statusCode: res.status,
      message:
        !res.ok
          ? `HTTP Error ${res.status}`
          : !validType
          ? "Invalid content type"
          : "Loaded OK"
    });

  } catch {
    assets.push({
      type,
      url,
      ok: false,
      statusCode: 0,
      message: "Timeout / Network Failure"
    });
  }
}
