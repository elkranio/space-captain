import {
    readFileSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
    fileURLToPath,
} from 'node:url';
import {
    spawnSync,
} from 'node:child_process';
import ts from 'typescript';

const EXPECTED_HEAD =
    '965f9df2a57172447337a799ba349a8b3b52908a';

const repoRoot =
    process.cwd();

const selfPath =
    fileURLToPath(import.meta.url);

const FILES = {
    combatSupport:
        'tests/engine/encounter/combat_test_support.ts',

    gameRuntime:
        'tests/runtime/GameRuntime.test.ts',

    gameRuntimeWeapons:
        'tests/runtime/GameRuntimePlayerShipWeapons.test.ts',

    legacyWeaponMapperTest:
        'tests/app/scenes/game/bridge/player_weapon_status_mapper.test.ts',

    atom11SystemsView:
        'src/app/scenes/game/bridge/view/captain_dashboard/player_ship/systems/BridgePlayerShipSystemsView.ts',

    atom11WeaponMapper:
        'src/app/scenes/game/bridge/controller/player_weapon_status/BridgePlayerWeaponStatusMapper.ts',
};

const EXPECTED_HEAD_BLOBS = {
    [FILES.combatSupport]:
        'fc0148d2ca181ea54cc75045fa6ac68a642332e1',

    [FILES.gameRuntime]:
        '550b3434987e20c6c5fcd3d0ac3486972e3f50de',

    [FILES.gameRuntimeWeapons]:
        '427419d1a90a752c8c76507a6a74577cff6da465',

    [FILES.legacyWeaponMapperTest]:
        '0a5087340f90c40487adba42ded3dd0ad8b98efd',
};

function fail(message) {
    throw new Error(message);
}

function absolute(relativePath) {
    return path.join(
        repoRoot,
        relativePath,
    );
}

function run(
    command,
    args,
) {
    const result =
        spawnSync(
            command,
            args,
            {
                cwd: repoRoot,
                encoding: 'utf8',
                shell: false,
            },
        );

    if (result.status !== 0) {
        fail(
            [
                `Command failed: ${command} ${args.join(' ')}`,
                result.stdout,
                result.stderr,
            ]
                .filter(Boolean)
                .join('\n'),
        );
    }

    return result.stdout;
}

function toLf(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

function getEol(text) {
    return text.includes('\r\n')
        ? '\r\n'
        : '\n';
}

function normalizeForWrite(
    text,
    eol,
) {
    return (
        toLf(text)
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n*$/, '') +
        '\n'
    ).replace(
        /\n/g,
        eol,
    );
}

function replaceOnce(
    text,
    oldText,
    newText,
    label,
) {
    const count =
        text.split(oldText)
            .length - 1;

    if (count !== 1) {
        fail(
            `${label}: expected 1 match, found ${count}.`,
        );
    }

    return text.replace(
        oldText,
        newText,
    );
}

function parseTs(
    fileName,
    text,
) {
    const source =
        ts.createSourceFile(
            fileName,
            text,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );

    if (
        source.parseDiagnostics.length >
        0
    ) {
        fail(
            [
                `TypeScript parse failed: ${fileName}`,
                ...source
                    .parseDiagnostics
                    .map((diagnostic) =>
                        ts.flattenDiagnosticMessageText(
                            diagnostic.messageText,
                            '\n',
                        ),
                    ),
            ].join('\n'),
        );
    }
}

const head =
    run(
        'git',
        [
            'rev-parse',
            'HEAD',
        ],
    ).trim();

if (head !== EXPECTED_HEAD) {
    fail(
        `HEAD mismatch. Expected ${EXPECTED_HEAD}, got ${head}.`,
    );
}

// Recovery patch: Atom 11 is intentionally dirty.
// Guard only the files this recovery edits.
for (
    const [
        relativePath,
        expectedBlob,
    ] of Object.entries(
        EXPECTED_HEAD_BLOBS,
    )
) {
    const headBlob =
        run(
            'git',
            [
                'rev-parse',
                `HEAD:${relativePath}`,
            ],
        ).trim();

    if (headBlob !== expectedBlob) {
        fail(
            `Unexpected HEAD blob for ${relativePath}. ` +
                `Expected ${expectedBlob}, got ${headBlob}.`,
        );
    }

    const localBlob =
        run(
            'git',
            [
                'hash-object',
                relativePath,
            ],
        ).trim();

    if (localBlob !== expectedBlob) {
        fail(
            `Recovery target already has local edits: ${relativePath}.`,
        );
    }
}

// Verify the actual Atom 11 dirty state is present before touching tests.
{
    const systemsView =
        toLf(
            readFileSync(
                absolute(
                    FILES.atom11SystemsView,
                ),
                'utf8',
            ),
        );

    if (
        !systemsView.includes(
            '../../../../../../../../engine/defs/ship_weapon',
        ) ||
        !systemsView.includes(
            'SHIP_WEAPON_KIND',
        )
    ) {
        fail(
            'Expected fixed Atom 11 dynamic systems view is not present.',
        );
    }

    const weaponMapper =
        toLf(
            readFileSync(
                absolute(
                    FILES.atom11WeaponMapper,
                ),
                'utf8',
            ),
        );

    if (
        !weaponMapper.includes(
            'weapon.id',
        ) ||
        !weaponMapper.includes(
            'weapon.weaponId',
        ) ||
        !weaponMapper.includes(
            '.map(',
        )
    ) {
        fail(
            'Expected Atom 11 array weapon mapper is not present.',
        );
    }
}

const staged =
    new Map();

const eols =
    new Map();

function stage(
    relativePath,
    transform,
) {
    const original =
        readFileSync(
            absolute(relativePath),
            'utf8',
        );

    eols.set(
        relativePath,
        getEol(original),
    );

    const next =
        transform(
            toLf(original),
        );

    parseTs(
        relativePath,
        next,
    );

    staged.set(
        relativePath,
        next,
    );
}

// 1. Combat tests own a stable combat scenario.
// Debug Start is designer-editable content and must not be their fixture.
stage(
    FILES.combatSupport,
    (text) => {
        let next =
            replaceOnce(
                text,
`import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';`,
`import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createStationAndBeaconNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import {
    SHIELD_GENERATOR_ID,
} from '../../../src/engine/defs/shield_generator';`,
                'combat support fixture imports',
            );

        next =
            replaceOnce(
                next,
`import {
    SHIP_WEAPON_KIND,
    type BeamCannonState,
    type MissileLauncherState,
    type SpamProjectorState,
    type StickyMineDispenserState,
} from '../../../src/engine/defs/ship_weapon';`,
`import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    type BeamCannonState,
    type MissileLauncherState,
    type ShipWeaponState,
    type SpamProjectorState,
    type StickyMineDispenserState,
} from '../../../src/engine/defs/ship_weapon';`,
                'combat support weapon imports',
            );

        next =
            replaceOnce(
                next,
`import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';`,
`import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import PowerCoreFactory from '../../../src/engine/generation/ship_system/PowerCoreFactory';
import ShieldGeneratorFactory from '../../../src/engine/generation/ship_system/ShieldGeneratorFactory';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import BeamCannonFactory from '../../../src/engine/generation/ship_weapon/BeamCannonFactory';
import MissileLauncherFactory from '../../../src/engine/generation/ship_weapon/MissileLauncherFactory';
import SpamProjectorFactory from '../../../src/engine/generation/ship_weapon/SpamProjectorFactory';
import StickyMineDispenserFactory from '../../../src/engine/generation/ship_weapon/StickyMineDispenserFactory';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';`,
                'combat support factories',
            );

        const oldSetup =
`    const run =
        createNewRunState();

    const startNode =
        run.universe.nodes.find((node) => {
            return node.id === 'node_start';
        });

    if (!startNode) {
        throw new Error(
            'Expected new-game start node',
        );
    }

    const engine =
        new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            node:
                startNode,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    startNode
                        .arrivalAnchorId,
            },

            drive:
                run.player.ship.drive,
            powerCore:
                run.player.ship
                    .powerCore,

            shieldGenerator:
                run.player.ship
                    .shieldGenerator,

            weapons:
                run.player.ship
                    .weapons,

            random:
                options.random,
        });`;

        const newSetup =
`    const {
        node,
        beaconId,
    } =
        createStationAndBeaconNodeFixture();

    node.actors.push(
        ShipNodeActorFactory.create({
            id:
                'ship_generic_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_DEFENSE_SANDBOX_00,

            anchorId:
                beaconId,
        }),
    );

    const engine =
        new EncounterEngine({
            playerHull:
                createPlayerHullFixture(),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    beaconId,
            },

            drive:
                createShipDriveFixture({
                    id:
                        'drive_player_00',
                }),

            powerCore:
                PowerCoreFactory.create({
                    id:
                        'power_core_player_00',

                    powerCoreId:
                        POWER_CORE_ID
                            .BASIC_00,
                }),

            shieldGenerator:
                ShieldGeneratorFactory.create({
                    id:
                        'shield_generator_player_00',

                    shieldGeneratorId:
                        SHIELD_GENERATOR_ID
                            .BASIC_00,
                }),

            weapons:
                createCanonicalPlayerCombatWeapons(),

            random:
                options.random,
        });`;

        next =
            replaceOnce(
                next,
                oldSetup,
                newSetup,
                'canonical combat setup',
            );

        const insertionAnchor =
`export function getPlayerWeaponOrThrow(
`;

        const helper =
`function createCanonicalPlayerCombatWeapons():
    ShipWeaponState[] {
    return [
        BeamCannonFactory.create({
            id:
                'beam_cannon_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .BEAM_CANNON_00,
        }),

        MissileLauncherFactory.create({
            id:
                'missile_launcher_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .MISSILE_LAUNCHER_00,
        }),

        StickyMineDispenserFactory.create({
            id:
                'sticky_mine_dispenser_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .STICKY_MINE_DISPENSER_00,
        }),

        SpamProjectorFactory.create({
            id:
                'spam_projector_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .SPAM_PROJECTOR_00,
        }),
    ];
}

`;

        next =
            replaceOnce(
                next,
                insertionAnchor,
                helper + insertionAnchor,
                'canonical combat weapon helper',
            );

        return next;
    },
);

// 2. GameRuntime initialization follows current Debug Start content.
// It must not freeze an old designer loadout in the test.
stage(
    FILES.gameRuntime,
    (text) => {
        let next =
            replaceOnce(
                text,
`import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../src/engine/defs/defense_turret';`,
`import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import {
    DEBUG_START,
} from '../../src/engine/content/catalogs/debug_start';`,
                'GameRuntime Debug Start import',
            );

        next =
            replaceOnce(
                next,
`import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';
import {
    SHIELD_GENERATOR_ID,
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../src/engine/defs/shield_generator';
`,
``,
                'remove stale GameRuntime weapon/shield imports',
            );

        const describeStart =
            next.indexOf(
                "describe('GameRuntime player ship hull'",
            );

        const nextDescribe =
            next.indexOf(
                "describe('GameRuntime player drive'",
            );

        if (
            describeStart < 0 ||
            nextDescribe < 0 ||
            nextDescribe <= describeStart
        ) {
            fail(
                'Could not locate GameRuntime player hull describe block.',
            );
        }

        const replacement =
`describe('GameRuntime player ship hull', () => {
    it('creates a new run from current Debug Start hardware', () => {
        const runtime =
            new GameRuntime();

        const ship =
            runtime
                .getCurrentRun()
                .player
                .ship;

        expect(ship.hull).toBe(
            DEBUG_START.player
                .maxHull,
        );

        expect(ship.maxHull).toBe(
            DEBUG_START.player
                .maxHull,
        );

        expect(
            ship.drive.driveId,
        ).toBe(
            DEBUG_START.player
                .driveId,
        );

        expect(
            ship.powerCore.powerCoreId,
        ).toBe(
            DEBUG_START.player
                .powerCoreId,
        );

        expect(
            ship.shieldGenerator
                .shieldGeneratorId,
        ).toBe(
            DEBUG_START.player
                .shieldGeneratorId,
        );

        expect(
            ship.defenseTurret
                .defenseTurretId,
        ).toBe(
            DEBUG_START.player
                .defenseTurretId,
        );

        expect(
            ship.weapons.map(
                (weapon) =>
                    weapon.weaponId,
            ),
        ).toEqual([
            DEBUG_START.player
                .weaponSlot1Id,
            DEBUG_START.player
                .weaponSlot2Id,
            DEBUG_START.player
                .weaponSlot3Id,
            DEBUG_START.player
                .weaponSlot4Id,
        ]);

        expect(
            new Set(
                ship.weapons.map(
                    (weapon) =>
                        weapon.id,
                ),
            ).size,
        ).toBe(
            ship.weapons.length,
        );
    });

    it('persists an exact player hull snapshot without replacing ship hardware', () => {
        const runtime =
            new GameRuntime();

        const ship =
            runtime
                .getCurrentRun()
                .player
                .ship;

        const weapons =
            ship.weapons;

        runtime.setPlayerShipHull(
            2,
        );

        expect(ship.hull).toBe(2);

        runtime.setPlayerShipHull(
            0,
        );

        expect(ship.hull).toBe(0);
        expect(ship.weapons).toBe(
            weapons,
        );
    });

    it('rejects a player hull snapshot outside its installed maximum', () => {
        const runtime =
            new GameRuntime();

        const maxHull =
            runtime
                .getCurrentRun()
                .player
                .ship
                .maxHull;

        expect(() => {
            runtime.setPlayerShipHull(
                -1,
            );
        }).toThrow(
            'Player ship hull must be in [0, maxHull]: -1/' +
                maxHull,
        );

        const aboveMax =
            maxHull + 1;

        expect(() => {
            runtime.setPlayerShipHull(
                aboveMax,
            );
        }).toThrow(
            'Player ship hull must be in [0, maxHull]: ' +
                aboveMax +
                '/' +
                maxHull,
        );
    });
});

`;

        next =
            next.slice(
                0,
                describeStart,
            ) +
            replacement +
            next.slice(
                nextDescribe,
            );

        return next;
    },
);

// 3. Weapon persistence tests also follow arbitrary Debug Start loadouts.
stage(
    FILES.gameRuntimeWeapons,
    (text) => {
        let next =
            replaceOnce(
                text,
`import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import {
    SHIP_WEAPONS,
} from '../../src/engine/content/catalogs/ship_weapons';`,
`import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import {
    DEBUG_START,
} from '../../src/engine/content/catalogs/debug_start';`,
                'GameRuntime weapon Debug Start import',
            );

        next =
            replaceOnce(
                next,
`    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,`,
`    SHIP_WEAPON_ID,
    SHIP_WEAPON_PHASE,`,
                'remove stale weapon kind import',
            );

        const firstTestStart =
            next.indexOf(
                "    it('creates a fully loaded starter missile launcher'",
            );

        const secondTestStart =
            next.indexOf(
                "    it('persists a detached mutable weapon-state snapshot'",
            );

        if (
            firstTestStart < 0 ||
            secondTestStart < 0 ||
            secondTestStart <= firstTestStart
        ) {
            fail(
                'Could not locate first GameRuntime weapon test.',
            );
        }

        const firstReplacement =
`    it('creates the configured Debug Start weapon slots with unique runtime ids', () => {
        const runtime =
            new GameRuntime();

        const weapons =
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons;

        expect(
            weapons.map(
                (weapon) =>
                    weapon.weaponId,
            ),
        ).toEqual([
            DEBUG_START.player
                .weaponSlot1Id,
            DEBUG_START.player
                .weaponSlot2Id,
            DEBUG_START.player
                .weaponSlot3Id,
            DEBUG_START.player
                .weaponSlot4Id,
        ]);

        expect(
            new Set(
                weapons.map(
                    (weapon) =>
                        weapon.id,
                ),
            ).size,
        ).toBe(
            weapons.length,
        );

        for (
            const weapon of
            weapons
        ) {
            expect(weapon).toMatchObject({
                phase:
                    SHIP_WEAPON_PHASE
                        .READY,

                phaseElapsedMs: 0,
            });
        }
    });

`;

        next =
            next.slice(
                0,
                firstTestStart,
            ) +
            firstReplacement +
            next.slice(
                secondTestStart,
            );

        const oldReplacement =
`                                weaponId:
                                    SHIP_WEAPON_ID
                                        .MISSILE_LAUNCHER_00,`;

        const newReplacement =
`                                weaponId:
                                    weapon.weaponId ===
                                    SHIP_WEAPON_ID
                                        .MISSILE_LAUNCHER_00
                                        ? SHIP_WEAPON_ID
                                              .BEAM_CANNON_00
                                        : SHIP_WEAPON_ID
                                              .MISSILE_LAUNCHER_00,`;

        next =
            replaceOnce(
                next,
                oldReplacement,
                newReplacement,
                'dynamic different weapon definition',
            );

        return next;
    },
);

// 4. One old app test still asserted the pre-Atom-11 singleton payload.
stage(
    FILES.legacyWeaponMapperTest,
    (text) => {
        return replaceOnce(
            text,
`                ).toEqual({
                    spamProjector: {
                        phase:
                            SHIP_WEAPON_PHASE
                                .CHANNELING,

                        initialPhaseMs:
                            definition
                                .channelDurationMs,

                        remainingPhaseMs:
                            definition
                                .channelDurationMs -
                            elapsedMs,
                    },
                });`,
`                ).toEqual([
                    {
                        id:
                            'player_spam_status_test',

                        weaponId:
                            SHIP_WEAPON_ID
                                .SPAM_PROJECTOR_00,

                        kind:
                            SHIP_WEAPON_KIND
                                .SPAM_PROJECTOR,

                        phase:
                            SHIP_WEAPON_PHASE
                                .CHANNELING,

                        initialPhaseMs:
                            definition
                                .channelDurationMs,

                        remainingPhaseMs:
                            definition
                                .channelDurationMs -
                            elapsedMs,
                    },
                ]);`,
            'legacy singleton bridge mapper expectation',
        );
    },
);

// Postguards before writes.
{
    const support =
        staged.get(
            FILES.combatSupport,
        );

    if (
        !support ||
        support.includes(
            'createNewRunState',
        ) ||
        !support.includes(
            'createCanonicalPlayerCombatWeapons',
        ) ||
        !support.includes(
            'createStationAndBeaconNodeFixture',
        )
    ) {
        fail(
            'Combat test support is still coupled to Debug Start/new-run state.',
        );
    }

    const runtimeTest =
        staged.get(
            FILES.gameRuntime,
        );

    if (
        !runtimeTest ||
        !runtimeTest.includes(
            'DEBUG_START',
        ) ||
        runtimeTest.includes(
            'beam_cannon_player_00',
        )
    ) {
        fail(
            'GameRuntime test still freezes the old designer loadout.',
        );
    }

    const mapperTest =
        staged.get(
            FILES.legacyWeaponMapperTest,
        );

    if (
        !mapperTest ||
        mapperTest.includes(
            'spamProjector: {',
        )
    ) {
        fail(
            'Legacy bridge mapper singleton expectation remains.',
        );
    }
}

// Write only after all transforms + parse checks succeed.
for (
    const [
        relativePath,
        content,
    ] of staged
) {
    writeFileSync(
        absolute(
            relativePath,
        ),
        normalizeForWrite(
            content,
            eols.get(
                relativePath,
            ) ?? '\n',
        ),
        'utf8',
    );
}

const diffCheck =
    spawnSync(
        'git',
        [
            '-c',
            'core.safecrlf=false',
            'diff',
            '--check',
        ],
        {
            cwd: repoRoot,
            encoding: 'utf8',
            shell: false,
        },
    );

if (
    diffCheck.status !== 0
) {
    fail(
        [
            'git diff --check failed.',
            diffCheck.stdout,
            diffCheck.stderr,
        ]
            .filter(Boolean)
            .join('\n'),
    );
}

console.log(
    [
        'Tests decoupled from editable Debug Start.',
        '',
        '- combat tests now own a canonical player + enemy combat scenario',
        '- GameRuntime tests follow the current Debug Start config',
        '- weapon persistence test no longer assumes a specific first weapon',
        '- remaining old bridge singleton mapper expectation migrated',
        '',
        'Run:',
        '  npm run typecheck',
        '  npm test',
    ].join('\n'),
);

unlinkSync(
    selfPath,
);
