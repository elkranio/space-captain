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

    private readonly listRoot: Phaser.GameObjects.Container;

    private readonly missileRowViews: BridgeCaptainMissileThreatRowView[] = [];

    private readonly beamCannonRowViews: BridgeCaptainBeamCannonThreatRowView[] = [];

    private readonly stickyMineRowViews: BridgeCaptainStickyMineThreatRowView[] = [];

    private readonly spamRowViews: BridgeCaptainSpamThreatRowView[] = [];

    private missiles: BridgeCaptainIncomingMissilePayload[] = [];

    private beamCannons: BridgeCaptainIncomingBeamCannonPayload[] = [];

    private stickyMines: BridgeCaptainStickyMinePayload[] = [];

    private spamChannels: BridgeCaptainSpamChannelPayload[] = [];

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,

        private readonly width: number,

        _height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.listRoot = this.scene.add.container(0, 0);

        this.root.add(this.listRoot);
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
        this.missiles = missiles;

        this.beamCannons = beamCannons;

        this.stickyMines = stickyMines;

        this.spamChannels = spamChannels;

        this.reconcileRows();
    }

    public destroy(): void {
        this.clearRows();

        this.listRoot.destroy(false);

        this.root.destroy(false);
    }

    private reconcileRows(): void {
        this.reconcileMissileRows();
        this.reconcileBeamCannonRows();
        this.reconcileStickyMineRows();
        this.reconcileSpamRows();
    }

    private reconcileMissileRows(): void {
        while (this.missileRowViews.length > this.missiles.length) {
            const rowView = this.missileRowViews.pop();

            rowView?.destroy();
        }

        while (this.missileRowViews.length < this.missiles.length) {
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

            this.listRoot.add(rowView.getRoot());
        }

        for (let index = 0; index < this.missiles.length; index += 1) {
            const missile = this.missiles[index];

            const rowView = this.missileRowViews[index];

            if (!missile || !rowView) {
                continue;
            }

            rowView.setPosition(0, index * ROW_HEIGHT);

            rowView.update(missile);
        }
    }

    private reconcileBeamCannonRows(): void {
        while (this.beamCannonRowViews.length > this.beamCannons.length) {
            const rowView = this.beamCannonRowViews.pop();

            rowView?.destroy();
        }

        while (this.beamCannonRowViews.length < this.beamCannons.length) {
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

            this.listRoot.add(rowView.getRoot());
        }

        const firstBeamCannonRow = this.missiles.length;

        for (let index = 0; index < this.beamCannons.length; index += 1) {
            const beamCannon = this.beamCannons[index];

            const rowView = this.beamCannonRowViews[index];

            if (!beamCannon || !rowView) {
                continue;
            }

            rowView.setPosition(0, (firstBeamCannonRow + index) * ROW_HEIGHT);

            rowView.update(beamCannon);
        }
    }

    private reconcileStickyMineRows(): void {
        while (this.stickyMineRowViews.length > this.stickyMines.length) {
            const rowView = this.stickyMineRowViews.pop();

            rowView?.destroy();
        }

        while (this.stickyMineRowViews.length < this.stickyMines.length) {
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

            this.listRoot.add(rowView.getRoot());
        }

        const firstStickyMineRow = this.missiles.length + this.beamCannons.length;

        for (let index = 0; index < this.stickyMines.length; index += 1) {
            const mine = this.stickyMines[index];

            const rowView = this.stickyMineRowViews[index];

            if (!mine || !rowView) {
                continue;
            }

            rowView.setPosition(0, (firstStickyMineRow + index) * ROW_HEIGHT);

            rowView.update(mine);
        }
    }

    private reconcileSpamRows(): void {
        while (this.spamRowViews.length > this.spamChannels.length) {
            const rowView = this.spamRowViews.pop();

            rowView?.destroy();
        }

        while (this.spamRowViews.length < this.spamChannels.length) {
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

            this.listRoot.add(rowView.getRoot());
        }

        const firstSpamRow = this.missiles.length + this.beamCannons.length + this.stickyMines.length;

        for (let index = 0; index < this.spamChannels.length; index += 1) {
            const channel = this.spamChannels[index];

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
