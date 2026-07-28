// src/app/scenes/game/bridge/view/combat/incoming_missiles/BridgeIncomingMissilesView.ts

import { POINT_DEFENSE_SHOT_OUTCOME } from '../../../../../../../engine/defs/point_defense';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeIncomingMissileAddedPayload,
    type BridgeIncomingMissileRemovedPayload,
    type BridgeIncomingMissilesUpdatedPayload,
    type BridgePointDefenseFiredPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';
import BridgePointDefenseBeamView from '../point_defense/BridgePointDefenseBeamView';
import BridgeIncomingMissileView from './missile/BridgeIncomingMissileView';

type GetObjectPosition = (objectId: string) => Phaser.Math.Vector2 | undefined;

const INCOMING_MISSILE_IMPACT_AREA = {
    // Центральная зона по X.
    insetX: 260,

    // Нижняя часть viewscreen,
    // но sprite, brackets и HUD label остаются внутри окна.
    topOffset: 215,
    bottomInset: 60,
} as const;

// Manager-view летящих в игрока ракет.
//
// Отвечает только за:
// - bridge events;
// - поиск source position;
// - выбор случайной impact point;
// - lifecycle missile views;
// - lifecycle point-defense effects.
export default class BridgeIncomingMissilesView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missiles = new Map<string, BridgeIncomingMissileView>();

    private readonly pointDefenseEffects = new Set<BridgePointDefenseBeamView>();

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

        this.eventBus.on(BRIDGE_EVENT.INCOMING_MISSILE_REMOVED, this.removeMissile, this);

        this.eventBus.on(BRIDGE_EVENT.POINT_DEFENSE_FIRED, this.handlePointDefenseFired, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, this.addMissile, this);

        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILES_UPDATED, this.updateMissiles, this);

        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILE_REMOVED, this.removeMissile, this);

        this.eventBus.off(BRIDGE_EVENT.POINT_DEFENSE_FIRED, this.handlePointDefenseFired, this);

        for (const effect of this.pointDefenseEffects) {
            effect.destroy();
        }

        this.pointDefenseEffects.clear();

        for (const missile of this.missiles.values()) {
            missile.destroy();
        }

        this.missiles.clear();

        this.root.destroy(false);
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

            designation: payload.designation,

            startPosition,

            targetPosition: this.createImpactPosition(),

            initialTimeToImpactMs: payload.initialTimeToImpactMs,
        });

        this.missiles.set(payload.projectileId, missile);
    }

    private updateMissiles(updates: BridgeIncomingMissilesUpdatedPayload): void {
        for (const update of updates) {
            const missile = this.missiles.get(update.projectileId);

            if (!missile) {
                throw new Error(`Incoming missile not found during update: ` + update.projectileId);
            }

            missile.update(update.timeToImpactMs, update.spectralBand);
        }
    }

    private removeMissile(payload: BridgeIncomingMissileRemovedPayload): void {
        const missile = this.missiles.get(payload.projectileId);

        if (!missile) {
            throw new Error(`Incoming missile not found: ` + payload.projectileId);
        }

        missile.destroy();

        this.missiles.delete(payload.projectileId);
    }

    private handlePointDefenseFired(payload: BridgePointDefenseFiredPayload): void {
        const missile = this.missiles.get(payload.projectileId);

        if (!missile) {
            throw new Error(`Point-defense target not found: ` + payload.projectileId);
        }

        const effect = new BridgePointDefenseBeamView({
            scene: this.scene,
            parent: this.root,

            beamBand: payload.beamBand,
            outcome: payload.outcome,

            // Последняя реально отображённая позиция.
            // Именно в неё игрок видел выстрел.
            targetPosition: missile.getPosition(),

            onComplete: (completedEffect) => {
                this.pointDefenseEffects.delete(completedEffect);
            },
        });

        this.pointDefenseEffects.add(effect);

        switch (payload.outcome) {
            case POINT_DEFENSE_SHOT_OUTCOME.HIT:
                this.removeMissile({
                    projectileId: payload.projectileId,
                });

                return;

            case POINT_DEFENSE_SHOT_OUTCOME.MISS:
                return;

            default:
                return this.assertNever(payload.outcome);
        }
    }

    private createImpactPosition(): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            Phaser.Math.Between(
                BRIDGE_VIEWSCREEN_RECT.x + INCOMING_MISSILE_IMPACT_AREA.insetX,

                BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width - INCOMING_MISSILE_IMPACT_AREA.insetX,
            ),

            Phaser.Math.Between(
                BRIDGE_VIEWSCREEN_RECT.y + INCOMING_MISSILE_IMPACT_AREA.topOffset,

                BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height - INCOMING_MISSILE_IMPACT_AREA.bottomInset,
            ),
        );
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled point-defense outcome: ${String(value)}`);
    }
}
