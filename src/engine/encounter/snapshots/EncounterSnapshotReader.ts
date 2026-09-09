// src/engine/encounter/snapshots/EncounterSnapshotReader.ts

import type { OfficerRole } from "../../defs/officer";
import { getAvailableOfficerCommands } from "../commands/queries/get_available_officer_commands";
import { getEnemyDebugSnapshots, type EnemyDebugSnapshot } from "../debug/get_enemy_debug_snapshots";
import type { AvailableOfficerCommand } from "../model/command";
import {
    createBeamCannonAttackSnapshot,
    type BeamCannonAttackSnapshot,
    type CombatProjectileState,
} from "../model/combat";
import type { EncounterState } from "../model/state";
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

    public getAvailableCommands(role: OfficerRole): AvailableOfficerCommand[] {
        return this.read((state) => {
            return getAvailableOfficerCommands(state, role);
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
