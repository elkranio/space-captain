// Run from the Space Captain project root:
// node apply_spam_direct_channel.mjs

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

const touchedFiles = new Map();

function absolute(relativePath) {
    return path.join(PROJECT_ROOT, relativePath);
}

function read(relativePath) {
    const filePath = absolute(relativePath);

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${relativePath}`);
    }

    const source = fs.readFileSync(filePath, 'utf8');

    if (!touchedFiles.has(relativePath)) {
        touchedFiles.set(relativePath, source);
    }

    return {
        source,
        eol: source.includes('\r\n') ? '\r\n' : '\n',
    };
}

function write(relativePath, source, eol = '\n') {
    const filePath = absolute(relativePath);

    fs.mkdirSync(path.dirname(filePath), {
        recursive: true,
    });

    const output = eol === '\n' ? source : source.replace(/\n/g, '\r\n');

    fs.writeFileSync(filePath, output, 'utf8');
}

function normalize(source) {
    return source.replace(/\r\n/g, '\n');
}

function replaceExact(source, search, replacement, label) {
    const firstIndex = source.indexOf(search);

    if (firstIndex < 0) {
        throw new Error(`${label}: expected snippet not found`);
    }

    if (source.indexOf(search, firstIndex + search.length) >= 0) {
        throw new Error(`${label}: expected snippet is not unique`);
    }

    return source.slice(0, firstIndex) + replacement + source.slice(firstIndex + search.length);
}

function updateShipWeaponDefinition() {
    const relativePath = 'src/engine/defs/ship_weapon.ts';
    const file = read(relativePath);

    let source = normalize(file.source);

    source = replaceExact(
        source,
        [
            'export type SpamProjectorDefinition = ShipWeaponDefinitionBase & {',
            '    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;',
            '',
            '    chargeDurationMs: number;',
            '    channelDurationMs: number;',
            '};',
        ].join('\n'),
        [
            'export type SpamProjectorDefinition = ShipWeaponDefinitionBase & {',
            '    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;',
            '',
            '    channelDurationMs: number;',
            '};',
        ].join('\n'),
        relativePath,
    );

    write(relativePath, source, file.eol);
}

function updateShipWeaponCatalog() {
    const relativePath = 'src/engine/content/catalogs/ship_weapons.ts';

    const file = read(relativePath);

    let source = normalize(file.source);

    source = replaceExact(
        source,
        [
            '        kind: SHIP_WEAPON_KIND.SPAM_PROJECTOR,',
            '',
            '        chargeDurationMs: 12000,',
            '        channelDurationMs: 20000,',
        ].join('\n'),
        ['        kind: SHIP_WEAPON_KIND.SPAM_PROJECTOR,', '', '        channelDurationMs: 20000,'].join('\n'),
        relativePath,
    );

    write(relativePath, source, file.eol);
}

function updateCombatRunner() {
    const relativePath = 'src/engine/encounter/combat/CombatRunner.ts';

    const file = read(relativePath);

    let source = normalize(file.source);

    source = replaceExact(
        source,
        [
            '            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:',
            '                this.startSpamCharging(actor, weapon);',
            '                return;',
        ].join('\n'),
        [
            '            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:',
            '                this.startSpamChannel(actor, weapon);',
            '                return;',
        ].join('\n'),
        `${relativePath}: targeting completion`,
    );

    source = replaceExact(
        source,
        [
            '            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:',
            '                this.advanceSpamCharging(actor, weapon, deltaMs);',
            '                return;',
        ].join('\n'),
        [
            '            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:',
            '                throw new Error(',
            '                    `Spam projector cannot enter charging phase: ` +',
            '                        `${actor.id}/${weapon.id}`,',
            '                );',
        ].join('\n'),
        `${relativePath}: charging dispatch`,
    );

    source = replaceExact(
        source,
        [
            '    private startSpamCharging(',
            '        actor: ShipEncounterActorState,',
            '        projector: SpamProjectorState,',
            '    ): void {',
            '        if (projector.activeChannelId !== null) {',
            '            throw new Error(',
            '                `Cannot charge spam projector with active channel: ` +',
            '                    `${actor.id}/${projector.id}/${projector.activeChannelId}`,',
            '            );',
            '        }',
            '',
            '        projector.phase = SHIP_WEAPON_PHASE.CHARGING;',
            '        projector.phaseElapsedMs = 0;',
            '',
            '        this.emit({',
            '            type: ENCOUNTER_EVENT.SPAM_ATTACK_STARTED,',
            '',
            '            sourceActorId: actor.id,',
            '            sourceWeaponId: projector.id,',
            '        });',
            '    }',
            '',
            '    private advanceSpamCharging(',
            '        actor: ShipEncounterActorState,',
            '        projector: SpamProjectorState,',
            '        deltaMs: number,',
            '    ): void {',
            '        const definition = this.getSpamProjectorDefinition(projector);',
            '',
            '        projector.phaseElapsedMs += deltaMs;',
            '',
            '        if (projector.phaseElapsedMs < definition.chargeDurationMs) {',
            '            return;',
            '        }',
            '',
            '        this.startSpamChannel(actor, projector);',
            '    }',
            '',
        ].join('\n'),
        '',
        `${relativePath}: obsolete spam charging methods`,
    );

    write(relativePath, source, file.eol);
}

function updateEncounterEvents() {
    const relativePath = 'src/engine/encounter/model/event.ts';

    const file = read(relativePath);

    let source = normalize(file.source);

    source = replaceExact(
        source,
        "    SPAM_ATTACK_STARTED: 'spam_attack_started',\n",
        '',
        `${relativePath}: event constant`,
    );

    source = replaceExact(
        source,
        [
            'export type SpamAttackStartedEvent = {',
            '    type: typeof ENCOUNTER_EVENT.SPAM_ATTACK_STARTED;',
            '',
            '    sourceActorId: string;',
            '    sourceWeaponId: string;',
            '};',
            '',
        ].join('\n'),
        '',
        `${relativePath}: event type`,
    );

    source = replaceExact(
        source,
        ['    | LaserFiredEvent', '    | SpamAttackStartedEvent', '    | SpamChannelStartedEvent'].join('\n'),
        ['    | LaserFiredEvent', '    | SpamChannelStartedEvent'].join('\n'),
        `${relativePath}: event union`,
    );

    write(relativePath, source, file.eol);
}

function updateBridgeEventHandler() {
    const relativePath =
        'src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler.ts';

    const file = read(relativePath);

    let source = normalize(file.source);

    source = replaceExact(
        source,
        [
            '            case ENCOUNTER_EVENT.SPAM_ATTACK_STARTED:',
            '                this.eventBus.emit(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED);',
            '                return;',
            '',
        ].join('\n'),
        '',
        `${relativePath}: obsolete spam attack case`,
    );

    source = replaceExact(
        source,
        [
            '            case ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED:',
            '                this.eventBus.emit(',
            '                    BRIDGE_EVENT.SPAM_CHANNEL_STARTED,',
        ].join('\n'),
        [
            '            case ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED:',
            '                this.eventBus.emit(',
            '                    BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED,',
            '                );',
            '',
            '                this.eventBus.emit(',
            '                    BRIDGE_EVENT.SPAM_CHANNEL_STARTED,',
        ].join('\n'),
        `${relativePath}: channel start warning clear`,
    );

    write(relativePath, source, file.eol);
}

function replaceSpamProjectorTest() {
    const relativePath = 'tests/engine/encounter/spam_projector.test.ts';

    const file = read(relativePath);

    const source = `// tests/engine/encounter/spam_projector.test.ts

import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { SPAM_CHANNEL_OUTCOME } from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Spam projector', () => {
    it('runs through targeting, channel expiry, cooldown and purge', () => {
        const { node, stationId } =
            createSingleStationNodeFixture();

        const nodeEnemy = ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00,

            anchorId: stationId,
        });

        node.actors.push(nodeEnemy);

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },

            pointDefense: createPointDefenseFixture(),
        });

        const [loadedEvent] = engine.drainEvents();

        if (
            loadedEvent.type !==
            ENCOUNTER_EVENT.ENCOUNTER_LOADED
        ) {
            throw new Error(
                \`Expected encounter loaded event, received: \` +
                    \`\${loadedEvent.type}\`,
            );
        }

        const enemy = loadedEvent.state.actors[0];
        const projector = enemy.weapons[0];

        if (
            projector.kind !==
            SHIP_WEAPON_KIND.SPAM_PROJECTOR
        ) {
            throw new Error(
                'Expected loaded enemy spam projector',
            );
        }

        const definition =
            SHIP_WEAPONS[projector.weaponId];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.SPAM_PROJECTOR
        ) {
            throw new Error(
                'Expected spam projector definition',
            );
        }

        expect(definition.channelDurationMs).toBe(20000);
        expect(definition.cooldownDurationMs).toBe(15000);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getSpamChannels()).toEqual([]);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: enemy.id,
                sourceWeaponId: projector.id,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );
        expect(projector.phaseElapsedMs).toBe(1);

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS -
                projector.phaseElapsedMs -
                1,
        );

        expect(engine.drainEvents()).toEqual([]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );
        expect(projector.phaseElapsedMs).toBe(
            SHIP_WEAPON_TARGETING_DURATION_MS - 1,
        );
        expect(engine.getSpamChannels()).toEqual([]);

        const firstChannel = {
            id: 'spam_channel_1',

            sourceActorId: enemy.id,
            sourceWeaponId: projector.id,

            elapsedMs: 0,
            durationMs: definition.channelDurationMs,
        };

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,

                channel: firstChannel,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBe(
            firstChannel.id,
        );
        expect(engine.getSpamChannels()).toEqual([
            firstChannel,
        ]);

        engine.step(definition.channelDurationMs - 1);

        expect(engine.drainEvents()).toEqual([]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );
        expect(projector.phaseElapsedMs).toBe(
            definition.channelDurationMs - 1,
        );
        expect(engine.getSpamChannels()).toEqual([
            {
                ...firstChannel,

                elapsedMs:
                    definition.channelDurationMs - 1,
            },
        ]);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,

                channel: {
                    ...firstChannel,

                    elapsedMs:
                        definition.channelDurationMs,
                },

                outcome:
                    SPAM_CHANNEL_OUTCOME.EXPIRED,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getSpamChannels()).toEqual([]);

        engine.step(definition.cooldownDurationMs);

        expect(engine.drainEvents()).toEqual([]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);

        // Second cycle reaches CHANNELING directly
        // after targeting and is stopped early by purge.
        engine.step(1);
        engine.drainEvents();

        const secondChannel = {
            ...firstChannel,

            id: 'spam_channel_2',
        };

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS -
                projector.phaseElapsedMs,
        );

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,

                channel: secondChannel,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );

        engine.step(7000);

        expect(engine.drainEvents()).toEqual([]);
        expect(engine.getSpamChannels()).toEqual([
            {
                ...secondChannel,

                elapsedMs: 7000,
            },
        ]);

        expect(
            engine.purgeSpamChannel(secondChannel.id),
        ).toBe(true);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,

                channel: {
                    ...secondChannel,

                    elapsedMs: 7000,
                },

                outcome:
                    SPAM_CHANNEL_OUTCOME.PURGED,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getSpamChannels()).toEqual([]);

        expect(
            engine.purgeSpamChannel(secondChannel.id),
        ).toBe(false);
        expect(engine.drainEvents()).toEqual([]);

        engine.step(definition.cooldownDurationMs);

        expect(engine.drainEvents()).toEqual([]);
        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);
    });
});
`;

    write(relativePath, source, file.eol);
}

function validateNoObsoleteSpamChargingReferences() {
    const roots = ['src', 'tests'];

    const forbidden = ['SPAM_ATTACK_STARTED', 'startSpamCharging', 'advanceSpamCharging'];

    for (const root of roots) {
        const rootPath = absolute(root);

        if (!fs.existsSync(rootPath)) {
            continue;
        }

        const stack = [rootPath];

        while (stack.length > 0) {
            const currentPath = stack.pop();

            if (!currentPath) {
                continue;
            }

            for (const entry of fs.readdirSync(currentPath, {
                withFileTypes: true,
            })) {
                const entryPath = path.join(currentPath, entry.name);

                if (entry.isDirectory()) {
                    stack.push(entryPath);
                    continue;
                }

                if (!entry.isFile() || !entry.name.endsWith('.ts')) {
                    continue;
                }

                const source = fs.readFileSync(entryPath, 'utf8');

                for (const token of forbidden) {
                    if (!source.includes(token)) {
                        continue;
                    }

                    throw new Error(
                        `Obsolete spam charging token remains: ` +
                            `${path.relative(PROJECT_ROOT, entryPath)}: ${token}`,
                    );
                }
            }
        }
    }
}

function rollback() {
    for (const [relativePath, original] of [...touchedFiles.entries()].reverse()) {
        const filePath = absolute(relativePath);

        fs.writeFileSync(filePath, original, 'utf8');
    }
}

try {
    updateShipWeaponDefinition();
    updateShipWeaponCatalog();
    updateCombatRunner();
    updateEncounterEvents();
    updateBridgeEventHandler();
    replaceSpamProjectorTest();

    validateNoObsoleteSpamChargingReferences();

    console.log('Applied direct spam channel lifecycle atom.');
    console.log('');
    console.log('Run:');
    console.log('  npm run typecheck');
    console.log('  npm test');
    console.log('  npm run dev');
} catch (error) {
    rollback();

    console.error(error instanceof Error ? error.message : error);

    console.error('No project files were left partially updated.');

    process.exitCode = 1;
}
