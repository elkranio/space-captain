import {
    BRIDGE_THREAT_ICON_ID,
    BRIDGE_THREAT_ICONS,
} from "../../../../../../../../../manifests/bridge/threat_icons";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../../../theme/font";
import type BridgeScene from "../../../../../../BridgeScene";
import type {
    BridgeCaptainIncomingMissilePayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_STYLE } from "../../../../captain_dashboard_style";
import BridgeDefenseTurretTrackingIndicatorView from "./BridgeDefenseTurretTrackingIndicatorView";

const LANE = {
    trajectoryDashWidth: 4,
    trajectoryDashGap: 5,
    trajectoryDashHeight: 2,
    trajectoryAlpha: 0.55,

    actionHoverAlpha: 0.18,
    fireBorderThickness: 1,

    cutoffWidth: 2,
    cutoffHeight: 14,
    cutoffAlpha: 0.7,

    dangerBlinkMs: 220,
} as const;

type ThreatLaneGeometry = {
    trajectoryLeftX: number;
    trajectoryRightX: number;
    cutoffX: number;

    fireButtonX: number;
    fireButtonWidth: number;
    fireButtonHeight: number;
};

export default class BridgeDefenseTurretThreatLaneView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly fireBackground: Phaser.GameObjects.Rectangle;

    private readonly fireText: Phaser.GameObjects.BitmapText;

    private readonly threatIcon: Phaser.GameObjects.Image;

    private readonly trackingIndicator: BridgeDefenseTurretTrackingIndicatorView;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private command?: BridgeOfficerCommandSelectedPayload;

    private cancelTaskId?: string;

    private interceptActive = false;

    private pointerOver = false;

    private danger = false;

    private dangerBlinkRed = false;

    private dangerBlinkEvent?: Phaser.Time.TimerEvent;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        private readonly height: number,
        private readonly geometry: ThreatLaneGeometry,
        private readonly onFireRequested: (command: BridgeOfficerCommandSelectedPayload) => void,
        private readonly onCancelRequested: (taskId: string) => void,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.createTrajectory();
        this.createCutoff();

        const fireY = Math.round(
            (this.height - this.geometry.fireButtonHeight) / 2,
        );

        this.fireBackground = this.scene.add
            .rectangle(
                this.geometry.fireButtonX,
                fireY,
                this.geometry.fireButtonWidth,
                this.geometry.fireButtonHeight,
                FONT_COLOR.PRIMARY,
                0,
            )
            .setOrigin(0, 0);

        this.fireText = this.scene.add
            .bitmapText(
                this.geometry.fireButtonX + Math.round(this.geometry.fireButtonWidth / 2),
                Math.round(this.height / 2),
                FONT_FAMILY.UI_PRIMARY,
                "FIRE",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0.5, 0.5);

        const threatSprite = BRIDGE_THREAT_ICONS[BRIDGE_THREAT_ICON_ID.MISSILE_INCOMING];

        this.threatIcon = this.scene.add
            .image(
                this.geometry.trajectoryRightX,
                Math.round(this.height / 2),
                threatSprite.atlasKey,
                threatSprite.frameKey,
            )
            .setTint(FONT_COLOR.PRIMARY);

        this.trackingIndicator = new BridgeDefenseTurretTrackingIndicatorView(this.scene);

        this.hitArea = this.scene.add
            .zone(0, 0, this.width, this.height)
            .setOrigin(0, 0)
            .setInteractive()
            .on(
                Phaser.Input.Events.POINTER_OVER,
                this.handlePointerOver,
                this,
            )
            .on(
                Phaser.Input.Events.POINTER_OUT,
                this.handlePointerOut,
                this,
            )
            .on(
                Phaser.Input.Events.POINTER_UP,
                this.handlePointerUp,
                this,
            );

        this.root.add([
            this.fireBackground,
            this.fireText,
            this.trackingIndicator.getRoot(),
            this.threatIcon,
            this.hitArea,
        ]);

        this.renderInteraction();
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(
        missile: BridgeCaptainIncomingMissilePayload,
        cutoffRemainingMs: number | null | undefined,
        interceptActive: boolean,
    ): void {
        this.command = missile.actions.interceptMissile;
        this.cancelTaskId = missile.activeTasks?.interceptMissileTaskId;
        this.interceptActive = interceptActive;

        this.threatIcon.setX(
            getThreatMarkerX(
                missile.timeToImpactMs,
                missile.initialTimeToImpactMs,
                cutoffRemainingMs,
                this.geometry.trajectoryLeftX,
                this.geometry.cutoffX,
                this.geometry.trajectoryRightX,
            ),
        );

        this.trackingIndicator.update(
            this.cancelTaskId !== undefined,
            this.geometry.trajectoryLeftX,
            this.threatIcon.x - Math.round(this.threatIcon.displayWidth / 2),
            Math.round(this.height / 2),
        );

        this.setDanger(
            cutoffRemainingMs === null ||
                (
                    cutoffRemainingMs !== undefined &&
                    missile.timeToImpactMs <= cutoffRemainingMs
                ),
        );

        this.renderInteraction();
    }

    public destroy(): void {
        this.stopDangerBlink();
        this.trackingIndicator.destroy();

        this.hitArea.off(
            Phaser.Input.Events.POINTER_OVER,
            this.handlePointerOver,
            this,
        );
        this.hitArea.off(
            Phaser.Input.Events.POINTER_OUT,
            this.handlePointerOut,
            this,
        );
        this.hitArea.off(
            Phaser.Input.Events.POINTER_UP,
            this.handlePointerUp,
            this,
        );

        this.root.destroy(true);
    }

    private createTrajectory(): void {
        const centerY = Math.round(this.height / 2);
        const step = LANE.trajectoryDashWidth + LANE.trajectoryDashGap;

        for (
            let x = this.geometry.trajectoryLeftX;
            x + LANE.trajectoryDashWidth <= this.geometry.trajectoryRightX;
            x += step
        ) {
            this.root.add(
                this.scene.add
                    .rectangle(
                        x,
                        centerY,
                        LANE.trajectoryDashWidth,
                        LANE.trajectoryDashHeight,
                        FONT_COLOR.PRIMARY,
                        LANE.trajectoryAlpha,
                    )
                    .setOrigin(0, 0.5),
            );
        }
    }

    private createCutoff(): void {
        this.root.add(
            this.scene.add
                .rectangle(
                    this.geometry.cutoffX,
                    Math.round(this.height / 2),
                    LANE.cutoffWidth,
                    LANE.cutoffHeight,
                    FONT_COLOR.PRIMARY,
                    LANE.cutoffAlpha,
                )
                .setOrigin(0.5, 0.5),
        );
    }

    private setDanger(danger: boolean): void {
        if (this.danger === danger) {
            return;
        }

        this.danger = danger;
        this.stopDangerBlink();

        if (!danger) {
            this.dangerBlinkRed = false;
            this.renderThreatTint();
            return;
        }

        this.dangerBlinkRed = true;
        this.renderThreatTint();

        this.dangerBlinkEvent = this.scene.time.addEvent({
            delay: LANE.dangerBlinkMs,
            loop: true,
            callback: this.handleDangerBlink,
            callbackScope: this,
        });
    }

    private stopDangerBlink(): void {
        this.dangerBlinkEvent?.remove(false);
        this.dangerBlinkEvent = undefined;
    }

    private handleDangerBlink(): void {
        this.dangerBlinkRed = !this.dangerBlinkRed;
        this.renderThreatTint();
    }

    private renderThreatTint(): void {
        const actionAvailable =
            this.cancelTaskId !== undefined ||
            (!this.interceptActive && this.command !== undefined);

        const idleColor =
            actionAvailable && this.pointerOver
                ? FONT_COLOR.WHITE
                : FONT_COLOR.PRIMARY;

        this.threatIcon.setTint(
            this.danger && this.dangerBlinkRed
                ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
                : idleColor,
        );
    }

    private renderInteraction(): void {
        const cancelling = this.cancelTaskId !== undefined;
        const fireVisible = !this.interceptActive;
        const actionVisible = cancelling || fireVisible;
        const enabled = cancelling || this.command !== undefined;

        const idleColor = enabled
            ? FONT_COLOR.PRIMARY
            : CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor;

        const hoverColor = cancelling
            ? FONT_COLOR.DANGER
            : FONT_COLOR.ACTIVITY;

        const color =
            enabled && this.pointerOver
                ? hoverColor
                : idleColor;

        this.fireBackground
            .setVisible(actionVisible)
            .setFillStyle(
                color,
                enabled && this.pointerOver ? LANE.actionHoverAlpha : 0,
            )
            .setStrokeStyle(LANE.fireBorderThickness, color);

        this.fireText
            .setVisible(actionVisible)
            .setText(cancelling ? "CANCEL" : "FIRE")
            .setTint(color);

        this.renderThreatTint();
    }

    private handlePointerOver(): void {
        this.pointerOver = true;
        this.renderInteraction();
    }

    private handlePointerOut(): void {
        this.pointerOver = false;
        this.renderInteraction();
    }

    private handlePointerUp(): void {
        if (this.cancelTaskId) {
            this.onCancelRequested(this.cancelTaskId);
            return;
        }

        if (this.interceptActive || !this.command) {
            return;
        }

        this.onFireRequested(this.command);
    }
}

function getThreatMarkerX(
    timeToImpactMs: number,
    initialTimeToImpactMs: number,
    cutoffRemainingMs: number | null | undefined,
    leftX: number,
    cutoffX: number,
    rightX: number,
): number {
    if (initialTimeToImpactMs <= 0) {
        return leftX;
    }

    const remainingMs = Phaser.Math.Clamp(
        timeToImpactMs,
        0,
        initialTimeToImpactMs,
    );

    if (cutoffRemainingMs === null || cutoffRemainingMs === undefined) {
        return Phaser.Math.Linear(
            leftX,
            rightX,
            remainingMs / initialTimeToImpactMs,
        );
    }

    if (remainingMs <= cutoffRemainingMs) {
        if (cutoffRemainingMs <= 0) {
            return leftX;
        }

        return Phaser.Math.Linear(
            leftX,
            cutoffX,
            Phaser.Math.Clamp(remainingMs / cutoffRemainingMs, 0, 1),
        );
    }

    if (initialTimeToImpactMs <= cutoffRemainingMs) {
        return cutoffX;
    }

    return Phaser.Math.Linear(
        cutoffX,
        rightX,
        Phaser.Math.Clamp(
            (remainingMs - cutoffRemainingMs) /
                (initialTimeToImpactMs - cutoffRemainingMs),
            0,
            1,
        ),
    );
}
