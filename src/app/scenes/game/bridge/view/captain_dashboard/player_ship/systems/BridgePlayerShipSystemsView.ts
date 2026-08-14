import {
    SHIP_WEAPON_KIND,
    type ShipWeaponKind,
} from '../../../../../../../../engine/defs/ship_weapon';
import type BridgeScene from '../../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgePlayerShipDashboardUpdatedPayload,
    type BridgePlayerWeaponDashboardPayload,
} from '../../../../events/bridge_event';
import type BridgeEventBus from '../../../../events/BridgeEventBus';
import BridgePlayerShipSystemRowView, {
    type BridgePlayerShipSystemRowLayout,
} from './BridgePlayerShipSystemRowView';

// Installed player weapons are a runtime list, not one singleton per kind.
// Rows are rebuilt only when installation identity/order changes; normal frame
// updates reuse the existing Phaser objects.
export default class BridgePlayerShipSystemsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly rowViews =
        new Map<
            string,
            BridgePlayerShipSystemRowView
        >();

    private rowOrder:
        string[] = [];

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly width: number,
        private readonly height: number,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_SHIP_DASHBOARD_UPDATED,

            this.handlePlayerShipDashboardUpdated,
            this,
        );
    }

    public getRoot():
        Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(
        x: number,
        y: number,
    ): void {
        this.root.setPosition(
            x,
            y,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_SHIP_DASHBOARD_UPDATED,

            this.handlePlayerShipDashboardUpdated,
            this,
        );

        this.destroyRows();
        this.root.destroy(false);
    }

    private handlePlayerShipDashboardUpdated(
        payload:
            BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        const weapons =
            payload.weapons ?? [];

        this.reconcileRows(
            weapons,
        );

        for (const weapon of weapons) {
            const view =
                this.rowViews.get(
                    weapon.id,
                );

            if (!view) {
                throw new Error(
                    'Captain dashboard weapon row is missing after reconciliation: ' +
                        weapon.id,
                );
            }

            this.updateWeapon(
                view,
                weapon,
            );
        }
    }

    private reconcileRows(
        weapons:
            BridgePlayerWeaponDashboardPayload[],
    ): void {
        const nextOrder =
            weapons.map(
                (weapon) =>
                    weapon.id,
            );

        if (
            isSameOrder(
                this.rowOrder,
                nextOrder,
            )
        ) {
            return;
        }

        assertUniqueWeaponIds(
            weapons,
        );

        this.destroyRows();

        if (weapons.length === 0) {
            return;
        }

        const rowHeight =
            this.height /
            weapons.length;

        for (
            let index = 0;
            index < weapons.length;
            index += 1
        ) {
            const weapon =
                weapons[index];

            if (!weapon) {
                continue;
            }

            const rowView =
                new BridgePlayerShipSystemRowView(
                    this.scene,
                    this.width,
                    rowHeight,
                    getWeaponRowLayout(
                        weapon.kind,
                    ),
                );

            rowView.setPosition(
                0,
                rowHeight * index,
            );

            this.rowViews.set(
                weapon.id,
                rowView,
            );

            this.rowOrder.push(
                weapon.id,
            );

            this.root.add(
                rowView.getRoot(),
            );
        }
    }

    private updateWeapon(
        view:
            BridgePlayerShipSystemRowView,
        weapon:
            BridgePlayerWeaponDashboardPayload,
    ): void {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER: {
                const ammo =
                    requireAmmo(
                        weapon,
                    );

                view.setSystemLabel(
                    'MISSILE ' +
                        ammo.current +
                        '/' +
                        ammo.max,
                );

                break;
            }

            case SHIP_WEAPON_KIND.BEAM_CANNON:
                view.setSystemLabel(
                    'BEAM CANNON',
                );

                break;

            case SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER: {
                const ammo =
                    requireAmmo(
                        weapon,
                    );

                view.setSystemLabel(
                    'MINES ' +
                        ammo.current +
                        '/' +
                        ammo.max,
                );

                break;
            }

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                view.setSystemLabel(
                    'SPAM',
                );

                break;

            default: {
                const exhaustiveKind:
                    never =
                    weapon.kind;

                return exhaustiveKind;
            }
        }

        view.setProgress(
            weapon.cooldownProgress,
        );

        const command =
            weapon.action.command;

        view.setAction(
            weapon.action.state,

            command
                ? () => {
                      this.eventBus.emit(
                          BRIDGE_EVENT
                              .OFFICER_COMMAND_SELECTED,

                          command,
                      );
                  }
                : undefined,
        );
    }

    private destroyRows(): void {
        for (
            const view of
            this.rowViews.values()
        ) {
            view.destroy();
        }

        this.rowViews.clear();
        this.rowOrder = [];
    }
}

function getWeaponRowLayout(
    kind:
        ShipWeaponKind,
): BridgePlayerShipSystemRowLayout {
    switch (kind) {
        case SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER:
            return {
                iconLabel: 'MSL',
                label: 'MISSILE --/--',
                roleLabel: 'WPN',
            };

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            return {
                iconLabel: 'LAS',
                label: 'BEAM CANNON',
                roleLabel: 'WPN',
            };

        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
            return {
                iconLabel: 'MIN',
                label: 'MINES --/--',
                roleLabel: 'WPN',
            };

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return {
                iconLabel: 'EW',
                label: 'SPAM',
                roleLabel: 'SCI',
            };

        default: {
            const exhaustiveKind:
                never =
                kind;

            return exhaustiveKind;
        }
    }
}

function requireAmmo(
    weapon:
        BridgePlayerWeaponDashboardPayload,
): NonNullable<
    BridgePlayerWeaponDashboardPayload[
        'ammo'
    ]
> {
    if (weapon.ammo) {
        return weapon.ammo;
    }

    throw new Error(
        'Captain dashboard ammo-backed weapon row is missing ammo: ' +
            weapon.id,
    );
}

function assertUniqueWeaponIds(
    weapons:
        BridgePlayerWeaponDashboardPayload[],
): void {
    const ids =
        new Set<string>();

    for (const weapon of weapons) {
        if (ids.has(weapon.id)) {
            throw new Error(
                'Captain dashboard received duplicate weapon runtime id: ' +
                    weapon.id,
            );
        }

        ids.add(
            weapon.id,
        );
    }
}

function isSameOrder(
    current:
        readonly string[],
    next:
        readonly string[],
): boolean {
    if (current.length !== next.length) {
        return false;
    }

    for (
        let index = 0;
        index < current.length;
        index += 1
    ) {
        if (
            current[index] !==
            next[index]
        ) {
            return false;
        }
    }

    return true;
}
