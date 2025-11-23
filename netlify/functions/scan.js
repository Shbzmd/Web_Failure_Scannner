const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { URL } = require('url');


exports.handler = async function(event) {
const pageUrl = event.queryStringParameters.url;


try {
const pageResponse = await fetch(pageUrl);
const html = await pageResponse.text();
const dom = new JSDOM(html);
const document = dom.window.document;


let reports = [];
let errors = [];


// CSS
for (const link of document.querySelectorAll("link[rel='stylesheet']")) {
const asset = new URL(link.href, pageUrl).href;
const res = await fetch(asset, { method: 'HEAD' });
(res.ok ? reports : errors).push({ type: 'CSS', issue: `${asset} - ${res.ok ? 'Loaded' : 'Failed'}` });
}


// JS
for (const script of document.querySelectorAll("script[src]")) {
const asset = new URL(script.src, pageUrl).href;
const res = await fetch(asset, { method: 'HEAD' });
(res.ok ? reports : errors).push({ type: 'JavaScript', issue: `${asset} - ${res.ok ? 'Loaded' : 'Failed'}` });
}


// Images
for (const img of document.querySelectorAll('img')) {
const asset = new URL(img.src, pageUrl).href;
const res = await fetch(asset, { method: 'HEAD' });
(res.ok ? reports : errors).push({ type: 'Image', issue: `${asset} - ${res.ok ? 'Loaded' : 'Failed'}` });
}


return { statusCode: 200, body: JSON.stringify({ reports, errors }) };


} catch (e) {
return { statusCode: 500, body: JSON.stringify({ errors: [{ type: 'System', issue: 'Scan failed' }] }) };
}
};