#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const EXPECTED_HEAD = 'f4026810a6c907be2ede3550c5b9669bc81276cb';

const expectedBlobs = {
    'src/app/runtime/SceneRuntime.ts': 'f47fca689b2407892951597138c0a6a0edcaa8f2',
    'src/index.ts': '784b9481c71b1b676c56eeddee4c21dee2fee1d9',
    'src/app/scenes/scene_key.ts': '06c93c693e0d23b7d3d64ee6a6335ff497b0a02c',
    'src/app/manifests/ui/button.ts': '8ad57ad0efb46bbb5fce6c4796aea9eacd740554',
    'src/app/theme/font.ts': '34c5d7ee9ca2a154072b18b39754066a728e2ff7',

    'src/app/manifests/ui/local_space_panel.ts': '849f8118f9a4d483eea56a9604e8a51d3dbd88af',
    'src/app/scenes/game/overlay/GameOverlayScene.ts': 'e6f7270c019f2c65bf3c4eca4b7702ebf4bfa737',
    'src/app/scenes/game/overlay/controller/GameOverlayController.ts': '9395c368eba6434a7c32dee230014909b4e34991',
    'src/app/scenes/game/overlay/events/GameOverlayEventBus.ts': '424e8e1e65cf00e612375ea59ba89082b454a370',
    'src/app/scenes/game/overlay/events/game_overlay_event.ts': '49d49f32eff9f56ba789d4725c42a3c6f9b309c0',
    'src/app/scenes/game/overlay/view/LocalSpaceButtonView.ts': 'a42223ad4af25268526a838d44bab81ddf8944b4',
    'src/app/scenes/game/overlay/view/LocalSpacePanelView.ts': '2ea746ed1f1f6fd1599afca6164b088cf34e63e0',

    'assets/raw/images/ui/buttons/local_space_00.png': '2753ad692bc1043e817bcd08f1d38418f077e176',
    'assets/raw/images/ui/local_space_panel/top.png': '35db1c4772583421267f9bba92912edaec050813',
    'assets/raw/images/ui/local_space_panel/middle.png': '4d5804b9828aed9f824741f6d1f68a93e6392348',
    'assets/raw/images/ui/local_space_panel/bottom.png': 'd3404bb083807a54ea206cf9604185a3d3a21028',
};

const replacementFiles = {
    'src/app/runtime/SceneRuntime.ts': `// src/app/runtime/SceneRuntime.ts

import type { SceneKey } from '../scenes/scene_key';

// Технический runtime для управления Phaser scenes.
//
// Не хранит game state и не содержит domain rules.
class SceneRuntime {
    public startGameScene(scene: Phaser.Scene, sceneKey: SceneKey): void {
        if (scene.sys.settings.key === sceneKey) {
            scene.scene.restart();
        } else {
            scene.scene.start(sceneKey);
        }
    }
}

export const SCENE_RUNTIME = new SceneRuntime();
`,
    'src/index.ts': `// src/index.ts

import Phaser from 'phaser';
import gameConfig from './config/gameConfig';
import Boot from './app/scenes/system/boot/Boot';
import Preload from './app/scenes/system/preload/Preload';

import InitScene from './app/scenes/game/init/InitScene';
import BridgeScene from './app/scenes/game/bridge/BridgeScene';
import EndScene from './app/scenes/game/end/EndScene';

import applyResponsiveScaling from './utils/applyResponsiveScaling';
import enforceOrientation from './utils/enforceOrientation';
import P34TOptions from './config/p34t.options';

window.addEventListener('load', async () => {
    applyResponsiveScaling(gameConfig);
    enforceOrientation();

    if (P34TOptions.title) {
        document.title = P34TOptions.title;
    }

    gameConfig.scene = [Boot, Preload, InitScene, BridgeScene, EndScene];

    new Phaser.Game(gameConfig);
});
`,
    'src/app/scenes/scene_key.ts': `// src/app/scenes/scene_key.ts

export const SCENE_KEY = {
    BOOT: 'boot',
    PRELOAD: 'preload',

    INIT: 'init',
    BRIDGE: 'bridge',
    END: 'end',
} as const;

export type SceneKey = (typeof SCENE_KEY)[keyof typeof SCENE_KEY];
`,
    'src/app/manifests/ui/button.ts': `// src/app/manifests/ui/button.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const UI_BUTTON_SPRITE_ID = {
    CLOSE_00: 'close_00',
} as const;

export type UiButtonSpriteId = (typeof UI_BUTTON_SPRITE_ID)[keyof typeof UI_BUTTON_SPRITE_ID];

export const UI_BUTTON_SPRITES = {
    [UI_BUTTON_SPRITE_ID.CLOSE_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ui/buttons/close_00',
    },
} satisfies Record<UiButtonSpriteId, SpriteEntry>;
`,
    'src/app/theme/font.ts': `// src/app/theme/font.ts

export const FONT_FAMILY = {
    VGA_8X14: 'vga_8x14',
} as const;

export const FONT_SIZE = {
    PX_12: 12,
    PX_14: 14,
    PX_16: 16,
} as const;

export const FONT_COLOR = {
    WHITE: 0xffffff,
    PRIMARY: 0xd7e6ff,
    SECONDARY: 0x8fb5d6,
    SPEAKER: 0xf2b36d,
    ACTIVITY: 0xea9e3e,
    DANGER: 0xff4d4d,
} as const;
`,
};

const deletedFiles = Object.keys(expectedBlobs).filter((file) => !(file in replacementFiles));

const legacyTokens = [
    'GameOverlay',
    'GAME_OVERLAY',
    'LocalSpace',
    'localSpace',
    'LOCAL_SPACE_00',
    'LOCAL_SPACE_PANEL',
    'LOCAL_SPACE_OBJECT',
    'LOCAL_SPACE_CURRENT_OBJECT',
    'local_space_panel',
    'local_space_00',
];

const allowedLegacyReferenceFiles = new Set(Object.keys(expectedBlobs));

function fail(message) {
    console.error(`\nERROR: ${message}`);
    process.exit(1);
}

function runGit(args) {
    try {
        return execFileSync('git', args, {
            cwd: process.cwd(),
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    } catch (error) {
        const stderr = error?.stderr?.toString?.().trim();
        fail(`git ${args.join(' ')} failed${stderr ? `:\n${stderr}` : ''}`);
    }
}

function listFilesRecursive(root) {
    if (!fs.existsSync(root)) {
        return [];
    }

    const result = [];
    const stack = [root];

    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
            } else if (entry.isFile()) {
                result.push(fullPath.replaceAll('\\', '/'));
            }
        }
    }

    return result.sort();
}

function assertDirectoryContainsOnly(dir, expectedFiles) {
    const actual = listFilesRecursive(dir);
    const expected = [...expectedFiles].sort();

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        fail(
            `${dir} no longer matches the audited tree.\n` +
            `Expected:\n${expected.map((x) => `  ${x}`).join('\n')}\n` +
            `Actual:\n${actual.map((x) => `  ${x}`).join('\n')}`,
        );
    }
}

function assertNoUnknownLegacyReferences() {
    const roots = ['src', 'tests', 'scripts'];
    const findings = [];

    for (const root of roots) {
        for (const file of listFilesRecursive(root)) {
            if (allowedLegacyReferenceFiles.has(file)) {
                continue;
            }

            let text;
            try {
                text = fs.readFileSync(file, 'utf8');
            } catch {
                continue;
            }

            for (const token of legacyTokens) {
                if (text.includes(token)) {
                    findings.push(`${file}: ${token}`);
                }
            }
        }
    }

    if (findings.length > 0) {
        fail(
            `Found legacy references outside the audited files. Refusing to guess:\n` +
            findings.map((x) => `  ${x}`).join('\n'),
        );
    }
}

function preflight() {
    if (!fs.existsSync('package.json') || !fs.existsSync('.git')) {
        fail('Run this script from the repository root.');
    }

    const head = runGit(['rev-parse', 'HEAD']);
    if (head !== EXPECTED_HEAD) {
        fail(
            `HEAD mismatch.\n` +
            `Expected: ${EXPECTED_HEAD}\n` +
            `Actual:   ${head}\n` +
            `Repo moved after the audit; re-read before applying.`,
        );
    }

    const dirty = runGit(['status', '--porcelain', '--', ...Object.keys(expectedBlobs)]);
    if (dirty) {
        fail(`Target files have local changes:\n${dirty}`);
    }

    for (const [file, expectedSha] of Object.entries(expectedBlobs)) {
        if (!fs.existsSync(file)) {
            fail(`Expected file is missing: ${file}`);
        }

        const actualSha = runGit(['hash-object', file]);
        if (actualSha !== expectedSha) {
            fail(
                `Blob mismatch for ${file}.\n` +
                `Expected: ${expectedSha}\n` +
                `Actual:   ${actualSha}`,
            );
        }
    }

    assertDirectoryContainsOnly(
        'src/app/scenes/game/overlay',
        deletedFiles.filter((x) => x.startsWith('src/app/scenes/game/overlay/')),
    );
    assertDirectoryContainsOnly(
        'assets/raw/images/ui/local_space_panel',
        deletedFiles.filter((x) => x.startsWith('assets/raw/images/ui/local_space_panel/')),
    );

    assertNoUnknownLegacyReferences();
}

function apply() {
    for (const [file, content] of Object.entries(replacementFiles)) {
        fs.writeFileSync(file, content, 'utf8');
    }

    fs.rmSync('src/app/scenes/game/overlay', { recursive: true, force: false });
    fs.rmSync('src/app/manifests/ui/local_space_panel.ts', { force: false });
    fs.rmSync('assets/raw/images/ui/buttons/local_space_00.png', { force: false });
    fs.rmSync('assets/raw/images/ui/local_space_panel', { recursive: true, force: false });
}

function postflight() {
    assertNoUnknownLegacyReferences();

    try {
        execFileSync('git', ['diff', '--check'], {
            cwd: process.cwd(),
            stdio: 'inherit',
        });
    } catch {
        fail('git diff --check failed.');
    }
}

preflight();
apply();
postflight();

console.log(`
Local Space / GameOverlay legacy shell removed.

Next:
  npm run pack:tex
  npm run typecheck
  npm test

Then runtime smoke:
  - boot/new game still reaches bridge;
  - scene restart/transition still works;
  - no LOCAL SPACE button/panel appears;
  - bridge world/object rendering still works.

Review:
  git status --short
  git diff --stat
  git diff

No Captain Dashboard or gameplay code was touched.
`);
