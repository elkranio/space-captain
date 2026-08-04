// apply_enemy_shield_timing_wiggle_atom_09b.mjs
//
// Adds a stable per-laser impact reserve to enemy shield timing.
//
// One reserve is rolled per active laser observation and remembered until
// Engineer commits to deployment. This prevents frame-by-frame rerolls and
// avoids the visible "every laser hits an already blinking shield" pattern.
//
// Safe window remains strict:
// - too early: wait;
// - too late to finish deployment: do not start.
//
// Presentation code is not modified.

import fs from 'node:fs';
import path from 'node:path';
import {
    execFileSync,
} from 'node:child_process';

const ROOT = process.cwd();

const EXPECTED_HEAD =
    '1d8fb772653edcb25317adb1fd9259a32fbc3d02';

const SELF_NAME =
    'apply_enemy_shield_timing_wiggle_atom_09b.mjs';

const SELF =
    path.resolve(
        ROOT,
        SELF_NAME,
    );

const FILES = {
    shields:
        'src/engine/content/rules/shields.ts',

    policy:
        'src/engine/encounter/combat/EnemyDecisionPolicy.ts',

    combatSupport:
        'tests/engine/encounter/combat_test_support.ts',

    shieldTest:
        'tests/engine/encounter/enemy_directional_shield.test.ts',
};

function fail(
    message,
) {
    throw new Error(message);
}

function git(
    ...args
) {
    return execFileSync(
        'git',
        args,
        {
            cwd: ROOT,
            encoding: 'utf8',
        },
    ).trim();
}

function absolute(
    relativePath,
) {
    return path.resolve(
        ROOT,
        relativePath,
    );
}

function read(
    relativePath,
) {
    return fs.readFileSync(
        absolute(relativePath),
        'utf8',
    );
}

function normalize(
    content,
) {
    return content.replace(
        /\r\n/g,
        '\n',
    );
}

function restoreEol(
    content,
    original,
) {
    return original.includes(
        '\r\n',
    )
        ? content.replace(
              /\n/g,
              '\r\n',
          )
        : content;
}

function replaceExactlyOnce(
    content,
    before,
    after,
    label,
) {
    const count =
        content.split(before).length -
        1;

    if (count !== 1) {
        fail(
            label +
                ': expected exactly one anchor, found ' +
                count,
        );
    }

    return content.replace(
        before,
        after,
    );
}

function assertRepositoryState() {
    const head =
        git(
            'rev-parse',
            'HEAD',
        );

    if (
        head !==
        EXPECTED_HEAD
    ) {
        fail(
            'Unexpected HEAD. Expected ' +
                EXPECTED_HEAD +
                ', received ' +
                head,
        );
    }

    for (
        const relativePath of
        Object.values(FILES)
    ) {
        if (
            !fs.existsSync(
                absolute(
                    relativePath,
                ),
            )
        ) {
            fail(
                'Required file is missing: ' +
                    relativePath,
            );
        }
    }

    const policy =
        read(FILES.policy);

    if (
        !policy.includes(
            'selectShieldDeployment(',
        ) ||
        !policy.includes(
            'SHIP_SHIELD_DURATION_MS',
        )
    ) {
        fail(
            'Atom 08 enemy shield policy is missing',
        );
    }

    if (
        policy.includes(
            'shieldImpactReserveMsByThreat',
        )
    ) {
        fail(
            'Enemy shield timing wiggle is already applied',
        );
    }
}

function transformShields(
    original,
) {
    let content =
        normalize(original);

    content =
        replaceExactlyOnce(
            content,

            `export const SHIP_SHIELD_DURATION_MS = 5000;

`,

            `export const SHIP_SHIELD_DURATION_MS = 5000;

// Desired field lifetime still remaining when the incoming player laser hits.
//
// A value above the final-second warning threshold keeps normal interceptions
// from always landing on an already blinking shield. The range also prevents
// every enemy from revealing one exact deployment timestamp.
export const ENEMY_SHIELD_IMPACT_RESERVE_RANGE_MS = {
    min: 1100,
    max: 1800,
} as const;

`,

            'enemy shield impact reserve rule',
        );

    return restoreEol(
        content,
        original,
    );
}

function transformPolicy(
    original,
) {
    let content =
        normalize(original);

    content =
        replaceExactlyOnce(
            content,

            `import {
    SHIP_SHIELD_DURATION_MS,
} from '../../content/rules/shields';
`,

            `import {
    ENEMY_SHIELD_IMPACT_RESERVE_RANGE_MS,
    SHIP_SHIELD_DURATION_MS,
} from '../../content/rules/shields';
`,

            'policy reserve rule import',
        );

    content =
        replaceExactlyOnce(
            content,

            `export default class EnemyDecisionPolicy {
    constructor(
`,

            `export default class EnemyDecisionPolicy {
    private readonly shieldImpactReserveMsByThreat =
        new Map<string, number>();

    constructor(
`,

            'policy reserve map field',
        );

    content =
        replaceExactlyOnce(
            content,

            `        const deployDurationMs =
            OFFICER_TASK_BASE_DURATION_MS
                .ENGINEER_DEPLOY_SHIELD;

        // Strict window:
        // - equal to deploy duration is too late;
        // - equal to deploy + lifetime is too early because the field
        //   expires on the same boundary before PlayerWeaponRunner fires.
        if (
            remainingLaserMs <=
                deployDurationMs ||
            remainingLaserMs >=
                deployDurationMs +
                    SHIP_SHIELD_DURATION_MS
        ) {
            return undefined;
        }

        return {
`,

            `        const deployDurationMs =
            OFFICER_TASK_BASE_DURATION_MS
                .ENGINEER_DEPLOY_SHIELD;

        const timingKey =
            this.getShieldTimingKey(
                actor.id,
                observation.id,
            );

        const impactReserveMs =
            this.getOrCreateShieldImpactReserveMs(
                timingKey,
            );

        const deploymentWindowStartMs =
            deployDurationMs +
            SHIP_SHIELD_DURATION_MS -
            impactReserveMs;

        // Safe timing window:
        // - above deploymentWindowStartMs: too early, wait;
        // - equal to deploy duration: too late, laser wins the boundary.
        if (
            remainingLaserMs <=
                deployDurationMs ||
            remainingLaserMs >
                deploymentWindowStartMs
        ) {
            return undefined;
        }

        this.shieldImpactReserveMsByThreat
            .delete(timingKey);

        return {
`,

            'policy stable reserve timing window',
        );

    content =
        replaceExactlyOnce(
            content,

            `    private getRemainingPlayerLaserMs(
`,

            `    private getShieldTimingKey(
        actorId: string,
        observationId: string,
    ): string {
        return (
            actorId +
            ':' +
            observationId
        );
    }

    private getOrCreateShieldImpactReserveMs(
        timingKey: string,
    ): number {
        const existing =
            this.shieldImpactReserveMsByThreat
                .get(timingKey);

        if (existing !== undefined) {
            return existing;
        }

        const randomUnit =
            Math.max(
                0,
                Math.min(
                    1,
                    this.random(),
                ),
            );

        const range =
            ENEMY_SHIELD_IMPACT_RESERVE_RANGE_MS;

        const reserveMs =
            Math.round(
                range.min +
                    (
                        range.max -
                        range.min
                    ) *
                        randomUnit,
            );

        this.shieldImpactReserveMsByThreat
            .set(
                timingKey,
                reserveMs,
            );

        return reserveMs;
    }

    private getRemainingPlayerLaserMs(
`,

            'policy reserve helpers',
        );

    return restoreEol(
        content,
        original,
    );
}

function transformCombatSupport(
    original,
) {
    let content =
        normalize(original);

    content =
        replaceExactlyOnce(
            content,

            `export type AnchoredPlayerCombatTestSetup = {
    engine: EncounterEngine;
    state: EncounterState;
    targetActor: ShipEncounterActorState;
};

export function createAnchoredPlayerCombatTestSetup():
    AnchoredPlayerCombatTestSetup {
`,

            `export type AnchoredPlayerCombatTestSetup = {
    engine: EncounterEngine;
    state: EncounterState;
    targetActor: ShipEncounterActorState;
};

export type AnchoredPlayerCombatTestSetupOptions = {
    random?: () => number;
};

export function createAnchoredPlayerCombatTestSetup(
    options:
        AnchoredPlayerCombatTestSetupOptions = {},
):
    AnchoredPlayerCombatTestSetup {
`,

            'combat support random option',
        );

    content =
        replaceExactlyOnce(
            content,

            `            weapons:
                run.player.ship
                    .weapons,
        });
`,

            `            weapons:
                run.player.ship
                    .weapons,

            random:
                options.random,
        });
`,

            'combat support engine random seam',
        );

    return restoreEol(
        content,
        original,
    );
}

function transformShieldTest(
    original,
) {
    let content =
        normalize(original);

    content =
        replaceExactlyOnce(
            content,

            `import {
    SHIP_SHIELD_DURATION_MS,
} from '../../../src/engine/content/rules/shields';
`,

            `import {
    ENEMY_SHIELD_IMPACT_RESERVE_RANGE_MS,
    SHIP_SHIELD_DURATION_MS,
} from '../../../src/engine/content/rules/shields';
`,

            'shield test reserve import',
        );

    content =
        replaceExactlyOnce(
            content,

            `// After Science completes, 2100 ms moves the 12 s laser
// from 9.0 s remaining to 6.9 s remaining.
// That enters the strict 2 s deploy + 5 s lifetime window.
const WAIT_FOR_DEPLOY_WINDOW_MS =
    2100;
`,

            `// Tests pin random to 0, selecting the minimum impact reserve.
// Engineer waits until the field will still have that reserve at impact.
const IMPACT_RESERVE_MS =
    ENEMY_SHIELD_IMPACT_RESERVE_RANGE_MS
        .min;

const WAIT_FOR_DEPLOY_WINDOW_MS =
    LASER_CHARGE_DURATION_MS -
    SCIENCE_DURATION_MS -
    (
        DEPLOY_DURATION_MS +
        SHIP_SHIELD_DURATION_MS -
        IMPACT_RESERVE_MS
    );
`,

            'shield test deterministic timing constants',
        );

    content =
        content.replaceAll(
            `createAnchoredPlayerCombatTestSetup();`,
            `createAnchoredPlayerCombatTestSetup({
                        random: () => 0,
                    });`,
        );

    const setupCount =
        content.split(
            `createAnchoredPlayerCombatTestSetup({
                        random: () => 0,
                    });`,
        ).length - 1;

    if (setupCount !== 2) {
        fail(
            'Shield test expected two deterministic setup calls, found ' +
                setupCount,
        );
    }

    content =
        replaceExactlyOnce(
            content,

            `                engine.step(
                    WAIT_FOR_DEPLOY_WINDOW_MS,
                );

                expect(
                    targetActor.crewTasks[
`,

            `                engine.step(
                    WAIT_FOR_DEPLOY_WINDOW_MS -
                        1,
                );

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.ENGINEER
                    ],
                ).toBeUndefined();

                engine.step(1);

                expect(
                    targetActor.crewTasks[
`,

            'shield test waits until stable reserve boundary',
        );

    content =
        replaceExactlyOnce(
            content,

            `                engine.step(
                    WAIT_FOR_DEPLOY_WINDOW_MS,
                );

                engine.step(
                    DEPLOY_DURATION_MS,
                );
`,

            `                engine.step(
                    WAIT_FOR_DEPLOY_WINDOW_MS,
                );

                engine.step(
                    DEPLOY_DURATION_MS,
                );
`,

            'hungover timing anchor verification',
        );

    content =
        replaceExactlyOnce(
            content,

            `                    elapsedMs:
                        SHIELD_TO_IMPACT_MS,
                });
`,

            `                    elapsedMs:
                        SHIELD_TO_IMPACT_MS,
                });

                expect(
                    targetActor.activeShield
                        ?.durationMs -
                        (
                            targetActor.activeShield
                                ?.elapsedMs ??
                            0
                        ),
                ).toBe(
                    IMPACT_RESERVE_MS,
                );
`,

            'shield test impact reserve expectation',
        );

    return restoreEol(
        content,
        original,
    );
}

function apply() {
    assertRepositoryState();

    const originals =
        new Map();

    for (
        const relativePath of
        Object.values(FILES)
    ) {
        originals.set(
            relativePath,
            read(relativePath),
        );
    }

    const staged =
        new Map([
            [
                FILES.shields,

                transformShields(
                    originals.get(
                        FILES.shields,
                    ),
                ),
            ],
            [
                FILES.policy,

                transformPolicy(
                    originals.get(
                        FILES.policy,
                    ),
                ),
            ],
            [
                FILES.combatSupport,

                transformCombatSupport(
                    originals.get(
                        FILES.combatSupport,
                    ),
                ),
            ],
            [
                FILES.shieldTest,

                transformShieldTest(
                    originals.get(
                        FILES.shieldTest,
                    ),
                ),
            ],
        ]);

    const written = [];

    try {
        for (
            const [
                relativePath,
                content,
            ] of staged
        ) {
            fs.writeFileSync(
                absolute(
                    relativePath,
                ),
                content,
                'utf8',
            );

            written.push(
                relativePath,
            );
        }
    } catch (error) {
        for (
            let index =
                written.length - 1;

            index >= 0;

            index -= 1
        ) {
            const relativePath =
                written[index];

            fs.writeFileSync(
                absolute(
                    relativePath,
                ),

                originals.get(
                    relativePath,
                ),

                'utf8',
            );
        }

        throw error;
    }

    try {
        if (
            fs.existsSync(
                SELF,
            )
        ) {
            fs.unlinkSync(
                SELF,
            );
        }
    } catch {
        // Optional self-cleanup.
    }

    console.log(
        [
            'Enemy shield timing wiggle atom 09b applied.',
            '',
            '- stable reserve rolled once per laser observation',
            '- reserve range: 1.1–1.8 seconds',
            '- Engineer still refuses a too-late deployment',
            '- normal blocks no longer arrive on a blinking field',
            '- presentation code unchanged',
        ].join('\n'),
    );
}

apply();
