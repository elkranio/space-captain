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
    rowGap: 10,
    topPadding: 3,
} as const;

type ThreatsViewCallbacks = {
    onOpenShieldTargeting: () => void;
};

// Captain threat list.
//
// Concrete threats fill one shared 4x2 glyph grid from left to right.
export default class BridgeCaptainThreatsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missileRowViews: BridgeCaptainMissileThreatRowView[] = [];

    private readonly beamCannonRowViews: BridgeCaptainBeamCannonThreatGlyphView[] = [];

    private readonly stickyMineRowViews: BridgeCaptainStickyMineThreatGlyphView[] = [];

    private readonly spamRowViews: BridgeCaptainSpamThreatGlyphView[] = [];

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
        while (this.missileRowViews.length > missiles.length) {
            const rowView = this.missileRowViews.pop();

            rowView?.destroy();
        }

        while (this.missileRowViews.length < missiles.length) {
            const rowView = new BridgeCaptainMissileThreatRowView(this.scene, {
                onIntercept: (command) => {
                    this.emitCommand(command);
                },

                onCancelTask: (taskId) => {
                    this.emitTaskCancel(taskId);
                },
            });

            this.missileRowViews.push(rowView);

            this.root.add(rowView.getRoot());
        }

        for (let index = 0; index < missiles.length; index += 1) {
            const missile = missiles[index];
            const rowView = this.missileRowViews[index];

            if (!missile || !rowView) {
                continue;
            }

            this.positionTile(rowView, index);
            rowView.update(missile);
        }
    }

    private reconcileBeamCannonRows(
        beamCannons: BridgeCaptainIncomingBeamCannonPayload[],
        missileCount: number,
        shieldTargetingAvailable: boolean,
        shieldDeployTaskId: string | undefined,
    ): void {
        while (this.beamCannonRowViews.length > beamCannons.length) {
            const rowView = this.beamCannonRowViews.pop();

            rowView?.destroy();
        }

        while (this.beamCannonRowViews.length < beamCannons.length) {
            const rowView = new BridgeCaptainBeamCannonThreatGlyphView(this.scene, {
                onOpenShieldTargeting: () => {
                    this.callbacks.onOpenShieldTargeting();
                },

                onCancelTask: (taskId) => {
                    this.emitTaskCancel(taskId);
                },
            });

            this.beamCannonRowViews.push(rowView);

            this.root.add(rowView.getRoot());
        }

        for (let index = 0; index < beamCannons.length; index += 1) {
            const beamCannon = beamCannons[index];
            const rowView = this.beamCannonRowViews[index];

            if (!beamCannon || !rowView) {
                continue;
            }

            this.positionTile(rowView, missileCount + index);

            rowView.update(beamCannon, shieldTargetingAvailable, shieldDeployTaskId);
        }
    }

    private reconcileStickyMineRows(
        stickyMines: BridgeCaptainStickyMinePayload[],

        startIndex: number,
    ): void {
        while (this.stickyMineRowViews.length > stickyMines.length) {
            const rowView = this.stickyMineRowViews.pop();

            rowView?.destroy();
        }

        while (this.stickyMineRowViews.length < stickyMines.length) {
            const rowView = new BridgeCaptainStickyMineThreatGlyphView(this.scene, {
                onClear: (command) => {
                    this.emitCommand(command);
                },

                onCancelTask: (taskId) => {
                    this.emitTaskCancel(taskId);
                },
            });

            this.stickyMineRowViews.push(rowView);

            this.root.add(rowView.getRoot());
        }

        for (let index = 0; index < stickyMines.length; index += 1) {
            const mine = stickyMines[index];

            const rowView = this.stickyMineRowViews[index];

            if (!mine || !rowView) {
                continue;
            }

            this.positionTile(rowView, startIndex + index);

            rowView.update(mine);
        }
    }

    private reconcileSpamRows(
        spamChannels: BridgeCaptainSpamChannelPayload[],

        startIndex: number,
    ): void {
        while (this.spamRowViews.length > spamChannels.length) {
            const rowView = this.spamRowViews.pop();

            rowView?.destroy();
        }

        while (this.spamRowViews.length < spamChannels.length) {
            const rowView = new BridgeCaptainSpamThreatGlyphView(this.scene, {
                onPurge: (command) => {
                    this.emitCommand(command);
                },

                onCancelTask: (taskId) => {
                    this.emitTaskCancel(taskId);
                },
            });

            this.spamRowViews.push(rowView);

            this.root.add(rowView.getRoot());
        }

        for (let index = 0; index < spamChannels.length; index += 1) {
            const channel = spamChannels[index];

            const rowView = this.spamRowViews[index];

            if (!channel || !rowView) {
                continue;
            }

            this.positionTile(rowView, startIndex + index);

            rowView.update(channel);
        }
    }

    private positionTile(
        rowView:
            | BridgeCaptainMissileThreatRowView
            | BridgeCaptainBeamCannonThreatGlyphView
            | BridgeCaptainStickyMineThreatGlyphView
            | BridgeCaptainSpamThreatGlyphView,
        index: number,
    ): void {
        const column = index % THREAT_TILE_GRID.columns;
        const row = Math.floor(index / THREAT_TILE_GRID.columns);
        const tileGap = this.getThreatTileGridGap();

        rowView.setPosition(
            column * (THREAT_TILE_GRID.tileWidth + tileGap),
            THREAT_TILE_GRID.topPadding + row * (THREAT_TILE_GRID.tileHeight + THREAT_TILE_GRID.rowGap),
        );
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
        for (const rowView of this.missileRowViews) {
            rowView.destroy();
        }

        for (const rowView of this.beamCannonRowViews) {
            rowView.destroy();
        }

        for (const rowView of this.stickyMineRowViews) {
            rowView.destroy();
        }

        for (const rowView of this.spamRowViews) {
            rowView.destroy();
        }

        this.missileRowViews.length = 0;
        this.beamCannonRowViews.length = 0;
        this.stickyMineRowViews.length = 0;
        this.spamRowViews.length = 0;
    }
}
