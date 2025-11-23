let mainTab = "all";     // all | css | javascript | image | response
let subTab = "fail";     // pass | fail
let assets = [];         // filled from backend

function normalizeUrl(input) {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

function setMainTab(tab, btn) {
  mainTab = tab;
  document
    .querySelectorAll(".report-tabs button")
    .forEach(b => b.classList.toggle("active", b === btn));
  renderResults();
}

function setSubTab(tab, btn) {
  subTab = tab;
  document
    .querySelectorAll(".sub-tabs button")
    .forEach(b => b.classList.toggle("active", b === btn));
  renderResults();
}

async function scanWebsite() {
  const input = document.getElementById("domainInput");
  const notification = document.getElementById("notification");
  const resultsBox = document.getElementById("scanResults");
  const summaryChip = document.getElementById("summaryChip");

  let url = normalizeUrl(input.value);
  if (!url) {
    alert("Please enter a website URL.");
    return;
  }

  notification.textContent = "⏳ Scanning website assets...";
  notification.className = "notification notification-neutral";
  resultsBox.innerHTML = "Scanning...";
  summaryChip.textContent = "Scanning...";

  try {
    const response = await fetch(
      "/.netlify/functions/scan?url=" + encodeURIComponent(url)
    );
    const data = await response.json();
    assets = data.assets || [];

    const failCount = assets.filter(a => !a.ok).length;
    const total = assets.length;

    if (failCount > 0) {
      notification.textContent = `❌ ${failCount} issue(s) detected out of ${total} assets`;
      notification.className = "notification notification-error";
    } else {
      notification.textContent = "✅ No asset failures detected";
      notification.className = "notification notification-success";
    }

    summaryChip.textContent = `${total} assets • ${failCount} failing`;

    // Default to Fail tab to show problems first
    subTab = "fail";
    document
      .querySelectorAll(".sub-tabs button")
      .forEach(b => b.classList.toggle("active", b.dataset.sub === "fail"));

    renderResults();
  } catch (err) {
    console.error(err);
    notification.textContent = "⚠️ Scan failed. Please check the URL or try again.";
    notification.className = "notification notification-error";
    resultsBox.innerHTML = "<p>Scan failed. Unable to reach the scanning service.</p>";
    summaryChip.textContent = "Scan failed";
  }
}

function renderResults() {
  const resultsBox = document.getElementById("scanResults");

  if (!assets || assets.length === 0) {
    resultsBox.innerHTML = '<p class="results-placeholder">No scan data yet.</p>';
    return;
  }

  const wantPass = subTab === "pass";

  const filtered = assets.filter(asset => {
    // Filter by pass/fail
    if (wantPass && !asset.ok) return false;
    if (!wantPass && asset.ok) return false;

    // Filter by main tab
    if (mainTab === "all") {
      return ["page", "css", "javascript", "image"].includes(asset.type);
    }
    if (mainTab === "response") {
      return true; // all assets show in Response tab
    }
    return asset.type === mainTab;
  });

  if (filtered.length === 0) {
    const typeLabel =
      mainTab === "all"
        ? "assets"
        : mainTab === "css"
        ? "CSS assets"
        : mainTab === "javascript"
        ? "JavaScript assets"
        : mainTab === "image"
        ? "image assets"
        : "assets";
    resultsBox.innerHTML = `<p class="results-placeholder">No ${typeLabel} in this category.</p>`;
    return;
  }

  let html = "";
  filtered.forEach(asset => {
    const cls = asset.ok ? "asset-pass" : "asset-fail";
    const prettyType =
      asset.type === "css"
        ? "CSS"
        : asset.type === "javascript"
        ? "JavaScript"
        : asset.type === "image"
        ? "Image"
        : asset.type === "page"
        ? "Page"
        : "System";

    const code =
      asset.statusCode === null || asset.statusCode === undefined
        ? "-"
        : asset.statusCode;

    html += `
      <div class="asset-card ${cls}">
        <div class="asset-header">
          <span class="asset-type">${prettyType}</span>
          <span class="asset-status-code">Status: ${code}</span>
        </div>
        <div class="asset-url">${asset.url}</div>
        <div class="asset-message">${asset.message || ""}</div>
      </div>
    `;
  });

  resultsBox.innerHTML = html;
}
