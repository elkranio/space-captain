import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPECTED_HEAD = '76762bf17eb7f98a8252e89bc6a5732b973a8b90';
const SELF_PATH = fileURLToPath(import.meta.url);
const ROOT = process.cwd();

function fail(message) {
    throw new Error(message);
}

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: options.capture ? 'pipe' : 'inherit',
        ...options,
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        const stdout = result.stdout ?? '';
        const stderr = result.stderr ?? '';
        fail(
            `${command} ${args.join(' ')} failed with exit code ${result.status}` +
                (stdout ? `\nSTDOUT:\n${stdout}` : '') +
                (stderr ? `\nSTDERR:\n${stderr}` : ''),
        );
    }

    return result.stdout ?? '';
}

function runGitGrep(args) {
    const result = spawnSync('git', ['grep', ...args], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'pipe',
    });

    if (result.error) {
        throw result.error;
    }

    // git grep: 0 = matches, 1 = no matches, >1 = actual error.
    if (result.status !== 0 && result.status !== 1) {
        fail(
            `git grep ${args.join(' ')} failed with exit code ${result.status}` +
                (result.stderr ? `\n${result.stderr}` : ''),
        );
    }

    return result.stdout ?? '';
}

function parseGrepOutput(output) {
    const hits = [];

    for (const rawLine of output.split(/\r?\n/)) {
        if (!rawLine) {
            continue;
        }

        const match = rawLine.match(/^([^:]+):(\d+):(.*)$/);
        if (!match) {
            fail(`Unexpected git grep output: ${rawLine}`);
        }

        hits.push({
            file: match[1],
            line: Number(match[2]),
            text: match[3],
        });
    }

    return hits;
}

function scanStaleTerminology() {
    const pdHits = parseGrepOutput(
        runGitGrep(['-n', '-I', '-w', '--', 'PD', '--', '.']),
    );

    const pointDefenseHits = parseGrepOutput(
        runGitGrep([
            '-n',
            '-I',
            '-i',
            '-E',
            '--',
            'point[ _-]*defen[cs]e',
            '--',
            '.',
        ]),
    );

    const unique = new Map();
    for (const hit of [...pdHits, ...pointDefenseHits]) {
        unique.set(`${hit.file}:${hit.line}:${hit.text}`, hit);
    }

    return [...unique.values()].sort((a, b) => {
        if (a.file !== b.file) {
            return a.file.localeCompare(b.file);
        }
        return a.line - b.line;
    });
}

function formatHits(hits) {
    return hits
        .map((hit) => `  - ${hit.file}:${hit.line}: ${hit.text.trim()}`)
        .join('\n');
}

function normalizeSingleEofNewline(text) {
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    return text.replace(/[\r\n]+$/u, '') + eol;
}

function transformTerminology(text) {
    let next = text;

    // Compact player-visible labels first. These must stay short.
    next = next.replace(/\bPD AIM\b/g, 'TURRET AIM');
    next = next.replace(/\bPD 40%/g, 'TURRET 40%');
    next = next.replace(/(['"`])  PD \1/g, '$1  TURRET $1');

    // Known prose where a blind generic acronym replacement would read badly.
    next = next.replace(
        /The old PD\/SHD resource cells are deliberately gone:/g,
        'The old separate turret/shield resource cells are deliberately gone:',
    );
    next = next.replace(
        /defensive PD\/shields\/mine clearing\/SPAM behavior/g,
        'defensive Defense Turret / shields / mine clearing / SPAM behavior',
    );
    next = next.replace(
        /a later shield\/PD consumer from double-claiming/g,
        'a later Shield Generator / Defense Turret consumer from double-claiming',
    );
    next = next.replace(/PD charges/g, 'Defense Turret charges');
    next = next.replace(/Player and enemy PD/g, 'Player and enemy Defense Turrets');
    next = next.replace(/Player PD/g, 'Player Defense Turret');
    next = next.replace(/Enemy PD/g, 'Enemy Defense Turret');
    next = next.replace(/enemy PD/g, 'enemy Defense Turret');
    next = next.replace(/the PD task/g, 'the Defense Turret task');
    next = next.replace(
        /blind PD without Science/g,
        'blind Defense Turret interception without Science',
    );

    // Old full-name forms, including identifier spellings if any survived.
    next = next.replace(/\bPointDefense\b/g, 'DefenseTurret');
    next = next.replace(/\bpointDefense\b/g, 'defenseTurret');
    next = next.replace(/\bPOINT_DEFENSE\b/g, 'DEFENSE_TURRET');
    next = next.replace(/\bpoint_defense\b/g, 'defense_turret');
    next = next.replace(/\bPoint_Defense\b/g, 'Defense_Turret');
    next = next.replace(
        /Point-defense player ship завершил наведение/g,
        'Player Defense Turret завершила наведение',
    );
    next = next.replace(/\bPOINT-DEFENSE\b/g, 'DEFENSE TURRET');
    next = next.replace(/\bpoint-defense\b/g, 'Defense Turret');
    next = next.replace(/\bPoint-defense\b/g, 'Defense Turret');
    next = next.replace(/\bPoint Defense\b/g, 'Defense Turret');
    next = next.replace(/\bpoint defense\b/g, 'Defense Turret');
    next = next.replace(/\bpoint defence\b/g, 'Defense Turret');
    next = next.replace(/\bPoint Defence\b/g, 'Defense Turret');

    // Any remaining standalone legacy acronym in tracked text is this system.
    next = next.replace(/\bPD\b/g, 'Defense Turret');

    return normalizeSingleEofNewline(next);
}

function containsStaleTerminology(text) {
    return (
        /\bPD\b/.test(text) ||
        /point[ _-]*defen[cs]e/i.test(text)
    );
}

function runNpm(args) {
    if (process.platform === 'win32') {
        const comspec = process.env.ComSpec || 'cmd.exe';
        run(comspec, ['/d', '/s', '/c', `npm ${args.join(' ')}`]);
        return;
    }

    run('npm', args);
}

if (!fs.existsSync(path.join(ROOT, '.git'))) {
    fail('Run this script from the Space Captain repository root.');
}

const head = run('git', ['rev-parse', 'HEAD'], { capture: true }).trim();
if (head !== EXPECTED_HEAD) {
    fail(`Unexpected HEAD. Expected ${EXPECTED_HEAD}, received ${head}.`);
}

const trackedStatus = run(
    'git',
    ['status', '--porcelain', '--untracked-files=no'],
    { capture: true },
);
if (trackedStatus.length !== 0) {
    fail(`Tracked worktree is not clean:\n${trackedStatus}`);
}

const staleHits = scanStaleTerminology();
if (staleHits.length === 0) {
    console.log('No tracked PD / Point Defense terminology remains.');
    fs.unlinkSync(SELF_PATH);
    process.exit(0);
}

console.log('Legacy terminology found:');
console.log(formatHits(staleHits));

// Build every changed file in memory first. If even one matched file cannot be
// made clean by the controlled terminology transform, nothing is written.
const files = [...new Set(staleHits.map((hit) => hit.file))];
const nextTexts = new Map();

for (const relativePath of files) {
    const absolutePath = path.join(ROOT, relativePath);
    const currentText = fs.readFileSync(absolutePath, 'utf8');
    const nextText = transformTerminology(currentText);

    if (nextText === currentText) {
        fail(
            `Stale terminology was detected in ${relativePath}, but no safe transform changed the file.`,
        );
    }

    if (containsStaleTerminology(nextText)) {
        fail(
            `Stale terminology would still remain in ${relativePath}; no files were changed.`,
        );
    }

    nextTexts.set(relativePath, nextText);
}

for (const [relativePath, text] of nextTexts) {
    fs.writeFileSync(path.join(ROOT, relativePath), text, 'utf8');
}

const remainingHits = scanStaleTerminology();
if (remainingHits.length > 0) {
    fail(
        'Stale PD / Point Defense terminology remains after cleanup:\n' +
            formatHits(remainingHits),
    );
}

run('git', ['-c', 'core.safecrlf=false', 'diff', '--check']);
runNpm(['run', 'typecheck']);
runNpm(['test']);

console.log('\nDefense Turret terminology cleanup complete.');
console.log('Changed tracked files:');
run('git', ['diff', '--name-only']);

// Successful temporary patchers delete themselves. Failed ones remain.
fs.unlinkSync(SELF_PATH);
