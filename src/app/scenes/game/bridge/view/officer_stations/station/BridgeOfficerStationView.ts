import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import { BRIDGE_SEATED_OFFICER_SPRITES } from '../../../../../../manifests/bridge/seated_officer';
import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import type { BridgeOfficerStationLayoutEntry } from '../bridge_officer_station_layout';

// One bridge officer sitting at a station already painted into the background.
// The authored sprite is chair + body + head; only the image may be mirrored.
export default class BridgeOfficerStationView {
    private readonly root: Phaser.GameObjects.Container;

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

        this.root = this.scene.add.container(
            layout.position.x,
            layout.position.y,
        );
        parent.add(this.root);

        const officerAsset =
            BRIDGE_SEATED_OFFICER_SPRITES[
                layout.seatedOfficerSpriteId
            ];

        this.officerImage = this.scene.add
            .image(
                0,
                0,
                officerAsset.atlasKey,
                officerAsset.frameKey,
            )
            .setOrigin(0.5, 0.5)
            .setFlipX(layout.flipX);

        this.hitArea = this.scene.add
            .zone(
                0,
                0,
                layout.hitArea.width,
                layout.hitArea.height,
            )
            .setOrigin(0.5, 0.5)
            .setInteractive({
                useHandCursor: true,
            })
            .on(
                Phaser.Input.Events.POINTER_DOWN,
                this.handlePointerDown,
                this,
            );

        this.root.add([
            this.officerImage,
            this.hitArea,
        ]);
    }

    public destroy(): void {
        this.hitArea.off(
            Phaser.Input.Events.POINTER_DOWN,
            this.handlePointerDown,
            this,
        );

        this.hitArea.destroy();
        this.officerImage.destroy();
        this.root.destroy(false);
    }

    private handlePointerDown(): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_STATION_CLICKED,
            {
                role: this.role,
            },
        );
    }
}
