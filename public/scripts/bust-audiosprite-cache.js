const fs = require('fs');
const path = require('path');

const AUDIO_JSON_PATH = path.resolve(__dirname, '../assets/live/sfx/sfx.json');

console.log('[p34t] Busting cache for audio sprite...');

try {
    if (!fs.existsSync(AUDIO_JSON_PATH)) {
        console.warn(`[p34t] No sfx.json found at ${AUDIO_JSON_PATH}`);
        process.exit(0);
    }

    const raw = fs.readFileSync(AUDIO_JSON_PATH, 'utf-8');
    const json = JSON.parse(raw);
    const version = Date.now();

    if (!Array.isArray(json.resources)) {
        throw new Error('Invalid audiosprite format — missing resources array');
    }

    json.resources = json.resources.map((resource) => {
        return resource.includes('?v=') ? resource : `${resource}?v=${version}`;
    });

    fs.writeFileSync(AUDIO_JSON_PATH, JSON.stringify(json, null, 2));
    console.log(`[p34t] Audio sprite cache busted with version: ${version}`);
} catch (err) {
    console.error('[p34t] Failed to bust audio cache:', err.message);
    process.exit(1);
}
