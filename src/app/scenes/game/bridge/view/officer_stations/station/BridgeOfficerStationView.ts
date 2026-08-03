import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import { BRIDGE_SEATED_OFFICER_SPRITES } from '../../../../../../manifests/bridge/seated_officer';
import {
    BRIDGE_STATION_SPRITE_ID,
    BRIDGE_STATION_SPRITES,
} from '../../../../../../manifests/bridge/station';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeOfficerStationIndicatorState,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import type { BridgeOfficerStationLayoutEntry } from '../bridge_officer_station_layout';
import BridgeOfficerStationActivityView from './activity/BridgeOfficerStationActivityView';
import BridgeOfficerStationHintsView from './hints/BridgeOfficerStationHintsView';
import BridgeOfficerStationIndicatorsView from './indicators/BridgeOfficerStationIndicatorsView';

// One reusable bridge station presentation.
//
// The base and seated officer use the same 242x180 source canvas,
// so identical position/origin values preserve their authored alignment.
export default class BridgeOfficerStationView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly stationImage: Phaser.GameObjects.Image;

    private readonly activityView: BridgeOfficerStationActivityView;

    private readonly hintsView: BridgeOfficerStationHintsView;

    private readonly indicatorsView: BridgeOfficerStationIndicatorsView;

    private readonly officerImage: Phaser.GameObjects.Image;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private readonly role: OfficerRole;

    private combatHints: string[] = [];

    private hasActiveActivity = false;

    constructor(
        private readonly scene: BridgeScene,

        parent: Phaser.GameObjects.Container,
        layout: BridgeOfficerStationLayoutEntry,

        private readonly eventBus: BridgeEventBus,
    ) {
        this.role = layout.role;

        this.root = this.scene.add.container(layout.position.x, layout.position.y);
        parent.add(this.root);

        const stationAsset = BRIDGE_STATION_SPRITES[BRIDGE_STATION_SPRITE_ID.BASE_00];

        this.stationImage = this.scene.add
            .image(0, 0, stationAsset.atlasKey, stationAsset.frameKey)
            .setOrigin(0.5, 0.5);

        this.activityView = new BridgeOfficerStationActivityView(this.scene);
        this.hintsView = new BridgeOfficerStationHintsView(this.scene);
        this.indicatorsView = new BridgeOfficerStationIndicatorsView(this.scene);

        const officerAsset = BRIDGE_SEATED_OFFICER_SPRITES[layout.seatedOfficerSpriteId];

        this.officerImage = this.scene.add
            .image(0, 0, officerAsset.atlasKey, officerAsset.frameKey)
            .setOrigin(0.5, 0.5);

        this.hitArea = this.scene.add
            .zone(0, 0, layout.hitArea.width, layout.hitArea.height)
            .setOrigin(0.5, 0.5)
            .setInteractive({
                useHandCursor: true,
            })
            .on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.root.add([
            this.stationImage,
            this.hintsView.getRoot(),
            this.activityView.getRoot(),
            this.indicatorsView.getRoot(),
            this.officerImage,
            this.hitArea,
        ]);

    }

    public destroy(): void {
        this.hitArea.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.activityView.destroy();
        this.hintsView.destroy();
        this.indicatorsView.destroy();

        this.hitArea.destroy();
        this.officerImage.destroy();
        this.stationImage.destroy();

        this.root.destroy(false);
    }

    public setIndicatorState(state: BridgeOfficerStationIndicatorState): void {
        this.indicatorsView.setState(state);
    }

    public showActivity(label: string): void {
        this.hasActiveActivity = true;
        this.hintsView.clear();

        this.activityView.show(label);
    }

    public setCombatHints(hints: readonly string[]): void {
        this.combatHints = [...hints];

        if (this.hasActiveActivity) {
            return;
        }

        this.hintsView.setHints(this.combatHints);
    }

    public setActivityProgress(progress: number | null): void {
        this.activityView.setProgress(progress);
    }

    public clearActivity(): void {
        this.hasActiveActivity = false;
        this.activityView.clear();
        this.hintsView.setHints(this.combatHints);
    }

    private handlePointerDown(): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_STATION_CLICKED, {
            role: this.role,
        });
    }
}
