import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPECTED_HEAD =
    '6434460d050165c2cfdfe6860196c8ef2635df29';

const SELF_PATH = fileURLToPath(import.meta.url);
const ROOT = process.cwd();

const CONFIG_PATH =
    'src/app/scenes/game/bridge/debug_view/bridge_missile_debug_config.ts';

const VIEW_PATH =
    'src/app/scenes/game/bridge/debug_view/BridgeMissileDebugView.ts';

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
        fail(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
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

    return fs.readFileSync(filePath, 'utf8');
}

function normalizeLf(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n*$/, '\n');
}

function writePreservingEol(relativePath, lfText, originalText) {
    const filePath = absolute(relativePath);
    const eol = originalText.includes('\r\n') ? '\r\n' : '\n';

    const normalized = normalizeLf(lfText);

    fs.writeFileSync(
        filePath,
        normalized.replace(/\n/g, eol),
        'utf8',
    );
}

function replaceExactlyOnce(text, before, after, label) {
    const first = text.indexOf(before);

    if (first === -1) {
        fail(`Expected source fragment missing: ${label}`);
    }

    if (text.indexOf(before, first + before.length) !== -1) {
        fail(`Expected source fragment is not unique: ${label}`);
    }

    return (
        text.slice(0, first) +
        after +
        text.slice(first + before.length)
    );
}

function assertPreconditions() {
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

    if (trackedStatus) {
        fail(
            'Tracked worktree must be clean before applying this atom:\n' +
            trackedStatus,
        );
    }

    const config = normalizeLf(
        readText(CONFIG_PATH),
    );

    for (const token of [
        'forwardAngleOffsetDeg: 180,',
        'terminalYawDeg: 82,',
        'terminalPitchDeg: -6,',
        'terminalScaleStartPathProgress: 0.62,',
    ]) {
        if (!config.includes(token)) {
            fail(
                `Expected pre-heading config token missing: ${token}`,
            );
        }
    }

    const view = normalizeLf(
        readText(VIEW_PATH),
    );

    for (const token of [
        'this.missile.angleX =',
        'this.missile.angleY =',
        'this.missile.angleZ =',
        '.terminalPitchDeg',
        '.terminalYawDeg',
    ]) {
        if (!view.includes(token)) {
            fail(
                `Expected pre-heading view token missing: ${token}`,
            );
        }
    }

    console.log('Missile heading-only preflight OK');
}

function patchConfig() {
    const original = readText(CONFIG_PATH);
    let text = normalizeLf(original);

    text = replaceExactlyOnce(
        text,
        `        forwardAngleOffsetDeg: 180,
        terminalYawDeg: 82,
        terminalPitchDeg: -6,`,
        `        // Authored sprite points upward at angle 0.
        // Phaser tangent angle uses +X as zero, so +90 aligns
        // the missile nose with the screen-space path tangent.
        forwardAngleOffsetDeg: 90,`,
        'heading-only missile orientation config',
    );

    writePreservingEol(
        CONFIG_PATH,
        text,
        original,
    );
}

function patchView() {
    const original = readText(VIEW_PATH);
    let text = normalizeLf(original);

    text = replaceExactlyOnce(
        text,
        `        this.missile.angleX =
            Phaser.Math.Linear(
                0,
                BRIDGE_MISSILE_DEBUG_CONFIG.missile.terminalPitchDeg,
                terminalEase,
            );

        this.missile.angleY =
            Phaser.Math.Linear(
                0,
                BRIDGE_MISSILE_DEBUG_CONFIG.missile.terminalYawDeg,
                terminalEase,
            );

        this.missile.angleZ =
            tangentAngleDeg +
            BRIDGE_MISSILE_DEBUG_CONFIG
                .missile
                .forwardAngleOffsetDeg;`,
        `        // Control pass: keep the mesh completely flat.
        // Only solve 2D heading first.
        this.missile.angleX = 0;
        this.missile.angleY = 0;

        this.missile.angleZ =
            tangentAngleDeg +
            BRIDGE_MISSILE_DEBUG_CONFIG
                .missile
                .forwardAngleOffsetDeg;`,
        'flat heading-only missile orientation',
    );

    writePreservingEol(
        VIEW_PATH,
        text,
        original,
    );
}

function postGuards() {
    const config = normalizeLf(
        readText(CONFIG_PATH),
    );

    if (!config.includes('forwardAngleOffsetDeg: 90,')) {
        fail(
            'Post-guard failed: forwardAngleOffsetDeg is not 90',
        );
    }

    for (const stale of [
        'forwardAngleOffsetDeg: 180,',
        'terminalYawDeg:',
        'terminalPitchDeg:',
    ]) {
        if (config.includes(stale)) {
            fail(
                `Post-guard failed: stale orientation config remains: ${stale}`,
            );
        }
    }

    const view = normalizeLf(
        readText(VIEW_PATH),
    );

    for (const token of [
        'this.missile.angleX = 0;',
        'this.missile.angleY = 0;',
        'tangentAngleDeg +',
        '.forwardAngleOffsetDeg;',
    ]) {
        if (!view.includes(token)) {
            fail(`Post-guard failed: ${token}`);
        }
    }

    for (const stale of [
        '.terminalPitchDeg',
        '.terminalYawDeg',
    ]) {
        if (view.includes(stale)) {
            fail(
                `Post-guard failed: stale perspective wiring remains: ${stale}`,
            );
        }
    }
}

function validate() {
    run(
        'git',
        ['-c', 'core.safecrlf=false', 'diff', '--check'],
    );

    runNpm(['run', 'typecheck']);
    runNpm(['test']);
}

try {
    assertPreconditions();
    patchConfig();
    patchView();
    postGuards();
    validate();

    fs.unlinkSync(SELF_PATH);

    console.log('\nBRIDGE MISSILE HEADING-ONLY ATOM 09 OK');
    console.log(
        'Runtime: press M. Ignore perspective completely; verify only that the red nose follows the path tangent.',
    );
} catch (error) {
    console.error('\nBRIDGE MISSILE HEADING-ONLY ATOM 09 FAILED');
    console.error(error);
    console.error(
        '\nThe patcher was intentionally left on disk for diagnosis.',
    );
    process.exitCode = 1;
}
