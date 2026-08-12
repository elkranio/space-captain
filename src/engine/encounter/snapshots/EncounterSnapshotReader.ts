// src/engine/encounter/snapshots/EncounterSnapshotReader.ts

import { SHIP_WEAPONS } from '../../content/catalogs/ship_weapons';
import type {
    DefenseCapacitorState,
} from '../../defs/defense_capacitor';
import type { OfficerRole } from '../../defs/officer';
import type { PlayerHullState } from '../../defs/player';
import type { PlayerSpaceNavigationState } from '../../defs/player_location';
import type { ShipDriveState } from '../../defs/ship_drive';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShieldEmitterState,
} from '../../defs/shield_emitter';
import { getAvailableOfficerCommands } from '../commands/queries/get_available_officer_commands';
import {
    getEnemyShipTelemetrySnapshots,
    type EnemyShipTelemetrySnapshot,
} from '../combat/queries/get_enemy_ship_telemetry_snapshots';
import {
    getLaserThreatSnapshots,
    type LaserThreatSnapshot,
} from '../combat/queries/get_laser_threat_snapshots';
import {
    getStickyMineSnapshots,
    type StickyMineSnapshot,
} from '../combat/queries/get_sticky_mine_snapshots';
import {
    getEnemyDebugSnapshots,
    type EnemyDebugSnapshot,
} from '../debug/get_enemy_debug_snapshots';
import type { AvailableOfficerCommand } from '../model/command';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type ActiveShieldState,
    type CombatProjectileState,
    type LaserAttackState,
    type SpamChannelState,
    type StickyMineState,
} from '../model/combat';
import type { OfficerAvailabilityStates } from '../model/officer_availability';
import type { OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { getOfficerAvailabilityStates } from '../officer_availability/queries/get_officer_availability_states';
import { createDetachedSnapshot } from './create_detached_snapshot';
import {
    createCombatPresentationSnapshot,
    type CombatPresentationSnapshot,
} from './combat_presentation_snapshot';

// App-facing read boundary for one EncounterState.
//
// The reader owns no mutable state and caches nothing. Every call reads the
// current authoritative state and returns a recursively detached value.
export default class EncounterSnapshotReader {
    constructor(private readonly state: EncounterState) {}

    public getCombatPresentationSnapshot():
        CombatPresentationSnapshot {
        return this.read(
            createCombatPresentationSnapshot,
        );
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return this.read((state) => state.navigation);
    }

    public getDriveState(): ShipDriveState {
        return this.read((state) => state.drive);
    }

    public getPlayerHullState(): PlayerHullState {
        return this.read((state) => state.playerHull);
    }

    public getAvailableCommands(role: OfficerRole): AvailableOfficerCommand[] {
        return this.read((state) => {
            return getAvailableOfficerCommands(state, role);
        });
    }

    public getOfficerAvailabilityStates(): OfficerAvailabilityStates {
        return this.read(getOfficerAvailabilityStates);
    }

    public getOfficerTasks(): OfficerTaskState[] {
        return this.read((state) => {
            return Object.values(state.officerTasks).filter(
                (task): task is OfficerTaskState => task !== undefined,
            );
        });
    }

    public getPlayerWeaponStates(): ShipWeaponState[] {
        return this.read((state) => state.combat.playerWeapons);
    }

    public getDefenseCapacitorState():
        DefenseCapacitorState | undefined {
        return this.read(
            (state) =>
                state.combat
                    .defenseCapacitor,
        );
    }

    public getShieldEmitterState():
        ShieldEmitterState | undefined {
        return this.read(
            (state) =>
                state.combat
                    .shieldEmitter,
        );
    }

    public getActiveShieldState():
        ActiveShieldState | null {
        return this.read(
            (state) =>
                state.combat
                    .activeShield,
        );
    }

    public getEnemyShipTelemetrySnapshots(): EnemyShipTelemetrySnapshot[] {
        return this.read(getEnemyShipTelemetrySnapshots);
    }


    public getEnemyDebugSnapshots():
        EnemyDebugSnapshot[] {
        return this.read(
            getEnemyDebugSnapshots,
        );
    }

    public getCombatProjectiles(): CombatProjectileState[] {
        return this.read((state) => state.combat.projectiles);
    }

    public getIncomingMissileProjectiles(): CombatProjectileState[] {
        return this.read((state) => {
            return state.combat.projectiles.filter((projectile) => {
                return (
                    projectile.source.kind === COMBAT_SOURCE_KIND.ACTOR &&
                    projectile.target.kind === COMBAT_TARGET_KIND.PLAYER_SHIP
                );
            });
        });
    }

    public getOutgoingMissileProjectiles(): CombatProjectileState[] {
        return this.read((state) => {
            return state.combat.projectiles.filter((projectile) => {
                return (
                    projectile.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                    projectile.target.kind === COMBAT_TARGET_KIND.ACTOR
                );
            });
        });
    }

    public getOutgoingStickyMines(): StickyMineState[] {
        return this.read((state) => {
            return state.combat.stickyMines.filter((mine) => {
                return (
                    mine.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                    mine.target.kind === COMBAT_TARGET_KIND.ACTOR
                );
            });
        });
    }

    public getStickyMineSnapshots(): StickyMineSnapshot[] {
        return this.read(getStickyMineSnapshots);
    }

    public getLaserAttacks(): LaserAttackState[] {
        return this.read((state) => state.combat.laserAttacks);
    }

    public getSpamChannels(): SpamChannelState[] {
        return this.read(selectSpamChannels);
    }

    public getLaserThreatSnapshots(): LaserThreatSnapshot[] {
        return this.read(getLaserThreatSnapshots);
    }

    private read<T>(select: (state: EncounterState) => T): T {
        return createDetachedSnapshot(select(this.state));
    }
}

function selectSpamChannels(state: EncounterState): SpamChannelState[] {
    const channels: SpamChannelState[] = [];

    for (const actor of state.actors) {
        if (actor.hull <= 0) {
            continue;
        }

        for (const weapon of actor.weapons) {
            if (
                weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR ||
                weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING
            ) {
                continue;
            }

            const channelId = weapon.activeChannelId;

            if (!channelId) {
                throw new Error(
                    `Spam projector channel id is missing: ` +
                        `${actor.id}/${weapon.id}/${weapon.phase}`,
                );
            }

            const definition = SHIP_WEAPONS[weapon.weaponId];

            if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
                throw new Error(
                    `Spam projector definition mismatch: ` +
                        `${actor.id}/${weapon.id}/${weapon.weaponId}`,
                );
            }

            channels.push({
                id: channelId,
                sourceActorId: actor.id,
                sourceWeaponId: weapon.id,
                elapsedMs: Math.min(
                    weapon.phaseElapsedMs,
                    definition.channelDurationMs,
                ),
                durationMs: definition.channelDurationMs,
            });
        }
    }

    return channels;
}
