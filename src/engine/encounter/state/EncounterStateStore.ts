// src/engine/encounter/state/EncounterStateStore.ts

import { MISSILES } from '../../content/catalogs/missiles';
import { SHIP_CHASSIS } from '../../content/catalogs/ship_chassis';
import { PLAYER_SHIELD_DURATION_MS } from '../../content/rules/shields';
import { JUMP_POINT_OBJECT_SPRITE_ID } from '../../defs/jump_point';
import type { LaserTargetZone } from '../../defs/laser';
import type { OfficerRole } from '../../defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND, type PlayerSpaceNavigationState } from '../../defs/player_location';
import {
    POINT_DEFENSE_SHOT_OUTCOME,
    type PointDefenseBeamBand,
    type PointDefenseShotOutcome,
    type PointDefenseState,
} from '../../defs/point_defense';
import type { ShieldGeneratorState } from '../../defs/shield_generator';
import type { ShipBehaviorState } from '../../defs/ship_behavior';
import {
    SHIP_DRIVE_STATUS,
    type ShipDriveState,
} from '../../defs/ship_drive';
import type { ShipChassisId } from '../../defs/ship_chassis';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type LaserWeaponState,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type { SpaceNodeState } from '../../defs/universe';
import { ENCOUNTER_ACTOR_KIND, type EncounterActorState } from '../actors/encounter_actor';
import type { ShipEncounterActorState } from '../actors/ship/ship_encounter_actor';
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorState } from '../anchors/encounter_anchor';
import type { JumpPointEncounterAnchorState } from '../anchors/jump_point/jump_point_encounter_anchor';
import { DOCKING_CLEARANCE_STATE } from '../anchors/station/station_encounter_anchor';
import type { EncounterTeam } from '../../defs/encounter_team';
import {
    COMBAT_THREAT_KIND,
    THREAT_IDENTIFICATION_STATUS,
    type ActiveShieldState,
    type ThreatIdentificationResult,
} from '../model/combat';
import type { OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { createEncounterState } from './create_encounter_state';

export type EncounterTravelStart = {
    fromAnchorId: string;
    target: EncounterAnchorState;
};

export type SpawnShipActorInput = {
    actorId: string;
    chassisId: ShipChassisId;
    anchorId: string;

    team: EncounterTeam;

    hull: number;
    maxHull: number;

    drive: ShipDriveState;
    shieldGenerator: ShieldGeneratorState;

    behavior: ShipBehaviorState;

    crewRoles: OfficerRole[];

    weapons: ShipWeaponState[];
};

// Владеет mutable runtime state одного encounter.
//
// Encounter runners могут изменять принадлежащие им
// участки state напрямую.
// Store централизует общие lookups, cross-system mutations
// и локальные invariants, которым нужен единый владелец.
export default class EncounterStateStore {
    constructor(private readonly state: EncounterState) {}

    // #region Creation

    public static fromSpaceNode(
        node: SpaceNodeState,
        navigation: PlayerSpaceNavigationState,
        drive: ShipDriveState,
        pointDefense: PointDefenseState,
        shieldGenerator?: ShieldGeneratorState,
        playerWeapons: ShipWeaponState[] = [],
    ): EncounterStateStore {
        const store = new EncounterStateStore(
            createEncounterState(
                node,
                navigation,
                drive,
                pointDefense,
                shieldGenerator,
                playerWeapons,
            ),
        );

        for (const actor of node.actors) {
            store.spawnShipActor({
                actorId: actor.id,
                chassisId: actor.chassisId,
                anchorId: actor.anchorId,

                team: actor.team,

                hull: actor.hull,
                maxHull: actor.maxHull,

                drive: actor.drive,
                shieldGenerator:
                    actor.shieldGenerator,

                behavior:
                    actor.behavior,

                crewRoles:
                    actor.crewRoles,

                weapons: actor.weapons,
            });
        }

        return store;
    }

    // #endregion

    // #region State access

    // Mutable state намеренно доступен encounter runners.
    // Queries используют тот же объект только для чтения.
    public getState(): EncounterState {
        return this.state;
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return {
            ...this.state.navigation,
        };
    }

    public findAnchorById(anchorId: string | undefined): EncounterAnchorState | undefined {
        if (!anchorId) {
            return undefined;
        }

        return this.state.anchors.find((anchor) => {
            return anchor.id === anchorId;
        });
    }

    public findActorById(actorId: string | undefined): EncounterActorState | undefined {
        if (!actorId) {
            return undefined;
        }

        return this.state.actors.find((actor) => {
            return actor.id === actorId;
        });
    }

    public getActorsAtAnchor(anchorId: string): EncounterActorState[] {
        return this.state.actors.filter((actor) => {
            return actor.anchorId === anchorId;
        });
    }

    // #endregion

    // #region Actor mutations

    public spawnShipActor({
        actorId,
        chassisId,
        anchorId,
        team,
        hull,
        maxHull,
        drive,
        shieldGenerator,
        behavior,
        crewRoles,
        weapons,
    }: SpawnShipActorInput): ShipEncounterActorState {
        if (!this.findAnchorById(anchorId)) {
            throw new Error(
                `Cannot spawn ship actor: ` +
                `anchor not found: ${anchorId}`,
            );
        }

        if (this.findActorById(actorId)) {
            throw new Error(
                `Encounter actor already exists: ${actorId}`,
            );
        }

        const ship =
            SHIP_CHASSIS[chassisId];

        const actor: ShipEncounterActorState = {
            id: actorId,
            kind: ENCOUNTER_ACTOR_KIND.SHIP,
            displayName: ship.name,

            team,

            anchorId,
            chassisId,

            hull,
            maxHull,

            drive: {
                ...drive,
            },

            shieldGenerator: {
                ...shieldGenerator,
            },

            behavior: {
                ...behavior,
            },

            crewRoles: [
                ...crewRoles,
            ],

            decision: {
                nextWeaponIndexByRole: {},

                offensiveTaskDelayRemainingMsByRole:
                    {},
            },

            crewTasks: {},

            hasUsedOpeningDisruptionPulse: false,

            weapons: weapons.map((weapon) => {
                return {
                    ...weapon,
                };
            }),
        };

        this.state.actors.push(actor);

        return actor;
    }

    public removeActor(
        actorId: string,
    ): EncounterActorState {
        const actorIndex =
            this.state.actors
                .findIndex((actor) => {
                    return (
                        actor.id ===
                        actorId
                    );
                });

        if (actorIndex < 0) {
            throw new Error(
                'Encounter actor not found: ' +
                    actorId,
            );
        }

        const actor =
            this.state.actors[
                actorIndex
            ];

        if (!actor) {
            throw new Error(
                'Encounter actor disappeared ' +
                    'before removal: ' +
                    actorId,
            );
        }

        this.state.actors.splice(
            actorIndex,
            1,
        );

        for (
            let index =
                this.state.combat
                    .laserAttacks
                    .length - 1;

            index >= 0;

            index -= 1
        ) {
            const attack =
                this.state.combat
                    .laserAttacks[
                        index
                    ];

            if (
                attack?.sourceActorId !==
                actorId
            ) {
                continue;
            }

            this.state.combat
                .laserAttacks.splice(
                    index,
                    1,
                );
        }

        return actor;
    }

    public setActorTeam(
        actorId: string,
        team: EncounterTeam,
    ): ShipEncounterActorState {
        const actor =
            this.findActorById(actorId);

        if (!actor) {
            throw new Error(
                `Encounter actor not found: ${actorId}`,
            );
        }

        actor.team = team;

        return actor;
    }

    public consumeOpeningDisruptionPulse(
        actorId: string,
    ): ShipEncounterActorState | undefined {
        const actor =
            this.findActorById(actorId);

        if (!actor) {
            throw new Error(
                `Encounter actor not found: ${actorId}`,
            );
        }

        if (
            actor.hasUsedOpeningDisruptionPulse
        ) {
            return undefined;
        }

        actor.hasUsedOpeningDisruptionPulse =
            true;

        return actor;
    }

    // #endregion

    // #region Navigation

    public completeArrival(): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ARRIVING) {
            throw new Error(`Cannot complete arrival from navigation state: ${navigation.kind}`);
        }

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: navigation.targetAnchorId,
        };
    }

    public startTravel(targetAnchorId: string): EncounterTravelStart {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            throw new Error(`Cannot start travel from navigation state: ${navigation.kind}`);
        }

        const target = this.findAnchorById(targetAnchorId);

        if (!target) {
            throw new Error(`Travel target not found: ${targetAnchorId}`);
        }

        const fromAnchorId = navigation.anchorId;

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,
            fromAnchorId,
            targetAnchorId: target.id,
        };

        return {
            fromAnchorId,
            target,
        };
    }

    public completeTravel(targetAnchorId: string): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING) {
            throw new Error(`Cannot complete travel from navigation state: ${navigation.kind}`);
        }

        if (navigation.targetAnchorId !== targetAnchorId) {
            throw new Error(
                `Travel target does not match navigation target: ` +
                    `${targetAnchorId} !== ${navigation.targetAnchorId}`,
            );
        }

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: targetAnchorId,
        };
    }

    public abortTravel(
        expectedTargetAnchorId: string,
    ): void {
        const navigation =
            this.state.navigation;

        if (
            navigation.kind !==
            PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING
        ) {
            throw new Error(
                `Cannot abort travel from navigation state: ` +
                    navigation.kind,
            );
        }

        if (
            navigation.targetAnchorId !==
            expectedTargetAnchorId
        ) {
            throw new Error(
                `Travel target does not match aborted task: ` +
                    `${navigation.targetAnchorId} !== ` +
                    expectedTargetAnchorId,
            );
        }

        this.state.navigation = {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: navigation.fromAnchorId,
        };
    }

    // #endregion

    // #region Player drive

    public disablePlayerDrive():
        ShipDriveState | undefined {
        const drive = this.state.drive;

        if (
            drive.status ===
            SHIP_DRIVE_STATUS.DISABLED
        ) {
            return undefined;
        }

        drive.status =
            SHIP_DRIVE_STATUS.DISABLED;

        return {
            ...drive,
        };
    }

    public repairPlayerDrive(): ShipDriveState {
        const drive = this.state.drive;

        if (
            drive.status !==
            SHIP_DRIVE_STATUS.DISABLED
        ) {
            throw new Error(
                'Cannot repair player drive from status: ' +
                    drive.status,
            );
        }

        drive.status =
            SHIP_DRIVE_STATUS.ONLINE;

        return {
            ...drive,
        };
    }

    // #endregion

    // #region Combat

    public startPlayerLaserTargeting(
        weaponId: string,
    ): LaserWeaponState {
        const weapon =
            this.state.combat
                .playerWeapons
                .find((candidate) => {
                    return (
                        candidate.id ===
                        weaponId
                    );
                });

        if (!weapon) {
            throw new Error(
                'Player weapon not found: ' +
                    weaponId,
            );
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND.LASER
        ) {
            throw new Error(
                'Player weapon is not a laser: ' +
                    weaponId +
                    '/' +
                    weapon.kind,
            );
        }

        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.READY
        ) {
            throw new Error(
                'Player laser is not ready: ' +
                    weaponId +
                    '/' +
                    weapon.phase,
            );
        }

        weapon.phase =
            SHIP_WEAPON_PHASE.TARGETING;

        weapon.phaseElapsedMs = 0;

        return {
            ...weapon,
        };
    }

    public resetPlayerWeapon(
        weaponId: string,
    ): ShipWeaponState | undefined {
        const weapon =
            this.state.combat
                .playerWeapons
                .find((candidate) => {
                    return (
                        candidate.id ===
                        weaponId
                    );
                });

        if (!weapon) {
            return undefined;
        }

        weapon.phase =
            SHIP_WEAPON_PHASE.READY;

        weapon.phaseElapsedMs = 0;

        return {
            ...weapon,
        };
    }

    public identifyThreat(threatId: string): ThreatIdentificationResult | undefined {
        const projectile = this.state.combat.projectiles.find((candidate) => {
            return candidate.id === threatId;
        });

        if (projectile) {
            if (projectile.identification.status === THREAT_IDENTIFICATION_STATUS.IDENTIFIED) {
                return {
                    kind: COMBAT_THREAT_KIND.MISSILE,

                    spectralBand: projectile.identification.spectralBand,
                };
            }

            const spectralBand = MISSILES[projectile.missileId].spectralBand;

            projectile.identification = {
                status: THREAT_IDENTIFICATION_STATUS.IDENTIFIED,
                spectralBand,
            };

            return {
                kind: COMBAT_THREAT_KIND.MISSILE,

                spectralBand,
            };
        }

        const laserAttack = this.state.combat.laserAttacks.find((candidate) => {
            return candidate.id === threatId;
        });

        // Угроза могла сработать или быть уничтожена
        // до завершения Science task.
        if (!laserAttack) {
            return undefined;
        }

        if (laserAttack.identification.status === THREAT_IDENTIFICATION_STATUS.IDENTIFIED) {
            return {
                kind: COMBAT_THREAT_KIND.LASER,

                targetZone: laserAttack.identification.targetZone,
            };
        }

        laserAttack.identification = {
            status: THREAT_IDENTIFICATION_STATUS.IDENTIFIED,

            targetZone: laserAttack.targetZone,
        };

        return {
            kind: COMBAT_THREAT_KIND.LASER,

            targetZone: laserAttack.targetZone,
        };
    }

    public deployPlayerShield(zone: LaserTargetZone): ActiveShieldState {
        const activeShield: ActiveShieldState = {
            zone,

            elapsedMs: 0,
            durationMs: PLAYER_SHIELD_DURATION_MS,
        };

        // Повторное развёртывание заменяет старую зону
        // и полностью обновляет lifetime.
        this.state.combat.activeShield = activeShield;

        return {
            ...activeShield,
        };
    }

    public spendShieldGeneratorCharge(): ShieldGeneratorState {
        const shieldGenerator = this.state.combat.shieldGenerator;

        if (!shieldGenerator) {
            throw new Error('Cannot spend shield-generator charge: generator not installed');
        }

        if (shieldGenerator.charges <= 0) {
            throw new Error('Cannot spend shield-generator charge: no charges remaining');
        }

        shieldGenerator.charges -= 1;

        // Текущий progress последовательной регенерации
        // не сбрасывается при расходе ещё одного charge.
        return {
            ...shieldGenerator,
        };
    }

    public spendPointDefenseCharge(): number {
        const pointDefense = this.state.combat.pointDefense;

        if (pointDefense.charges <= 0) {
            throw new Error('Cannot spend point-defense charge: no charges remaining');
        }

        pointDefense.charges -= 1;

        return pointDefense.charges;
    }

    public firePointDefense(threatId: string, beamBand: PointDefenseBeamBand): PointDefenseShotOutcome | undefined {
        const threatIndex = this.state.combat.projectiles.findIndex((projectile) => {
            return projectile.id === threatId;
        });

        // Ракета могла ударить или быть уничтожена
        // до завершения Weapons task.
        //
        // Заряд уже был потрачен при начале aim.
        if (threatIndex < 0) {
            return undefined;
        }

        const threat = this.state.combat.projectiles[threatIndex];

        const missile = MISSILES[threat.missileId];

        const outcome =
            missile.spectralBand === beamBand ? POINT_DEFENSE_SHOT_OUTCOME.HIT : POINT_DEFENSE_SHOT_OUTCOME.MISS;

        if (outcome === POINT_DEFENSE_SHOT_OUTCOME.HIT) {
            this.state.combat.projectiles.splice(threatIndex, 1);
        }

        return outcome;
    }

    // #endregion

    // #region Encounter object mutations

    public createJumpPoint(targetNodeId: string): JumpPointEncounterAnchorState {
        const existingJumpPoint = this.state.anchors.find((anchor) => {
            return anchor.kind === ENCOUNTER_ANCHOR_KIND.JUMP_POINT;
        });

        if (existingJumpPoint) {
            throw new Error(`Encounter already contains jump point: ${existingJumpPoint.id}`);
        }

        const id = `jump_point_${targetNodeId}`;

        if (this.findAnchorById(id)) {
            throw new Error(`Cannot create duplicate encounter anchor: ${id}`);
        }

        const anchor: JumpPointEncounterAnchorState = {
            id,
            kind: ENCOUNTER_ANCHOR_KIND.JUMP_POINT,
            displayName: 'JUMP POINT',

            jumpPoint: {
                id,
                name: 'JUMP POINT',
                targetNodeId,
                objectSpriteId: JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT_00,
            },

            // Временная постановочная позиция внутри текущей ноды.
            localPosition: {
                x: 1500,
                y: -250,
                z: 700,
            },

            position: {
                x: 0,
                y: 0,
            },

            perspectiveDepth: 1,
        };

        this.state.anchors.push(anchor);

        return anchor;
    }

    public grantDockingClearance(targetAnchorId: string): void {
        const target = this.findAnchorById(targetAnchorId);

        if (!target) {
            throw new Error(`Cannot grant docking clearance: ` + `encounter anchor not found: ${targetAnchorId}`);
        }

        switch (target.kind) {
            case ENCOUNTER_ANCHOR_KIND.STATION:
                target.docking.clearance = DOCKING_CLEARANCE_STATE.GRANTED;
                return;

            default:
                throw new Error(`Cannot grant docking clearance to encounter anchor: ` + `${target.kind}`);
        }
    }

    // #endregion

    // #region Officer task storage

    public getOfficerTask(role: OfficerRole): OfficerTaskState | undefined {
        return this.state.officerTasks[role];
    }

    public getOfficerTasks(): OfficerTaskState[] {
        return Object.values(this.state.officerTasks).filter((task): task is OfficerTaskState => {
            return task !== undefined;
        });
    }

    public findOfficerTaskById(taskId: string): OfficerTaskState | undefined {
        return this.getOfficerTasks().find((task) => {
            return task.id === taskId;
        });
    }

    public assignOfficerTask(task: OfficerTaskState): void {
        const activeTask = this.getOfficerTask(task.role);

        if (activeTask) {
            throw new Error(
                `Cannot assign officer task ${task.kind}: ` +
                    `officer ${task.role} is already busy with ${activeTask.kind}`,
            );
        }

        this.state.officerTasks[task.role] = task;
    }

    public removeOfficerTask(role: OfficerRole): void {
        delete this.state.officerTasks[role];
    }

    public advanceOfficerTask(
        taskId: string,
        progressDeltaMs: number,
    ): void {
        if (!Number.isFinite(progressDeltaMs) || progressDeltaMs < 0) {
            throw new Error(
                'Invalid officer task progress delta: ' +
                    taskId + '/' + progressDeltaMs,
            );
        }

        const task = this.findOfficerTaskById(taskId);

        if (!task || task.durationMs === null) {
            return;
        }

        task.elapsedMs = Math.min(
            task.elapsedMs + progressDeltaMs,
            task.durationMs,
        );
    }

    // #endregion
}
