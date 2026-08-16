import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPECTED_HEAD =
    'dcc710451cc1f7c495a21d136e6b0211effbbb4b';

const SELF_PATH = fileURLToPath(import.meta.url);
const ROOT = process.cwd();

const MANAGER_PATH =
    'src/app/scenes/game/bridge/view/combat/incoming_missiles/BridgeIncomingMissilesView.ts';

const LEAF_PATH =
    'src/app/scenes/game/bridge/view/combat/incoming_missiles/missile/BridgeIncomingMissileView.ts';

const PRESENTATION_PATH =
    'src/app/scenes/game/bridge/view/combat/incoming_missiles/missile/bridge_incoming_missile_presentation.ts';

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
    const filePath = absolute(relativePath);

    if (!fs.existsSync(filePath)) {
        fail(`Expected file missing: ${relativePath}`);
    }

    return fs
        .readFileSync(filePath, 'utf8')
        .replace(/\r\n/g, '\n');
}

function countOccurrences(text, token) {
    let count = 0;
    let cursor = 0;

    while (true) {
        const index = text.indexOf(token, cursor);

        if (index === -1) {
            return count;
        }

        count += 1;
        cursor = index + token.length;
    }
}

function assertRecoveryState() {
    const head = runCapture(
        'git',
        ['rev-parse', 'HEAD'],
    );

    if (head !== EXPECTED_HEAD) {
        fail(
            `Unexpected HEAD.\nExpected: ${EXPECTED_HEAD}\nActual:   ${head}`,
        );
    }

    const trackedStatus = runCapture(
        'git',
        ['status', '--porcelain', '--untracked-files=no'],
    );

    const trackedLines = trackedStatus
        ? trackedStatus.split(/\r?\n/)
        : [];

    const allowedTracked = new Set([
        ` M ${MANAGER_PATH}`,
        ` M ${LEAF_PATH}`,
    ]);

    for (const line of trackedLines) {
        if (!allowedTracked.has(line)) {
            fail(
                'Unexpected tracked dirty path during atom 18 recovery:\n' +
                trackedStatus,
            );
        }
    }

    if (trackedLines.length !== 2) {
        fail(
            'Atom 18 recovery expected exactly the manager and missile leaf to be modified.\n' +
            `Actual tracked status:\n${trackedStatus || '(clean)'}`,
        );
    }

    if (!fs.existsSync(absolute(PRESENTATION_PATH))) {
        fail(
            `Expected atom 18 presentation file is missing: ${PRESENTATION_PATH}`,
        );
    }

    console.log(
        'Atom 18 partial-apply recovery state confirmed',
    );
}

function assertManager() {
    const manager = readText(MANAGER_PATH);

    for (const stale of [
        `import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';`,
        'INCOMING_MISSILE_IMPACT_AREA',
        'designation: payload.designation,',
        'targetPosition: this.createImpactPosition()',
        'createImpactPosition(): Phaser.Math.Vector2',
        'update.identificationStatus',
    ]) {
        if (manager.includes(stale)) {
            fail(
                `Recovery guard failed: legacy manager token remains: ${stale}`,
            );
        }
    }

    for (const required of [
        `projectileId:
                payload.projectileId,`,
        `missile.update(
                update.timeToImpactMs,
            );`,
        `targetPosition: missile.getPosition(),`,
    ]) {
        if (!manager.includes(required)) {
            fail(
                `Recovery guard failed: manager token missing: ${required}`,
            );
        }
    }

    if (
        countOccurrences(
            manager,
            'targetPosition:',
        ) !== 1
    ) {
        fail(
            'Recovery guard failed: manager must contain exactly one targetPosition:, owned by Defense Turret beam VFX',
        );
    }
}

function assertLeaf() {
    const leaf = readText(LEAF_PATH);

    for (const stale of [
        'MISSILE_SPRITE_ID',
        'MISSILE_SPRITES',
        'TARGETING_FRAME',
        'BitmapText',
        'statusLabel',
        'designation',
        'getQuantizedProgress',
        'getQuadraticBezierPosition',
        'framesPerSecond',
        'controlPosition',
    ]) {
        if (leaf.includes(stale)) {
            fail(
                `Recovery guard failed: legacy leaf token remains: ${stale}`,
            );
        }
    }

    for (const required of [
        'projectileId: string;',
        'private readonly trajectoryPoints:',
        'private readonly trailPoints:',
        'private getTimeProgress(',
        'private mapTimeToPathProgress(',
        'private createTrajectoryPoints(',
        'private createJitteredPoint(',
        'private getTrajectoryPoint(',
        'private catmullRom(',
        'this.initialTimeToImpactMs',
    ]) {
        if (!leaf.includes(required)) {
            fail(
                `Recovery guard failed: new leaf token missing: ${required}`,
            );
        }
    }
}

function assertPresentation() {
    const presentation =
        readText(PRESENTATION_PATH);

    for (const required of [
        'trajectories: [',
        'firstWaypointPx: 4,',
        'waypointPx: 10,',
        'endPx: 5,',
        'terminalStartTimeProgress: 0.90,',
        'terminalStartPathProgress: 0.62,',
        'cruiseLinearWeight: 0.42,',
        'terminalLinearWeight: 0.392,',
        'coreColor: 0xf7fbff,',
        'minParticleSpacingPx: 2,',
    ]) {
        if (!presentation.includes(required)) {
            fail(
                `Recovery guard failed: presentation token missing: ${required}`,
            );
        }
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
    assertRecoveryState();
    assertManager();
    assertLeaf();
    assertPresentation();
    validate();

    fs.unlinkSync(SELF_PATH);

    console.log(
        '\nBRIDGE INCOMING MISSILE PRODUCTION REWRITE RECOVERY ATOM 18B OK',
    );

    console.log(
        'No source rewrite was needed: atom 18 had already applied successfully; only its original post-guard was incorrect.',
    );
} catch (error) {
    console.error(
        '\nBRIDGE INCOMING MISSILE PRODUCTION REWRITE RECOVERY ATOM 18B FAILED',
    );

    console.error(error);

    console.error(
        '\nThe recovery patcher was intentionally left on disk for diagnosis.',
    );

    process.exitCode = 1;
}
