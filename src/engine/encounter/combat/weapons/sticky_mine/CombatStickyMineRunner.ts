import {
    SHIP_WEAPONS,
} from '../../../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../../defs/encounter_team';
import {
    advanceShipWeaponCooldown,
    commitShipWeaponCooldown,
    finishShipWeaponAction,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserDefinition,
    type StickyMineDispenserState,
} from '../../../../defs/ship_weapon';
import type { ShipEncounterActorState } from '../../../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_STICKY_MINE_OUTCOME,
    type StickyMineState,
} from '../../../model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../../model/event';
import type { EncounterState } from '../../../model/state';
import EncounterStateStore from '../../../state/EncounterStateStore';
import CombatRuntimeIdentityFactory from '../../CombatRuntimeIdentityFactory';

export type PlayerStickyMineAttachInput = {
    sourceWeaponId: string;
    damage: number;
    fuseDurationMs: number;
    targetActorId: string;
    ageMs: number;
};

type CombatStickyMineRunnerOptions = {
    stateStore: EncounterStateStore;
    identities: CombatRuntimeIdentityFactory;
    emit: (event: EncounterEvent) => void;
    interruptRandomOfficerTask: () => void;
    destroyEnemyActor: (actorId: string) => void;
};

// Owns the complete sticky-mine lifecycle for both combat directions:
// queued player attachments, enemy dispenser phases, active fuses,
// detonation, target loss and actor-target cleanup.
export default class CombatStickyMineRunner {
    private readonly stateStore:
        EncounterStateStore;

    private readonly state: EncounterState;

    private readonly identities:
        CombatRuntimeIdentityFactory;

    private readonly emit:
        (event: EncounterEvent) => void;

    private readonly interruptRandomOfficerTask:
        () => void;

    private readonly destroyEnemyActor:
        (actorId: string) => void;

    private readonly pendingPlayerAttachments:
        PlayerStickyMineAttachInput[] = [];

    constructor({
        stateStore,
        identities,
        emit,
        interruptRandomOfficerTask,
        destroyEnemyActor,
    }: CombatStickyMineRunnerOptions) {
        this.stateStore = stateStore;
        this.identities = identities;
        this.emit = emit;
        this.interruptRandomOfficerTask =
            interruptRandomOfficerTask;
        this.destroyEnemyActor =
            destroyEnemyActor;

        this.state =
            this.stateStore
                .getState();
    }

    public captureExistingMineIds(): string[] {
        return this.state.combat
            .stickyMines
            .map((mine) => {
                return mine.id;
            });
    }

    public queuePlayerAttach(
        input: PlayerStickyMineAttachInput,
    ): void {
        if (
            !Number.isFinite(input.ageMs) ||
            input.ageMs < 0
        ) {
            throw new Error(
                'Invalid player sticky-mine age: ' +
                    String(input.ageMs),
            );
        }

        this.pendingPlayerAttachments.push({
            ...input,
        });
    }

    public integratePendingPlayerAttachments(): void {
        const attachments =
            this.pendingPlayerAttachments
                .splice(0);

        for (const attachment of attachments) {
            this.attachPlayerMine(attachment);
        }
    }

    public advanceExistingMines(
        mineIds: readonly string[],
        deltaMs: number,
    ): void {
        for (const mineId of mineIds) {
            const index =
                this.state.combat
                    .stickyMines
                    .findIndex((mine) => {
                        return mine.id === mineId;
                    });

            // A previous lethal resolution may have removed this mine during
            // the same combat step.
            if (index < 0) {
                continue;
            }

            const mine =
                this.state.combat
                    .stickyMines[index];

            if (
                mine.target.kind ===
                COMBAT_TARGET_KIND.ACTOR
            ) {
                const targetActorId =
                    mine.target.actorId;

                const target =
                    this.state.actors.find(
                        (actor) => {
                            return (
                                actor.id ===
                                targetActorId
                            );
                        },
                    );

                if (
                    !target ||
                    target.team !==
                        ENCOUNTER_TEAM.ENEMY ||
                    target.hull <= 0
                ) {
                    this.resolvePlayerTargetLost(
                        index,
                        mine,
                    );

                    continue;
                }
            }

            mine.timeToDetonationMs =
                Math.max(
                    0,
                    mine.timeToDetonationMs -
                        deltaMs,
                );

            if (mine.timeToDetonationMs > 0) {
                continue;
            }

            this.resolveDetonation(
                index,
                mine,
            );
        }
    }

    public advanceEnemyDispenser(
        actor: ShipEncounterActorState,
        dispenser: StickyMineDispenserState,
        deltaMs: number,
        worldDeltaMs: number,
    ): void {
        const definition =
            this.getDispenserDefinition(
                dispenser,
            );

        advanceShipWeaponCooldown(
            dispenser,
            definition.cooldownDurationMs,
            worldDeltaMs,
        );

        switch (dispenser.phase) {
            case SHIP_WEAPON_PHASE.READY:
                return;

            case SHIP_WEAPON_PHASE.TARGETING:
                throw new Error(
                    `Sticky-mine dispenser cannot enter targeting phase: ` +
                        `${actor.id}/${dispenser.id}`,
                );

            case SHIP_WEAPON_PHASE.DISPENSING:
                this.ensureDispensingStarted(
                    actor,
                    dispenser,
                );
                this.advanceDispensing(
                    actor,
                    dispenser,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.COOLDOWN:
                return;

            case SHIP_WEAPON_PHASE.CHARGING:
                throw new Error(
                    `Sticky-mine dispenser cannot enter charging phase: ` +
                        `${actor.id}/${dispenser.id}`,
                );

            case SHIP_WEAPON_PHASE.CHANNELING:
                throw new Error(
                    `Sticky-mine dispenser cannot enter channeling phase: ` +
                        `${actor.id}/${dispenser.id}`,
                );
        }
    }

    public clearMine(mineId: string): boolean {
        const mineIndex =
            this.state.combat
                .stickyMines
                .findIndex((mine) => {
                    return (
                        mine.id === mineId &&
                        mine.target.kind ===
                            COMBAT_TARGET_KIND
                                .PLAYER_SHIP
                    );
                });

        if (mineIndex < 0) {
            return false;
        }

        this.state.combat
            .stickyMines
            .splice(mineIndex, 1);

        return true;
    }

    public clearPlayerMineFromActor(
        mineId: string,
        targetActorId: string,
    ): boolean {
        const mineIndex =
            this.state.combat
                .stickyMines
                .findIndex((mine) => {
                    return (
                        mine.id ===
                            mineId &&
                        mine.source.kind ===
                            COMBAT_SOURCE_KIND
                                .PLAYER_SHIP &&
                        mine.target.kind ===
                            COMBAT_TARGET_KIND
                                .ACTOR &&
                        mine.target.actorId ===
                            targetActorId
                    );
                });

        if (mineIndex < 0) {
            return false;
        }

        const [
            mine,
        ] =
            this.state.combat
                .stickyMines
                .splice(
                    mineIndex,
                    1,
                );

        if (!mine) {
            throw new Error(
                'Cleared player sticky mine ' +
                    'disappeared during removal: ' +
                    mineId,
            );
        }

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_STICKY_MINE_RESOLVED,

            mine,

            outcome:
                PLAYER_STICKY_MINE_OUTCOME
                    .CLEARED,
        });

        return true;
    }

    public removePlayerMinesTargetingActor(
        actorId: string,
    ): void {
        for (
            let index =
                this.state.combat
                    .stickyMines.length - 1;
            index >= 0;
            index -= 1
        ) {
            const mine =
                this.state.combat
                    .stickyMines[index];

            if (
                mine.source.kind !==
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP ||
                mine.target.kind !==
                    COMBAT_TARGET_KIND.ACTOR ||
                mine.target.actorId !== actorId
            ) {
                continue;
            }

            this.resolvePlayerTargetLost(
                index,
                mine,
            );
        }
    }

    private attachPlayerMine(
        input: PlayerStickyMineAttachInput,
    ): void {
        const target =
            this.state.actors.find(
                (actor) => {
                    return (
                        actor.id ===
                        input.targetActorId
                    );
                },
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY ||
            target.hull <= 0
        ) {
            throw new Error(
                'Cannot attach player sticky mine to invalid target: ' +
                    input.sourceWeaponId +
                    '/' +
                    input.targetActorId,
            );
        }

        const mine: StickyMineState = {
            id:
                this.identities
                    .createStickyMineId(),

            source: {
                kind:
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP,
            },

            sourceWeaponId:
                input.sourceWeaponId,

            target: {
                kind:
                    COMBAT_TARGET_KIND.ACTOR,

                actorId:
                    input.targetActorId,
            },

            timeToDetonationMs:
                Math.max(
                    0,
                    input.fuseDurationMs -
                        input.ageMs,
                ),

            initialTimeToDetonationMs:
                input.fuseDurationMs,

            damage: input.damage,
        };

        this.state.combat
            .stickyMines
            .push(mine);

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_STICKY_MINE_ATTACHED,

            mine,
        });
    }

    private ensureDispensingStarted(
        actor: ShipEncounterActorState,
        dispenser: StickyMineDispenserState,
    ): void {
        if (
            dispenser.dispensedMineCount >
            0
        ) {
            return;
        }

        this.attachEnemyMine(
            actor,
            dispenser,
            0,
        );
    }

    private advanceDispensing(
        actor: ShipEncounterActorState,
        dispenser: StickyMineDispenserState,
        deltaMs: number,
    ): void {
        const definition =
            this.getDispenserDefinition(
                dispenser,
            );

        dispenser.phaseElapsedMs += deltaMs;

        while (
            dispenser.dispensedMineCount <
                definition.salvoSize &&
            dispenser.ammoCount > 0 &&
            dispenser.phaseElapsedMs >=
                definition.launchIntervalMs
        ) {
            dispenser.phaseElapsedMs -=
                definition.launchIntervalMs;

            this.attachEnemyMine(
                actor,
                dispenser,
                dispenser.phaseElapsedMs,
            );
        }

        if (
            dispenser.dispensedMineCount <
                definition.salvoSize &&
            dispenser.ammoCount > 0
        ) {
            return;
        }

        finishShipWeaponAction(
            dispenser,
            definition.cooldownDurationMs,
        );
    }

    private attachEnemyMine(
        actor: ShipEncounterActorState,
        dispenser: StickyMineDispenserState,
        ageMs: number,
    ): void {
        const definition =
            this.getDispenserDefinition(
                dispenser,
            );

        if (
            dispenser.dispensedMineCount >=
            definition.salvoSize
        ) {
            throw new Error(
                `Cannot exceed sticky-mine salvo size: ` +
                    `${actor.id}/${dispenser.id}/${definition.salvoSize}`,
            );
        }

        if (
            dispenser.ammoCount <= 0
        ) {
            throw new Error(
                `Cannot launch sticky mine from empty dispenser: ` +
                    `${actor.id}/${dispenser.id}`,
            );
        }

        if (
            dispenser.dispensedMineCount === 0
        ) {
            // First physical attachment is the mine-dispenser commitment edge.
            commitShipWeaponCooldown(
                dispenser,
                definition.cooldownDurationMs,
            );
        }

        const mine: StickyMineState = {
            id:
                this.identities
                    .createStickyMineId(),

            source: {
                kind:
                    COMBAT_SOURCE_KIND.ACTOR,

                actorId: actor.id,
            },

            sourceWeaponId: dispenser.id,

            target: {
                kind:
                    COMBAT_TARGET_KIND
                        .PLAYER_SHIP,
            },

            timeToDetonationMs:
                Math.max(
                    0,
                    definition.fuseDurationMs -
                        ageMs,
                ),

            initialTimeToDetonationMs:
                definition.fuseDurationMs,

            damage: definition.damage,
        };

        dispenser.ammoCount -= 1;
        dispenser.dispensedMineCount += 1;

        this.state.combat
            .stickyMines
            .push(mine);

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .STICKY_MINE_ATTACHED,

            mine,
        });

        if (mine.timeToDetonationMs > 0) {
            return;
        }

        this.resolveDetonation(
            this.state.combat
                .stickyMines.length - 1,
            mine,
        );
    }

    private resolveDetonation(
        index: number,
        mine: StickyMineState,
    ): void {
        mine.timeToDetonationMs = 0;

        this.state.combat
            .stickyMines
            .splice(index, 1);

        if (
            mine.source.kind ===
                COMBAT_SOURCE_KIND.ACTOR &&
            mine.target.kind ===
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP
        ) {
            const damageResult =
                this.stateStore
                    .damagePlayerHull(
                        mine.damage,
                    );

            this.emit({
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine,

                ...damageResult,
            });

            this.interruptRandomOfficerTask();
            return;
        }

        if (
            mine.source.kind ===
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP &&
            mine.target.kind ===
                COMBAT_TARGET_KIND.ACTOR
        ) {
            this.resolvePlayerImpact(
                mine,
                mine.target.actorId,
            );
            return;
        }

        throw new Error(
            'Unsupported sticky-mine detonation route: ' +
                mine.id +
                '/' +
                mine.source.kind +
                '/' +
                mine.target.kind,
        );
    }

    private resolvePlayerImpact(
        mine: StickyMineState,
        targetActorId: string,
    ): void {
        const target =
            this.state.actors.find(
                (actor) => {
                    return (
                        actor.id ===
                        targetActorId
                    );
                },
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY ||
            target.hull <= 0
        ) {
            return;
        }

        const damageResult =
            this.stateStore
                .damageEnemyActorHull(
                    target.id,
                    mine.damage,
                );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_STICKY_MINE_RESOLVED,

            mine,

            outcome:
                PLAYER_STICKY_MINE_OUTCOME
                    .DETONATED,

            damage:
                damageResult.appliedDamage,

            remainingHull:
                damageResult.remainingHull,
        });

        if (!damageResult.destroyed) {
            return;
        }

        this.destroyEnemyActor(target.id);
    }

    private resolvePlayerTargetLost(
        index: number,
        mine: StickyMineState,
    ): void {
        if (
            mine.source.kind !==
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP ||
            mine.target.kind !==
                COMBAT_TARGET_KIND.ACTOR
        ) {
            throw new Error(
                'Cannot resolve player sticky-mine target loss for route: ' +
                    mine.id +
                    '/' +
                    mine.source.kind +
                    '/' +
                    mine.target.kind,
            );
        }

        this.state.combat
            .stickyMines
            .splice(index, 1);

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_STICKY_MINE_RESOLVED,

            mine,

            outcome:
                PLAYER_STICKY_MINE_OUTCOME
                    .TARGET_LOST,
        });
    }

    private getDispenserDefinition(
        dispenser: StickyMineDispenserState,
    ): StickyMineDispenserDefinition {
        const definition =
            SHIP_WEAPONS[dispenser.weaponId];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                `Sticky-mine dispenser kind does not match definition: ` +
                    `${dispenser.id}/${dispenser.weaponId}`,
            );
        }

        return definition;
    }
}
