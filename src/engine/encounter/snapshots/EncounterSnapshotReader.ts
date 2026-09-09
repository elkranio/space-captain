// src/engine/encounter/snapshots/EncounterSnapshotReader.ts

import type { OfficerRole } from "../../defs/officer";
import type { PlayerHullState } from "../../defs/player";
import type { PlayerSpaceNavigationState } from "../../defs/player_location";
import type { ShipEvadeState } from "../../defs/ship_evade";
import type { ShipWeaponState } from "../../defs/ship_weapon";
import { getAvailableOfficerCommands } from "../commands/queries/get_available_officer_commands";
import { getEnemyDebugSnapshots, type EnemyDebugSnapshot } from "../debug/get_enemy_debug_snapshots";
import type { AvailableOfficerCommand } from "../model/command";
import {
    createBeamCannonAttackSnapshot,
    type BeamCannonAttackSnapshot,
    type CombatProjectileState,
} from "../model/combat";
import {
    createShipWeaponStateSnapshot,
} from "../model/equipment";
import type { OfficerAvailabilityStates } from "../model/officer_availability";
import type { OfficerTaskState } from "../model/officer_task";
import type { EncounterShipDriveState, EncounterState } from "../model/state";
import { getOfficerAvailabilityStates } from "../officer_availability/queries/get_officer_availability_states";
import { createDetachedSnapshot } from "./create_detached_snapshot";
import { createCombatPresentationSnapshot, type CombatPresentationSnapshot } from "./combat_presentation_snapshot";
import {
    createEncounterPresentationSnapshot,
    type EncounterPresentationSnapshot,
} from "./encounter_presentation_snapshot";

// App-facing read boundary for one EncounterState.
//
// The reader owns no mutable state and caches nothing. Every call reads the
// current authoritative state and returns a recursively detached value.
export default class EncounterSnapshotReader {
    constructor(private readonly state: EncounterState) {}

    public getPresentationSnapshot(): EncounterPresentationSnapshot {
        return this.read(createEncounterPresentationSnapshot);
    }

    public getCombatPresentationSnapshot(): CombatPresentationSnapshot {
        return this.read(createCombatPresentationSnapshot);
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return this.read((state) => state.navigation);
    }

    public getDriveState(): EncounterShipDriveState {
        return this.read((state) => state.drive);
    }

    public getEvadeState(): ShipEvadeState {
        return this.read((state) => state.evade);
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
            return Object.values(state.officerTasks).filter((task): task is OfficerTaskState => task !== undefined);
        });
    }

    public getPlayerWeaponStates(): ShipWeaponState[] {
        return this.read((state) => {
            return state.combat.playerWeapons.map(createShipWeaponStateSnapshot);
        });
    }

    public getEnemyDebugSnapshots(): EnemyDebugSnapshot[] {
        return this.read(getEnemyDebugSnapshots);
    }

    public getCombatProjectiles(): CombatProjectileState[] {
        return this.read((state) => state.combat.projectiles);
    }

    public getBeamCannonAttacks(): BeamCannonAttackSnapshot[] {
        return this.read((state) => {
            return state.combat.beamCannonAttacks.map(createBeamCannonAttackSnapshot);
        });
    }

    private read<T>(select: (state: EncounterState) => T): T {
        return createDetachedSnapshot(select(this.state));
    }
}
