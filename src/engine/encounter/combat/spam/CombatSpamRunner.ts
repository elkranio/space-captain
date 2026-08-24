import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import {
    advanceShipWeaponCooldown,
    finishShipWeaponAction,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type SpamProjectorDefinition,
    type SpamProjectorState,
} from "../../../defs/ship_weapon";
import type { ShipEncounterActorState } from "../../actors/ship_encounter_actor";
import { SPAM_CHANNEL_OUTCOME, type SpamChannelOutcome, type SpamChannelState } from "../../model/combat";
import { ENCOUNTER_EVENT, type EncounterEvent } from "../../model/event";
import type { EncounterState } from "../../model/state";
import EncounterStateStore from "../../state/EncounterStateStore";
import CombatRuntimeIdentityFactory from "../CombatRuntimeIdentityFactory";

type CombatSpamRunnerOptions = {
    stateStore: EncounterStateStore;
    identities: CombatRuntimeIdentityFactory;
    emit: (event: EncounterEvent) => void;
};

// Owns the complete hostile-spam lifecycle: channel start,
// active-channel timing, expiry, purge and cooldown.
export default class CombatSpamRunner {
    private readonly state: EncounterState;

    private readonly identities: CombatRuntimeIdentityFactory;

    private readonly emit: (event: EncounterEvent) => void;

    constructor({ stateStore, identities, emit }: CombatSpamRunnerOptions) {
        this.identities = identities;
        this.emit = emit;

        this.state = stateStore.getState();
    }

    public advanceEnemyProjector(
        actor: ShipEncounterActorState,
        projector: SpamProjectorState,
        deltaMs: number,
        worldDeltaMs: number,
    ): void {
        const definition = this.getDefinition(projector);

        advanceShipWeaponCooldown(projector, definition.cooldownDurationMs, worldDeltaMs);

        switch (projector.phase) {
            case SHIP_WEAPON_PHASE.READY:
                return;

            case SHIP_WEAPON_PHASE.TARGETING:
                throw new Error(`Spam projector cannot enter targeting phase: ` + `${actor.id}/${projector.id}`);

            case SHIP_WEAPON_PHASE.CHANNELING:
                this.ensureChannelStarted(actor, projector);
                this.advanceChanneling(actor, projector, deltaMs);
                return;

            case SHIP_WEAPON_PHASE.COOLDOWN:
                return;

            case SHIP_WEAPON_PHASE.CHARGING:
                throw new Error(`Spam projector cannot enter charging phase: ` + `${actor.id}/${projector.id}`);

            case SHIP_WEAPON_PHASE.DISPENSING:
                throw new Error(`Spam projector cannot enter dispensing phase: ` + `${actor.id}/${projector.id}`);
        }
    }

    public purgeChannel(channelId: string): boolean {
        for (const actor of this.state.actors) {
            for (const weapon of actor.weapons) {
                if (weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR || weapon.activeChannelId !== channelId) {
                    continue;
                }

                if (weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING) {
                    throw new Error(
                        `Spam projector has active channel outside channeling phase: ` +
                            `${actor.id}/${weapon.id}/${channelId}/${weapon.phase}`,
                    );
                }

                const channel = this.createChannelSnapshot(actor, weapon);

                this.endChannel(weapon, channel, SPAM_CHANNEL_OUTCOME.PURGED);

                return true;
            }
        }

        return false;
    }

    private ensureChannelStarted(actor: ShipEncounterActorState, projector: SpamProjectorState): void {
        if (projector.activeChannelId !== null) {
            return;
        }

        projector.activeChannelId = this.identities.createSpamChannelId();

        this.emit({
            type: ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,

            channel: this.createChannelSnapshot(actor, projector),
        });
    }

    private advanceChanneling(actor: ShipEncounterActorState, projector: SpamProjectorState, deltaMs: number): void {
        const definition = this.getDefinition(projector);

        projector.phaseElapsedMs += deltaMs;

        if (projector.phaseElapsedMs < definition.channelDurationMs) {
            return;
        }

        const channel = this.createChannelSnapshot(actor, projector);

        this.endChannel(projector, channel, SPAM_CHANNEL_OUTCOME.EXPIRED);
    }

    private endChannel(projector: SpamProjectorState, channel: SpamChannelState, outcome: SpamChannelOutcome): void {
        projector.activeChannelId = null;

        const definition = this.getDefinition(projector);

        finishShipWeaponAction(projector, definition.cooldownDurationMs);

        this.emit({
            type: ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,

            channel,
            outcome,
        });
    }

    private createChannelSnapshot(actor: ShipEncounterActorState, projector: SpamProjectorState): SpamChannelState {
        const channelId = projector.activeChannelId;

        if (!channelId) {
            throw new Error(
                `Spam projector channel id is missing: ` + `${actor.id}/${projector.id}/${projector.phase}`,
            );
        }

        const definition = this.getDefinition(projector);

        return {
            id: channelId,

            sourceActorId: actor.id,
            sourceWeaponId: projector.id,

            elapsedMs: Math.min(projector.phaseElapsedMs, definition.channelDurationMs),
            durationMs: definition.channelDurationMs,
        };
    }

    private getDefinition(projector: SpamProjectorState): SpamProjectorDefinition {
        const definition = SHIP_WEAPONS[projector.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error(
                `Spam projector kind does not match definition: ` + `${projector.id}/${projector.weaponId}`,
            );
        }

        return definition;
    }
}
