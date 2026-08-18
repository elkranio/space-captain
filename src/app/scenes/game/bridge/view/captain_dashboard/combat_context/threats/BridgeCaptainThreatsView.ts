import type BridgeScene from "../../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeCaptainIncomingBeamCannonPayload,
    type BridgeCaptainIncomingMissilePayload,
    type BridgeCaptainSpamChannelPayload,
    type BridgeCaptainStickyMinePayload,
    type BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import BridgeCaptainBeamCannonThreatRowView from "./BridgeCaptainBeamCannonThreatRowView";
import BridgeCaptainMissileThreatRowView from "./BridgeCaptainMissileThreatRowView";
import BridgeCaptainSpamThreatRowView from "./BridgeCaptainSpamThreatRowView";
import BridgeCaptainStickyMineThreatRowView from "./BridgeCaptainStickyMineThreatRowView";

const ROW_HEIGHT = 36;

// Captain threat list.
//
// Missile WPN action now executes the single engine-resolved INTERCEPT command
// directly. Signature choice no longer exists in presentation.
//
// BeamCannon rows:
// SCI пока disabled, ENG использует real DEPLOY SHIELD command.
export default class BridgeCaptainThreatsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missileRowViews: BridgeCaptainMissileThreatRowView[] = [];

    private readonly beamCannonRowViews: BridgeCaptainBeamCannonThreatRowView[] = [];

    private readonly stickyMineRowViews: BridgeCaptainStickyMineThreatRowView[] = [];

    private readonly spamRowViews: BridgeCaptainSpamThreatRowView[] = [];

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,

        private readonly width: number,
    ) {
        this.root = this.scene.add.container(0, 0);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(
        missiles: BridgeCaptainIncomingMissilePayload[],

        beamCannons: BridgeCaptainIncomingBeamCannonPayload[],

        stickyMines: BridgeCaptainStickyMinePayload[],

        spamChannels: BridgeCaptainSpamChannelPayload[],
    ): void {
        this.reconcileMissileRows(missiles);

        this.reconcileBeamCannonRows(beamCannons, missiles.length);

        this.reconcileStickyMineRows(stickyMines, missiles.length + beamCannons.length);

        this.reconcileSpamRows(spamChannels, missiles.length + beamCannons.length + stickyMines.length);
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
            const rowView = new BridgeCaptainMissileThreatRowView(
                this.scene,
                this.width,
                ROW_HEIGHT,

                {
                    onIdentify: (command) => {
                        this.emitCommand(command);
                    },

                    onIntercept: (command) => {
                        this.emitCommand(command);
                    },
                },
            );

            this.missileRowViews.push(rowView);

            this.root.add(rowView.getRoot());
        }

        for (let index = 0; index < missiles.length; index += 1) {
            const missile = missiles[index];

            const rowView = this.missileRowViews[index];

            if (!missile || !rowView) {
                continue;
            }

            rowView.setPosition(0, index * ROW_HEIGHT);

            rowView.update(missile);
        }
    }

    private reconcileBeamCannonRows(
        beamCannons: BridgeCaptainIncomingBeamCannonPayload[],

        firstBeamCannonRow: number,
    ): void {
        while (this.beamCannonRowViews.length > beamCannons.length) {
            const rowView = this.beamCannonRowViews.pop();

            rowView?.destroy();
        }

        while (this.beamCannonRowViews.length < beamCannons.length) {
            const rowView = new BridgeCaptainBeamCannonThreatRowView(
                this.scene,
                this.width,
                ROW_HEIGHT,

                {
                    onDeployShield: (command) => {
                        this.emitCommand(command);
                    },
                },
            );

            this.beamCannonRowViews.push(rowView);

            this.root.add(rowView.getRoot());
        }

        for (let index = 0; index < beamCannons.length; index += 1) {
            const beamCannon = beamCannons[index];

            const rowView = this.beamCannonRowViews[index];

            if (!beamCannon || !rowView) {
                continue;
            }

            rowView.setPosition(0, (firstBeamCannonRow + index) * ROW_HEIGHT);

            rowView.update(beamCannon);
        }
    }

    private reconcileStickyMineRows(
        stickyMines: BridgeCaptainStickyMinePayload[],

        firstStickyMineRow: number,
    ): void {
        while (this.stickyMineRowViews.length > stickyMines.length) {
            const rowView = this.stickyMineRowViews.pop();

            rowView?.destroy();
        }

        while (this.stickyMineRowViews.length < stickyMines.length) {
            const rowView = new BridgeCaptainStickyMineThreatRowView(
                this.scene,
                this.width,
                ROW_HEIGHT,

                {
                    onClear: (command) => {
                        this.emitCommand(command);
                    },
                },
            );

            this.stickyMineRowViews.push(rowView);

            this.root.add(rowView.getRoot());
        }

        for (let index = 0; index < stickyMines.length; index += 1) {
            const mine = stickyMines[index];

            const rowView = this.stickyMineRowViews[index];

            if (!mine || !rowView) {
                continue;
            }

            rowView.setPosition(0, (firstStickyMineRow + index) * ROW_HEIGHT);

            rowView.update(mine);
        }
    }

    private reconcileSpamRows(
        spamChannels: BridgeCaptainSpamChannelPayload[],

        firstSpamRow: number,
    ): void {
        while (this.spamRowViews.length > spamChannels.length) {
            const rowView = this.spamRowViews.pop();

            rowView?.destroy();
        }

        while (this.spamRowViews.length < spamChannels.length) {
            const rowView = new BridgeCaptainSpamThreatRowView(
                this.scene,
                this.width,
                ROW_HEIGHT,

                {
                    onPurge: (command) => {
                        this.emitCommand(command);
                    },
                },
            );

            this.spamRowViews.push(rowView);

            this.root.add(rowView.getRoot());
        }

        for (let index = 0; index < spamChannels.length; index += 1) {
            const channel = spamChannels[index];

            const rowView = this.spamRowViews[index];

            if (!channel || !rowView) {
                continue;
            }

            rowView.setPosition(0, (firstSpamRow + index) * ROW_HEIGHT);

            rowView.update(channel);
        }
    }

    private emitCommand(command: BridgeOfficerCommandSelectedPayload): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_COMMAND_SELECTED,

            command,
        );
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
