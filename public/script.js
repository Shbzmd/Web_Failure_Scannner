async function scanWebsite() {
const domain = document.getElementById('domainInput').value;
const resultsBox = document.getElementById('results');
const notification = document.getElementById('notification');


if (!domain) {
alert('Enter a valid website URL');
return;
}


resultsBox.innerHTML = 'Scanning...';


const response = await fetch(`/.netlify/functions/scan?url=${domain}`);
const data = await response.json();


if (data.errors.length > 0) {
notification.style.background = '#ffe6e6';
notification.style.color = '#cc0000';
notification.textContent = `❌ ${data.errors.length} Issues Found`;
} else {
notification.textContent = '✅ No Issues Found';
}


let html = '';
data.errors.forEach(err => {
html += `
<div style="border-left:4px solid red;padding:10px;margin-bottom:10px;">
<strong>Type:</strong> ${err.type}<br>
<strong>Issue:</strong> ${err.issue}
</div>
`;
});


resultsBox.innerHTML = html || '<p>No errors detected ✅</p>';
}