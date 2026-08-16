// src/app/scenes/game/bridge/view/combat/beam_cannon_threats/beam_cannon/BridgeBeamCannonThreatView.ts

import type BridgeScene from '../../../../BridgeScene';
import BridgeBeamCannonChargeView from '../../beam_cannon_charge/BridgeBeamCannonChargeView';

type BridgeBeamCannonThreatViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    weaponOrigin:
        Phaser.Math.Vector2;
};

// Enemy beamCannon charging presentation.
//
// Tactical designation and countdown live outside
// the viewscreen. This leaf only shows the physical
// charge effect at the enemy weapon origin.
export default class BridgeBeamCannonThreatView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly chargeView:
        BridgeBeamCannonChargeView;

    constructor({
        scene,
        parent,

        weaponOrigin,
    }: BridgeBeamCannonThreatViewOptions) {
        this.root =
            scene.add.container(
                Math.round(
                    weaponOrigin.x,
                ),
                Math.round(
                    weaponOrigin.y,
                ),
            );

        parent.add(
            this.root,
        );

        this.chargeView =
            BridgeBeamCannonChargeView.create({
                scene,
                parent:
                    this.root,
            });
    }

    public destroy(): void {
        this.chargeView.destroy();
        this.root.destroy(true);
    }
}
