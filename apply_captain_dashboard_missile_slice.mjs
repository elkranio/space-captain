import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const EXPECTED_HEAD = "19756eea9d027558e432d3ed380981d7919fb8a9";
const FULL_FILES = {
    "src/app/scenes/game/bridge/view/BridgeView.ts": "// src/app/scenes/game/bridge/view/BridgeView.ts\n\nimport type BridgeScene from '../BridgeScene';\nimport type BridgeEventBus from '../events/BridgeEventBus';\nimport BridgeOfficerBarksView from './barks/BridgeOfficerBarksView';\nimport BridgeCaptainDashboardView from './captain_dashboard/BridgeCaptainDashboardView';\nimport BridgeCombatView from './combat/BridgeCombatView';\nimport BridgeTargetingWarningView from './indicators/targeting_warning/BridgeTargetingWarningView';\nimport BridgeInteriorView from './interior/BridgeInteriorView';\nimport BridgeOfficerStationsView from './officer_stations/BridgeOfficerStationsView';\nimport BridgeSpaceView from './space/BridgeSpaceView';\n\n// Root view bridge scene.\n// Собирает верхнеуровневые визуальные модули\n// и отвечает только за их lifecycle.\nexport default class BridgeView {\n    private interiorView?: BridgeInteriorView;\n\n    private captainDashboardView?: BridgeCaptainDashboardView;\n\n    private targetingWarningView?: BridgeTargetingWarningView;\n\n    private combatView?: BridgeCombatView;\n\n    private officerStationsView?: BridgeOfficerStationsView;\n\n    private spaceView?: BridgeSpaceView;\n\n    private officerBarksView?: BridgeOfficerBarksView;\n\n    constructor(\n        private readonly scene: BridgeScene,\n        private readonly eventBus: BridgeEventBus,\n    ) {}\n\n    public prepare(): void {\n        const spaceView = new BridgeSpaceView(\n            this.scene,\n            this.eventBus,\n\n            (offsetX) => {\n                this.combatView\n                    ?.setCameraTurnOffsetX(\n                        offsetX,\n                    );\n            },\n        );\n\n        this.spaceView = spaceView;\n\n        this.combatView = new BridgeCombatView(\n            this.scene,\n            this.eventBus,\n            spaceView,\n        );\n\n        this.combatView.prepare();\n\n        this.interiorView = new BridgeInteriorView(this.scene);\n\n        this.targetingWarningView = new BridgeTargetingWarningView(this.scene, this.eventBus);\n\n        this.officerStationsView = new BridgeOfficerStationsView(this.scene, this.eventBus);\n\n        this.captainDashboardView = new BridgeCaptainDashboardView(\n            this.scene,\n            this.eventBus,\n        );\n\n        this.officerBarksView = new BridgeOfficerBarksView(this.scene, this.eventBus);\n    }\n\n    public destroy(): void {\n        this.officerBarksView?.destroy();\n        this.captainDashboardView?.destroy();\n        this.officerStationsView?.destroy();\n        this.targetingWarningView?.destroy();\n        this.interiorView?.destroy();\n        this.combatView?.destroy();\n        this.spaceView?.destroy();\n\n        this.officerBarksView = undefined;\n        this.captainDashboardView = undefined;\n        this.officerStationsView = undefined;\n        this.targetingWarningView = undefined;\n        this.interiorView = undefined;\n        this.combatView = undefined;\n        this.spaceView = undefined;\n    }\n}\n",
    "src/app/scenes/game/bridge/view/captain_dashboard/BridgeCaptainDashboardView.ts": "import type BridgeScene from '../../BridgeScene';\nimport type BridgeEventBus from '../../events/BridgeEventBus';\nimport BridgePlayerShipDashboardView from './player_ship/BridgePlayerShipDashboardView';\n\nconst PLAYER_SHIP_POSITION = {\n    x: 16,\n    y: 500,\n} as const;\n\n// Root view капитанского dashboard.\n//\n// Пока dashboard содержит только стабильную левую часть:\n// состояние и системы корабля игрока.\n// Внешний context/right side добавим только когда начнём\n// соответствующий реальный vertical slice.\nexport default class BridgeCaptainDashboardView {\n    private readonly root:\n        Phaser.GameObjects.Container;\n\n    private readonly playerShipView:\n        BridgePlayerShipDashboardView;\n\n    constructor(\n        private readonly scene: BridgeScene,\n        private readonly eventBus: BridgeEventBus,\n    ) {\n        this.root =\n            this.scene.add.container(\n                0,\n                0,\n            );\n\n        this.scene.layers\n            .get('ui')\n            .add(this.root);\n\n        this.playerShipView =\n            new BridgePlayerShipDashboardView(\n                this.scene,\n                this.eventBus,\n            );\n\n        this.playerShipView.setPosition(\n            PLAYER_SHIP_POSITION.x,\n            PLAYER_SHIP_POSITION.y,\n        );\n\n        this.root.add(\n            this.playerShipView.getRoot(),\n        );\n    }\n\n    public destroy(): void {\n        this.playerShipView.destroy();\n        this.root.destroy(false);\n    }\n}\n",
    "src/app/scenes/game/bridge/view/captain_dashboard/player_ship/BridgePlayerShipDashboardView.ts": "import type BridgeScene from '../../../BridgeScene';\nimport type BridgeEventBus from '../../../events/BridgeEventBus';\nimport BridgePlayerShipStatusStripView from './status/BridgePlayerShipStatusStripView';\nimport BridgePlayerShipSystemsView from './systems/BridgePlayerShipSystemsView';\n\nconst PANEL = {\n    width: 416,\n    height: 204,\n\n    padding: 8,\n    sectionGap: 6,\n\n    backgroundColor: 0x0b1018,\n    backgroundAlpha: 0.94,\n\n    borderColor: 0x40546a,\n    borderThickness: 2,\n} as const;\n\nconst STATUS_HEIGHT = 38;\nconst SYSTEMS_HEIGHT = 144;\n\n// Стабильная левая часть captain dashboard.\n//\n// Этот view отвечает только за физическую композицию:\n// рамка → status strip → список систем.\n// Runtime presentation конкретных систем живёт ниже,\n// в focused system views.\nexport default class BridgePlayerShipDashboardView {\n    private readonly root:\n        Phaser.GameObjects.Container;\n\n    private readonly background:\n        Phaser.GameObjects.Rectangle;\n\n    private readonly statusStripView:\n        BridgePlayerShipStatusStripView;\n\n    private readonly systemsView:\n        BridgePlayerShipSystemsView;\n\n    constructor(\n        private readonly scene: BridgeScene,\n        private readonly eventBus: BridgeEventBus,\n    ) {\n        this.root =\n            this.scene.add.container(\n                0,\n                0,\n            );\n\n        this.background =\n            this.scene.add\n                .rectangle(\n                    0,\n                    0,\n\n                    PANEL.width,\n                    PANEL.height,\n\n                    PANEL.backgroundColor,\n                    PANEL.backgroundAlpha,\n                )\n                .setOrigin(0, 0)\n                .setStrokeStyle(\n                    PANEL.borderThickness,\n                    PANEL.borderColor,\n                );\n\n        const innerWidth =\n            PANEL.width -\n            PANEL.padding * 2;\n\n        this.statusStripView =\n            new BridgePlayerShipStatusStripView(\n                this.scene,\n                innerWidth,\n                STATUS_HEIGHT,\n            );\n\n        this.statusStripView.setPosition(\n            PANEL.padding,\n            PANEL.padding,\n        );\n\n        this.systemsView =\n            new BridgePlayerShipSystemsView(\n                this.scene,\n                this.eventBus,\n                innerWidth,\n                SYSTEMS_HEIGHT,\n            );\n\n        this.systemsView.setPosition(\n            PANEL.padding,\n\n            PANEL.padding +\n                STATUS_HEIGHT +\n                PANEL.sectionGap,\n        );\n\n        this.root.add([\n            this.background,\n            this.statusStripView.getRoot(),\n            this.systemsView.getRoot(),\n        ]);\n    }\n\n    public getRoot():\n        Phaser.GameObjects.Container {\n        return this.root;\n    }\n\n    public setPosition(\n        x: number,\n        y: number,\n    ): void {\n        this.root.setPosition(\n            x,\n            y,\n        );\n    }\n\n    public destroy(): void {\n        this.systemsView.destroy();\n        this.statusStripView.destroy();\n\n        this.background.destroy();\n        this.root.destroy(false);\n    }\n}\n",
    "src/app/scenes/game/bridge/view/captain_dashboard/player_ship/systems/BridgePlayerShipSystemsView.ts": "import type BridgeScene from '../../../../BridgeScene';\nimport {\n    BRIDGE_EVENT,\n    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,\n    type BridgePlayerShipDashboardUpdatedPayload,\n} from '../../../../events/bridge_event';\nimport type BridgeEventBus from '../../../../events/BridgeEventBus';\nimport BridgePlayerShipSystemRowView, {\n    type BridgePlayerShipSystemRowLayout,\n} from './BridgePlayerShipSystemRowView';\n\nconst SYSTEM_ROWS:\n    BridgePlayerShipSystemRowLayout[] = [\n        {\n            iconLabel: 'MSL',\n            label: 'MISSILE --/--',\n            roleLabel: 'WPN',\n        },\n        {\n            iconLabel: 'LAS',\n            label: 'LASER',\n            roleLabel: 'WPN',\n        },\n        {\n            iconLabel: 'MIN',\n            label: 'MINES --/--',\n            roleLabel: 'WPN',\n        },\n        {\n            iconLabel: 'EW',\n            label: 'SPAM',\n            roleLabel: 'SCI',\n        },\n    ];\n\nconst MISSILE_LAUNCHER_ROW_INDEX = 0;\n\n// Список player ship systems.\n//\n// Missile row — первый реальный vertical slice:\n// snapshot и exact resolved command приходят из app/controller,\n// view только отображает presentation state и эмитит существующий\n// OFFICER_COMMAND_SELECTED на активный click.\nexport default class BridgePlayerShipSystemsView {\n    private readonly root:\n        Phaser.GameObjects.Container;\n\n    private readonly rowViews:\n        BridgePlayerShipSystemRowView[] = [];\n\n    private missileLauncherView?:\n        BridgePlayerShipSystemRowView;\n\n    constructor(\n        private readonly scene: BridgeScene,\n        private readonly eventBus: BridgeEventBus,\n        width: number,\n        height: number,\n    ) {\n        this.root =\n            this.scene.add.container(\n                0,\n                0,\n            );\n\n        const rowHeight =\n            height /\n            SYSTEM_ROWS.length;\n\n        for (\n            let index = 0;\n            index < SYSTEM_ROWS.length;\n            index += 1\n        ) {\n            const row =\n                SYSTEM_ROWS[index];\n\n            if (!row) {\n                continue;\n            }\n\n            const rowView =\n                new BridgePlayerShipSystemRowView(\n                    this.scene,\n                    width,\n                    rowHeight,\n                    row,\n                );\n\n            rowView.setPosition(\n                0,\n                rowHeight *\n                    index,\n            );\n\n            if (\n                index ===\n                MISSILE_LAUNCHER_ROW_INDEX\n            ) {\n                this.missileLauncherView =\n                    rowView;\n            }\n\n            this.rowViews.push(\n                rowView,\n            );\n\n            this.root.add(\n                rowView.getRoot(),\n            );\n        }\n\n        if (!this.missileLauncherView) {\n            throw new Error(\n                'Missile launcher dashboard row was not created',\n            );\n        }\n\n        this.eventBus.on(\n            BRIDGE_EVENT\n                .PLAYER_SHIP_DASHBOARD_UPDATED,\n            this.handlePlayerShipDashboardUpdated,\n            this,\n        );\n    }\n\n    public getRoot():\n        Phaser.GameObjects.Container {\n        return this.root;\n    }\n\n    public setPosition(\n        x: number,\n        y: number,\n    ): void {\n        this.root.setPosition(\n            x,\n            y,\n        );\n    }\n\n    public destroy(): void {\n        this.eventBus.off(\n            BRIDGE_EVENT\n                .PLAYER_SHIP_DASHBOARD_UPDATED,\n            this.handlePlayerShipDashboardUpdated,\n            this,\n        );\n\n        for (\n            const rowView\n            of this.rowViews\n        ) {\n            rowView.destroy();\n        }\n\n        this.rowViews.length = 0;\n        this.missileLauncherView = undefined;\n\n        this.root.destroy(false);\n    }\n\n    private handlePlayerShipDashboardUpdated(\n        payload:\n            BridgePlayerShipDashboardUpdatedPayload,\n    ): void {\n        const view =\n            this.missileLauncherView;\n\n        if (!view) {\n            return;\n        }\n\n        const launcher =\n            payload.missileLauncher;\n\n        if (!launcher) {\n            view.setSystemLabel(\n                'MISSILE --/--',\n            );\n\n            view.setProgress(\n                undefined,\n            );\n\n            view.setAction(\n                BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                    .DISABLED_SYSTEM,\n            );\n\n            return;\n        }\n\n        view.setSystemLabel(\n            'MISSILE ' +\n                `${launcher.ammo.current}/` +\n                `${launcher.ammo.max}`,\n        );\n\n        view.setProgress(\n            launcher.cooldownProgress,\n        );\n\n        const command =\n            launcher.action.command;\n\n        view.setAction(\n            launcher.action.state,\n\n            command\n                ? () => {\n                      this.eventBus.emit(\n                          BRIDGE_EVENT\n                              .OFFICER_COMMAND_SELECTED,\n\n                          command,\n                      );\n                  }\n                : undefined,\n        );\n    }\n}\n",
    "src/app/scenes/game/bridge/view/captain_dashboard/player_ship/systems/BridgePlayerShipSystemRowView.ts": "import {\n    FONT_COLOR,\n    FONT_FAMILY,\n    FONT_SIZE,\n} from '../../../../../../../theme/font';\nimport type BridgeScene from '../../../../BridgeScene';\nimport {\n    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,\n    type BridgePlayerSystemActionState,\n} from '../../../../events/bridge_event';\n\nexport type BridgePlayerShipSystemRowLayout = {\n    iconLabel: string;\n    label: string;\n    roleLabel: string;\n};\n\nconst ROW = {\n    verticalGap: 1,\n\n    backgroundColor: 0x0e1620,\n    backgroundAlpha: 0.94,\n\n    borderColor: 0x26394c,\n    borderThickness: 1,\n\n    iconX: 6,\n    iconY: 4,\n    iconSize: 28,\n\n    iconBackgroundColor: 0x152332,\n    iconBorderColor: 0x45627f,\n\n    progressHeight: 3,\n    progressBackgroundColor: 0x252a2f,\n    progressColor: FONT_COLOR.ACTIVITY,\n\n    labelX: 44,\n    labelY: 10,\n\n    roleButtonWidth: 84,\n    roleButtonHeight: 28,\n    roleButtonMarginRight: 6,\n    roleButtonY: 4,\n\n    actionActiveBackgroundColor:\n        0x193147,\n    actionActiveBorderColor:\n        0x7aa0c4,\n\n    actionDisabledBackgroundColor:\n        0x101923,\n    actionDisabledBorderColor:\n        0x26394c,\n    actionDisabledTextColor:\n        0x536778,\n\n    actionBusyBackgroundColor:\n        0x171a1f,\n    actionBusyBorderColor:\n        0x8a6a35,\n\n    actionEngagedBackgroundColor:\n        0x2a2115,\n    actionEngagedBorderColor:\n        FONT_COLOR.ACTIVITY,\n} as const;\n\n// Один повторяемый визуальный row player system.\n//\n// Не знает domain-семантику конкретного оружия.\n// Получает уже готовые:\n// - label;\n// - progress 0..1;\n// - presentation state action button;\n// - callback только для ACTIVE action.\nexport default class BridgePlayerShipSystemRowView {\n    private readonly root:\n        Phaser.GameObjects.Container;\n\n    private readonly systemLabel:\n        Phaser.GameObjects.BitmapText;\n\n    private readonly progressBackground:\n        Phaser.GameObjects.Rectangle;\n\n    private readonly progressFill:\n        Phaser.GameObjects.Rectangle;\n\n    private readonly roleButton:\n        Phaser.GameObjects.Rectangle;\n\n    private readonly roleLabel:\n        Phaser.GameObjects.BitmapText;\n\n    private actionHandler?:\n        () => void;\n\n    constructor(\n        private readonly scene: BridgeScene,\n        width: number,\n        height: number,\n        layout:\n            BridgePlayerShipSystemRowLayout,\n    ) {\n        this.root =\n            this.scene.add.container(\n                0,\n                0,\n            );\n\n        const visibleHeight =\n            Math.max(\n                1,\n                height -\n                    ROW.verticalGap,\n            );\n\n        const background =\n            this.scene.add\n                .rectangle(\n                    0,\n                    0,\n\n                    width,\n                    visibleHeight,\n\n                    ROW.backgroundColor,\n                    ROW.backgroundAlpha,\n                )\n                .setOrigin(0, 0)\n                .setStrokeStyle(\n                    ROW.borderThickness,\n                    ROW.borderColor,\n                );\n\n        const iconBackground =\n            this.scene.add\n                .rectangle(\n                    ROW.iconX,\n                    ROW.iconY,\n\n                    ROW.iconSize,\n                    ROW.iconSize,\n\n                    ROW.iconBackgroundColor,\n                    1,\n                )\n                .setOrigin(0, 0)\n                .setStrokeStyle(\n                    1,\n                    ROW.iconBorderColor,\n                );\n\n        const iconLabel =\n            this.scene.add\n                .bitmapText(\n                    ROW.iconX +\n                        ROW.iconSize / 2,\n\n                    ROW.iconY +\n                        ROW.iconSize / 2,\n\n                    FONT_FAMILY.VGA_8X14,\n                    layout.iconLabel,\n                    FONT_SIZE.PX_16,\n                )\n                .setOrigin(\n                    0.5,\n                    0.5,\n                )\n                .setTint(\n                    FONT_COLOR.SECONDARY,\n                );\n\n        const progressY =\n            ROW.iconY +\n            ROW.iconSize;\n\n        this.progressBackground =\n            this.scene.add\n                .rectangle(\n                    ROW.iconX,\n                    progressY,\n\n                    ROW.iconSize,\n                    ROW.progressHeight,\n\n                    ROW.progressBackgroundColor,\n                    1,\n                )\n                .setOrigin(0, 0)\n                .setVisible(false);\n\n        this.progressFill =\n            this.scene.add\n                .rectangle(\n                    ROW.iconX,\n                    progressY,\n\n                    ROW.iconSize,\n                    ROW.progressHeight,\n\n                    ROW.progressColor,\n                    1,\n                )\n                .setOrigin(0, 0)\n                .setVisible(false);\n\n        this.systemLabel =\n            this.scene.add\n                .bitmapText(\n                    ROW.labelX,\n                    ROW.labelY,\n\n                    FONT_FAMILY.VGA_8X14,\n                    layout.label,\n                    FONT_SIZE.PX_16,\n                )\n                .setOrigin(0, 0)\n                .setTint(\n                    FONT_COLOR.PRIMARY,\n                );\n\n        const roleButtonX =\n            width -\n            ROW.roleButtonMarginRight -\n            ROW.roleButtonWidth;\n\n        this.roleButton =\n            this.scene.add\n                .rectangle(\n                    roleButtonX,\n                    ROW.roleButtonY,\n\n                    ROW.roleButtonWidth,\n                    ROW.roleButtonHeight,\n\n                    ROW.actionDisabledBackgroundColor,\n                    1,\n                )\n                .setOrigin(0, 0)\n                .setStrokeStyle(\n                    1,\n                    ROW.actionDisabledBorderColor,\n                );\n\n        this.roleLabel =\n            this.scene.add\n                .bitmapText(\n                    roleButtonX +\n                        ROW.roleButtonWidth /\n                            2,\n\n                    ROW.roleButtonY +\n                        ROW.roleButtonHeight /\n                            2,\n\n                    FONT_FAMILY.VGA_8X14,\n                    layout.roleLabel,\n                    FONT_SIZE.PX_16,\n                )\n                .setOrigin(\n                    0.5,\n                    0.5,\n                );\n\n        this.roleButton.on(\n            'pointerdown',\n            this.handleActionPointerDown,\n            this,\n        );\n\n        this.root.add([\n            background,\n            iconBackground,\n            iconLabel,\n            this.progressBackground,\n            this.progressFill,\n            this.systemLabel,\n            this.roleButton,\n            this.roleLabel,\n        ]);\n\n        this.setAction(\n            BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                .DISABLED_SYSTEM,\n        );\n    }\n\n    public getRoot():\n        Phaser.GameObjects.Container {\n        return this.root;\n    }\n\n    public setPosition(\n        x: number,\n        y: number,\n    ): void {\n        this.root.setPosition(\n            x,\n            y,\n        );\n    }\n\n    public setSystemLabel(\n        text: string,\n    ): void {\n        this.systemLabel.setText(\n            text,\n        );\n    }\n\n    public setProgress(\n        progress:\n            number | undefined,\n    ): void {\n        if (\n            progress ===\n            undefined\n        ) {\n            this.progressBackground\n                .setVisible(false);\n\n            this.progressFill\n                .setVisible(false);\n\n            return;\n        }\n\n        const clampedProgress =\n            Math.max(\n                0,\n                Math.min(\n                    1,\n                    progress,\n                ),\n            );\n\n        this.progressBackground\n            .setVisible(true);\n\n        this.progressFill\n            .setVisible(true)\n            .setScale(\n                clampedProgress,\n                1,\n            );\n    }\n\n    public setAction(\n        state:\n            BridgePlayerSystemActionState,\n        onSelected?:\n            () => void,\n    ): void {\n        if (\n            state ===\n                BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                    .ACTIVE &&\n            !onSelected\n        ) {\n            throw new Error(\n                'Active player system action requires click handler',\n            );\n        }\n\n        this.actionHandler =\n            state ===\n            BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                .ACTIVE\n                ? onSelected\n                : undefined;\n\n        this.applyActionVisualState(\n            state,\n        );\n    }\n\n    public destroy(): void {\n        this.roleButton.off(\n            'pointerdown',\n            this.handleActionPointerDown,\n            this,\n        );\n\n        this.actionHandler = undefined;\n\n        this.root.destroy(true);\n    }\n\n    private handleActionPointerDown(): void {\n        this.actionHandler?.();\n    }\n\n    private applyActionVisualState(\n        state:\n            BridgePlayerSystemActionState,\n    ): void {\n        this.roleButton\n            .disableInteractive();\n\n        switch (state) {\n            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                .ACTIVE:\n                this.roleButton\n                    .setFillStyle(\n                        ROW.actionActiveBackgroundColor,\n                        1,\n                    )\n                    .setStrokeStyle(\n                        1,\n                        ROW.actionActiveBorderColor,\n                    )\n                    .setInteractive({\n                        useHandCursor: true,\n                    });\n\n                this.roleLabel\n                    .setTint(\n                        FONT_COLOR.WHITE,\n                    );\n\n                return;\n\n            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                .DISABLED_SYSTEM:\n                this.roleButton\n                    .setFillStyle(\n                        ROW.actionDisabledBackgroundColor,\n                        1,\n                    )\n                    .setStrokeStyle(\n                        1,\n                        ROW.actionDisabledBorderColor,\n                    );\n\n                this.roleLabel\n                    .setTint(\n                        ROW.actionDisabledTextColor,\n                    );\n\n                return;\n\n            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                .DISABLED_OFFICER_BUSY:\n                this.roleButton\n                    .setFillStyle(\n                        ROW.actionBusyBackgroundColor,\n                        1,\n                    )\n                    .setStrokeStyle(\n                        1,\n                        ROW.actionBusyBorderColor,\n                    );\n\n                this.roleLabel\n                    .setTint(\n                        ROW.actionBusyBorderColor,\n                    );\n\n                return;\n\n            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                .ENGAGED_CURRENT_WORK:\n                this.roleButton\n                    .setFillStyle(\n                        ROW.actionEngagedBackgroundColor,\n                        1,\n                    )\n                    .setStrokeStyle(\n                        1,\n                        ROW.actionEngagedBorderColor,\n                    );\n\n                this.roleLabel\n                    .setTint(\n                        FONT_COLOR.ACTIVITY,\n                    );\n\n                return;\n\n            default: {\n                const exhaustiveState:\n                    never =\n                    state;\n\n                return exhaustiveState;\n            }\n        }\n    }\n}\n",
    "src/app/scenes/game/bridge/controller/player_weapon_status/BridgePlayerWeaponStatusMapper.ts": "// src/app/scenes/game/bridge/controller/player_weapon_status/BridgePlayerWeaponStatusMapper.ts\n\nimport {\n    SHIP_WEAPONS,\n    SHIP_WEAPON_TARGETING_DURATION_MS,\n} from '../../../../../../engine/content/catalogs/ship_weapons';\nimport {\n    SHIP_WEAPON_KIND,\n    SHIP_WEAPON_PHASE,\n    type ShipWeaponState,\n} from '../../../../../../engine/defs/ship_weapon';\nimport type {\n    BridgePlayerWeaponStatusPayload,\n    BridgePlayerWeaponsStatusUpdatedPayload,\n} from '../../events/bridge_event';\n\nexport function mapPlayerWeaponsToBridgeStatusPayload(\n    weapons: ShipWeaponState[],\n): BridgePlayerWeaponsStatusUpdatedPayload {\n    let laser:\n        BridgePlayerWeaponStatusPayload\n        | undefined;\n\n    let missileLauncher:\n        BridgePlayerWeaponsStatusUpdatedPayload[\n            'missileLauncher'\n        ];\n\n    let spamProjector:\n        BridgePlayerWeaponsStatusUpdatedPayload[\n            'spamProjector'\n        ];\n\n    for (const weapon of weapons) {\n        switch (weapon.kind) {\n            case SHIP_WEAPON_KIND.LASER: {\n                if (laser) {\n                    throw new Error(\n                        'Bridge weapon status supports ' +\n                            'one player laser',\n                    );\n                }\n\n                laser =\n                    mapWeaponStatus(\n                        weapon,\n                    );\n\n                break;\n            }\n\n            case SHIP_WEAPON_KIND\n                .MISSILE_LAUNCHER: {\n                if (missileLauncher) {\n                    throw new Error(\n                        'Bridge weapon status supports ' +\n                            'one player missile launcher',\n                    );\n                }\n\n                const definition =\n                    SHIP_WEAPONS[\n                        weapon.weaponId\n                    ];\n\n                if (\n                    definition.kind !==\n                    SHIP_WEAPON_KIND\n                        .MISSILE_LAUNCHER\n                ) {\n                    throw new Error(\n                        'Player missile launcher ' +\n                            'definition mismatch: ' +\n                            weapon.id,\n                    );\n                }\n\n                missileLauncher = {\n                    ...mapWeaponStatus(\n                        weapon,\n                    ),\n\n                    ammo: {\n                        current:\n                            weapon.ammoCount,\n\n                        max:\n                            definition\n                                .ammoCapacity,\n                    },\n                };\n\n                break;\n            }\n\n            case SHIP_WEAPON_KIND\n                .SPAM_PROJECTOR: {\n                if (spamProjector) {\n                    throw new Error(\n                        'Bridge weapon status supports ' +\n                            'one player spam projector',\n                    );\n                }\n\n                spamProjector =\n                    mapWeaponStatus(\n                        weapon,\n                    );\n\n                break;\n            }\n\n            default:\n                break;\n        }\n    }\n\n    return {\n        ...(laser\n            ? {\n                  laser,\n              }\n            : {}),\n\n        ...(missileLauncher\n            ? {\n                  missileLauncher,\n              }\n            : {}),\n\n        ...(spamProjector\n            ? {\n                  spamProjector,\n              }\n            : {}),\n    };\n}\n\nfunction mapWeaponStatus(\n    weapon: ShipWeaponState,\n): BridgePlayerWeaponStatusPayload {\n    const phaseDurationMs =\n        getPhaseDurationMs(\n            weapon,\n        );\n\n    return {\n        phase:\n            weapon.phase,\n\n        ...(phaseDurationMs !== undefined\n            ? {\n                  initialPhaseMs:\n                      phaseDurationMs,\n\n                  remainingPhaseMs:\n                      getRemainingMs(\n                          phaseDurationMs,\n                          weapon.phaseElapsedMs,\n                      ),\n              }\n            : {}),\n    };\n}\n\nfunction getPhaseDurationMs(\n    weapon: ShipWeaponState,\n): number | undefined {\n    const definition =\n        SHIP_WEAPONS[\n            weapon.weaponId\n        ];\n\n    switch (weapon.phase) {\n        case SHIP_WEAPON_PHASE.READY:\n            return undefined;\n\n        case SHIP_WEAPON_PHASE.TARGETING:\n            return SHIP_WEAPON_TARGETING_DURATION_MS;\n\n        case SHIP_WEAPON_PHASE.CHARGING:\n            if (\n                definition.kind !==\n                SHIP_WEAPON_KIND.LASER\n            ) {\n                throw new Error(\n                    'Only player laser can be ' +\n                        'in charging phase: ' +\n                        weapon.id,\n                );\n            }\n\n            return definition.chargeDurationMs;\n\n        case SHIP_WEAPON_PHASE.COOLDOWN:\n            return definition.cooldownDurationMs;\n\n        case SHIP_WEAPON_PHASE.CHANNELING:\n            if (\n                definition.kind !==\n                SHIP_WEAPON_KIND\n                    .SPAM_PROJECTOR\n            ) {\n                throw new Error(\n                    'Only player spam projector can be ' +\n                        'in channeling phase: ' +\n                        weapon.id,\n                );\n            }\n\n            return definition.channelDurationMs;\n\n        case SHIP_WEAPON_PHASE.DISPENSING:\n            throw new Error(\n                'Unsupported player weapon phase ' +\n                    'for bridge status: ' +\n                    weapon.id +\n                    '/' +\n                    weapon.phase,\n            );\n    }\n}\n\nfunction getRemainingMs(\n    durationMs: number,\n    elapsedMs: number,\n): number {\n    return Math.max(\n        0,\n        durationMs -\n            elapsedMs,\n    );\n}\n",
    "src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper.ts": "import { OFFICER_ROLE } from '../../../../../../engine/defs/officer';\nimport {\n    SHIP_WEAPON_PHASE,\n} from '../../../../../../engine/defs/ship_weapon';\nimport {\n    OFFICER_AVAILABILITY_STATE,\n    type OfficerAvailabilityState,\n} from '../../../../../../engine/encounter/model/officer_availability';\nimport {\n    ENCOUNTER_OFFICER_COMMAND_ID,\n    type AvailableOfficerCommand,\n} from '../../../../../../engine/encounter/model/command';\nimport {\n    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,\n    type BridgePlayerShipDashboardUpdatedPayload,\n    type BridgePlayerWeaponsStatusUpdatedPayload,\n} from '../../events/bridge_event';\n\ntype MissileLauncherStatus =\n    NonNullable<\n        BridgePlayerWeaponsStatusUpdatedPayload[\n            'missileLauncher'\n        ]\n    >;\n\ntype MissileLauncherDashboardPayload =\n    NonNullable<\n        BridgePlayerShipDashboardUpdatedPayload[\n            'missileLauncher'\n        ]\n    >;\n\ntype PlayerShipDashboardMapperInput = {\n    weapons:\n        BridgePlayerWeaponsStatusUpdatedPayload;\n\n    availableWeaponsCommands:\n        AvailableOfficerCommand[];\n\n    weaponsOfficerAvailability:\n        OfficerAvailabilityState;\n};\n\n// App-side projection player ship runtime → captain dashboard.\n//\n// Здесь разрешается только presentation state.\n// Domain availability не пересчитывается:\n// active command приходит напрямую из getAvailableCommands(WEAPONS).\nexport function mapPlayerShipToBridgeDashboardPayload(\n    input:\n        PlayerShipDashboardMapperInput,\n): BridgePlayerShipDashboardUpdatedPayload {\n    const launcher =\n        input.weapons\n            .missileLauncher;\n\n    if (!launcher) {\n        return {};\n    }\n\n    const cooldownProgress =\n        getMissileCooldownProgress(\n            launcher,\n        );\n\n    return {\n        missileLauncher: {\n            ammo: {\n                ...launcher.ammo,\n            },\n\n            ...(cooldownProgress !== undefined\n                ? {\n                      cooldownProgress,\n                  }\n                : {}),\n\n            action:\n                mapMissileAction(\n                    launcher,\n                    input.availableWeaponsCommands,\n                    input.weaponsOfficerAvailability,\n                ),\n        },\n    };\n}\n\nfunction mapMissileAction(\n    launcher:\n        MissileLauncherStatus,\n    availableWeaponsCommands:\n        AvailableOfficerCommand[],\n    weaponsOfficerAvailability:\n        OfficerAvailabilityState,\n): MissileLauncherDashboardPayload[\n    'action'\n] {\n    if (\n        launcher.phase ===\n        SHIP_WEAPON_PHASE.TARGETING\n    ) {\n        return {\n            state:\n                BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                    .ENGAGED_CURRENT_WORK,\n        };\n    }\n\n    if (\n        launcher.phase !==\n            SHIP_WEAPON_PHASE.READY ||\n        launcher.ammo.current <= 0\n    ) {\n        return {\n            state:\n                BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                    .DISABLED_SYSTEM,\n        };\n    }\n\n    const missileCommand =\n        getSingleMissileCommand(\n            availableWeaponsCommands,\n        );\n\n    if (missileCommand) {\n        return {\n            state:\n                BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                    .ACTIVE,\n\n            command: {\n                role:\n                    OFFICER_ROLE.WEAPONS,\n\n                commandId:\n                    missileCommand\n                        .commandId,\n\n                target:\n                    missileCommand\n                        .target,\n            },\n        };\n    }\n\n    if (\n        weaponsOfficerAvailability ===\n        OFFICER_AVAILABILITY_STATE.BUSY\n    ) {\n        return {\n            state:\n                BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                    .DISABLED_OFFICER_BUSY,\n        };\n    }\n\n    return {\n        state:\n            BRIDGE_PLAYER_SYSTEM_ACTION_STATE\n                .DISABLED_SYSTEM,\n    };\n}\n\nfunction getSingleMissileCommand(\n    commands:\n        AvailableOfficerCommand[],\n): AvailableOfficerCommand | undefined {\n    const missileCommands =\n        commands.filter(\n            (command) => {\n                return (\n                    command.commandId ===\n                    ENCOUNTER_OFFICER_COMMAND_ID\n                        .WEAPONS_FIRE_MISSILE\n                );\n            },\n        );\n\n    if (\n        missileCommands.length > 1\n    ) {\n        throw new Error(\n            'Captain dashboard missile row received ' +\n                'multiple resolved missile commands',\n        );\n    }\n\n    return missileCommands[0];\n}\n\nfunction getMissileCooldownProgress(\n    launcher:\n        MissileLauncherStatus,\n): number | undefined {\n    if (\n        launcher.ammo.current <= 0 ||\n        launcher.phase !==\n            SHIP_WEAPON_PHASE.COOLDOWN\n    ) {\n        return undefined;\n    }\n\n    const initialPhaseMs =\n        launcher.initialPhaseMs;\n\n    const remainingPhaseMs =\n        launcher.remainingPhaseMs;\n\n    if (\n        initialPhaseMs === undefined ||\n        remainingPhaseMs === undefined ||\n        initialPhaseMs <= 0\n    ) {\n        throw new Error(\n            'Missile cooldown dashboard snapshot ' +\n                'requires valid phase timing',\n        );\n    }\n\n    return Math.max(\n        0,\n        Math.min(\n            1,\n\n            1 -\n                remainingPhaseMs /\n                    initialPhaseMs,\n        ),\n    );\n}\n",
    "src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer.ts": "import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';\nimport type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';\nimport { THREAT_IDENTIFICATION_STATUS } from '../../../../../../../engine/encounter/model/combat';\nimport type { GameRuntime } from '../../../../../../runtime/GameRuntime';\nimport { BRIDGE_EVENT } from '../../../events/bridge_event';\nimport type BridgeEventBus from '../../../events/BridgeEventBus';\nimport { mapPlayerShipToBridgeDashboardPayload } from '../../captain_dashboard/BridgePlayerShipDashboardMapper';\nimport { mapPlayerWeaponsToBridgeStatusPayload } from '../../player_weapon_status/BridgePlayerWeaponStatusMapper';\n\n// App-side transport for continuously changing encounter read models.\n//\n// The engine remains the authoritative owner of combat state.\n// This synchronizer only reads detached engine snapshots, maps them to\n// bridge payloads and delivers them to GameRuntime / bridge views.\n// Navigation stays in BridgeEncounterController because it is synchronized\n// at explicit lifecycle boundaries rather than on every frame.\nexport default class BridgeEncounterSnapshotSynchronizer {\n    constructor(\n        private readonly encounterEngine: EncounterEngine,\n        private readonly eventBus: BridgeEventBus,\n        private readonly gameRuntime: GameRuntime,\n    ) {}\n\n    public syncInitial(): void {\n        this.syncPlayerWeapons();\n        this.syncEnemyShipTelemetry();\n    }\n\n    public syncCombatPresentation(): void {\n        this.syncIncomingMissiles();\n        this.syncOutgoingMissiles();\n        this.syncOutgoingStickyMines();\n        this.syncStickyMines();\n        this.syncLaserThreats();\n        this.syncPlayerShield();\n        this.syncEnemyShields();\n        this.syncEnemyShipTelemetry();\n    }\n\n    public syncEnemyDebug(): void {\n        const [snapshot] =\n            this.encounterEngine\n                .getEnemyDebugSnapshots();\n\n        this.eventBus.emit(\n            BRIDGE_EVENT\n                .ENEMY_DEBUG_UPDATED,\n\n            snapshot,\n        );\n    }\n\n    public syncPlayerWeapons(): void {\n        const weapons = this.encounterEngine.getPlayerWeaponStates();\n\n        this.gameRuntime.setPlayerShipWeaponStates(weapons);\n\n        const weaponStatus =\n            mapPlayerWeaponsToBridgeStatusPayload(\n                weapons,\n            );\n\n        this.eventBus.emit(\n            BRIDGE_EVENT.PLAYER_WEAPONS_STATUS_UPDATED,\n            weaponStatus,\n        );\n\n        this.eventBus.emit(\n            BRIDGE_EVENT\n                .PLAYER_SHIP_DASHBOARD_UPDATED,\n\n            mapPlayerShipToBridgeDashboardPayload({\n                weapons:\n                    weaponStatus,\n\n                availableWeaponsCommands:\n                    this.encounterEngine\n                        .getAvailableCommands(\n                            OFFICER_ROLE.WEAPONS,\n                        ),\n\n                weaponsOfficerAvailability:\n                    this.encounterEngine\n                        .getOfficerAvailabilityStates()[\n                            OFFICER_ROLE.WEAPONS\n                        ],\n            }),\n        );\n    }\n\n    public syncLaserThreats(): void {\n        const snapshots = this.encounterEngine.getLaserThreatSnapshots();\n\n        this.eventBus.emit(\n            BRIDGE_EVENT.LASER_THREATS_UPDATED,\n            snapshots.map((snapshot) => {\n                return {\n                    attackId: snapshot.attack.id,\n                    timeToFireMs: snapshot.timeToFireMs,\n                    initialTimeToFireMs: snapshot.initialTimeToFireMs,\n\n                    ...(snapshot.attack.identification.status === THREAT_IDENTIFICATION_STATUS.IDENTIFIED\n                        ? {\n                              targetZone: snapshot.attack.identification.targetZone,\n                          }\n                        : {}),\n                };\n            }),\n        );\n    }\n\n    private syncEnemyShields(): void {\n        const snapshots =\n            this.encounterEngine\n                .getEnemyShieldSnapshots();\n\n        this.eventBus.emit(\n            BRIDGE_EVENT\n                .ENEMY_SHIELDS_UPDATED,\n\n            snapshots.map((snapshot) => {\n                return {\n                    actorId:\n                        snapshot.actorId,\n\n                    zone:\n                        snapshot.zone,\n\n                    remainingDurationMs:\n                        Math.max(\n                            0,\n\n                            snapshot.durationMs -\n                                snapshot.elapsedMs,\n                        ),\n\n                    initialDurationMs:\n                        snapshot.durationMs,\n                };\n            }),\n        );\n    }\n\n    private syncEnemyShipTelemetry(): void {\n        const [snapshot] = this.encounterEngine.getEnemyShipTelemetrySnapshots();\n\n        this.eventBus.emit(\n            BRIDGE_EVENT.ENEMY_SHIP_TELEMETRY_UPDATED,\n            snapshot\n                ? {\n                      actorId: snapshot.actorId,\n                      hull: {\n                          ...snapshot.hull,\n                      },\n                      drive: {\n                          ...snapshot.drive,\n                      },\n                      shieldGenerator: {\n                          ...snapshot.shieldGenerator,\n                      },\n                      weapons: snapshot.weapons.map((weapon) => {\n                          return {\n                              ...weapon,\n                          };\n                      }),\n                  }\n                : undefined,\n        );\n    }\n\n    private syncIncomingMissiles(): void {\n        const projectiles = this.encounterEngine.getIncomingMissileProjectiles();\n\n        this.eventBus.emit(\n            BRIDGE_EVENT.INCOMING_MISSILES_UPDATED,\n            projectiles.map((projectile) => {\n                return {\n                    projectileId: projectile.id,\n                    timeToImpactMs: projectile.timeToImpactMs,\n\n                    ...(projectile.identification.status === THREAT_IDENTIFICATION_STATUS.IDENTIFIED\n                        ? {\n                              spectralBand: projectile.identification.spectralBand,\n                          }\n                        : {}),\n                };\n            }),\n        );\n    }\n\n    private syncOutgoingMissiles(): void {\n        this.eventBus.emit(\n            BRIDGE_EVENT.OUTGOING_MISSILES_UPDATED,\n            this.encounterEngine.getOutgoingMissileProjectiles().map((projectile) => {\n                return {\n                    projectileId: projectile.id,\n                    timeToImpactMs: projectile.timeToImpactMs,\n                    initialTimeToImpactMs: projectile.initialTimeToImpactMs,\n                };\n            }),\n        );\n    }\n\n    private syncOutgoingStickyMines(): void {\n        this.eventBus.emit(\n            BRIDGE_EVENT.OUTGOING_STICKY_MINES_UPDATED,\n            this.encounterEngine.getOutgoingStickyMines().map((mine) => {\n                return {\n                    mineId: mine.id,\n                    remainingTimeToDetonationMs: mine.timeToDetonationMs,\n                    initialTimeToDetonationMs: mine.initialTimeToDetonationMs,\n                };\n            }),\n        );\n    }\n\n    private syncStickyMines(): void {\n        this.eventBus.emit(\n            BRIDGE_EVENT.STICKY_MINES_UPDATED,\n            this.encounterEngine.getStickyMineSnapshots().map((snapshot) => {\n                return {\n                    mineId: snapshot.mine.id,\n                    remainingTimeToDetonationMs: snapshot.mine.timeToDetonationMs,\n                    initialTimeToDetonationMs: snapshot.mine.initialTimeToDetonationMs,\n                    isBeingCleared: snapshot.isBeingCleared,\n                    isNextClearTarget: snapshot.isNextClearTarget,\n                };\n            }),\n        );\n    }\n\n    private syncPlayerShield(): void {\n        const shield = this.encounterEngine.getActiveShieldState();\n\n        this.eventBus.emit(\n            BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,\n            shield\n                ? {\n                      zone: shield.zone,\n                      remainingDurationMs: Math.max(0, shield.durationMs - shield.elapsedMs),\n                      initialDurationMs: shield.durationMs,\n                  }\n                : undefined,\n        );\n    }\n}\n"
};

const BRIDGE_EVENT_FILE = 'src/app/scenes/game/bridge/events/bridge_event.ts';

function fail(message) {
    throw new Error(message);
}

function getHead() {
    return execFileSync(
        'git',
        ['rev-parse', 'HEAD'],
        { encoding: 'utf8' },
    ).trim();
}

function replaceExactly(source, before, after, label) {
    const first = source.indexOf(before);

    if (first < 0) {
        fail(`Expected source block missing: ${label}`);
    }

    const second = source.indexOf(
        before,
        first + before.length,
    );

    if (second >= 0) {
        fail(`Expected source block is not unique: ${label}`);
    }

    return (
        source.slice(0, first) +
        after +
        source.slice(first + before.length)
    );
}

const head = getHead();

if (head !== EXPECTED_HEAD) {
    fail(
        `HEAD mismatch.\n` +
        `Expected: ${EXPECTED_HEAD}\n` +
        `Actual:   ${head}\n` +
        `Read fresh master before applying this atom.`,
    );
}

const newMapperPath =
    'src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper.ts';

if (fs.existsSync(newMapperPath)) {
    fail(
        `New dashboard mapper already exists: ${newMapperPath}`,
    );
}

for (const filePath of Object.keys(FULL_FILES)) {
    if (filePath === newMapperPath) {
        continue;
    }

    if (!fs.existsSync(filePath)) {
        fail(`Expected source file missing: ${filePath}`);
    }
}

const originalBridgeEvent = fs.readFileSync(
    BRIDGE_EVENT_FILE,
    'utf8',
);

const bridgeEventEol =
    originalBridgeEvent.includes('\r\n')
        ? '\r\n'
        : '\n';

let bridgeEvent =
    originalBridgeEvent.replace(/\r\n/g, '\n');

bridgeEvent = replaceExactly(
    bridgeEvent,
    `    // Актуальные состояния установленных
    // player laser и missile launcher.
    PLAYER_WEAPONS_STATUS_UPDATED:
        'player_weapons_status_updated',

    // Полный view-ready snapshot
`,
    `    // Актуальные состояния установленных
    // player laser и missile launcher.
    PLAYER_WEAPONS_STATUS_UPDATED:
        'player_weapons_status_updated',

    // View-ready captain dashboard snapshot
    // стабильной player-ship части.
    PLAYER_SHIP_DASHBOARD_UPDATED:
        'player_ship_dashboard_updated',

    // Полный view-ready snapshot
`,
    'player ship dashboard event constant',
);

bridgeEvent = replaceExactly(
    bridgeEvent,
    `export type BridgePlayerWeaponStatusPayload = {
    phase: ShipWeaponPhase;

    remainingPhaseMs?: number;
};

export type BridgePlayerWeaponsStatusUpdatedPayload = {
    laser?: BridgePlayerWeaponStatusPayload;

    missileLauncher?:
        BridgePlayerWeaponStatusPayload & {
            ammo: {
                current: number;
                max: number;
            };
        };

    spamProjector?:
        BridgePlayerWeaponStatusPayload;
};

export type BridgeEnemyShipTelemetryUpdatedPayload =
`,
    `export type BridgePlayerWeaponStatusPayload = {
    phase: ShipWeaponPhase;

    // Полная длительность текущей timed phase.
    // Отсутствует для READY.
    initialPhaseMs?: number;

    remainingPhaseMs?: number;
};

export type BridgePlayerWeaponsStatusUpdatedPayload = {
    laser?: BridgePlayerWeaponStatusPayload;

    missileLauncher?:
        BridgePlayerWeaponStatusPayload & {
            ammo: {
                current: number;
                max: number;
            };
        };

    spamProjector?:
        BridgePlayerWeaponStatusPayload;
};

export const BRIDGE_PLAYER_SYSTEM_ACTION_STATE = {
    ACTIVE: 'active',
    DISABLED_SYSTEM: 'disabled_system',
    DISABLED_OFFICER_BUSY:
        'disabled_officer_busy',
    ENGAGED_CURRENT_WORK:
        'engaged_current_work',
} as const;

export type BridgePlayerSystemActionState =
    (typeof BRIDGE_PLAYER_SYSTEM_ACTION_STATE)[keyof typeof BRIDGE_PLAYER_SYSTEM_ACTION_STATE];

export type BridgePlayerShipDashboardUpdatedPayload = {
    missileLauncher?: {
        ammo: {
            current: number;
            max: number;
        };

        // 0..1 elapsed cooldown.
        // undefined означает, что cooldown bar не показывается.
        cooldownProgress?: number;

        action: {
            state:
                BridgePlayerSystemActionState;

            // Exact engine-resolved command.
            // Присутствует только у ACTIVE state.
            command?:
                BridgeOfficerCommandSelectedPayload;
        };
    };
};

export type BridgeEnemyShipTelemetryUpdatedPayload =
`,
    'player ship dashboard payload types',
);

bridgeEvent = replaceExactly(
    bridgeEvent,
    `    [BRIDGE_EVENT.PLAYER_WEAPONS_STATUS_UPDATED]:
        BridgePlayerWeaponsStatusUpdatedPayload;

    [BRIDGE_EVENT.ENEMY_SHIP_TELEMETRY_UPDATED]:
`,
    `    [BRIDGE_EVENT.PLAYER_WEAPONS_STATUS_UPDATED]:
        BridgePlayerWeaponsStatusUpdatedPayload;

    [BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED]:
        BridgePlayerShipDashboardUpdatedPayload;

    [BRIDGE_EVENT.ENEMY_SHIP_TELEMETRY_UPDATED]:
`,
    'player ship dashboard payload map entry',
);

if (
    !bridgeEvent.includes(
        "PLAYER_SHIP_DASHBOARD_UPDATED",
    ) ||
    !bridgeEvent.includes(
        "BridgePlayerShipDashboardUpdatedPayload",
    )
) {
    fail(
        'Bridge dashboard event transformation incomplete.',
    );
}

// All preflight / transformations succeeded.
// Only now touch the working tree.

for (const [filePath, content] of Object.entries(FULL_FILES)) {
    fs.mkdirSync(
        path.dirname(filePath),
        { recursive: true },
    );

    fs.writeFileSync(
        filePath,
        content,
        'utf8',
    );
}

const bridgeEventOutput =
    bridgeEventEol === '\n'
        ? bridgeEvent
        : bridgeEvent.replace(
              /\n/g,
              bridgeEventEol,
          );

fs.writeFileSync(
    BRIDGE_EVENT_FILE,
    bridgeEventOutput,
    'utf8',
);

console.log(
    [
        'Applied: missile captain-dashboard vertical slice.',
        '',
        'Implemented:',
        '  - real MISSILE ammo snapshot',
        '  - ACTIVE / system-disabled / officer-busy / engaged button states',
        '  - exact engine-resolved missile command on WPN click',
        '  - missile cooldown progress bar under the icon',
        '  - 0 ammo disables launch and hides irrelevant cooldown progress',
        '  - existing OFFICER_COMMAND_SELECTED execution path is reused',
        '',
        'No missile availability rule was duplicated in the view.',
        '',
        'Run:',
        '  npm run typecheck',
        '  npm test',
        '  npm run dev',
        '',
        'Runtime smoke:',
        '  1. MISSILE 5/5 + active WPN button',
        '  2. click WPN -> targeting/engaged state',
        '  3. launch -> ammo 4/5, WPN released, cooldown bar',
        '  4. cooldown completes -> button active again',
        '  5. fire to 0/5 -> disabled, no cooldown bar',
        '  6. while WPN is busy elsewhere -> distinct busy-disabled state',
        '',
        'Do not add this apply script to git.',
    ].join('\n'),
);
