let mainTab = 'all';
let subTab = 'pass';
let scanData = {};


function setMainTab(tab) {
mainTab = tab;
renderResults();
}


function setSubTab(tab) {
subTab = tab;
renderResults();
}


async function scanWebsite() {
const url = document.getElementById('domainInput').value;
const resultsBox = document.getElementById('scanResults');


if (!url) return alert('Enter a valid URL');


resultsBox.innerHTML = '⏳ Scanning...';


const response = await fetch(`/.netlify/functions/scan?url=${url}`);
scanData = await response.json();


renderResults();
}


function renderResults() {
const resultsBox = document.getElementById('scanResults');
let html = '';


const list = subTab === 'pass' ? scanData.reports : scanData.errors;


if (!list || list.length === 0) {
resultsBox.innerHTML = '<p>No results found</p>';
return;
}


list.forEach(item => {
if (mainTab !== 'all' && item.type.toLowerCase() !== mainTab) return;


html += `
<div class="${subTab === 'pass' ? 'asset-pass' : 'asset-fail'}">
<strong>${item.type}</strong><br>${item.issue}
</div>
`;
});


resultsBox.innerHTML = html || '<p>No matching results</p>';
}