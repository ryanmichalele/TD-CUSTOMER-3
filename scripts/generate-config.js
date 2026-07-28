const fs = require('fs');
const path = require('path');

const siteKey = process.env.TURNSTILE_SITE_KEY || '';

const content = 'window.TURNSTILE_SITE_KEY = ' + (siteKey ? JSON.stringify(siteKey) : 'null') + ';';

fs.writeFileSync(path.join(__dirname, 'turnstile-config.js'), content, 'utf-8');
console.log('turnstile-config.js generated. Site key ' + (siteKey ? 'set.' : 'NOT set - Turnstile disabled.'));
