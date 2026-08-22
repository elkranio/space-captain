// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/BridgeCaptainThreatsView.ts
import type BridgeScene from "../../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeCaptainCombatContextUpdatedPayload,
    type BridgeCaptainIncomingBeamCannonPayload,
    type BridgeCaptainIncomingMissilePayload,
    type BridgeCaptainSpamChannelPayload,
    type BridgeCaptainStickyMinePayload,
    type BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import BridgeCaptainBeamCannonThreatGlyphView from "./BridgeCaptainBeamCannonThreatGlyphView";
import BridgeCaptainMissileThreatRowView from "./BridgeCaptainMissileThreatRowView";
import { THREAT_CELL } from "./threat_glyph_style";
import BridgeCaptainSpamThreatGlyphView from "./BridgeCaptainSpamThreatGlyphView";
import BridgeCaptainStickyMineThreatGlyphView from "./BridgeCaptainStickyMineThreatGlyphView";

const THREAT_TILE_GRID = {
    columns: 4,
    tileWidth: THREAT_CELL.width,
    tileHeight: THREAT_CELL.height,
    rowGap: 4,
    topPadding: 7,
} as const;

const THREAT_TILE_ANIMATION = {
    spawnDurationMs: 90,
    despawnDurationMs: 80,
    moveDurationMs: 120,
} as const;

type ThreatsViewCallbacks = {
    onOpenShieldTargeting: () => void;
};

type ThreatRowView =
    | BridgeCaptainMissileThreatRowView
    | BridgeCaptainBeamCannonThreatGlyphView
    | BridgeCaptainStickyMineThreatGlyphView
    | BridgeCaptainSpamThreatGlyphView;

type ThreatTileTarget = {
    x: number;
    y: number;
};

// Captain threat list.
//
// Concrete threats fill one shared 4x2 glyph grid from left to right.
export default class BridgeCaptainThreatsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missileRowViews = new Map<string, BridgeCaptainMissileThreatRowView>();

    private readonly beamCannonRowViews = new Map<string, BridgeCaptainBeamCannonThreatGlyphView>();

    private readonly stickyMineRowViews = new Map<string, BridgeCaptainStickyMineThreatGlyphView>();

    private readonly spamRowViews = new Map<string, BridgeCaptainSpamThreatGlyphView>();

    private readonly tileTargets = new WeakMap<Phaser.GameObjects.Container, ThreatTileTarget>();
    private readonly moveTweens = new WeakMap<Phaser.GameObjects.Container, Phaser.Tweens.Tween>();
    private readonly scaleTweens = new WeakMap<Phaser.GameObjects.Container, Phaser.Tweens.Tween>();

    private readonly retiringRowViews = new Set<ThreatRowView>();

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,

        private readonly width: number,

        private readonly callbacks: ThreatsViewCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(payload: BridgeCaptainCombatContextUpdatedPayload): void {
        const missiles = payload.incomingMissiles;
        const beamCannons = payload.incomingBeamCannons;
        const stickyMines = payload.incomingStickyMines;
        const spamChannels = payload.activeSpamChannels;

        this.reconcileMissileRows(missiles);

        this.reconcileBeamCannonRows(
            beamCannons,
            missiles.length,
            payload.shieldTargeting !== undefined,
            payload.shieldDeployTaskId,
        );

        const firstStickyMineIndex = missiles.length + beamCannons.length;

        this.reconcileStickyMineRows(stickyMines, firstStickyMineIndex);

        const firstSpamIndex = firstStickyMineIndex + stickyMines.length;

        this.reconcileSpamRows(spamChannels, firstSpamIndex);
    }

    public destroy(): void {
        this.clearRows();

        this.root.destroy(false);
    }

    private reconcileMissileRows(missiles: BridgeCaptainIncomingMissilePayload[]): void {
        const activeProjectileIds = new Set(missiles.map((missile) => missile.projectileId));

        for (const [projectileId, rowView] of this.missileRowViews) {
            if (activeProjectileIds.has(projectileId)) {
                continue;
            }

            this.missileRowViews.delete(projectileId);
            this.animateTileOut(rowView);
        }

        for (let index = 0; index < missiles.length; index += 1) {
            const missile = missiles[index];

            if (!missile) {
                continue;
            }

            let rowView = this.missileRowViews.get(missile.projectileId);
            const isNew = rowView === undefined;

            if (!rowView) {
                rowView = new BridgeCaptainMissileThreatRowView(this.scene, {
                    onIntercept: (command) => {
                        this.emitCommand(command);
                    },

                    onCancelTask: (taskId) => {
                        this.emitTaskCancel(taskId);
                    },
                });

                this.missileRowViews.set(missile.projectileId, rowView);
                this.root.add(rowView.getRoot());
            }

            this.positionTile(rowView, index);
            rowView.update(missile);

            if (isNew) {
                this.animateTileIn(rowView);
            }
        }
    }

    private reconcileBeamCannonRows(
        beamCannons: BridgeCaptainIncomingBeamCannonPayload[],
        missileCount: number,
        shieldTargetingAvailable: boolean,
        shieldDeployTaskId: string | undefined,
    ): void {
        const activeAttackIds = new Set(beamCannons.map((beamCannon) => beamCannon.attackId));

        for (const [attackId, rowView] of this.beamCannonRowViews) {
            if (activeAttackIds.has(attackId)) {
                continue;
            }

            this.beamCannonRowViews.delete(attackId);
            this.animateTileOut(rowView);
        }

        for (let index = 0; index < beamCannons.length; index += 1) {
            const beamCannon = beamCannons[index];

            if (!beamCannon) {
                continue;
            }

            let rowView = this.beamCannonRowViews.get(beamCannon.attackId);
            const isNew = rowView === undefined;

            if (!rowView) {
                rowView = new BridgeCaptainBeamCannonThreatGlyphView(this.scene, {
                    onOpenShieldTargeting: () => {
                        this.callbacks.onOpenShieldTargeting();
                    },

                    onCancelTask: (taskId) => {
                        this.emitTaskCancel(taskId);
                    },
                });

                this.beamCannonRowViews.set(beamCannon.attackId, rowView);
                this.root.add(rowView.getRoot());
            }

            this.positionTile(rowView, missileCount + index);
            rowView.update(beamCannon, shieldTargetingAvailable, shieldDeployTaskId);

            if (isNew) {
                this.animateTileIn(rowView);
            }
        }
    }

    private reconcileStickyMineRows(
        stickyMines: BridgeCaptainStickyMinePayload[],

        startIndex: number,
    ): void {
        const activeMineIds = new Set(stickyMines.map((mine) => mine.mineId));

        for (const [mineId, rowView] of this.stickyMineRowViews) {
            if (activeMineIds.has(mineId)) {
                continue;
            }

            this.stickyMineRowViews.delete(mineId);
            this.animateTileOut(rowView);
        }

        for (let index = 0; index < stickyMines.length; index += 1) {
            const mine = stickyMines[index];

            if (!mine) {
                continue;
            }

            let rowView = this.stickyMineRowViews.get(mine.mineId);
            const isNew = rowView === undefined;

            if (!rowView) {
                rowView = new BridgeCaptainStickyMineThreatGlyphView(this.scene, {
                    onClear: (command) => {
                        this.emitCommand(command);
                    },

                    onCancelTask: (taskId) => {
                        this.emitTaskCancel(taskId);
                    },
                });

                this.stickyMineRowViews.set(mine.mineId, rowView);
                this.root.add(rowView.getRoot());
            }

            this.positionTile(rowView, startIndex + index);
            rowView.update(mine);

            if (isNew) {
                this.animateTileIn(rowView);
            }
        }
    }

    private reconcileSpamRows(
        spamChannels: BridgeCaptainSpamChannelPayload[],

        startIndex: number,
    ): void {
        const activeChannelIds = new Set(spamChannels.map((channel) => channel.channelId));

        for (const [channelId, rowView] of this.spamRowViews) {
            if (activeChannelIds.has(channelId)) {
                continue;
            }

            this.spamRowViews.delete(channelId);
            this.animateTileOut(rowView);
        }

        for (let index = 0; index < spamChannels.length; index += 1) {
            const channel = spamChannels[index];

            if (!channel) {
                continue;
            }

            let rowView = this.spamRowViews.get(channel.channelId);
            const isNew = rowView === undefined;

            if (!rowView) {
                rowView = new BridgeCaptainSpamThreatGlyphView(this.scene, {
                    onPurge: (command) => {
                        this.emitCommand(command);
                    },

                    onCancelTask: (taskId) => {
                        this.emitTaskCancel(taskId);
                    },
                });

                this.spamRowViews.set(channel.channelId, rowView);
                this.root.add(rowView.getRoot());
            }

            this.positionTile(rowView, startIndex + index);
            rowView.update(channel);

            if (isNew) {
                this.animateTileIn(rowView);
            }
        }
    }

    private positionTile(rowView: ThreatRowView, index: number): void {
        const column = index % THREAT_TILE_GRID.columns;
        const row = Math.floor(index / THREAT_TILE_GRID.columns);
        const tileGap = this.getThreatTileGridGap();

        const target = {
            x: column * (THREAT_TILE_GRID.tileWidth + tileGap),
            y: THREAT_TILE_GRID.topPadding + row * (THREAT_TILE_GRID.tileHeight + THREAT_TILE_GRID.rowGap),
        };

        const root = rowView.getRoot();
        const previousTarget = this.tileTargets.get(root);

        this.tileTargets.set(root, target);

        if (!previousTarget) {
            rowView.setPosition(target.x, target.y);
            return;
        }

        if (previousTarget.x === target.x && previousTarget.y === target.y) {
            return;
        }

        this.moveTweens.get(root)?.stop();

        const tween = this.scene.tweens.add({
            targets: root,
            x: target.x,
            y: target.y,
            duration: THREAT_TILE_ANIMATION.moveDurationMs,
            ease: "Quad.Out",
        });

        this.moveTweens.set(root, tween);
    }

    private animateTileIn(rowView: ThreatRowView): void {
        const root = rowView.getRoot();
        const target = this.tileTargets.get(root);

        if (!target) {
            return;
        }

        this.scaleTweens.get(root)?.stop();

        root.setPosition(
            target.x + THREAT_TILE_GRID.tileWidth / 2,
            target.y + THREAT_TILE_GRID.tileHeight / 2,
        );
        root.setScale(0);

        const tween = this.scene.tweens.add({
            targets: root,
            x: target.x,
            y: target.y,
            scaleX: 1,
            scaleY: 1,
            duration: THREAT_TILE_ANIMATION.spawnDurationMs,
            ease: "Quad.Out",
        });

        this.scaleTweens.set(root, tween);
    }

    private animateTileOut(rowView: ThreatRowView): void {
        if (this.retiringRowViews.has(rowView)) {
            return;
        }

        this.retiringRowViews.add(rowView);

        const root = rowView.getRoot();
        const centerX = root.x + (THREAT_TILE_GRID.tileWidth * root.scaleX) / 2;
        const centerY = root.y + (THREAT_TILE_GRID.tileHeight * root.scaleY) / 2;

        this.moveTweens.get(root)?.stop();
        this.scaleTweens.get(root)?.stop();
        this.tileTargets.delete(root);

        for (const child of root.list) {
            child.disableInteractive();
        }

        const tween = this.scene.tweens.add({
            targets: root,
            x: centerX,
            y: centerY,
            scaleX: 0,
            scaleY: 0,
            duration: THREAT_TILE_ANIMATION.despawnDurationMs,
            ease: "Quad.In",
            onComplete: () => {
                this.scaleTweens.delete(root);
                this.destroyRowView(rowView);
            },
        });

        this.scaleTweens.set(root, tween);
    }

    private destroyRowView(rowView: ThreatRowView): void {
        const root = rowView.getRoot();

        this.moveTweens.get(root)?.stop();
        this.scaleTweens.get(root)?.stop();

        this.moveTweens.delete(root);
        this.scaleTweens.delete(root);
        this.tileTargets.delete(root);
        this.retiringRowViews.delete(rowView);

        rowView.destroy();
    }

    private getThreatTileGridGap(): number {
        return Math.max(
            0,
            Math.floor(
                (this.width - THREAT_TILE_GRID.columns * THREAT_TILE_GRID.tileWidth) / (THREAT_TILE_GRID.columns - 1),
            ),
        );
    }

    private emitCommand(command: BridgeOfficerCommandSelectedPayload): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_COMMAND_SELECTED,

            command,
        );
    }

    private emitTaskCancel(taskId: string): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_TASK_CANCEL_REQUESTED, {
            taskId,
        });
    }

    private clearRows(): void {
        const rowViews = new Set<ThreatRowView>([
            ...this.missileRowViews.values(),
            ...this.beamCannonRowViews.values(),
            ...this.stickyMineRowViews.values(),
            ...this.spamRowViews.values(),
            ...this.retiringRowViews,
        ]);

        for (const rowView of rowViews) {
            this.destroyRowView(rowView);
        }

        this.missileRowViews.clear();
        this.beamCannonRowViews.clear();
        this.stickyMineRowViews.clear();
        this.spamRowViews.clear();
        this.retiringRowViews.clear();
    }
}
