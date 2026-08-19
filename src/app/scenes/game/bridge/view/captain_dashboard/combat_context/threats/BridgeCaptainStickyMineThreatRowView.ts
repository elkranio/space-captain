import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainStickyMinePayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";

const TILE = {
    iconX: 9,
    iconY: 8,

    timerX: 154,
    timerY: 8,

    buttonWidth: 75,
    buttonY: 34,
    engineerButtonX: 5,

    roleOffsetX: 9,
    roleOffsetY: 10,

    labelRightInset: 10,
    labelOffsetY: 14,

    disabledAlpha: 0.35,
} as const;

type StickyMineThreatRowCallbacks = {
    onClear: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Image;
    roleGlyph: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
};

// Sticky Mine использует общий production-like threat tile.
// CLEAR остаётся Engineer-only, а верхняя середина намеренно пустая:
// текущие mine-state labels не меняют решение игрока.
export default class BridgeCaptainStickyMineThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;
    private readonly engineerAction: ActionButton;

    private engineerCommand?: BridgeOfficerCommandSelectedPayload;
    private engineerTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: StickyMineThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const background = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_TILE_BG, 0, 0);
        const mineIcon = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_MINE, TILE.iconX, TILE.iconY);

        this.timerText = this.scene.add
            .bitmapText(TILE.timerX, TILE.timerY, FONT_FAMILY.VGA_8X14, "--.-s", FONT_SIZE.PX_14)
            .setOrigin(1, 0)
            .setTint(FONT_COLOR.WHITE);

        this.engineerAction = this.createActionButton(TILE.engineerButtonX, UI_COMBAT_SPRITE_ID.ROLE_E, "CLEAR");

        this.engineerAction.background.on("pointerdown", this.handleEngineerPointerDown, this);

        this.root.add([
            background,
            mineIcon,
            this.timerText,
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

    public update(mine: BridgeCaptainStickyMinePayload): void {
        this.timerText.setText(formatCaptainDashboardCountdown(mine.timeToDetonationMs));

        this.setEngineerAction(mine.actions.engineerClear, mine.activeTasks?.engineerClearTaskId);
    }

    public destroy(): void {
        this.engineerAction.background.off("pointerdown", this.handleEngineerPointerDown, this);

        this.engineerCommand = undefined;
        this.engineerTaskId = undefined;

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

    private setEngineerAction(
        command: BridgeOfficerCommandSelectedPayload | undefined,
        taskId: string | undefined,
    ): void {
        this.engineerCommand = command;
        this.engineerTaskId = taskId;
        this.setActionState(this.engineerAction, command !== undefined, taskId !== undefined);
    }

    private setActionState(action: ActionButton, enabled: boolean, active: boolean): void {
        action.background.disableInteractive();
        action.background.clearTint();
        action.label.clearTint();

        if (enabled || active) {
            action.background.setInteractive({
                useHandCursor: true,
            });
        }

        if (active) {
            action.background.setTint(FONT_COLOR.ACTIVITY);
            action.label.setTint(FONT_COLOR.ACTIVITY);
        }

        const alpha = enabled || active ? 1 : TILE.disabledAlpha;

        action.background.setAlpha(alpha);
        action.roleGlyph.setAlpha(alpha);
        action.label.setAlpha(alpha);
    }

    private handleEngineerPointerDown(): void {
        if (this.engineerTaskId) {
            this.callbacks.onCancelTask(this.engineerTaskId);
            return;
        }

        if (!this.engineerCommand) {
            return;
        }

        this.callbacks.onClear(this.engineerCommand);
    }
}

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
