// src/app/scenes/game/bridge/view/combat/incoming_missiles/BridgeIncomingMissilesView.ts

import { DEFENSE_TURRET_SHOT_OUTCOME } from '../../../../../../../engine/defs/defense_turret';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeIncomingMissileAddedPayload,
    type BridgeIncomingMissileRemovedPayload,
    type BridgeIncomingMissilesUpdatedPayload,
    type BridgeDefenseTurretFiredPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { SCREEN_SHAKE } from '../../../../../../theme/screen_shake';
import BridgeDefenseTurretBeamView from '../defense_turret/BridgeDefenseTurretBeamView';
import {
    removeMissingCombatSnapshotEntries,
} from '../remove_missing_combat_snapshot_entries';
import BridgeIncomingMissileView from './missile/BridgeIncomingMissileView';

type GetObjectPosition = (objectId: string) => Phaser.Math.Vector2 | undefined;

// Manager-view летящих в игрока ракет.
//
// Отвечает только за:
// - bridge events;
// - поиск source position;
// - lifecycle missile views;
// - feedback реального missile impact;
// - lifecycle defense-turret effects.
export default class BridgeIncomingMissilesView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missiles = new Map<string, BridgeIncomingMissileView>();

    private readonly defenseTurretEffects = new Set<BridgeDefenseTurretBeamView>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly getObjectPosition: GetObjectPosition,
    ) {
        this.root = this.scene.add.container(0, 0);

        // Поверх encounter objects,
        // но под bridge interior и UI.
        this.scene.layers.get('vfx').add(this.root);

        this.eventBus.on(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, this.addMissile, this);

        this.eventBus.on(BRIDGE_EVENT.INCOMING_MISSILES_UPDATED, this.updateMissiles, this);

        this.eventBus.on(
            BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,
            this.handleMissileImpact,
            this,
        );

        this.eventBus.on(BRIDGE_EVENT.DEFENSE_TURRET_FIRED, this.handleDefenseTurretFired, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, this.addMissile, this);

        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILES_UPDATED, this.updateMissiles, this);

        this.eventBus.off(
            BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,
            this.handleMissileImpact,
            this,
        );

        this.eventBus.off(BRIDGE_EVENT.DEFENSE_TURRET_FIRED, this.handleDefenseTurretFired, this);

        for (const effect of this.defenseTurretEffects) {
            effect.destroy();
        }

        this.defenseTurretEffects.clear();

        for (const missile of this.missiles.values()) {
            missile.destroy();
        }

        this.missiles.clear();

        this.root.destroy(false);
    }

    public setCameraTurnOffsetX(offsetX: number): void {
        this.root.x = Math.round(offsetX);
    }

    private addMissile(payload: BridgeIncomingMissileAddedPayload): void {
        if (this.missiles.has(payload.projectileId)) {
            throw new Error(`Incoming missile already exists: ` + payload.projectileId);
        }

        const startPosition = this.getObjectPosition(payload.sourceActorId);

        if (!startPosition) {
            throw new Error(`Incoming missile source object not found: ` + payload.sourceActorId);
        }

        const missile = new BridgeIncomingMissileView({
            scene: this.scene,
            parent: this.root,

            projectileId:
                payload.projectileId,

            startPosition,

            initialTimeToImpactMs:
                payload.initialTimeToImpactMs,
        });

        this.missiles.set(payload.projectileId, missile);
    }

    private updateMissiles(updates: BridgeIncomingMissilesUpdatedPayload): void {
        removeMissingCombatSnapshotEntries(
            this.missiles,
            updates.map((update) => {
                return update.projectileId;
            }),
            (projectileId, missile) => {
                missile.destroy();
                this.missiles.delete(
                    projectileId,
                );
            },
        );

        if (updates.length === 0) {
            this.setCameraTurnOffsetX(0);
        }

        for (const update of updates) {
            const missile = this.missiles.get(update.projectileId);

            if (!missile) {
                throw new Error(`Incoming missile not found during update: ` + update.projectileId);
            }

            missile.update(
                update.timeToImpactMs,
            );
        }
    }

    private handleMissileImpact(
        payload:
            BridgeIncomingMissileRemovedPayload,
    ): void {
        this.removeMissileView(
            payload.projectileId,
        );

        const shake =
            SCREEN_SHAKE.MEDIUM;

        this.scene.cameras.main.shake(
            shake.durationMs,
            shake.intensity,
        );
    }

    private removeMissileView(
        projectileId: string,
    ): void {
        const missile =
            this.missiles.get(
                projectileId,
            );

        if (!missile) {
            throw new Error(
                'Incoming missile not found: ' +
                    projectileId,
            );
        }

        missile.destroy();

        this.missiles.delete(
            projectileId,
        );
    }

    private handleDefenseTurretFired(payload: BridgeDefenseTurretFiredPayload): void {
        const missile = this.missiles.get(payload.projectileId);

        if (!missile) {
            throw new Error(`Defense Turret target not found: ` + payload.projectileId);
        }

        const effect = new BridgeDefenseTurretBeamView({
            scene: this.scene,
            parent: this.root,

            outcome: payload.outcome,

            // Последняя реально отображённая позиция.
            // Именно в неё игрок видел выстрел.
            targetPosition: missile.getPosition(),

            onComplete: (completedEffect) => {
                this.defenseTurretEffects.delete(completedEffect);
            },
        });

        this.defenseTurretEffects.add(effect);

        switch (payload.outcome) {
            case DEFENSE_TURRET_SHOT_OUTCOME.HIT:
                this.removeMissileView(
                    payload.projectileId,
                );

                return;

            case DEFENSE_TURRET_SHOT_OUTCOME.MISS:
                return;

            default:
                return this.assertNever(payload.outcome);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled defense-turret outcome: ${String(value)}`);
    }
}
