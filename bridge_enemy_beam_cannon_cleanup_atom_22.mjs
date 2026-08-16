import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPECTED_HEAD =
    'd50c9c953ca1a34e7157501cc1747a160377d3de';

const SELF_PATH = fileURLToPath(import.meta.url);
const ROOT = process.cwd();

const THREAT_PATH =
    'src/app/scenes/game/bridge/view/combat/beam_cannon_threats/beam_cannon/BridgeBeamCannonThreatView.ts';

const THREATS_MANAGER_PATH =
    'src/app/scenes/game/bridge/view/combat/beam_cannon_threats/BridgeBeamCannonThreatsView.ts';

const BEAMS_MANAGER_PATH =
    'src/app/scenes/game/bridge/view/combat/beam_cannon_beams/BridgeBeamCannonBeamsView.ts';

const THREAT_SOURCE = `// src/app/scenes/game/bridge/view/combat/beam_cannon_threats/beam_cannon/BridgeBeamCannonThreatView.ts

import type BridgeScene from '../../../../BridgeScene';
import BridgeBeamCannonChargeView from '../../beam_cannon_charge/BridgeBeamCannonChargeView';

type BridgeBeamCannonThreatViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    weaponOrigin:
        Phaser.Math.Vector2;
};

// Enemy beamCannon charging presentation.
//
// Tactical designation and countdown live outside
// the viewscreen. This leaf only shows the physical
// charge effect at the enemy weapon origin.
export default class BridgeBeamCannonThreatView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly chargeView:
        BridgeBeamCannonChargeView;

    constructor({
        scene,
        parent,

        weaponOrigin,
    }: BridgeBeamCannonThreatViewOptions) {
        this.root =
            scene.add.container(
                Math.round(
                    weaponOrigin.x,
                ),
                Math.round(
                    weaponOrigin.y,
                ),
            );

        parent.add(
            this.root,
        );

        this.chargeView =
            BridgeBeamCannonChargeView.create({
                scene,
                parent:
                    this.root,
            });
    }

    public destroy(): void {
        this.chargeView.destroy();
        this.root.destroy(true);
    }
}
`;

function fail(message) {
    throw new Error(message);
}

function absolute(relativePath) {
    return path.join(ROOT, relativePath);
}

function runCapture(command, args) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        shell: false,
    });

    if (result.error) {
        fail(`${command} failed to start: ${result.error.message}`);
    }

    if (result.status !== 0) {
        fail(
            `${command} ${args.join(' ')} failed with exit code ${result.status}\n` +
            `${result.stderr ?? ''}`,
        );
    }

    return (result.stdout ?? '').trim();
}

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        stdio: 'inherit',
        shell: false,
    });

    if (result.error) {
        fail(`${command} failed to start: ${result.error.message}`);
    }

    if (result.status !== 0) {
        fail(
            `${command} ${args.join(' ')} failed with exit code ${result.status}`,
        );
    }
}

function runNpm(args) {
    if (process.platform === 'win32') {
        run(
            'cmd.exe',
            ['/d', '/s', '/c', `npm ${args.join(' ')}`],
        );

        return;
    }

    run('npm', args);
}

function readText(relativePath) {
    const filePath =
        absolute(relativePath);

    if (!fs.existsSync(filePath)) {
        fail(
            `Expected file missing: ${relativePath}`,
        );
    }

    return fs.readFileSync(
        filePath,
        'utf8',
    );
}

function normalizeLf(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n*$/, '\n');
}

function writePreservingEol(
    relativePath,
    lfText,
    originalText,
) {
    const eol =
        originalText.includes('\r\n')
            ? '\r\n'
            : '\n';

    fs.writeFileSync(
        absolute(relativePath),
        normalizeLf(lfText)
            .replace(/\n/g, eol),
        'utf8',
    );
}

function replaceExactlyOnce(
    text,
    before,
    after,
    label,
) {
    const first =
        text.indexOf(before);

    if (first === -1) {
        fail(
            `Expected source fragment missing: ${label}`,
        );
    }

    if (
        text.indexOf(
            before,
            first + before.length,
        ) !== -1
    ) {
        fail(
            `Expected source fragment is not unique: ${label}`,
        );
    }

    return (
        text.slice(0, first) +
        after +
        text.slice(
            first + before.length,
        )
    );
}

function assertPreconditions() {
    const head =
        runCapture(
            'git',
            ['rev-parse', 'HEAD'],
        );

    if (head !== EXPECTED_HEAD) {
        fail(
            `Unexpected HEAD.\nExpected: ${EXPECTED_HEAD}\nActual:   ${head}`,
        );
    }

    const status =
        runCapture(
            'git',
            [
                'status',
                '--porcelain',
                '--untracked-files=no',
            ],
        );

    if (status) {
        fail(
            'Tracked worktree must be clean before applying this atom:\n' +
            status,
        );
    }

    const threat =
        normalizeLf(
            readText(THREAT_PATH),
        );

    for (const token of [
        `FONT_FAMILY,`,
        `FONT_SIZE,`,
        `const TARGETING_FRAME = {`,
        `private readonly targetingFrame:`,
        `private readonly statusLabel:`,
        `private timeToFireMs?: number;`,
        `public update(`,
        `private drawTargetingFrame():`,
        `private formatStatusLabel():`,
        `private formatTimeToFire(`,
    ]) {
        if (!threat.includes(token)) {
            fail(
                `Expected legacy beam threat token missing: ${token}`,
            );
        }
    }

    const threatsManager =
        normalizeLf(
            readText(THREATS_MANAGER_PATH),
        );

    for (const token of [
        `designation:
                    payload.designation,`,
        `threat.update(
                update.timeToFireMs,`,
    ]) {
        if (!threatsManager.includes(token)) {
            fail(
                `Expected beam threat manager token missing: ${token}`,
            );
        }
    }

    const beamsManager =
        normalizeLf(
            readText(BEAMS_MANAGER_PATH),
        );

    for (const token of [
        `BEAM_CANNON_SHOT_OUTCOME,`,
        `case BEAM_CANNON_SHOT_OUTCOME.HIT:`,
        `case BEAM_CANNON_SHOT_OUTCOME.ABSORBED:`,
        `const beam = new BridgeBeamCannonBeamView({`,
    ]) {
        if (!beamsManager.includes(token)) {
            fail(
                `Expected beam manager token missing: ${token}`,
            );
        }
    }

    console.log(
        'Enemy beam cannon cleanup preflight OK',
    );
}

function rewriteThreat() {
    const original =
        readText(THREAT_PATH);

    writePreservingEol(
        THREAT_PATH,
        THREAT_SOURCE,
        original,
    );
}

function patchThreatsManager() {
    const original =
        readText(THREATS_MANAGER_PATH);

    let text =
        normalizeLf(original);

    text = replaceExactlyOnce(
        text,
        `                designation:
                    payload.designation,

                weaponOrigin,`,
        `                weaponOrigin,`,
        'remove viewscreen designation',
    );

    const oldUpdateLoop = `        for (const update of payload) {
            const threat =
                this.threats.get(
                    update.attackId,
                );

            if (!threat) {
                throw new Error(
                    'BeamCannon threat update ' +
                        'target not found: ' +
                        update.attackId,
                );
            }

            threat.update(
                update.timeToFireMs,

                update
                    .initialTimeToFireMs,
            );
        }`;

    const newUpdateLoop = `        for (const update of payload) {
            if (
                !this.threats.has(
                    update.attackId,
                )
            ) {
                throw new Error(
                    'BeamCannon threat update ' +
                        'target not found: ' +
                        update.attackId,
                );
            }
        }`;

    text = replaceExactlyOnce(
        text,
        oldUpdateLoop,
        newUpdateLoop,
        'remove viewscreen countdown updates',
    );

    writePreservingEol(
        THREATS_MANAGER_PATH,
        text,
        original,
    );
}

function patchBeamsManager() {
    const original =
        readText(BEAMS_MANAGER_PATH);

    let text =
        normalizeLf(original);

    text = replaceExactlyOnce(
        text,
        `import type BridgeScene from '../../../BridgeScene';`,
        `import type BridgeScene from '../../../BridgeScene';
import { SCREEN_SHAKE } from '../../../../../../theme/screen_shake';`,
        'screen shake import',
    );

    text = replaceExactlyOnce(
        text,
        `        const targetPosition =
            this.getTargetPosition(
                payload.outcome,
            );

        const beam = new BridgeBeamCannonBeamView({`,
        `        const targetPosition =
            this.getTargetPosition(
                payload.outcome,
            );

        if (
            payload.outcome ===
            BEAM_CANNON_SHOT_OUTCOME.HIT
        ) {
            const shake =
                SCREEN_SHAKE.MEDIUM;

            this.scene.cameras.main.shake(
                shake.durationMs,
                shake.intensity,
            );
        }

        const beam = new BridgeBeamCannonBeamView({`,
        'beam cannon hull-hit shake',
    );

    writePreservingEol(
        BEAMS_MANAGER_PATH,
        text,
        original,
    );
}

function postGuards() {
    const threat =
        normalizeLf(
            readText(THREAT_PATH),
        );

    for (const stale of [
        'FONT_FAMILY',
        'FONT_SIZE',
        'TARGETING_FRAME',
        'targetingFrame',
        'statusLabel',
        'designation',
        'timeToFireMs',
        'initialTimeToFireMs',
        'formatStatusLabel',
        'formatTimeToFire',
        'drawTargetingFrame',
        'drawCorner',
        'BitmapText',
    ]) {
        if (threat.includes(stale)) {
            fail(
                `Post-guard failed: legacy beam threat token remains: ${stale}`,
            );
        }
    }

    for (const required of [
        `private readonly chargeView:`,
        `BridgeBeamCannonChargeView.create({`,
        `Tactical designation and countdown live outside`,
    ]) {
        if (!threat.includes(required)) {
            fail(
                `Post-guard failed: clean beam threat token missing: ${required}`,
            );
        }
    }

    const threatsManager =
        normalizeLf(
            readText(THREATS_MANAGER_PATH),
        );

    for (const stale of [
        `designation:
                    payload.designation,`,
        `threat.update(`,
        `update.timeToFireMs`,
        `update
                    .initialTimeToFireMs`,
    ]) {
        if (threatsManager.includes(stale)) {
            fail(
                `Post-guard failed: countdown manager token remains: ${stale}`,
            );
        }
    }

    if (
        !threatsManager.includes(
            `!this.threats.has(
                    update.attackId,
                )`,
        )
    ) {
        fail(
            'Post-guard failed: snapshot existence validation missing',
        );
    }

    const beamsManager =
        normalizeLf(
            readText(BEAMS_MANAGER_PATH),
        );

    for (const required of [
        `import { SCREEN_SHAKE } from '../../../../../../theme/screen_shake';`,
        `payload.outcome ===
            BEAM_CANNON_SHOT_OUTCOME.HIT`,
        `SCREEN_SHAKE.MEDIUM`,
        `this.scene.cameras.main.shake(`,
        `case BEAM_CANNON_SHOT_OUTCOME.ABSORBED:`,
    ]) {
        if (!beamsManager.includes(required)) {
            fail(
                `Post-guard failed: beam manager token missing: ${required}`,
            );
        }
    }

    const absorbedCaseIndex =
        beamsManager.indexOf(
            'case BEAM_CANNON_SHOT_OUTCOME.ABSORBED:',
        );

    const shakeIndex =
        beamsManager.indexOf(
            'this.scene.cameras.main.shake(',
        );

    if (
        absorbedCaseIndex === -1 ||
        shakeIndex === -1
    ) {
        fail(
            'Post-guard failed: expected beam/shield structure missing',
        );
    }
}

function validate() {
    run(
        'git',
        [
            '-c',
            'core.safecrlf=false',
            'diff',
            '--check',
        ],
    );

    runNpm([
        'run',
        'typecheck',
    ]);

    runNpm([
        'test',
    ]);
}

try {
    assertPreconditions();
    rewriteThreat();
    patchThreatsManager();
    patchBeamsManager();
    postGuards();
    validate();

    fs.unlinkSync(SELF_PATH);

    console.log(
        '\nBRIDGE ENEMY BEAM CANNON CLEANUP ATOM 22 OK',
    );

    console.log(
        'Runtime: enemy charge should show only the physical charge effect. No viewscreen frame/countdown. HIT shakes the captain camera; ABSORBED keeps existing shield behavior without shake.',
    );
} catch (error) {
    console.error(
        '\nBRIDGE ENEMY BEAM CANNON CLEANUP ATOM 22 FAILED',
    );

    console.error(error);

    console.error(
        '\nThe patcher was intentionally left on disk for diagnosis.',
    );

    process.exitCode = 1;
}
