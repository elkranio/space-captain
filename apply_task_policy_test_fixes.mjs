// Run from the Space Captain project root:
// node apply_task_policy_test_fixes.mjs

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

function readNormalized(relativePath) {
    const absolutePath = path.join(PROJECT_ROOT, relativePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${relativePath}`);
    }

    const source = fs.readFileSync(absolutePath, 'utf8');

    return {
        absolutePath,
        eol: source.includes('\r\n') ? '\r\n' : '\n',
        source: source.replace(/\r\n/g, '\n'),
    };
}

function writePreservingEol(file, source) {
    const output = file.eol === '\n'
        ? source
        : source.replace(/\n/g, '\r\n');

    fs.writeFileSync(file.absolutePath, output, 'utf8');
}

function replaceRegexExact(source, regex, replacement, expectedCount, label) {
    let count = 0;

    const result = source.replace(regex, (...args) => {
        count += 1;

        return typeof replacement === 'function'
            ? replacement(...args)
            : replacement;
    });

    if (count !== expectedCount) {
        throw new Error(
            `${label}: expected ${expectedCount} replacement(s), received ${count}`,
        );
    }

    return result;
}

function updateEngineerShieldTest() {
    const relativePath =
        'tests/engine/encounter/engineer_deploy_shield_command.test.ts';

    const file = readNormalized(relativePath);

    const source = replaceRegexExact(
        file.source,
        /^(\s*)label: `SHIELD \$\{zone\.toUpperCase\(\)\}`,\n\1showProgress: true,\n\n\1durationMs: 2000,/gm,
        (
            _match,
            indent,
        ) => [
            `${indent}label: \`SHIELD \${zone.toUpperCase()}\`,`,
            `${indent}showProgress: true,`,
            '',
            `${indent}canBeCancelledByPlayer: true,`,
            `${indent}canBeInterruptedByDamage: true,`,
            '',
            `${indent}durationMs: 2000,`,
        ].join('\n'),
        1,
        relativePath,
    );

    writePreservingEol(file, source);
}

function updateScienceIdentifyTest() {
    const relativePath =
        'tests/engine/encounter/science_identify_threat.test.ts';

    const file = readNormalized(relativePath);

    const source = replaceRegexExact(
        file.source,
        /^(\s*)label: 'IDENTIFY',\n\1showProgress: true,\n\1durationMs: 3000,/gm,
        (
            _match,
            indent,
        ) => [
            `${indent}label: 'IDENTIFY',`,
            `${indent}showProgress: true,`,
            '',
            `${indent}canBeCancelledByPlayer: true,`,
            `${indent}canBeInterruptedByDamage: true,`,
            '',
            `${indent}durationMs: 3000,`,
        ].join('\n'),
        4,
        relativePath,
    );

    writePreservingEol(file, source);
}

function updateWeaponsPointDefenseTest() {
    const relativePath =
        'tests/engine/encounter/weapons_point_defense_command.test.ts';

    const file = readNormalized(relativePath);

    let source = replaceRegexExact(
        file.source,
        /^(\s*)label: 'PD AIM',\n\1showProgress: true,\n\1durationMs: 3000,/gm,
        (
            _match,
            indent,
        ) => [
            `${indent}label: 'PD AIM',`,
            `${indent}showProgress: true,`,
            '',
            `${indent}canBeCancelledByPlayer: true,`,
            `${indent}canBeInterruptedByDamage: true,`,
            '',
            `${indent}durationMs: 3000,`,
        ].join('\n'),
        5,
        `${relativePath}: task policy snapshots`,
    );

    source = replaceRegexExact(
        source,
        /^(\s*)outcome: OFFICER_TASK_OUTCOME\.COMPLETED,\n(\s*)},$/gm,
        (
            _match,
            outcomeIndent,
            closingIndent,
        ) => [
            `${outcomeIndent}outcome: OFFICER_TASK_OUTCOME.COMPLETED,`,
            `${outcomeIndent}result: undefined,`,
            `${closingIndent}},`,
        ].join('\n'),
        1,
        `${relativePath}: undefined task result`,
    );

    writePreservingEol(file, source);
}

try {
    updateEngineerShieldTest();
    updateScienceIdentifyTest();
    updateWeaponsPointDefenseTest();

    console.log('Updated test expectations:');
    console.log(
        '- tests/engine/encounter/engineer_deploy_shield_command.test.ts',
    );
    console.log(
        '- tests/engine/encounter/science_identify_threat.test.ts',
    );
    console.log(
        '- tests/engine/encounter/weapons_point_defense_command.test.ts',
    );
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
}
