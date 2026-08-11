import type BridgeScene from '../../../../BridgeScene';
import {
    BRIDGE_EVENT,
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgePlayerShipDashboardUpdatedPayload,
} from '../../../../events/bridge_event';
import type BridgeEventBus from '../../../../events/BridgeEventBus';
import BridgePlayerShipSystemRowView, {
    type BridgePlayerShipSystemRowLayout,
} from './BridgePlayerShipSystemRowView';

const SYSTEM_ROWS:
    BridgePlayerShipSystemRowLayout[] = [
        {
            iconLabel: 'MSL',
            label: 'MISSILE --/--',
            roleLabel: 'WPN',
        },
        {
            iconLabel: 'LAS',
            label: 'LASER',
            roleLabel: 'WPN',
        },
        {
            iconLabel: 'MIN',
            label: 'MINES --/--',
            roleLabel: 'WPN',
        },
        {
            iconLabel: 'EW',
            label: 'SPAM',
            roleLabel: 'SCI',
        },
    ];

const MISSILE_LAUNCHER_ROW_INDEX = 0;
const LASER_ROW_INDEX = 1;
const STICKY_MINE_DISPENSER_ROW_INDEX = 2;
const SPAM_PROJECTOR_ROW_INDEX = 3;

// Список player ship systems.
//
// Каждая реальная строка получает уже разрешённый app-side state.
// View не пересчитывает domain availability:
// ACTIVE callback только эмитит существующий OFFICER_COMMAND_SELECTED.
export default class BridgePlayerShipSystemsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly rowViews:
        BridgePlayerShipSystemRowView[] = [];

    private missileLauncherView?:
        BridgePlayerShipSystemRowView;

    private laserView?:
        BridgePlayerShipSystemRowView;

    private stickyMineDispenserView?:
        BridgePlayerShipSystemRowView;

    private spamProjectorView?:
        BridgePlayerShipSystemRowView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        width: number,
        height: number,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        const rowHeight =
            height /
            SYSTEM_ROWS.length;

        for (
            let index = 0;
            index < SYSTEM_ROWS.length;
            index += 1
        ) {
            const row =
                SYSTEM_ROWS[index];

            if (!row) {
                continue;
            }

            const rowView =
                new BridgePlayerShipSystemRowView(
                    this.scene,
                    width,
                    rowHeight,
                    row,
                );

            rowView.setPosition(
                0,
                rowHeight *
                    index,
            );

            if (
                index ===
                MISSILE_LAUNCHER_ROW_INDEX
            ) {
                this.missileLauncherView =
                    rowView;
            }

            if (
                index ===
                LASER_ROW_INDEX
            ) {
                this.laserView =
                    rowView;
            }

            if (
                index ===
                STICKY_MINE_DISPENSER_ROW_INDEX
            ) {
                this.stickyMineDispenserView =
                    rowView;
            }

            if (
                index ===
                SPAM_PROJECTOR_ROW_INDEX
            ) {
                this.spamProjectorView =
                    rowView;
            }

            this.rowViews.push(
                rowView,
            );

            this.root.add(
                rowView.getRoot(),
            );
        }

        if (
            !this.missileLauncherView ||
            !this.laserView ||
            !this.stickyMineDispenserView ||
            !this.spamProjectorView
        ) {
            throw new Error(
                'Captain dashboard weapon rows were not created',
            );
        }

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

        for (
            const rowView
            of this.rowViews
        ) {
            rowView.destroy();
        }

        this.rowViews.length = 0;

        this.missileLauncherView =
            undefined;

        this.laserView =
            undefined;

        this.stickyMineDispenserView =
            undefined;

        this.spamProjectorView =
            undefined;

        this.root.destroy(false);
    }

    private handlePlayerShipDashboardUpdated(
        payload:
            BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        this.updateMissileLauncher(
            payload.missileLauncher,
        );

        this.updateLaser(
            payload.laser,
        );

        this.updateStickyMineDispenser(
            payload.stickyMineDispenser,
        );

        this.updateSpamProjector(
            payload.spamProjector,
        );
    }

    private updateMissileLauncher(
        launcher:
            BridgePlayerShipDashboardUpdatedPayload[
                'missileLauncher'
            ],
    ): void {
        const view =
            this.missileLauncherView;

        if (!view) {
            return;
        }

        if (!launcher) {
            view.setSystemLabel(
                'MISSILE --/--',
            );

            view.setProgress(
                undefined,
            );

            view.setAction(
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .DISABLED_SYSTEM,
            );

            return;
        }

        view.setSystemLabel(
            'MISSILE ' +
                `${launcher.ammo.current}/` +
                `${launcher.ammo.max}`,
        );

        view.setProgress(
            launcher.cooldownProgress,
        );

        this.applyAction(
            view,
            launcher.action,
        );
    }

    private updateLaser(
        laser:
            BridgePlayerShipDashboardUpdatedPayload[
                'laser'
            ],
    ): void {
        const view =
            this.laserView;

        if (!view) {
            return;
        }

        view.setSystemLabel(
            'LASER',
        );

        if (!laser) {
            view.setProgress(
                undefined,
            );

            view.setAction(
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .DISABLED_SYSTEM,
            );

            return;
        }

        view.setProgress(
            laser.cooldownProgress,
        );

        this.applyAction(
            view,
            laser.action,
        );
    }

    private updateStickyMineDispenser(
        dispenser:
            BridgePlayerShipDashboardUpdatedPayload[
                'stickyMineDispenser'
            ],
    ): void {
        const view =
            this.stickyMineDispenserView;

        if (!view) {
            return;
        }

        if (!dispenser) {
            view.setSystemLabel(
                'MINES --/--',
            );

            view.setProgress(
                undefined,
            );

            view.setAction(
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .DISABLED_SYSTEM,
            );

            return;
        }

        view.setSystemLabel(
            'MINES ' +
                dispenser.ammo.current +
                '/' +
                dispenser.ammo.max,
        );

        view.setProgress(
            dispenser.cooldownProgress,
        );

        this.applyAction(
            view,
            dispenser.action,
        );
    }

    private updateSpamProjector(
        projector:
            BridgePlayerShipDashboardUpdatedPayload[
                'spamProjector'
            ],
    ): void {
        const view =
            this.spamProjectorView;

        if (!view) {
            return;
        }

        view.setSystemLabel(
            'SPAM',
        );

        if (!projector) {
            view.setProgress(
                undefined,
            );

            view.setAction(
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .DISABLED_SYSTEM,
            );

            return;
        }

        view.setProgress(
            projector.cooldownProgress,
        );

        this.applyAction(
            view,
            projector.action,
        );
    }

    private applyAction(
        view:
            BridgePlayerShipSystemRowView,

        action:
            NonNullable<
                BridgePlayerShipDashboardUpdatedPayload[
                    'missileLauncher'
                ]
            >[
                'action'
            ],
    ): void {
        const command =
            action.command;

        view.setAction(
            action.state,

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
}
