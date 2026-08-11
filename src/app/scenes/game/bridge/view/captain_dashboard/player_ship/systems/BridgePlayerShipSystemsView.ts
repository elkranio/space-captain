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

// Список player ship systems.
//
// Missile row — первый реальный vertical slice:
// snapshot и exact resolved command приходят из app/controller,
// view только отображает presentation state и эмитит существующий
// OFFICER_COMMAND_SELECTED на активный click.
export default class BridgePlayerShipSystemsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly rowViews:
        BridgePlayerShipSystemRowView[] = [];

    private missileLauncherView?:
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

            this.rowViews.push(
                rowView,
            );

            this.root.add(
                rowView.getRoot(),
            );
        }

        if (!this.missileLauncherView) {
            throw new Error(
                'Missile launcher dashboard row was not created',
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
        this.missileLauncherView = undefined;

        this.root.destroy(false);
    }

    private handlePlayerShipDashboardUpdated(
        payload:
            BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        const view =
            this.missileLauncherView;

        if (!view) {
            return;
        }

        const launcher =
            payload.missileLauncher;

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

        const command =
            launcher.action.command;

        view.setAction(
            launcher.action.state,

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
