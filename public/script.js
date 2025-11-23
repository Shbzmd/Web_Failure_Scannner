async function scanWebsite() {
  const domain = document.getElementById('domainInput').value;
  const resultsBox = document.getElementById('results');
  const notification = document.getElementById('notification');

  if (!domain) {
    alert('Please enter a valid URL');
    return;
  }

  resultsBox.innerHTML = "<p>🔄 Scanning website...</p>";
  notification.textContent = "⏳ Scanning in progress...";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`/.netlify/functions/scan?url=${domain}`, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!data.errors || data.errors.length === 0) {
      notification.textContent = '✅ No Issues Found';
      resultsBox.innerHTML = "<p>No problems detected ✅</p>";
      return;
    }

    notification.textContent = `❌ ${data.errors.length} Issues Found`;

    let output = '';
    data.errors.forEach(err => {
      output += `
        <div style="margin:10px 0;padding:10px;background:#ffecec;border-left:5px solid red;">
          <strong>${err.type}</strong>: ${err.issue}
        </div>`;
    });

    resultsBox.innerHTML = output;

  } catch (error) {
    notification.textContent = "⚠️ Scan Failed";
    resultsBox.innerHTML = `
      <div style="color:red;">
        Website blocked scanning or connection timed out.
      </div>
    `;
  }
}
