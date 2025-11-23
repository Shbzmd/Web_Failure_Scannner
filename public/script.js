let mainTab = "all";
let subTab = "pass";
let assets = [];

function normalizeUrl(url) {
  if (!url.startsWith('http')) return 'https://' + url;
  return url;
}

function setMainTab(tab, btn) {
  mainTab = tab;
  document.querySelectorAll('.report-tabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderResults();
}

function setSubTab(tab, btn) {
  subTab = tab;
  document.querySelectorAll('.sub-tabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderResults();
}

async function scanWebsite() {
  const url = normalizeUrl(document.getElementById('domainInput').value);
  const note = document.getElementById('notification');

  note.textContent = "Scanning...";
  note.className = "notification neutral";

  const res = await fetch(`/.netlify/functions/scan?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  assets = data.assets;

  const failCount = assets.filter(a => !a.ok).length;

  note.className = failCount ? "notification error" : "notification success";
  note.textContent = failCount ? `❌ ${failCount} Issues Found` : "✅ No Issues Found";

  renderResults();
  document.getElementById("summaryChip").textContent =
    `${assets.length} assets • ${failCount} failing`;
}

function renderResults() {
  const box = document.getElementById('scanResults');
  let filtered = assets.filter(asset => {

    if (mainTab === "response") {
      if (subTab === "pass") return asset.statusCode >= 200 && asset.statusCode < 400;
      return asset.statusCode >= 400 || asset.statusCode === 0;
    }

    if (subTab === "pass" && !asset.ok) return false;
    if (subTab === "fail" && asset.ok) return false;

    if (mainTab === "all") return true;
    return asset.type === mainTab;
  });

  if (!filtered.length) {
    box.innerHTML = "No results found.";
    return;
  }

  box.innerHTML = filtered.map(a => `
    <div class="asset-card ${a.ok ? 'asset-pass' : 'asset-fail'}">
      <div class="asset-header">
        <strong>${a.type.toUpperCase()}</strong>
        <span>Status: ${a.statusCode || '-'}</span>
      </div>
      <div class="asset-url">${a.url}</div>
      <small>${a.message}</small>
    </div>
  `).join('');
}
