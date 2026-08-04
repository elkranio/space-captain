// src/engine/encounter/state/EncounterStateStore.ts

import type { LaserTargetZone } from '../../defs/laser';
import type { OfficerRole } from '../../defs/officer';
import type {
    PlayerHullDamageResult,
} from '../../defs/player';
import type {
    PlayerSpaceNavigationState,
} from '../../defs/player_location';
import type {
    PointDefenseBeamBand,
    PointDefenseShotOutcome,
} from '../../defs/point_defense';
import type {
    ShieldGeneratorState,
} from '../../defs/shield_generator';
import type {
    ShipDriveState,
} from '../../defs/ship_drive';
import type {
    LaserWeaponState,
    MissileLauncherState,
    ShipWeaponState,
    SpamProjectorState,
    StickyMineDispenserState,
} from '../../defs/ship_weapon';
import type {
    EncounterActorState,
} from '../actors/encounter_actor';
import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';
import type {
    EncounterAnchorState,
} from '../anchors/encounter_anchor';
import type {
    JumpPointEncounterAnchorState,
} from '../anchors/jump_point/jump_point_encounter_anchor';
import type {
    ActiveShieldState,
    ThreatIdentificationResult,
} from '../model/combat';
import type {
    OfficerTaskState,
} from '../model/officer_task';
import type {
    EncounterState,
} from '../model/state';
import EncounterActorStore, {
    type EnemyHullDamageResult,
    type SpawnShipActorInput,
} from './actors/EncounterActorStore';
import {
    createEncounterState,
    type CreateEncounterStateInput,
} from './create_encounter_state';
import EncounterNavigationStore, {
    type EncounterTravelStart,
} from './navigation/EncounterNavigationStore';
import OfficerTaskStore from './officer_tasks/OfficerTaskStore';
import PlayerShipStore from './player/PlayerShipStore';

export type {
    EnemyHullDamageResult,
    EncounterTravelStart,
    SpawnShipActorInput,
};

// Public mutable-state boundary for one encounter.
//
// Specialized stores own concrete mutation groups.
// This facade preserves the existing engine-facing API,
// so callers do not need to know the internal decomposition.
export default class EncounterStateStore {
    private readonly actors:
        EncounterActorStore;

    private readonly navigation:
        EncounterNavigationStore;

    private readonly playerShip:
        PlayerShipStore;

    private readonly officerTasks:
        OfficerTaskStore;

    constructor(
        private readonly state: EncounterState,
    ) {
        this.actors =
            new EncounterActorStore(
                this.state,
            );

        this.navigation =
            new EncounterNavigationStore(
                this.state,
            );

        this.playerShip =
            new PlayerShipStore(
                this.state,
            );

        this.officerTasks =
            new OfficerTaskStore(
                this.state,
            );
    }

    // #region Creation

    public static fromSpaceNode(
        input: CreateEncounterStateInput,
    ): EncounterStateStore {
        const store =
            new EncounterStateStore(
                createEncounterState(
                    input,
                ),
            );

        for (
            const actor of
            input.node.actors
        ) {
            store.spawnShipActor({
                actorId: actor.id,
                chassisId: actor.chassisId,
                anchorId: actor.anchorId,

                team: actor.team,

                hull: actor.hull,
                maxHull: actor.maxHull,

                drive: actor.drive,

                pointDefense:
                    actor.pointDefense,

                shieldGenerator:
                    actor.shieldGenerator,

                behavior:
                    actor.behavior,

                crewRoles:
                    actor.crewRoles,

                crewTraitsByRole:
                    actor.crewTraitsByRole,

                weapons: actor.weapons,
            });
        }

        return store;
    }

    // #endregion

    // #region State access

    // Mutable state intentionally remains available
    // to encounter runners.
    public getState(): EncounterState {
        return this.state;
    }

    public getNavigationState():
        PlayerSpaceNavigationState {
        return this.navigation
            .getNavigationState();
    }

    public findAnchorById(
        anchorId: string | undefined,
    ): EncounterAnchorState | undefined {
        return this.navigation
            .findAnchorById(
                anchorId,
            );
    }

    public findActorById(
        actorId: string | undefined,
    ): EncounterActorState | undefined {
        return this.actors
            .findActorById(
                actorId,
            );
    }

    public getActorsAtAnchor(
        anchorId: string,
    ): EncounterActorState[] {
        return this.actors
            .getActorsAtAnchor(
                anchorId,
            );
    }

    // #endregion

    // #region Player hull and drive

    public damagePlayerHull(
        damage: number,
    ): PlayerHullDamageResult {
        return this.playerShip
            .damagePlayerHull(
                damage,
            );
    }

    public disablePlayerDrive():
        ShipDriveState | undefined {
        return this.playerShip
            .disablePlayerDrive();
    }

    public repairPlayerDrive():
        ShipDriveState {
        return this.playerShip
            .repairPlayerDrive();
    }

    // #endregion

    // #region Actors

    public spawnShipActor(
        input: SpawnShipActorInput,
    ): ShipEncounterActorState {
        return this.actors
            .spawnShipActor(
                input,
            );
    }

    public removeActor(
        actorId: string,
    ): EncounterActorState {
        return this.actors
            .removeActor(
                actorId,
            );
    }

    public setActorTeam(
        actorId: string,
        team:
            SpawnShipActorInput['team'],
    ): ShipEncounterActorState {
        return this.actors
            .setActorTeam(
                actorId,
                team,
            );
    }

    public damageEnemyActorHull(
        actorId: string,
        damage: number,
    ): EnemyHullDamageResult {
        return this.actors
            .damageEnemyActorHull(
                actorId,
                damage,
            );
    }

    public consumeOpeningDisruptionPulse(
        actorId: string,
    ): ShipEncounterActorState | undefined {
        return this.actors
            .consumeOpeningDisruptionPulse(
                actorId,
            );
    }

    // #endregion

    // #region Navigation

    public completeArrival(): void {
        this.navigation
            .completeArrival();
    }

    public startTravel(
        targetAnchorId: string,
    ): EncounterTravelStart {
        return this.navigation
            .startTravel(
                targetAnchorId,
            );
    }

    public completeTravel(
        targetAnchorId: string,
    ): void {
        this.navigation
            .completeTravel(
                targetAnchorId,
            );
    }

    public abortTravel(
        expectedTargetAnchorId: string,
    ): void {
        this.navigation
            .abortTravel(
                expectedTargetAnchorId,
            );
    }

    public createJumpPoint(
        targetNodeId: string,
    ): JumpPointEncounterAnchorState {
        return this.navigation
            .createJumpPoint(
                targetNodeId,
            );
    }

    // #endregion

    // #region Player combat systems

    public findPlayerWeaponById(
        weaponId: string,
    ): ShipWeaponState | undefined {
        return this.playerShip
            .findPlayerWeaponById(
                weaponId,
            );
    }

    public startPlayerMissileTargeting(
        weaponId: string,
    ): MissileLauncherState {
        return this.playerShip
            .startPlayerMissileTargeting(
                weaponId,
            );
    }

    public startPlayerStickyMineDispensing(
        weaponId: string,
    ): StickyMineDispenserState {
        return this.playerShip
            .startPlayerStickyMineDispensing(
                weaponId,
            );
    }

    public cancelPlayerStickyMineDispensing(
        weaponId: string,
    ): StickyMineDispenserState | undefined {
        return this.playerShip
            .cancelPlayerStickyMineDispensing(
                weaponId,
            );
    }

    public startPlayerSpamTargeting(
        weaponId: string,
    ): SpamProjectorState {
        return this.playerShip
            .startPlayerSpamTargeting(
                weaponId,
            );
    }

    public cancelPlayerSpamProjection(
        weaponId: string,
    ): string | undefined {
        return this.playerShip
            .cancelPlayerSpamProjection(
                weaponId,
            );
    }

    public startPlayerLaserTargeting(
        weaponId: string,
    ): LaserWeaponState {
        return this.playerShip
            .startPlayerLaserTargeting(
                weaponId,
            );
    }

    public resetPlayerWeapon(
        weaponId: string,
    ): ShipWeaponState | undefined {
        return this.playerShip
            .resetPlayerWeapon(
                weaponId,
            );
    }

    public identifyThreat(
        threatId: string,
    ): ThreatIdentificationResult | undefined {
        return this.playerShip
            .identifyThreat(
                threatId,
            );
    }

    public deployPlayerShield(
        zone: LaserTargetZone,
    ): ActiveShieldState {
        return this.playerShip
            .deployPlayerShield(
                zone,
            );
    }

    public spendShieldGeneratorCharge():
        ShieldGeneratorState {
        return this.playerShip
            .spendShieldGeneratorCharge();
    }

    public spendPointDefenseCharge():
        number {
        return this.playerShip
            .spendPointDefenseCharge();
    }

    public firePointDefense(
        threatId: string,
        beamBand: PointDefenseBeamBand,
    ): PointDefenseShotOutcome | undefined {
        return this.playerShip
            .firePointDefense(
                threatId,
                beamBand,
            );
    }

    // #endregion

    // #region Officer task storage

    public getOfficerTask(
        role: OfficerRole,
    ): OfficerTaskState | undefined {
        return this.officerTasks
            .getOfficerTask(
                role,
            );
    }

    public getOfficerTasks():
        OfficerTaskState[] {
        return this.officerTasks
            .getOfficerTasks();
    }

    public findOfficerTaskById(
        taskId: string,
    ): OfficerTaskState | undefined {
        return this.officerTasks
            .findOfficerTaskById(
                taskId,
            );
    }

    public assignOfficerTask(
        task: OfficerTaskState,
    ): void {
        this.officerTasks
            .assignOfficerTask(
                task,
            );
    }

    public removeOfficerTask(
        role: OfficerRole,
    ): void {
        this.officerTasks
            .removeOfficerTask(
                role,
            );
    }

    public advanceOfficerTask(
        taskId: string,
        progressDeltaMs: number,
    ): void {
        this.officerTasks
            .advanceOfficerTask(
                taskId,
                progressDeltaMs,
            );
    }

    // #endregion
}
