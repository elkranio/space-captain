const fs = require('fs');
const path = require('path');

const ATLAS_JSON_PATH = path.resolve(__dirname, '../assets/live/images/atlas.json');

console.log('[p34t] Busting cache for atlas...');

try {
    if (!fs.existsSync(ATLAS_JSON_PATH)) {
        console.warn(`[p34t] No atlas found at ${ATLAS_JSON_PATH}`);
        process.exit(0);
    }

    const raw = fs.readFileSync(ATLAS_JSON_PATH, 'utf-8');
    const json = JSON.parse(raw);
    const version = Date.now();

    if (!Array.isArray(json.textures)) {
        throw new Error('Invalid atlas format — missing textures array');
    }

    json.textures.forEach((texture) => {
        if (typeof texture.image === 'string' && !texture.image.includes('?v=')) {
            texture.image += `?v=${version}`;
        }
    });

    fs.writeFileSync(ATLAS_JSON_PATH, JSON.stringify(json, null, 2));
    console.log(`[p34t] Atlas cache busted with version: ${version}`);
} catch (err) {
    console.error('[p34t] Failed to bust atlas cache:', err.message);
    process.exit(1);
}
