import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const rel =
    'tests/engine/encounter/enemy_spam_slowdown.test.ts';
const target = path.join(ROOT, rel);

if (!fs.existsSync(target)) {
    throw new Error(`Missing file: ${rel}`);
}

let source =
    fs.readFileSync(target, 'utf8');

const pattern =
    /\r?\n\s*const missile =\s*\r?\n\s*MISSILES\[\s*MISSILE_ID\.BASIC_00\s*\];/;

const matches =
    source.match(
        new RegExp(
            pattern.source,
            'g',
        ),
    ) ?? [];

if (matches.length !== 1) {
    throw new Error(
        `Expected exactly one unused missile declaration, found ${matches.length}`,
    );
}

source =
    source.replace(
        pattern,
        '',
    );

fs.writeFileSync(
    target,
    source,
    'utf8',
);

console.log(
    'Removed unused missile definition variable.',
);
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('');
console.log(
    'If green: npm test',
);
