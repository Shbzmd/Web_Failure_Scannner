async function scanWebsite() {
const domain = document.getElementById('domainInput').value;
const resultsBox = document.getElementById('results');
const notification = document.getElementById('notification');


if (!domain) {
alert('Please enter a domain');
return;
}


resultsBox.textContent = 'Scanning...';


const response = await fetch(`/.netlify/functions/scan?url=${domain}`);
const data = await response.json();


resultsBox.textContent = JSON.stringify(data, null, 2);


if (data.errors.length > 0) {
notification.textContent = `🔔 ${data.errors.length} Issues Found`;
} else {
notification.textContent = '✅ No Issues Found';
}
}