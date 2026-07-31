// node apply_officer_performance_spam.mjs

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const originals = new Map();

const abs = (file) => path.join(root, file);

function read(file) {
    const original = fs.readFileSync(abs(file), 'utf8');

    if (!originals.has(file)) {
        originals.set(file, original);
    }

    return {
        text: original.replace(/\r\n/g, '\n'),
        eol: original.includes('\r\n') ? '\r\n' : '\n',
    };
}

function write(file, text, eol = '\n') {
    fs.mkdirSync(path.dirname(abs(file)), { recursive: true });

    fs.writeFileSync(abs(file), eol === '\n' ? text : text.replace(/\n/g, '\r\n'), 'utf8');
}

function create(file, text) {
    if (fs.existsSync(abs(file))) {
        throw new Error(`New file already exists: ${file}`);
    }

    originals.set(file, undefined);
    write(file, text);
}

function replaceFile(file, text) {
    const { eol } = read(file);
    write(file, text, eol);
}

function patch(file, changes) {
    const source = read(file);
    let text = source.text;

    for (const [search, replacement, label] of changes) {
        const index = text.indexOf(search);

        if (index < 0) {
            throw new Error(`${file}: ${label}: snippet not found`);
        }

        if (text.indexOf(search, index + search.length) >= 0) {
            throw new Error(`${file}: ${label}: snippet is not unique`);
        }

        text = text.slice(0, index) + replacement + text.slice(index + search.length);
    }

    write(file, text, source.eol);
}

function rollback() {
    for (const [file, original] of [...originals.entries()].reverse()) {
        if (original === undefined) {
            fs.rmSync(abs(file), { force: true });
        } else {
            fs.writeFileSync(abs(file), original, 'utf8');
        }
    }
}

const activeSpamQuery = `// src/engine/encounter/combat/queries/get_active_enemy_spam_channels.ts

import { SHIP_WEAPONS } from '../../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../defs/ship_weapon';
import { ENCOUNTER_ACTOR_KIND } from '../../actors/encounter_actor';
import type { EncounterState } from '../../model/state';

export type ActiveEnemySpamChannel = {
    id: string;
    officerTaskProgressMultiplier: number;
};

export function getActiveEnemySpamChannels(
    state: EncounterState,
): ActiveEnemySpamChannel[] {
    const channels: ActiveEnemySpamChannel[] = [];

    for (const actor of state.actors) {
        if (
            actor.kind !== ENCOUNTER_ACTOR_KIND.SHIP ||
            actor.team !== ENCOUNTER_TEAM.ENEMY
        ) {
            continue;
        }

        for (const weapon of actor.weapons) {
            if (
                weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR ||
                weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING ||
                weapon.activeChannelId === null
            ) {
                continue;
            }

            const definition = SHIP_WEAPONS[weapon.weaponId];

            if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
                throw new Error(
                    'Spam projector definition mismatch: ' +
                        actor.id +
                        '/' +
                        weapon.id +
                        '/' +
                        weapon.weaponId,
                );
            }

            channels.push({
                id: weapon.activeChannelId,
                officerTaskProgressMultiplier:
                    definition.officerTaskProgressMultiplier,
            });
        }
    }

    return channels;
}
`;

const performanceResolver = `// src/engine/encounter/officer_performance/OfficerPerformanceResolver.ts

import { getActiveEnemySpamChannels } from '../combat/queries/get_active_enemy_spam_channels';
import type { OfficerTaskState } from '../model/officer_task';
import type EncounterStateStore from '../state/EncounterStateStore';

// Единая точка вычисления текущей производительности officer task.
// Не хранит state, не двигает progress и не эмитит events.
export default class OfficerPerformanceResolver {
    constructor(
        private readonly stateStore: EncounterStateStore,
    ) {}

    public getTaskProgressMultiplier(
        task: OfficerTaskState,
    ): number {
        let multiplier = 1;

        for (const channel of getActiveEnemySpamChannels(
            this.stateStore.getState(),
        )) {
            const value = channel.officerTaskProgressMultiplier;

            if (!Number.isFinite(value) || value < 0) {
                throw new Error(
                    'Invalid officer task progress multiplier: ' +
                        task.id +
                        '/' +
                        channel.id +
                        '/' +
                        value,
                );
            }

            // Одинаковые spam effects не перемножаются.
            multiplier = Math.min(multiplier, value);
        }

        return multiplier;
    }
}
`;

const spamCommandHandler = `// src/engine/encounter/commands/handlers/science_purge_spam_command_handler.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { getActiveEnemySpamChannels } from '../../combat/queries/get_active_enemy_spam_channels';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { createSciencePurgeSpamTask } from '../../officer_tasks/create_officer_task_draft';
import { requireThreatTargetId } from './command_handler_helpers';

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM;

const COMMAND_DEF = {
    role: OFFICER_ROLE.SCIENCE,
    label: 'PURGE SPAM',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
    },

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const sciencePurgeSpamCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return getActiveEnemySpamChannels(state).map((channel) => {
            return {
                commandId: COMMAND_ID,
                label: COMMAND_DEF.label,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
                    threatId: channel.id,
                },

                targetLabel: 'SPAM CHANNEL',
            };
        });
    },

    execute(context, input) {
        context.startOfficerTask(
            createSciencePurgeSpamTask(
                requireThreatTargetId(input),
            ),
        );
    },
} satisfies OfficerCommandHandler;
`;

const testFile = `// tests/engine/encounter/officer_performance_spam.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_WEAPON_TARGETING_DURATION_MS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
} from '../../../src/engine/encounter/model/command';
import { SPAM_CHANNEL_OUTCOME } from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Officer performance during hostile spam', () => {
    it('slows task progress without changing duration', () => {
        const { engine, projector } = createActiveSpamEncounter();
        const taskStartedEvent = startPurgeTask(engine);

        engine.step(5000);

        expect(engine.drainEvents()).toEqual([]);
        expect(engine.getOfficerTasks()).toEqual([
            {
                ...taskStartedEvent.task,
                elapsedMs: 2500,
            },
        ]);
        expect(taskStartedEvent.task.durationMs).toBe(5000);

        engine.step(5000);

        const [channelEndedEvent, taskEndedEvent] =
            engine.drainEvents();

        expect(channelEndedEvent).toMatchObject({
            type: ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,
            outcome: SPAM_CHANNEL_OUTCOME.PURGED,
        });
        expect(taskEndedEvent).toMatchObject({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
            task: {
                id: taskStartedEvent.task.id,
                elapsedMs: 5000,
                durationMs: 5000,
            },
            outcome: OFFICER_TASK_OUTCOME.COMPLETED,
        });

        expect(engine.getOfficerTasks()).toEqual([]);
        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
    });

    it('cancels PURGE SPAM when its channel expires first', () => {
        const { engine, channel } = createActiveSpamEncounter();

        engine.step(channel.durationMs - 5000);
        expect(engine.drainEvents()).toEqual([]);

        const taskStartedEvent = startPurgeTask(engine);

        engine.step(5000);

        const [channelEndedEvent, taskEndedEvent] =
            engine.drainEvents();

        expect(channelEndedEvent).toEqual({
            type: ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,
            channel: {
                ...channel,
                elapsedMs: channel.durationMs,
            },
            outcome: SPAM_CHANNEL_OUTCOME.EXPIRED,
        });
        expect(taskEndedEvent).toMatchObject({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
            task: {
                id: taskStartedEvent.task.id,
                elapsedMs: 2500,
            },
            outcome: OFFICER_TASK_OUTCOME.CANCELLED,
        });

        expect(engine.getOfficerTasks()).toEqual([]);
        expect(engine.getSpamChannels()).toEqual([]);
    });
});

function createActiveSpamEncounter() {
    const { node, stationId } = createSingleStationNodeFixture();

    node.actors.push(
        ShipNodeActorFactory.create({
            id: 'ship_enemy_00',
            presetId:
                SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00,
            anchorId: stationId,
        }),
    );

    const engine = new EncounterEngine({
        node,
        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        },
        pointDefense: createPointDefenseFixture(),
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error('Expected encounter loaded event');
    }

    const projector = loadedEvent.state.actors[0].weapons[0];

    engine.step(SHIP_WEAPON_TARGETING_DURATION_MS);

    const channelStartedEvent = engine
        .drainEvents()
        .find((event) => {
            return event.type === ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED;
        });

    if (
        !channelStartedEvent ||
        channelStartedEvent.type !==
            ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED
    ) {
        throw new Error('Expected spam channel started event');
    }

    return {
        engine,
        projector,
        channel: channelStartedEvent.channel,
    };
}

function startPurgeTask(engine: EncounterEngine) {
    const command = engine
        .getAvailableCommands(OFFICER_ROLE.SCIENCE)
        .find((candidate) => {
            return (
                candidate.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM
            );
        });

    if (!command) {
        throw new Error('Expected PURGE SPAM command');
    }

    expect(
        engine.executeCommand({
            role: OFFICER_ROLE.SCIENCE,
            commandId: command.commandId,
            target: command.target,
        }),
    ).toEqual({
        status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
    });

    const [event] = engine.drainEvents();

    if (event.type !== ENCOUNTER_EVENT.OFFICER_TASK_STARTED) {
        throw new Error('Expected officer task started event');
    }

    return event;
}
`;

try {
    create('src/engine/encounter/combat/queries/get_active_enemy_spam_channels.ts', activeSpamQuery);
    create('src/engine/encounter/officer_performance/OfficerPerformanceResolver.ts', performanceResolver);
    create('tests/engine/encounter/officer_performance_spam.test.ts', testFile);

    patch('src/engine/defs/ship_weapon.ts', [
        [
            [
                'export type SpamProjectorDefinition = ShipWeaponDefinitionBase & {',
                '    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;',
                '',
                '    channelDurationMs: number;',
                '};',
            ].join('\n'),
            [
                'export type SpamProjectorDefinition = ShipWeaponDefinitionBase & {',
                '    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;',
                '',
                '    channelDurationMs: number;',
                '',
                '    officerTaskProgressMultiplier: number;',
                '};',
            ].join('\n'),
            'definition',
        ],
    ]);

    patch('src/engine/content/catalogs/ship_weapons.ts', [
        [
            '        channelDurationMs: 20000,\n        cooldownDurationMs: 15000,',
            [
                '        channelDurationMs: 20000,',
                '',
                '        officerTaskProgressMultiplier: 0.5,',
                '',
                '        cooldownDurationMs: 15000,',
            ].join('\n'),
            'catalog multiplier',
        ],
    ]);

    replaceFile('src/engine/encounter/commands/handlers/science_purge_spam_command_handler.ts', spamCommandHandler);

    patch('src/engine/encounter/state/EncounterStateStore.ts', [
        [
            [
                '    public advanceOfficerTasks(deltaMs: number): void {',
                '        for (const task of this.getOfficerTasks()) {',
                '            if (task.durationMs === null) {',
                '                continue;',
                '            }',
                '',
                '            task.elapsedMs = Math.min(task.elapsedMs + deltaMs, task.durationMs);',
                '        }',
                '    }',
            ].join('\n'),
            [
                '    public advanceOfficerTask(',
                '        taskId: string,',
                '        progressDeltaMs: number,',
                '    ): void {',
                '        if (!Number.isFinite(progressDeltaMs) || progressDeltaMs < 0) {',
                '            throw new Error(',
                "                'Invalid officer task progress delta: ' +",
                "                    taskId + '/' + progressDeltaMs,",
                '            );',
                '        }',
                '',
                '        const task = this.findOfficerTaskById(taskId);',
                '',
                '        if (!task || task.durationMs === null) {',
                '            return;',
                '        }',
                '',
                '        task.elapsedMs = Math.min(',
                '            task.elapsedMs + progressDeltaMs,',
                '            task.durationMs,',
                '        );',
                '    }',
            ].join('\n'),
            'per-task progress',
        ],
    ]);

    patch('src/engine/encounter/officer_tasks/OfficerTaskRunner.ts', [
        [
            "import EncounterStateStore from '../state/EncounterStateStore';",
            [
                "import { getActiveEnemySpamChannels } from '../combat/queries/get_active_enemy_spam_channels';",
                "import OfficerPerformanceResolver from '../officer_performance/OfficerPerformanceResolver';",
                "import EncounterStateStore from '../state/EncounterStateStore';",
            ].join('\n'),
            'imports',
        ],
        [
            '    private readonly taskResolver: OfficerTaskResolver;\n\n    private nextTaskId = 1;',
            [
                '    private readonly taskResolver: OfficerTaskResolver;',
                '',
                '    private readonly performanceResolver: OfficerPerformanceResolver;',
                '',
                '    private nextTaskId = 1;',
            ].join('\n'),
            'field',
        ],
        [
            [
                '        this.taskResolver = new OfficerTaskResolver(',
                '            this.stateStore,',
                '            purgeSpamChannel,',
                '        );',
                '',
                '        this.restoreMissingNavigationTask();',
            ].join('\n'),
            [
                '        this.taskResolver = new OfficerTaskResolver(',
                '            this.stateStore,',
                '            purgeSpamChannel,',
                '        );',
                '',
                '        this.performanceResolver =',
                '            new OfficerPerformanceResolver(this.stateStore);',
                '',
                '        this.restoreMissingNavigationTask();',
            ].join('\n'),
            'resolver construction',
        ],
        [
            [
                '    public step(deltaMs: number): void {',
                '        this.stateStore.advanceOfficerTasks(deltaMs);',
                '        this.completeFinishedTasks();',
                '    }',
            ].join('\n'),
            [
                '    public step(deltaMs: number): void {',
                '        for (const task of this.stateStore.getOfficerTasks()) {',
                '            if (task.durationMs === null) {',
                '                continue;',
                '            }',
                '',
                '            const multiplier =',
                '                this.performanceResolver.getTaskProgressMultiplier(task);',
                '',
                '            this.stateStore.advanceOfficerTask(',
                '                task.id,',
                '                deltaMs * multiplier,',
                '            );',
                '        }',
                '',
                '        this.completeFinishedTasks();',
                '    }',
                '',
                '    public cancelTasksWithMissingTargets(): void {',
                '        const activeSpamChannelIds = new Set(',
                '            getActiveEnemySpamChannels(',
                '                this.stateStore.getState(),',
                '            ).map((channel) => channel.id),',
                '        );',
                '',
                '        const invalidTaskIds = this.stateStore',
                '            .getOfficerTasks()',
                '            .filter((task) => {',
                '                return (',
                '                    task.kind ===',
                '                        OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM &&',
                '                    !activeSpamChannelIds.has(task.channelId)',
                '                );',
                '            })',
                '            .map((task) => task.id);',
                '',
                '        for (const taskId of invalidTaskIds) {',
                '            this.cancel(taskId);',
                '        }',
                '    }',
            ].join('\n'),
            'step and target validation',
        ],
    ]);

    patch('src/engine/encounter/EncounterEngine.ts', [
        [
            '        this.combatRunner.step(deltaMs);',
            [
                '        this.combatRunner.step(deltaMs);',
                '',
                '        this.officerTaskRunner.cancelTasksWithMissingTargets();',
            ].join('\n'),
            'missing target cancellation',
        ],
    ]);

    const backlogPath = abs('BACKLOG.md');

    if (fs.existsSync(backlogPath)) {
        const backlog = read('BACKLOG.md');
        const item = [
            '- Spam channel must slow officer task progress through the future modifier',
            '  system. Do not mutate task duration. Apply an officer-task progress/speed',
            '  multiplier while the channel is active. The multiplier value belongs to',
            '  the Spam Projector definition and will be tuned later.',
            '',
        ].join('\n');

        if (backlog.text.includes(item)) {
            write('BACKLOG.md', backlog.text.replace(item, ''), backlog.eol);
        }
    }

    console.log('Applied officer performance + spam slowdown atom.');
    console.log('Run: npm run typecheck && npm test && npm run dev');
} catch (error) {
    rollback();

    console.error(error instanceof Error ? error.message : error);
    console.error('No partial changes were left.');

    process.exitCode = 1;
}
