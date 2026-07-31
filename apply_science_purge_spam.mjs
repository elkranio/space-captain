// Run from the Space Captain project root:
// node apply_science_purge_spam.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const NEW_FILES = {
    'src/engine/encounter/commands/handlers/science_purge_spam_command_handler.ts':
        "// src/engine/encounter/commands/handlers/science_purge_spam_command_handler.ts\n\nimport { ENCOUNTER_TEAM } from '../../../defs/encounter_team';\nimport { OFFICER_ROLE } from '../../../defs/officer';\nimport {\n    SHIP_WEAPON_KIND,\n    SHIP_WEAPON_PHASE,\n} from '../../../defs/ship_weapon';\nimport { ENCOUNTER_ACTOR_KIND } from '../../actors/encounter_actor';\nimport {\n    ENCOUNTER_OFFICER_COMMAND_ID,\n    OFFICER_COMMAND_TARGET_KIND,\n    type OfficerCommandDef,\n} from '../../model/command';\nimport type { OfficerCommandHandler } from '../../model/officer_command_handler';\nimport type { EncounterState } from '../../model/state';\nimport { createSciencePurgeSpamTask } from '../../officer_tasks/create_officer_task_draft';\nimport { requireThreatTargetId } from './command_handler_helpers';\n\nconst COMMAND_ID =\n    ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM;\n\nconst COMMAND_DEF = {\n    role: OFFICER_ROLE.SCIENCE,\n    label: 'PURGE SPAM',\n\n    targeting: {\n        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,\n    },\n\n    requiresIdleBridge: false,\n} satisfies OfficerCommandDef;\n\nexport const sciencePurgeSpamCommandHandler = {\n    commandId: COMMAND_ID,\n    def: COMMAND_DEF,\n\n    getAvailableCommands(state) {\n        return getActiveEnemySpamChannelIds(state).map(\n            (channelId) => ({\n                commandId: COMMAND_ID,\n                label: COMMAND_DEF.label,\n\n                target: {\n                    kind:\n                        OFFICER_COMMAND_TARGET_KIND.THREAT,\n                    threatId: channelId,\n                },\n\n                targetLabel: 'SPAM CHANNEL',\n            }),\n        );\n    },\n\n    execute(context, input) {\n        context.startOfficerTask(\n            createSciencePurgeSpamTask(\n                requireThreatTargetId(input),\n            ),\n        );\n    },\n} satisfies OfficerCommandHandler;\n\nfunction getActiveEnemySpamChannelIds(\n    state: EncounterState,\n): string[] {\n    const channelIds: string[] = [];\n\n    for (const actor of state.actors) {\n        if (\n            actor.kind !== ENCOUNTER_ACTOR_KIND.SHIP ||\n            actor.team !== ENCOUNTER_TEAM.ENEMY\n        ) {\n            continue;\n        }\n\n        for (const weapon of actor.weapons) {\n            if (\n                weapon.kind ===\n                    SHIP_WEAPON_KIND.SPAM_PROJECTOR &&\n                weapon.phase ===\n                    SHIP_WEAPON_PHASE.CHANNELING &&\n                weapon.activeChannelId !== null\n            ) {\n                channelIds.push(\n                    weapon.activeChannelId,\n                );\n            }\n        }\n    }\n\n    return channelIds;\n}\n",
    'tests/engine/encounter/science_purge_spam.test.ts':
        "// tests/engine/encounter/science_purge_spam.test.ts\n\nimport { describe, expect, it } from 'vitest';\nimport { SHIP_WEAPON_TARGETING_DURATION_MS } from '../../../src/engine/content/catalogs/ship_weapons';\nimport { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';\nimport { OFFICER_ROLE } from '../../../src/engine/defs/officer';\nimport { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';\nimport {\n    SHIP_WEAPON_KIND,\n    SHIP_WEAPON_PHASE,\n} from '../../../src/engine/defs/ship_weapon';\nimport EncounterEngine from '../../../src/engine/encounter/EncounterEngine';\nimport {\n    ENCOUNTER_OFFICER_COMMAND_ID,\n    OFFICER_COMMAND_EXECUTION_STATUS,\n    OFFICER_COMMAND_TARGET_KIND,\n} from '../../../src/engine/encounter/model/command';\nimport { SPAM_CHANNEL_OUTCOME } from '../../../src/engine/encounter/model/combat';\nimport {\n    ENCOUNTER_EVENT,\n    OFFICER_TASK_OUTCOME,\n} from '../../../src/engine/encounter/model/event';\nimport { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';\nimport ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';\nimport { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';\nimport { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';\n\ndescribe('Science purge spam command', () => {\n    it('purges an active hostile spam channel', () => {\n        const { node, stationId } =\n            createSingleStationNodeFixture();\n\n        node.actors.push(\n            ShipNodeActorFactory.create({\n                id: 'ship_enemy_00',\n                presetId:\n                    SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00,\n                anchorId: stationId,\n            }),\n        );\n\n        const engine = new EncounterEngine({\n            node,\n            navigation: {\n                kind:\n                    PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,\n                anchorId: stationId,\n            },\n            pointDefense: createPointDefenseFixture(),\n            completeTimedTasksImmediately: true,\n        });\n\n        const [loadedEvent] = engine.drainEvents();\n\n        if (\n            loadedEvent.type !==\n            ENCOUNTER_EVENT.ENCOUNTER_LOADED\n        ) {\n            throw new Error(\n                `Expected encounter loaded event, received: ` +\n                    `${loadedEvent.type}`,\n            );\n        }\n\n        const enemy = loadedEvent.state.actors[0];\n        const projector = enemy.weapons[0];\n\n        if (\n            projector.kind !==\n            SHIP_WEAPON_KIND.SPAM_PROJECTOR\n        ) {\n            throw new Error(\n                'Expected enemy spam projector',\n            );\n        }\n\n        expect(\n            findPurgeCommand(engine),\n        ).toBeUndefined();\n\n        engine.step(\n            SHIP_WEAPON_TARGETING_DURATION_MS,\n        );\n\n        const [\n            targetingEvent,\n            channelStartedEvent,\n        ] = engine.drainEvents();\n\n        expect(targetingEvent.type).toBe(\n            ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,\n        );\n\n        if (\n            channelStartedEvent.type !==\n            ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED\n        ) {\n            throw new Error(\n                `Expected spam channel started event, received: ` +\n                    `${channelStartedEvent.type}`,\n            );\n        }\n\n        const purgeCommand =\n            findPurgeCommand(engine);\n\n        expect(purgeCommand).toEqual({\n            commandId:\n                ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM,\n            label: 'PURGE SPAM',\n            target: {\n                kind:\n                    OFFICER_COMMAND_TARGET_KIND.THREAT,\n                threatId:\n                    channelStartedEvent.channel.id,\n            },\n            targetLabel: 'SPAM CHANNEL',\n        });\n\n        if (!purgeCommand) {\n            throw new Error(\n                'Expected PURGE SPAM command',\n            );\n        }\n\n        expect(\n            engine.executeCommand({\n                role: OFFICER_ROLE.SCIENCE,\n                commandId: purgeCommand.commandId,\n                target: purgeCommand.target,\n            }),\n        ).toEqual({\n            status:\n                OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,\n        });\n\n        const [\n            taskStartedEvent,\n            channelEndedEvent,\n            taskEndedEvent,\n        ] = engine.drainEvents();\n\n        expect(taskStartedEvent).toMatchObject({\n            type:\n                ENCOUNTER_EVENT.OFFICER_TASK_STARTED,\n            task: {\n                kind:\n                    OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM,\n                role: OFFICER_ROLE.SCIENCE,\n                sourceCommandId:\n                    ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM,\n                channelId:\n                    channelStartedEvent.channel.id,\n                label: 'PURGE SPAM',\n                showProgress: true,\n                canBeCancelledByPlayer: true,\n                canBeInterruptedByDamage: true,\n                durationMs: 5000,\n            },\n        });\n\n        expect(channelEndedEvent).toEqual({\n            type:\n                ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,\n            channel: channelStartedEvent.channel,\n            outcome:\n                SPAM_CHANNEL_OUTCOME.PURGED,\n        });\n\n        expect(taskEndedEvent).toMatchObject({\n            type:\n                ENCOUNTER_EVENT.OFFICER_TASK_ENDED,\n            outcome:\n                OFFICER_TASK_OUTCOME.COMPLETED,\n            result: undefined,\n        });\n\n        expect(projector.phase).toBe(\n            SHIP_WEAPON_PHASE.COOLDOWN,\n        );\n        expect(projector.activeChannelId).toBeNull();\n        expect(engine.getSpamChannels()).toEqual([]);\n        expect(engine.getOfficerTasks()).toEqual([]);\n        expect(\n            findPurgeCommand(engine),\n        ).toBeUndefined();\n    });\n});\n\nfunction findPurgeCommand(\n    engine: EncounterEngine,\n) {\n    return engine\n        .getAvailableCommands(OFFICER_ROLE.SCIENCE)\n        .find((command) => {\n            return (\n                command.commandId ===\n                ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM\n            );\n        });\n}\n",
};
const originals = new Map();

function filePath(relativePath) {
    return path.join(ROOT, relativePath);
}

function read(relativePath) {
    const absolutePath = filePath(relativePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${relativePath}`);
    }

    const source = fs.readFileSync(absolutePath, 'utf8');

    if (!originals.has(relativePath)) {
        originals.set(relativePath, source);
    }

    return {
        source: source.replace(/\r\n/g, '\n'),
        eol: source.includes('\r\n') ? '\r\n' : '\n',
    };
}

function write(relativePath, source, eol = '\n') {
    const absolutePath = filePath(relativePath);

    fs.mkdirSync(path.dirname(absolutePath), {
        recursive: true,
    });

    fs.writeFileSync(absolutePath, eol === '\n' ? source : source.replace(/\n/g, '\r\n'), 'utf8');
}

function replaceOnce(source, search, replacement, label) {
    const index = source.indexOf(search);

    if (index < 0) {
        throw new Error(`${label}: snippet not found`);
    }

    if (source.indexOf(search, index + search.length) >= 0) {
        throw new Error(`${label}: snippet is not unique`);
    }

    return source.slice(0, index) + replacement + source.slice(index + search.length);
}

function edit(relativePath, changes) {
    const file = read(relativePath);
    let source = file.source;

    for (const [search, replacement, label] of changes) {
        source = replaceOnce(source, search, replacement, `${relativePath}: ${label}`);
    }

    write(relativePath, source, file.eol);
}

function createNewFiles() {
    for (const [relativePath, source] of Object.entries(NEW_FILES)) {
        const absolutePath = filePath(relativePath);

        if (fs.existsSync(absolutePath)) {
            throw new Error(`New file already exists: ${relativePath}`);
        }

        originals.set(relativePath, undefined);
        write(relativePath, source);
    }
}

function apply() {
    createNewFiles();

    edit('src/engine/encounter/model/command.ts', [
        [
            "    SCIENCE_IDENTIFY_THREAT: 'science_identify_threat',",
            [
                "    SCIENCE_IDENTIFY_THREAT: 'science_identify_threat',",
                "    SCIENCE_PURGE_SPAM: 'science_purge_spam',",
            ].join('\n'),
            'command id',
        ],
    ]);

    edit('src/engine/encounter/model/officer_task.ts', [
        [
            "    SCIENCE_IDENTIFY_THREAT: 'science_identify_threat',",
            [
                "    SCIENCE_IDENTIFY_THREAT: 'science_identify_threat',",
                "    SCIENCE_PURGE_SPAM: 'science_purge_spam',",
            ].join('\n'),
            'task kind',
        ],
        [
            [
                'type ScienceIdentifyThreatOfficerTaskDraft = OfficerTaskDraftBase & {',
                '    kind: typeof OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT;',
                '    role: typeof OFFICER_ROLE.SCIENCE;',
                '',
                '    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;',
                '',
                '    threatId: string;',
                '};',
            ].join('\n'),
            [
                'type ScienceIdentifyThreatOfficerTaskDraft = OfficerTaskDraftBase & {',
                '    kind: typeof OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT;',
                '    role: typeof OFFICER_ROLE.SCIENCE;',
                '',
                '    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;',
                '',
                '    threatId: string;',
                '};',
                '',
                'type SciencePurgeSpamOfficerTaskDraft = OfficerTaskDraftBase & {',
                '    kind: typeof OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM;',
                '    role: typeof OFFICER_ROLE.SCIENCE;',
                '',
                '    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM;',
                '',
                '    channelId: string;',
                '};',
            ].join('\n'),
            'task draft',
        ],
        [
            '    | ScienceIdentifyThreatOfficerTaskDraft\n    | EngineerDeployShieldOfficerTaskDraft',
            '    | ScienceIdentifyThreatOfficerTaskDraft\n    | SciencePurgeSpamOfficerTaskDraft\n    | EngineerDeployShieldOfficerTaskDraft',
            'draft union',
        ],
        [
            '        case OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT:\n        case OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD:',
            '        case OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT:\n        case OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM:\n        case OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD:',
            'cancellation policy',
        ],
    ]);

    edit('src/engine/content/rules/officer_tasks.ts', [
        [
            '    SCIENCE_IDENTIFY_THREAT: 3000,',
            '    SCIENCE_IDENTIFY_THREAT: 3000,\n    SCIENCE_PURGE_SPAM: 5000,',
            'duration',
        ],
    ]);

    edit('src/engine/encounter/officer_tasks/create_officer_task_draft.ts', [
        [
            [
                'export function createScienceIdentifyThreatTask(threatId: string): OfficerTaskDraft {',
                '    return {',
                '        kind: OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT,',
                '        role: OFFICER_ROLE.SCIENCE,',
                '',
                '        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,',
                '',
                '        threatId,',
                '',
                "        label: 'IDENTIFY',",
                '        showProgress: true,',
                '',
                '        durationMs: OFFICER_TASK_BASE_DURATION_MS.SCIENCE_IDENTIFY_THREAT,',
                '    };',
                '}',
            ].join('\n'),
            [
                'export function createScienceIdentifyThreatTask(threatId: string): OfficerTaskDraft {',
                '    return {',
                '        kind: OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT,',
                '        role: OFFICER_ROLE.SCIENCE,',
                '',
                '        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,',
                '',
                '        threatId,',
                '',
                "        label: 'IDENTIFY',",
                '        showProgress: true,',
                '',
                '        durationMs: OFFICER_TASK_BASE_DURATION_MS.SCIENCE_IDENTIFY_THREAT,',
                '    };',
                '}',
                '',
                'export function createSciencePurgeSpamTask(channelId: string): OfficerTaskDraft {',
                '    return {',
                '        kind: OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM,',
                '        role: OFFICER_ROLE.SCIENCE,',
                '',
                '        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM,',
                '',
                '        channelId,',
                '',
                "        label: 'PURGE SPAM',",
                '        showProgress: true,',
                '',
                '        durationMs: OFFICER_TASK_BASE_DURATION_MS.SCIENCE_PURGE_SPAM,',
                '    };',
                '}',
            ].join('\n'),
            'task factory',
        ],
    ]);

    edit('src/engine/encounter/commands/officer_command_handlers.ts', [
        [
            "import { scienceIdentifyThreatCommandHandler } from './handlers/science_identify_threat_command_handler';",
            [
                "import { scienceIdentifyThreatCommandHandler } from './handlers/science_identify_threat_command_handler';",
                "import { sciencePurgeSpamCommandHandler } from './handlers/science_purge_spam_command_handler';",
            ].join('\n'),
            'handler import',
        ],
        [
            '    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT]: scienceIdentifyThreatCommandHandler,',
            [
                '    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT]: scienceIdentifyThreatCommandHandler,',
                '',
                '    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM]: sciencePurgeSpamCommandHandler,',
            ].join('\n'),
            'handler registry',
        ],
    ]);

    edit('src/engine/encounter/officer_tasks/OfficerTaskResolver.ts', [
        [
            'export default class OfficerTaskResolver {\n    constructor(private readonly stateStore: EncounterStateStore) {}',
            [
                'export default class OfficerTaskResolver {',
                '    constructor(',
                '        private readonly stateStore: EncounterStateStore,',
                '        private readonly purgeSpamChannel: (channelId: string) => boolean,',
                '    ) {}',
            ].join('\n'),
            'constructor',
        ],
        [
            '            case OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT:\n                return this.resolveScienceIdentifyThreatTask(task);',
            [
                '            case OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT:',
                '                return this.resolveScienceIdentifyThreatTask(task);',
                '',
                '            case OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM:',
                '                this.purgeSpamChannel(task.channelId);',
                '                return undefined;',
            ].join('\n'),
            'resolve switch',
        ],
    ]);

    edit('src/engine/encounter/officer_tasks/OfficerTaskRunner.ts', [
        [
            '    emit: (event: EncounterEvent) => void;\n    completeTimedTasksImmediately?: boolean;',
            '    emit: (event: EncounterEvent) => void;\n\n    purgeSpamChannel: (channelId: string) => boolean;\n\n    completeTimedTasksImmediately?: boolean;',
            'options',
        ],
        [
            '    constructor({ stateStore, emit, completeTimedTasksImmediately = false }: OfficerTaskRunnerOptions) {',
            [
                '    constructor({',
                '        stateStore,',
                '        emit,',
                '',
                '        purgeSpamChannel,',
                '',
                '        completeTimedTasksImmediately = false,',
                '    }: OfficerTaskRunnerOptions) {',
            ].join('\n'),
            'constructor',
        ],
        [
            '        this.taskResolver = new OfficerTaskResolver(this.stateStore);',
            [
                '        this.taskResolver = new OfficerTaskResolver(',
                '            this.stateStore,',
                '            purgeSpamChannel,',
                '        );',
            ].join('\n'),
            'resolver wiring',
        ],
    ]);

    edit('src/engine/encounter/EncounterEngine.ts', [
        [
            [
                '        this.officerTaskRunner = new OfficerTaskRunner({',
                '            stateStore: this.stateStore,',
                '            emit: this.emit,',
                '',
                '            completeTimedTasksImmediately,',
                '        });',
                '',
                '        this.combatRunner = new CombatRunner({',
                '            state: encounterState,',
                '            emit: this.emit,',
                '',
                '            random,',
                '',
                '            interruptRandomOfficerTask: () => {',
                '                this.interruptRandomOfficerTask(random);',
                '            },',
                '        });',
            ].join('\n'),
            [
                '        this.combatRunner = new CombatRunner({',
                '            state: encounterState,',
                '            emit: this.emit,',
                '',
                '            random,',
                '',
                '            interruptRandomOfficerTask: () => {',
                '                this.interruptRandomOfficerTask(random);',
                '            },',
                '        });',
                '',
                '        this.officerTaskRunner = new OfficerTaskRunner({',
                '            stateStore: this.stateStore,',
                '            emit: this.emit,',
                '',
                '            purgeSpamChannel: (channelId) => {',
                '                return this.combatRunner.purgeSpamChannel(channelId);',
                '            },',
                '',
                '            completeTimedTasksImmediately,',
                '        });',
            ].join('\n'),
            'runner order',
        ],
    ]);
}

function rollback() {
    for (const [relativePath, original] of [...originals.entries()].reverse()) {
        const absolutePath = filePath(relativePath);

        if (original === undefined) {
            fs.rmSync(absolutePath, {
                force: true,
            });
            continue;
        }

        fs.writeFileSync(absolutePath, original, 'utf8');
    }
}

try {
    apply();

    console.log('Applied SCIENCE PURGE SPAM command.');
    console.log('Run: npm run typecheck && npm test');
} catch (error) {
    rollback();

    console.error(error instanceof Error ? error.message : error);
    console.error('No partial changes were left.');

    process.exitCode = 1;
}
