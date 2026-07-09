const fs = require('fs-extra');
const path = require('path');

const src = path.resolve(__dirname, '../assets/live');
const dest = path.resolve(__dirname, '../public/assets');

console.log('[Copy Live Assets] Clearing public/assets...');
fs.removeSync(dest);

console.log('[Copy Live Assets] Copying from assets/live to public/assets...');
fs.copySync(src, dest);

console.log('[Copy Live Assets] Done.');
