if (data.reports) {
  data.reports.forEach(rep => {
    html += `
    <div style="border-left:4px solid green;padding:10px;margin-bottom:10px;">
      ✅ ${rep.type}: ${rep.issue}
    </div>`;
  });
}

if (data.errors) {
  data.errors.forEach(err => {
    html += `
    <div style="border-left:4px solid red;padding:10px;margin-bottom:10px;">
      ❌ ${err.type}: ${err.issue}
    </div>`;
  });
}
