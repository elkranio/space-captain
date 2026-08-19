// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/BridgeCaptainBeamCannonThreatRowView.ts
import { BEAM_CANNON_TARGET_INTEL_STATUS } from "../../../../../../../../engine/encounter/model/combat";
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainIncomingBeamCannonPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";

const TILE = {
    width: 163,
    height: 66,

    iconX: 9,
    iconY: 8,

    statusCenterX: 81,
    statusY: 8,

    timerX: 154,
    timerY: 8,

    buttonWidth: 75,
    buttonY: 34,
    scienceButtonX: 5,
    engineerButtonX: 83,

    roleOffsetX: 9,
    roleOffsetY: 10,

    labelRightInset: 10,
    labelOffsetY: 14,

    disabledAlpha: 0.35,
} as const;

type BeamCannonThreatRowCallbacks = {
    onTrack: (command: BridgeOfficerCommandSelectedPayload) => void;
    onDeployShield: (command: BridgeOfficerCommandSelectedPayload) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Image;
    roleGlyph: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
};

// Beam Cannon использует тот же production-like tile grammar, что и missile.
// Objective target остаётся скрытым в engine; view рисует только player-observer intel.
export default class BridgeCaptainBeamCannonThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;
    private readonly targetText: Phaser.GameObjects.BitmapText;

    private readonly scienceAction: ActionButton;
    private readonly engineerAction: ActionButton;

    private scienceCommand?: BridgeOfficerCommandSelectedPayload;
    private engineerCommand?: BridgeOfficerCommandSelectedPayload;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: BeamCannonThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const background = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_TILE_BG, 0, 0);
        const beamCannonIcon = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_BEAM_CANNON, TILE.iconX, TILE.iconY);

        this.targetText = this.scene.add
            .bitmapText(TILE.statusCenterX, TILE.statusY, FONT_FAMILY.VGA_8X14, "UNKNOWN", FONT_SIZE.PX_14)
            .setOrigin(0.5, 0)
            .setTint(FONT_COLOR.DANGER);

        this.timerText = this.scene.add
            .bitmapText(TILE.timerX, TILE.timerY, FONT_FAMILY.VGA_8X14, "--.-s", FONT_SIZE.PX_14)
            .setOrigin(1, 0)
            .setTint(FONT_COLOR.WHITE);

        this.scienceAction = this.createActionButton(TILE.scienceButtonX, UI_COMBAT_SPRITE_ID.ROLE_S, "TRACK");

        this.engineerAction = this.createActionButton(TILE.engineerButtonX, UI_COMBAT_SPRITE_ID.ROLE_E, "SHIELD");

        this.scienceAction.background.on("pointerdown", this.handleSciencePointerDown, this);
        this.engineerAction.background.on("pointerdown", this.handleEngineerPointerDown, this);

        this.root.add([
            background,
            beamCannonIcon,
            this.targetText,
            this.timerText,
            this.scienceAction.background,
            this.scienceAction.roleGlyph,
            this.scienceAction.label,
            this.engineerAction.background,
            this.engineerAction.roleGlyph,
            this.engineerAction.label,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(beamCannon: BridgeCaptainIncomingBeamCannonPayload): void {
        this.timerText.setText(formatCaptainDashboardCountdown(beamCannon.timeToFireMs));

        this.updateTargetIntel(beamCannon.targetIntel);

        if (beamCannon.targetIntel.status === BEAM_CANNON_TARGET_INTEL_STATUS.CONFIRMED) {
            this.hideScienceAction();
        } else {
            this.setScienceAction(beamCannon.actions.trackTarget);
        }

        this.setEngineerAction(beamCannon.actions.deployShield);
    }

    public destroy(): void {
        this.scienceAction.background.off("pointerdown", this.handleSciencePointerDown, this);
        this.engineerAction.background.off("pointerdown", this.handleEngineerPointerDown, this);

        this.scienceCommand = undefined;
        this.engineerCommand = undefined;

        this.root.destroy(true);
    }

    private createSprite(spriteId: UiCombatSpriteId, x: number, y: number): Phaser.GameObjects.Image {
        const sprite = UI_COMBAT_SPRITES[spriteId];

        return this.scene.add.image(x, y, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);
    }

    private createActionButton(x: number, roleSpriteId: UiCombatSpriteId, labelText: string): ActionButton {
        const background = this.createSprite(UI_COMBAT_SPRITE_ID.ACTION_BUTTON_BG, x, TILE.buttonY);

        const roleGlyph = this.createSprite(roleSpriteId, x + TILE.roleOffsetX, TILE.buttonY + TILE.roleOffsetY);

        const label = this.scene.add
            .text(x + TILE.buttonWidth - TILE.labelRightInset, TILE.buttonY + TILE.labelOffsetY, labelText, {
                fontFamily: "Anta",
                fontSize: "10px",
                color: "#ffffff",
                resolution: 1,
            })
            .setOrigin(1, 0.5);

        return {
            background,
            roleGlyph,
            label,
        };
    }

    private updateTargetIntel(targetIntel: BridgeCaptainIncomingBeamCannonPayload["targetIntel"]): void {
        switch (targetIntel.status) {
            case BEAM_CANNON_TARGET_INTEL_STATUS.UNKNOWN:
                this.targetText.setText("UNKNOWN").setTint(FONT_COLOR.DANGER);
                return;

            case BEAM_CANNON_TARGET_INTEL_STATUS.UNCERTAIN:
                this.targetText.setText(`${targetIntel.hypothesis.toUpperCase()}?`).setTint(FONT_COLOR.ACTIVITY);
                return;

            case BEAM_CANNON_TARGET_INTEL_STATUS.CONFIRMED:
                this.targetText.setText(targetIntel.hypothesis.toUpperCase()).setTint(FONT_COLOR.SECONDARY);
                return;
        }
    }

    private setScienceAction(command: BridgeOfficerCommandSelectedPayload | undefined): void {
        this.setActionVisible(this.scienceAction, true);

        this.scienceCommand = command;
        this.setActionEnabled(this.scienceAction, command !== undefined);
    }

    private hideScienceAction(): void {
        this.scienceCommand = undefined;

        this.scienceAction.background.disableInteractive();
        this.setActionVisible(this.scienceAction, false);
    }

    private setEngineerAction(command: BridgeOfficerCommandSelectedPayload | undefined): void {
        this.setActionVisible(this.engineerAction, true);

        this.engineerCommand = command;
        this.setActionEnabled(this.engineerAction, command !== undefined);
    }

    private setActionVisible(action: ActionButton, visible: boolean): void {
        action.background.setVisible(visible);
        action.roleGlyph.setVisible(visible);
        action.label.setVisible(visible);
    }

    private setActionEnabled(action: ActionButton, enabled: boolean): void {
        action.background.disableInteractive();

        if (enabled) {
            action.background.setInteractive({
                useHandCursor: true,
            });
        }

        const alpha = enabled ? 1 : TILE.disabledAlpha;

        action.background.setAlpha(alpha);
        action.roleGlyph.setAlpha(alpha);
        action.label.setAlpha(alpha);
    }

    private handleSciencePointerDown(): void {
        if (!this.scienceCommand) {
            return;
        }

        this.callbacks.onTrack(this.scienceCommand);
    }

    private handleEngineerPointerDown(): void {
        if (!this.engineerCommand) {
            return;
        }

        this.callbacks.onDeployShield(this.engineerCommand);
    }
}

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
