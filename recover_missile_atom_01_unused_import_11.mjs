import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const rel =
    'tests/engine/encounter/enemy_spam_slowdown.test.ts';
const target =
    path.join(ROOT, rel);

if (!fs.existsSync(target)) {
    throw new Error(`Missing file: ${rel}`);
}

let source =
    fs.readFileSync(target, 'utf8');

const pattern =
    /import \{\r?\n\s*MISSILES,\r?\n\} from '\.\.\/\.\.\/\.\.\/src\/engine\/content\/catalogs\/missiles';\r?\n/;

const matches =
    source.match(
        new RegExp(
            pattern.source,
            'g',
        ),
    ) ?? [];

if (matches.length !== 1) {
    throw new Error(
        `Expected exactly one MISSILES import, found ${matches.length}`,
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

console.log('Removed unused MISSILES import.');
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('  npm test');
