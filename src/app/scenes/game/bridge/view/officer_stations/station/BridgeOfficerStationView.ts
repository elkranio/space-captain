import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import { BRIDGE_SEATED_OFFICER_SPRITES } from '../../../../../../manifests/bridge/seated_officer';
import {
    BRIDGE_STATION_SPRITE_ID,
    BRIDGE_STATION_SPRITES,
} from '../../../../../../manifests/bridge/station';
import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import type { BridgeOfficerStationLayoutEntry } from '../bridge_officer_station_layout';

// One reusable bridge station presentation.
//
// The base and seated officer use the same 242x180 source canvas,
// so identical position/origin values preserve their authored alignment.
export default class BridgeOfficerStationView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly stationImage: Phaser.GameObjects.Image;

    private readonly officerImage: Phaser.GameObjects.Image;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private readonly role: OfficerRole;

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

        this.root.add([this.stationImage, this.officerImage, this.hitArea]);
    }

    public destroy(): void {
        this.hitArea.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.root.destroy(true);
    }

    private handlePointerDown(): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_STATION_CLICKED, {
            role: this.role,
        });
    }
}
