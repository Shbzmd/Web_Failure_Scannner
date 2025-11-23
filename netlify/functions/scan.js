async function check(type, url) {
  try {
    const full = new URL(url, pageUrl).href;

    const res = await fetch(full, {
      method: "GET",
      redirect: "follow"
    });

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
      message: !res.ok
        ? "HTTP Error"
        : !validType
        ? "Invalid content type"
        : "Loaded OK"
    });

  } catch (err) {
    assets.push({
      type,
      url,
      ok: false,
      statusCode: 0,
      message: "Network Failure"
    });
  }
}
