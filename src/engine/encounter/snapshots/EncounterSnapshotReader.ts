// src/engine/encounter/snapshots/EncounterSnapshotReader.ts

import type {
    PowerCoreState,
} from '../../defs/power_core';
import type { OfficerRole } from '../../defs/officer';
import type { PlayerHullState } from '../../defs/player';
import type { PlayerSpaceNavigationState } from '../../defs/player_location';
import type { ShipDriveState } from '../../defs/ship_drive';
import type {
    ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShieldGeneratorState,
} from '../../defs/shield_generator';
import { getAvailableOfficerCommands } from '../commands/queries/get_available_officer_commands';
import {
    getEnemyShipTelemetrySnapshots,
    type EnemyShipTelemetrySnapshot,
} from '../combat/queries/get_enemy_ship_telemetry_snapshots';
import {
    getEnemyDebugSnapshots,
    type EnemyDebugSnapshot,
} from '../debug/get_enemy_debug_snapshots';
import type { AvailableOfficerCommand } from '../model/command';
import type {
    ActiveShieldState,
    CombatProjectileState,
    LaserAttackState,
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

    public getPowerCoreState():
        PowerCoreState | undefined {
        return this.read(
            (state) =>
                state.combat
                    .powerCore,
        );
    }

    public getShieldGeneratorState():
        ShieldGeneratorState | undefined {
        return this.read(
            (state) =>
                state.combat
                    .shieldGenerator,
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

    public getLaserAttacks(): LaserAttackState[] {
        return this.read((state) => state.combat.laserAttacks);
    }

    private read<T>(select: (state: EncounterState) => T): T {
        return createDetachedSnapshot(select(this.state));
    }
}
