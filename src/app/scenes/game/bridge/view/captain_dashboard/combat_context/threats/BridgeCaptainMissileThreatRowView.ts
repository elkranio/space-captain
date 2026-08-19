import { MISSILE_SIGNATURE_INTEL_STATUS } from "../../../../../../../../engine/encounter/model/missile_signature_intel";
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainIncomingMissilePayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";

const TILE = {
    width: 163,
    height: 66,

    iconX: 7,
    iconY: 8,

    statusX: 51,
    statusY: 8,

    timerX: 156,
    timerY: 8,

    buttonY: 34,
    scienceButtonX: 5,
    weaponsButtonX: 83,

    roleOffsetX: 9,
    roleOffsetY: 10,

    labelOffsetX: 47,
    labelOffsetY: 14,

    disabledAlpha: 0.35,
} as const;

type MissileThreatRowCallbacks = {
    onIdentify: (command: BridgeOfficerCommandSelectedPayload) => void;
    onIntercept: (command: BridgeOfficerCommandSelectedPayload) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Image;
    roleGlyph: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.BitmapText;
};

// Первый production-like threat tile.
//
// Пока общий ThreatsView всё ещё раскладывает mixed threat types вертикально.
// В следующем layout-атоме этот fixed 163x66 tile станет ячейкой общей 3x2 сетки.
export default class BridgeCaptainMissileThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;
    private readonly identificationText: Phaser.GameObjects.BitmapText;

    private readonly scienceAction: ActionButton;
    private readonly weaponsAction: ActionButton;

    private scienceCommand?: BridgeOfficerCommandSelectedPayload;
    private weaponsCommand?: BridgeOfficerCommandSelectedPayload;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: MissileThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const background = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_TILE_BG, 0, 0);
        const missileIcon = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_MISSILE, TILE.iconX, TILE.iconY);

        this.identificationText = this.scene.add
            .bitmapText(
                TILE.statusX,
                TILE.statusY,
                FONT_FAMILY.VGA_8X14,
                "NO ID",
                FONT_SIZE.PX_14,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.DANGER);

        this.timerText = this.scene.add
            .bitmapText(
                TILE.timerX,
                TILE.timerY,
                FONT_FAMILY.VGA_8X14,
                "--.-s",
                FONT_SIZE.PX_14,
            )
            .setOrigin(1, 0)
            .setTint(FONT_COLOR.WHITE);

        this.scienceAction = this.createActionButton(
            TILE.scienceButtonX,
            UI_COMBAT_SPRITE_ID.ROLE_S,
            "TRACK",
        );

        this.weaponsAction = this.createActionButton(
            TILE.weaponsButtonX,
            UI_COMBAT_SPRITE_ID.ROLE_W,
            "HIT",
        );

        this.scienceAction.background.on("pointerdown", this.handleSciencePointerDown, this);
        this.weaponsAction.background.on("pointerdown", this.handleWeaponsPointerDown, this);

        this.root.add([
            background,
            missileIcon,
            this.identificationText,
            this.timerText,
            this.scienceAction.background,
            this.scienceAction.roleGlyph,
            this.scienceAction.label,
            this.weaponsAction.background,
            this.weaponsAction.roleGlyph,
            this.weaponsAction.label,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(missile: BridgeCaptainIncomingMissilePayload): void {
        this.timerText.setText(formatCaptainDashboardCountdown(missile.timeToImpactMs));

        this.updateIdentification(missile.identificationStatus);

        if (missile.identificationStatus === MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED) {
            this.hideScienceAction();
        } else {
            this.setScienceAction(missile.actions.identifyThreat);
        }

        this.setWeaponsAction(missile.actions.interceptMissile);
    }

    public destroy(): void {
        this.scienceAction.background.off("pointerdown", this.handleSciencePointerDown, this);
        this.weaponsAction.background.off("pointerdown", this.handleWeaponsPointerDown, this);

        this.scienceCommand = undefined;
        this.weaponsCommand = undefined;

        this.root.destroy(true);
    }

    private createSprite(spriteId: UiCombatSpriteId, x: number, y: number): Phaser.GameObjects.Image {
        const sprite = UI_COMBAT_SPRITES[spriteId];

        return this.scene.add.image(x, y, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);
    }

    private createActionButton(x: number, roleSpriteId: UiCombatSpriteId, labelText: string): ActionButton {
        const background = this.createSprite(UI_COMBAT_SPRITE_ID.ACTION_BUTTON_BG, x, TILE.buttonY);

        const roleGlyph = this.createSprite(
            roleSpriteId,
            x + TILE.roleOffsetX,
            TILE.buttonY + TILE.roleOffsetY,
        );

        const label = this.scene.add
            .bitmapText(
                x + TILE.labelOffsetX,
                TILE.buttonY + TILE.labelOffsetY,
                FONT_FAMILY.VGA_8X14,
                labelText,
                FONT_SIZE.PX_14,
            )
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.WHITE);

        return {
            background,
            roleGlyph,
            label,
        };
    }

    private updateIdentification(status: BridgeCaptainIncomingMissilePayload["identificationStatus"]): void {
        switch (status) {
            case MISSILE_SIGNATURE_INTEL_STATUS.UNKNOWN:
                this.identificationText.setText("NO ID").setTint(FONT_COLOR.DANGER);
                return;

            case MISSILE_SIGNATURE_INTEL_STATUS.UNCERTAIN:
                this.identificationText.setText("GUESS").setTint(FONT_COLOR.ACTIVITY);
                return;

            case MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED:
                this.identificationText.setText("LOCK").setTint(FONT_COLOR.SECONDARY);
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

    private setWeaponsAction(command: BridgeOfficerCommandSelectedPayload | undefined): void {
        this.setActionVisible(this.weaponsAction, true);

        this.weaponsCommand = command;
        this.setActionEnabled(this.weaponsAction, command !== undefined);
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

        this.callbacks.onIdentify(this.scienceCommand);
    }

    private handleWeaponsPointerDown(): void {
        if (!this.weaponsCommand) {
            return;
        }

        this.callbacks.onIntercept(this.weaponsCommand);
    }
}

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
