import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const SELF = fileURLToPath(import.meta.url);

function fail(message) {
    throw new Error(message);
}

function abs(rel) {
    return path.join(ROOT, rel);
}

function read(rel) {
    const target = abs(rel);

    if (!fs.existsSync(target)) {
        fail(`Missing file: ${rel}`);
    }

    return fs.readFileSync(target, 'utf8');
}

function write(rel, source) {
    fs.writeFileSync(abs(rel), source, 'utf8');
}

const rel =
    'tests/engine/encounter/science_identify_threat.test.ts';

const original = read(rel);
const eol =
    original.includes('\r\n')
        ? '\r\n'
        : '\n';

let source =
    original.replace(/\r\n/g, '\n');

// Add the existing mutable-state test seam.
if (
    !source.includes(
        "from './get_mutable_encounter_state_for_test';",
    )
) {
    const anchor =
`import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
`;

    if (!source.includes(anchor)) {
        fail(
            'Cannot find science test import insertion anchor',
        );
    }

    source =
        source.replace(
            anchor,
            anchor +
`import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';
`,
        );
}

const testTitle =
    "it('offers IDENTIFY THREAT again for uncertain missile intel'";

if (!source.includes(testTitle)) {
    const insertBefore =
`    it('does not offer IDENTIFY THREAT for a laser without identifiable intel', () => {
`;

    if (!source.includes(insertBefore)) {
        fail(
            'Cannot find Science laser-test insertion anchor',
        );
    }

    const contractTest =
`    it('offers IDENTIFY THREAT again for uncertain missile intel', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const nodeEnemy =
            ShipNodeActorFactory.create({
                id: 'ship_enemy_00',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_GENERIC_00,

                anchorId:
                    stationId,
            });

        const nodeLauncher =
            nodeEnemy.weapons[0];

        if (
            nodeLauncher.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected enemy missile launcher',
            );
        }

        nodeLauncher.ammoCount = 1;
        node.actors.push(nodeEnemy);

        const engine =
            new EncounterEngine({
                playerHull:
                    createPlayerHullFixture(),

                drive:
                    createShipDriveFixture(),

                node,

                navigation: {
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND
                            .ANCHORED,

                    anchorId:
                        stationId,
                },

                random:
                    () => 0,
            });

        engine.drainEvents();

        engine.step(1);
        engine.drainEvents();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS -
                1,
        );
        engine.drainEvents();

        const state =
            getMutableEncounterStateForTest(
                engine,
            );

        const projectile =
            state.combat
                .projectiles[0];

        if (!projectile) {
            throw new Error(
                'Expected incoming missile projectile',
            );
        }

        projectile.identification = {
            status:
                MISSILE_SIGNATURE_INTEL_STATUS
                    .UNCERTAIN,

            hypothesis:
                MISSILE_SIGNATURE.B,
        };

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.SCIENCE,
                )
                .find((command) => {
                    return (
                        command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .SCIENCE_IDENTIFY_THREAT &&
                        command.target.kind ===
                            OFFICER_COMMAND_TARGET_KIND
                                .THREAT &&
                        command.target.threatId ===
                            projectile.id
                    );
                }),
        ).toBeDefined();
    });

`;

    source =
        source.replace(
            insertBefore,
            contractTest + insertBefore,
        );
}

// Contract guards.
if (
    !source.includes(
        'MISSILE_SIGNATURE_INTEL_STATUS\n                    .UNCERTAIN',
    )
) {
    fail(
        'UNCERTAIN contract test was not inserted',
    );
}

if (
    !source.includes(
        "it('offers IDENTIFY THREAT again for uncertain missile intel'",
    )
) {
    fail(
        'UNCERTAIN retry test is missing',
    );
}

// The existing main test must continue to cover CONFIRMED terminal behavior.
const confirmedStateIndex =
    source.indexOf(
        'status: MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED',
    );

const terminalExpectationIndex =
    source.indexOf(
        ').toBeUndefined();',
        confirmedStateIndex,
    );

if (
    confirmedStateIndex < 0 ||
    terminalExpectationIndex < 0
) {
    fail(
        'Existing CONFIRMED terminal coverage is missing',
    );
}

write(
    rel,
    eol === '\n'
        ? source
        : source.replace(/\n/g, '\r\n'),
);

// Narrow cleanup: only missile-refactor/recovery scripts created by this work.
// Preserve the currently executing script on Windows.
const obsolete =
    fs.readdirSync(ROOT)
        .filter((name) => {
            return (
                /^(?:refactor|recover)_missile_.*\.mjs$/
                    .test(name)
            );
        });

const removed = [];

for (const name of obsolete) {
    const target =
        path.join(ROOT, name);

    if (
        path.resolve(target) ===
        path.resolve(SELF)
    ) {
        continue;
    }

    fs.unlinkSync(target);
    removed.push(name);
}

console.log(
    'Missile intel atom 02 contract test added.',
);

if (removed.length > 0) {
    console.log('');
    console.log(
        'Removed obsolete missile patch scripts:',
    );

    for (const name of removed) {
        console.log('  ' + name);
    }
}

console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('  npm test');
