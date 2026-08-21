// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/BridgeCaptainBeamCannonThreatGlyphView.ts
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type { BridgeCaptainIncomingBeamCannonPayload } from "../../../../events/bridge_event";
import { BEAM_SHIELD_TIMING_PHASE, getBeamShieldTimingStripState } from "./get_beam_shield_timing_strip_state";
import { THREAT_CELL, THREAT_GLYPH_COLOR } from "./threat_glyph_style";

const TARGET_TEXT = {
    y: 52,
    fontSize: 11,
} as const;

type BeamCannonThreatGlyphCallbacks = {
    onOpenShieldTargeting: () => void;
    onCancelTask: (taskId: string) => void;
};

export default class BridgeCaptainBeamCannonThreatGlyphView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hitArea: Phaser.GameObjects.Rectangle;

    private readonly beamIcon: Phaser.GameObjects.Image;
    private readonly beamDangerIcon: Phaser.GameObjects.Image;

    private readonly targetText: Phaser.GameObjects.BitmapText;

    private readonly roleGlyph: Phaser.GameObjects.Image;
    private readonly actionLabel: Phaser.GameObjects.Text;

    private shieldTargetingAvailable = false;
    private engineerTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: BeamCannonThreatGlyphCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.hitArea = this.scene.add
            .rectangle(0, 0, THREAT_CELL.width, THREAT_CELL.height, 0xffffff, 0)
            .setOrigin(0, 0);

        this.beamIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_BEAM_CANNON,
            THREAT_CELL.glyphX,
            THREAT_CELL.glyphY,
        ).setTintFill(THREAT_GLYPH_COLOR.BEAM);

        this.beamDangerIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_BEAM_CANNON,
            THREAT_CELL.glyphX,
            THREAT_CELL.glyphY,
        )
            .setTintFill(FONT_COLOR.DANGER)
            .setVisible(false);

        this.targetText = this.scene.add
            .bitmapText(THREAT_CELL.width / 2, TARGET_TEXT.y, FONT_FAMILY.VGA_8X14, "--", TARGET_TEXT.fontSize)
            .setOrigin(0.5, 0)
            .setTint(FONT_COLOR.SECONDARY);

        this.roleGlyph = this.createSprite(UI_COMBAT_SPRITE_ID.ROLE_E, 0, THREAT_CELL.actionCenterY).setOrigin(0, 0.5);

        this.actionLabel = this.scene.add
            .text(0, THREAT_CELL.actionCenterY, "SHIELD", {
                fontFamily: "Anta",
                fontSize: "10px",
                color: "#ffffff",
                resolution: 1,
            })
            .setOrigin(0, 0.5);

        this.hitArea.on("pointerdown", this.handlePointerDown, this);

        this.root.add([
            this.hitArea,
            this.beamIcon,
            this.beamDangerIcon,
            this.targetText,
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

    public update(
        beamCannon: BridgeCaptainIncomingBeamCannonPayload,
        shieldTargetingAvailable: boolean,
        shieldDeployTaskId: string | undefined,
    ): void {
        this.targetText.setText(beamCannon.targetNode.toUpperCase());

        this.shieldTargetingAvailable = shieldTargetingAvailable;
        this.engineerTaskId = shieldDeployTaskId;

        this.updateActionState(shieldTargetingAvailable, shieldDeployTaskId !== undefined);

        this.updateGlyphTiming(beamCannon);
    }

    public destroy(): void {
        this.hitArea.off("pointerdown", this.handlePointerDown, this);

        this.shieldTargetingAvailable = false;
        this.engineerTaskId = undefined;

        this.root.destroy(true);
    }

    private createSprite(spriteId: UiCombatSpriteId, x: number, y: number): Phaser.GameObjects.Image {
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

        this.actionLabel.setText(active ? "CANCEL" : "SHIELD");

        const alpha = enabled || active ? 1 : THREAT_CELL.disabledAlpha;

        this.roleGlyph.setAlpha(alpha);
        this.actionLabel.setAlpha(alpha);

        this.layoutActionLabel();
    }

    private updateGlyphTiming(beamCannon: BridgeCaptainIncomingBeamCannonPayload): void {
        this.beamIcon.setVisible(true).setAlpha(1);
        this.beamDangerIcon.setVisible(false);

        const timing = getBeamShieldTimingStripState({
            remainingMs: beamCannon.timeToFireMs,
            initialRemainingMs: beamCannon.initialTimeToFireMs,
            shieldWindow: beamCannon.decisionTimings?.shieldWindow,
        });

        if (timing.phase === BEAM_SHIELD_TIMING_PHASE.HIDDEN) {
            return;
        }

        if (timing.phase === BEAM_SHIELD_TIMING_PHASE.EXPIRED) {
            this.showTerminalGlyph();
            return;
        }

        if (timing.phase === BEAM_SHIELD_TIMING_PHASE.TOO_EARLY) {
            const blinkOn = Math.floor(this.scene.time.now / THREAT_CELL.earlyBlinkPeriodMs) % 2 === 0;

            this.beamIcon.setAlpha(blinkOn ? 1 : 0.45);
            return;
        }

        this.showDangerProgress(1 - timing.validFill01);
    }

    private showDangerProgress(progress01: number): void {
        const clampedProgress01 = Math.max(0, Math.min(1, progress01));

        if (clampedProgress01 <= 0) {
            return;
        }

        const cropWidth = Math.max(1, Math.round(this.beamDangerIcon.width * clampedProgress01));

        this.beamDangerIcon.setCrop(0, 0, cropWidth, this.beamDangerIcon.height).setVisible(true);
    }

    private showTerminalGlyph(): void {
        const blinkOn = Math.floor(this.scene.time.now / THREAT_CELL.terminalBlinkPeriodMs) % 2 === 0;

        this.beamIcon.setVisible(false);
        this.beamDangerIcon.setCrop(0, 0, this.beamDangerIcon.width, this.beamDangerIcon.height).setVisible(blinkOn);
    }

    private layoutActionLabel(): void {
        const contentWidth = this.roleGlyph.displayWidth + THREAT_CELL.actionGap + this.actionLabel.width;
        const startX = Math.round((THREAT_CELL.width - contentWidth) / 2);

        this.roleGlyph.setPosition(startX, THREAT_CELL.actionCenterY);
        this.actionLabel.setPosition(
            startX + this.roleGlyph.displayWidth + THREAT_CELL.actionGap,
            THREAT_CELL.actionCenterY,
        );
    }

    private handlePointerDown(): void {
        if (this.engineerTaskId) {
            this.callbacks.onCancelTask(this.engineerTaskId);
            return;
        }

        if (!this.shieldTargetingAvailable) {
            return;
        }

        this.callbacks.onOpenShieldTargeting();
    }
}

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
