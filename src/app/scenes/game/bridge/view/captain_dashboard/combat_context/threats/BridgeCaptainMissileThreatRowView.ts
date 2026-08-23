// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/BridgeCaptainMissileThreatRowView.ts
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainIncomingMissilePayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { getThreatActiveTaskRoleAlpha, THREAT_CELL, THREAT_GLYPH_COLOR } from "./threat_glyph_style";

const TILE = THREAT_CELL;

type MissileThreatRowCallbacks = {
    onIntercept: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

// Temporary single-threat migration target.
//
// Missile already uses the new dashboard grammar:
// - large concrete glyph;
// - no card chrome or numeric countdown;
// - whole cell is the HIT / CANCEL target;
// - red glyph fill shows how much of the useful-start window has been spent;
// - full-red blink means the latest useful start has already been missed.
//
// BridgeCaptainThreatsView still owns the legacy grid while the other threat
// views are migrated one by one.
export default class BridgeCaptainMissileThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hitArea: Phaser.GameObjects.Rectangle;

    private readonly missileIcon: Phaser.GameObjects.Image;

    private readonly missileDangerIcon: Phaser.GameObjects.Image;

    private readonly roleGlyph: Phaser.GameObjects.Image;

    private readonly actionLabel: Phaser.GameObjects.Text;

    private weaponsCommand?: BridgeOfficerCommandSelectedPayload;

    private weaponsTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: MissileThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.hitArea = this.scene.add
            .rectangle(0, 0, TILE.width, TILE.height, 0xffffff, 0)
            .setOrigin(0, 0);

        this.missileIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_MISSILE,
            TILE.glyphX,
            TILE.glyphY,
        )
            .setTintFill(THREAT_GLYPH_COLOR.MISSILE);

        this.missileDangerIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_MISSILE,
            TILE.glyphX,
            TILE.glyphY,
        )
            .setTintFill(FONT_COLOR.DANGER)
            .setVisible(false);

        this.roleGlyph = this.createSprite(UI_COMBAT_SPRITE_ID.ROLE_W, 0, TILE.actionCenterY)
            .setOrigin(0, 0.5);

        this.actionLabel = this.scene.add
            .text(0, TILE.actionCenterY, "HIT", {
                fontFamily: "Anta",
                fontSize: "10px",
                color: "#ffffff",
                resolution: 1,
            })
            .setOrigin(0, 0.5);

        this.hitArea.on("pointerdown", this.handlePointerDown, this);

        this.root.add([
            this.hitArea,
            this.missileIcon,
            this.missileDangerIcon,
            this.roleGlyph,
            this.actionLabel,
        ]);

        this.layoutActionLabel();
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(missile: BridgeCaptainIncomingMissilePayload): void {
        const interceptMissileTaskId = missile.activeTasks?.interceptMissileTaskId;

        this.weaponsCommand = missile.actions.interceptMissile;
        this.weaponsTaskId = interceptMissileTaskId;

        this.updateActionState(
            missile.actions.interceptMissile !== undefined,
            interceptMissileTaskId !== undefined,
        );

        this.updateGlyphTiming(
            missile.timeToImpactMs,
            missile.initialTimeToImpactMs,
            missile.decisionTimings?.interceptMissileMinRemainingMs,
        );
    }

    public destroy(): void {
        this.hitArea.off("pointerdown", this.handlePointerDown, this);

        this.weaponsCommand = undefined;
        this.weaponsTaskId = undefined;

        this.root.destroy(true);
    }

    private createSprite(
        spriteId: UiCombatSpriteId,
        x: number,
        y: number,
    ): Phaser.GameObjects.Image {
        const sprite = UI_COMBAT_SPRITES[spriteId];

        return this.scene.add.image(x, y, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);
    }

    private updateActionState(enabled: boolean, active: boolean): void {
        this.hitArea.disableInteractive();

        if (enabled || active) {
            this.hitArea.setInteractive({
                useHandCursor: true,
            });
        }

        this.actionLabel.setText(active ? "CANCEL" : "HIT");

        const alpha = enabled || active ? 1 : TILE.disabledAlpha;

        this.roleGlyph.setAlpha(active ? getThreatActiveTaskRoleAlpha(this.scene.time.now) : alpha);
        this.actionLabel.setAlpha(alpha);

        this.layoutActionLabel();
    }

    private updateGlyphTiming(
        remainingMs: number,
        initialRemainingMs: number,
        latestUsefulStartRemainingMs: number | null | undefined,
    ): void {
        this.missileIcon.setVisible(true);
        this.missileDangerIcon.setVisible(false);

        if (latestUsefulStartRemainingMs === undefined) {
            return;
        }

        if (latestUsefulStartRemainingMs === null) {
            this.showTerminalGlyph();
            return;
        }

        const usefulWindowMs = initialRemainingMs - latestUsefulStartRemainingMs;
        const usefulRemainingMs = remainingMs - latestUsefulStartRemainingMs;

        if (usefulWindowMs <= 0 || usefulRemainingMs <= 0) {
            this.showTerminalGlyph();
            return;
        }

        const usefulRemaining01 = Math.max(0, Math.min(1, usefulRemainingMs / usefulWindowMs));
        const dangerProgress01 = 1 - usefulRemaining01;

        if (dangerProgress01 <= 0) {
            return;
        }

        const cropWidth = Math.round(this.missileDangerIcon.width * dangerProgress01);

        if (cropWidth <= 0) {
            return;
        }

        this.missileDangerIcon
            .setCrop(0, 0, cropWidth, this.missileDangerIcon.height)
            .setVisible(true);
    }

    private showTerminalGlyph(): void {
        const blinkOn =
            Math.floor(this.scene.time.now / TILE.terminalBlinkPeriodMs) % 2 === 0;

        this.missileIcon.setVisible(false);
        this.missileDangerIcon
            .setCrop(
                0,
                0,
                this.missileDangerIcon.width,
                this.missileDangerIcon.height,
            )
            .setVisible(blinkOn);
    }

    private layoutActionLabel(): void {
        const contentWidth =
            this.roleGlyph.displayWidth + TILE.actionGap + this.actionLabel.width;
        const startX = Math.round((TILE.width - contentWidth) / 2);

        this.roleGlyph.setPosition(startX, TILE.actionCenterY);
        this.actionLabel.setPosition(
            startX + this.roleGlyph.displayWidth + TILE.actionGap,
            TILE.actionCenterY,
        );
    }

    private handlePointerDown(): void {
        if (this.weaponsTaskId) {
            this.callbacks.onCancelTask(this.weaponsTaskId);
            return;
        }

        if (!this.weaponsCommand) {
            return;
        }

        this.callbacks.onIntercept(this.weaponsCommand);
    }
}

type UiCombatSpriteId =
    (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
