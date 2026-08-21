import {
    BEAM_CANNON_TARGET_NODE,
    type BeamCannonTargetNode,
} from "../../../../../../../../engine/encounter/model/combat";
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainIncomingBeamCannonPayload,
    BridgeCaptainShieldTargetPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";

const VIEW = {
    headerHeight: 28,
    headerIconX: 8,
    headerIconY: 6,
    titleX: 56,
    titleY: 5,

    rowHeight: 34,
    hullRowY: 34,
    driveRowY: 74,
    rowLabelX: 12,

    markerRightInset: 12,
    markerGap: 12,

    cancelWidth: 92,
    cancelHeight: 22,
} as const;

type ShieldTargetingCallbacks = {
    onSelectTarget: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancel: () => void;
};

type TargetRow = {
    targetNode: BeamCannonTargetNode;

    background: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.BitmapText;

    command?: BridgeOfficerCommandSelectedPayload;

    threatTexts: Phaser.GameObjects.BitmapText[];
};

type ThreatMarker = {
    timeToFireMs: number;
};

// Full-inline shield mode with a temporary two-row node renderer.
// The container/flow stays; this list can later be replaced by the ship silhouette.
export default class BridgeCaptainShieldTargetingView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hullRow: TargetRow;
    private readonly driveRow: TargetRow;

    constructor(
        private readonly scene: BridgeScene,

        private readonly width: number,
        height: number,

        private readonly callbacks: ShieldTargetingCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const header = this.scene.add
            .rectangle(
                0,
                0,
                this.width,
                VIEW.headerHeight,
                CAPTAIN_DASHBOARD_STYLE.row.backgroundColor,
                CAPTAIN_DASHBOARD_STYLE.row.backgroundAlpha,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(
                CAPTAIN_DASHBOARD_STYLE.row.borderThickness,
                CAPTAIN_DASHBOARD_STYLE.row.borderColor,
            );

        const beamSprite = UI_COMBAT_SPRITES[UI_COMBAT_SPRITE_ID.THREAT_BEAM_CANNON];

        const beamIcon = this.scene.add
            .image(
                VIEW.headerIconX,
                VIEW.headerIconY,
                beamSprite.atlasKey,
                beamSprite.frameKey,
            )
            .setOrigin(0, 0);

        const title = this.scene.add
            .bitmapText(
                VIEW.titleX,
                VIEW.titleY,
                FONT_FAMILY.VGA_8X14,
                "RAISE SHIELD",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        this.root.add([
            header,
            beamIcon,
            title,
        ]);

        this.hullRow = this.createTargetRow(
            BEAM_CANNON_TARGET_NODE.HULL,
            "HULL",
            VIEW.hullRowY,
        );

        this.driveRow = this.createTargetRow(
            BEAM_CANNON_TARGET_NODE.DRIVE,
            "DRIVE",
            VIEW.driveRowY,
        );

        const cancelX = this.width - VIEW.cancelWidth;
        const cancelY = height - VIEW.cancelHeight;

        const cancelBackground = this.scene.add
            .rectangle(
                cancelX,
                cancelY,
                VIEW.cancelWidth,
                VIEW.cancelHeight,
                CAPTAIN_DASHBOARD_STYLE.action.activeBackgroundColor,
                1,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(
                1,
                CAPTAIN_DASHBOARD_STYLE.action.activeBorderColor,
            )
            .setInteractive({
                useHandCursor: true,
            });

        const cancelText = this.scene.add
            .bitmapText(
                cancelX + VIEW.cancelWidth / 2,
                cancelY + VIEW.cancelHeight / 2,
                FONT_FAMILY.VGA_8X14,
                "CANCEL",
                FONT_SIZE.PX_14,
            )
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.PRIMARY);

        cancelBackground.on("pointerdown", () => {
            this.callbacks.onCancel();
        });

        this.root.add([
            cancelBackground,
            cancelText,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setVisible(visible: boolean): void {
        this.root.setVisible(visible);
    }

    public update(
        targets: BridgeCaptainShieldTargetPayload[],
        beamCannons: BridgeCaptainIncomingBeamCannonPayload[],
    ): void {
        this.updateTargetRow(
            this.hullRow,
            targets.find((target) => target.targetNode === BEAM_CANNON_TARGET_NODE.HULL),
            beamCannons,
        );

        this.updateTargetRow(
            this.driveRow,
            targets.find((target) => target.targetNode === BEAM_CANNON_TARGET_NODE.DRIVE),
            beamCannons,
        );
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private createTargetRow(
        targetNode: BeamCannonTargetNode,
        labelText: string,
        y: number,
    ): TargetRow {
        const background = this.scene.add
            .rectangle(
                0,
                y,
                this.width,
                VIEW.rowHeight,
                CAPTAIN_DASHBOARD_STYLE.row.backgroundColor,
                CAPTAIN_DASHBOARD_STYLE.row.backgroundAlpha,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(
                CAPTAIN_DASHBOARD_STYLE.row.borderThickness,
                CAPTAIN_DASHBOARD_STYLE.row.borderColor,
            );

        const label = this.scene.add
            .bitmapText(
                VIEW.rowLabelX,
                y + VIEW.rowHeight / 2,
                FONT_FAMILY.VGA_8X14,
                labelText,
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0.5)
            .setTint(FONT_COLOR.PRIMARY);

        const row: TargetRow = {
            targetNode,

            background,
            label,

            threatTexts: [],
        };

        background.on("pointerdown", () => {
            if (row.command) {
                this.callbacks.onSelectTarget(row.command);
            }
        });

        this.root.add([
            background,
            label,
        ]);

        return row;
    }

    private updateTargetRow(
        row: TargetRow,
        target: BridgeCaptainShieldTargetPayload | undefined,
        beamCannons: BridgeCaptainIncomingBeamCannonPayload[],
    ): void {
        row.command = target?.command;
        row.label.setText(target?.label ?? row.targetNode.toUpperCase());

        row.background.disableInteractive();

        if (row.command) {
            row.background.setInteractive({
                useHandCursor: true,
            });
        }

        const alpha = row.command ? 1 : 0.35;

        row.background.setAlpha(alpha);
        row.label.setAlpha(alpha);

        const markers = getTargetMarkers(beamCannons, row.targetNode);

        while (row.threatTexts.length > markers.length) {
            row.threatTexts.pop()?.destroy();
        }

        while (row.threatTexts.length < markers.length) {
            const text = this.scene.add
                .bitmapText(
                    0,
                    0,
                    FONT_FAMILY.VGA_8X14,
                    "",
                    FONT_SIZE.PX_14,
                )
                .setOrigin(1, 0.5);

            row.threatTexts.push(text);
            this.root.add(text);
        }

        for (let index = 0; index < markers.length; index += 1) {
            const marker = markers[index];
            const text = row.threatTexts[index];

            if (!marker || !text) {
                continue;
            }

            text
                .setText("! " + formatCaptainDashboardCountdown(marker.timeToFireMs))
                .setTint(FONT_COLOR.DANGER);
        }

        let rightX = this.width - VIEW.markerRightInset;

        for (let index = row.threatTexts.length - 1; index >= 0; index -= 1) {
            const text = row.threatTexts[index];

            if (!text) {
                continue;
            }

            text.setPosition(
                rightX,
                row.background.y + VIEW.rowHeight / 2,
            );

            rightX -= text.width + VIEW.markerGap;
        }
    }
}

function getTargetMarkers(
    beamCannons: BridgeCaptainIncomingBeamCannonPayload[],
    targetNode: BeamCannonTargetNode,
): ThreatMarker[] {
    const markers: ThreatMarker[] = [];

    for (const beamCannon of beamCannons) {
        if (beamCannon.targetNode !== targetNode) {
            continue;
        }

        markers.push({
            timeToFireMs: beamCannon.timeToFireMs,
        });
    }

    markers.sort((left, right) => {
        return left.timeToFireMs - right.timeToFireMs;
    });

    return markers;
}
