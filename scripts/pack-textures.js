const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

// Optional override path (if installed elsewhere)
const TEXTURE_PACKER_CMD = process.env.TEXTURE_PACKER_PATH || 'TexturePacker';

const INPUT_DIR = path.resolve(__dirname, '../assets/raw/images');
const OUTPUT_SHEET = path.resolve(__dirname, '../assets/live/images/atlas-{n}.png');
const OUTPUT_JSON = path.resolve(__dirname, '../assets/live/images/atlas.json');

// Build CLI command
const cmd = [
    `"${TEXTURE_PACKER_CMD}"`,
    `--data "${OUTPUT_JSON}"`,
    `--sheet "${OUTPUT_SHEET}"`,
    '--format phaser',
    '--texture-format png',
    '--png-opt-level 1',
    '--trim-mode Trim',
    '--trim-margin 1',
    '--border-padding 0',
    '--shape-padding 0',
    '--extrude 1',
    '--max-size 2048',
    '--size-constraints AnySize',
    '--scale 1',
    '--scale-mode Smooth',
    '--algorithm MaxRects',
    '--multipack',
    '--trim-sprite-names',
    `"${INPUT_DIR}"`,
].join(' ');

// Run it
console.log('[p34t] Packing textures...');
try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('[p34t] Texture packing complete');
} catch (err) {
    console.error('[p34t] Texture packing failed');
    console.error(err.message);

    process.exitCode = 1;
}
