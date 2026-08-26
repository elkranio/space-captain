import type BridgeScene from "../BridgeScene";
import BridgeMissileLauncherTileView, {
    MISSILE_LAUNCHER_PROGRESS_MODE,
    type MissileLauncherProgressMode,
} from "../view/captain_dashboard/player_ship/equipment/BridgeMissileLauncherTileView";

const PREVIEW = {
    x: 16,
    y: 435,
    width: 136,
    height: 86,
    durationMs: 2_400,
} as const;

type ProgressState = {
    progress: number;
};

// Временный визуальный стенд для equipment tile.
//
// 1 — cooldown
// 2 — repair
// 3 — targeting
// 4 — nominal / reset
export default class BridgeEquipmentTileDebugView {
    private readonly tileView: BridgeMissileLauncherTileView;

    private progressTween?: Phaser.Tweens.Tween;

    constructor(private readonly scene: BridgeScene) {
        this.tileView = new BridgeMissileLauncherTileView(this.scene, PREVIEW.width, PREVIEW.height);
        this.tileView.setPosition(PREVIEW.x, PREVIEW.y);
        this.tileView.setAmmo(5);
        this.tileView.setIntegrity(1, 2);

        this.scene.layers.get("ui").add(this.tileView.getRoot());

        this.scene.input.keyboard?.on("keydown", this.handleKeyDown, this);
    }

    public destroy(): void {
        this.scene.input.keyboard?.off("keydown", this.handleKeyDown, this);

        this.stopProgressTween();

        this.tileView.destroy();
    }

    private handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case "1":
                this.startPreview(MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN);
                return;

            case "2":
                this.startPreview(MISSILE_LAUNCHER_PROGRESS_MODE.REPAIR);
                return;

            case "3":
                this.startPreview(MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING);
                return;

            case "4":
                this.resetPreview();
                return;

            default:
                return;
        }
    }

    private startPreview(mode: MissileLauncherProgressMode): void {
        this.stopProgressTween();

        const state: ProgressState = {
            progress: 0,
        };

        this.tileView.setProgress(mode, state.progress);

        this.progressTween = this.scene.tweens.add({
            targets: state,
            progress: 1,
            duration: PREVIEW.durationMs,
            ease: "Linear",
            repeat: -1,

            onUpdate: () => {
                this.tileView.setProgress(mode, state.progress);
            },
        });
    }

    private resetPreview(): void {
        this.stopProgressTween();
        this.tileView.resetProgress();
    }

    private stopProgressTween(): void {
        this.progressTween?.stop();
        this.progressTween = undefined;
    }
}
