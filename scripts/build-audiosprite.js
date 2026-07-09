const audiosprite = require('audiosprite-ffmpeg');
const path = require('path');
const glob = require('glob');
const fs = require('fs');

const SOURCE_DIR = path.resolve(__dirname, '../assets/raw/sfx');
const OUTPUT_DIR = path.resolve(__dirname, '../assets/live/sfx');
const SPRITE_NAME = 'sfx';

const AUDIO_FORMATS = ['.ogg', '.mp3'];

async function go() {
    console.log(`[AudioSprite] Building ${SPRITE_NAME} from raw audio...`);

    const files = glob.sync(`${SOURCE_DIR}/**/*.{ogg,mp3}`);

    if (!files.length) {
        console.warn('[AudioSprite] No audio files found. Aborting.');
        return;
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const opts = {
        output: path.join(OUTPUT_DIR, SPRITE_NAME),
        export: AUDIO_FORMATS.map((ext) => ext.slice(1)).join(','),
        log: 'info',
        silence: 0.2,
    };

    try {
        const result = await new Promise((resolve, reject) => {
            audiosprite(files, opts, (err, obj) => {
                if (err) return reject(err);
                resolve(obj);
            });
        });

        // Inject resource list (used by Phaser)
        result.resources = AUDIO_FORMATS.map((ext) => `${SPRITE_NAME}${ext}`);

        const jsonPath = path.join(OUTPUT_DIR, `${SPRITE_NAME}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

        console.log(`[AudioSprite] Done. Output: ${jsonPath}`);
    } catch (err) {
        console.error('[AudioSprite] Failed to build sprite:', err);
    }
}

go();
