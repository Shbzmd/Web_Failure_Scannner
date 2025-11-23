async function scanWebsite() {
  const domain = document.getElementById('domainInput').value;
  const resultsBox = document.getElementById('results');
  const notification = document.getElementById('notification');

  if (!domain) {
    alert('Enter a valid website URL');
    return;
  }

  resultsBox.innerHTML = "⏳ Scanning...";
  notification.textContent = "Scanning in progress...";

  try {
    const response = await fetch(`/.netlify/functions/scan?url=${domain}`);
    const data = await response.json();

    let html = '';

    // ✅ Show WORKING assets
    if (data.reports && data.reports.length > 0) {
      data.reports.forEach(rep => {
        html += `
          <div style="border-left:5px solid #16a34a;padding:10px;margin-bottom:8px;background:#ecfdf5;">
            ✅ <strong>${rep.type}</strong>: ${rep.issue}
          </div>
        `;
      });
    }

    // ❌ Show FAILED assets
    if (data.errors && data.errors.length > 0) {
      data.errors.forEach(err => {
        html += `
          <div style="border-left:5px solid #dc2626;padding:10px;margin-bottom:8px;background:#fef2f2;">
            ❌ <strong>${err.type}</strong>: ${err.issue}
          </div>
        `;
      });

      notification.textContent = `❌ ${data.errors.length} Issue(s) Found`;
    } else {
      notification.textContent = '✅ All assets loaded successfully';
    }

    resultsBox.innerHTML = html || "<p>No results</p>";

  } catch (error) {
    notification.textContent = "⚠️ Scan failed";
    resultsBox.innerHTML = `
      <div style="color:red;">Unable to scan website. Check URL or network.</div>
    `;
  }
}
