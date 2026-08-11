import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const EXPECTED_HEAD = '44825c855d1bcf0bfa09ba7997b5f7c9dd4ed9c3';

const BRIDGE_VIEW =
    'src/app/scenes/game/bridge/view/BridgeView.ts';

const NEW_FILES = {
    'src/app/scenes/game/bridge/view/captain_dashboard/BridgeCaptainDashboardView.ts':
`import type BridgeScene from '../../BridgeScene';
import BridgePlayerShipDashboardView from './player_ship/BridgePlayerShipDashboardView';

const PLAYER_SHIP_POSITION = {
    x: 16,
    y: 500,
} as const;

// Root view капитанского dashboard.
//
// Пока dashboard содержит только стабильную левую часть:
// состояние и системы корабля игрока.
// Внешний context/right side добавим только когда начнём
// соответствующий реальный vertical slice.
export default class BridgeCaptainDashboardView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly playerShipView:
        BridgePlayerShipDashboardView;

    constructor(
        private readonly scene: BridgeScene,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.scene.layers
            .get('ui')
            .add(this.root);

        this.playerShipView =
            new BridgePlayerShipDashboardView(
                this.scene,
            );

        this.playerShipView.setPosition(
            PLAYER_SHIP_POSITION.x,
            PLAYER_SHIP_POSITION.y,
        );

        this.root.add(
            this.playerShipView.getRoot(),
        );
    }

    public destroy(): void {
        this.playerShipView.destroy();
        this.root.destroy(false);
    }
}
`,

    'src/app/scenes/game/bridge/view/captain_dashboard/player_ship/BridgePlayerShipDashboardView.ts':
`import type BridgeScene from '../../../BridgeScene';
import BridgePlayerShipStatusStripView from './status/BridgePlayerShipStatusStripView';
import BridgePlayerShipSystemsView from './systems/BridgePlayerShipSystemsView';

const PANEL = {
    width: 520,
    height: 204,

    padding: 8,
    sectionGap: 6,

    backgroundColor: 0x0b1018,
    backgroundAlpha: 0.94,

    borderColor: 0x40546a,
    borderThickness: 2,
} as const;

const STATUS_HEIGHT = 38;
const SYSTEMS_HEIGHT = 144;

// Стабильная левая часть captain dashboard.
//
// Этот view пока отвечает только за физическую композицию:
// рамка → status strip → список систем.
//
// Runtime state и actions намеренно подключим отдельными атомами,
// после того как примем геометрию на реальном bridge.
export default class BridgePlayerShipDashboardView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly background:
        Phaser.GameObjects.Rectangle;

    private readonly statusStripView:
        BridgePlayerShipStatusStripView;

    private readonly systemsView:
        BridgePlayerShipSystemsView;

    constructor(
        private readonly scene: BridgeScene,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.background =
            this.scene.add
                .rectangle(
                    0,
                    0,

                    PANEL.width,
                    PANEL.height,

                    PANEL.backgroundColor,
                    PANEL.backgroundAlpha,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    PANEL.borderThickness,
                    PANEL.borderColor,
                );

        const innerWidth =
            PANEL.width -
            PANEL.padding * 2;

        this.statusStripView =
            new BridgePlayerShipStatusStripView(
                this.scene,
                innerWidth,
                STATUS_HEIGHT,
            );

        this.statusStripView.setPosition(
            PANEL.padding,
            PANEL.padding,
        );

        this.systemsView =
            new BridgePlayerShipSystemsView(
                this.scene,
                innerWidth,
                SYSTEMS_HEIGHT,
            );

        this.systemsView.setPosition(
            PANEL.padding,

            PANEL.padding +
                STATUS_HEIGHT +
                PANEL.sectionGap,
        );

        this.root.add([
            this.background,
            this.statusStripView.getRoot(),
            this.systemsView.getRoot(),
        ]);
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
        this.systemsView.destroy();
        this.statusStripView.destroy();

        this.background.destroy();
        this.root.destroy(false);
    }
}
`,

    'src/app/scenes/game/bridge/view/captain_dashboard/player_ship/status/BridgePlayerShipStatusStripView.ts':
`import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

type StatusCell = {
    label: string;
};

const STATUS_CELLS: StatusCell[] = [
    {
        label: 'HULL',
    },
    {
        label: 'PD',
    },
    {
        label: 'SHD',
    },
    {
        label: 'ENGINE',
    },
];

const CELL = {
    backgroundColor: 0x101923,
    backgroundAlpha: 0.96,

    borderColor: 0x31465b,
    borderThickness: 1,

    textPaddingX: 10,
    textY: 11,
} as const;

// Layout-only status strip.
//
// Значения состояния здесь намеренно не показываются:
// runtime snapshot подключим после принятия геометрии.
export default class BridgePlayerShipStatusStripView {
    private readonly root:
        Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        width: number,
        height: number,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        const cellWidth =
            width /
            STATUS_CELLS.length;

        for (
            let index = 0;
            index < STATUS_CELLS.length;
            index += 1
        ) {
            const cell =
                STATUS_CELLS[index];

            if (!cell) {
                continue;
            }

            const x =
                cellWidth *
                index;

            const background =
                this.scene.add
                    .rectangle(
                        x,
                        0,

                        cellWidth,
                        height,

                        CELL.backgroundColor,
                        CELL.backgroundAlpha,
                    )
                    .setOrigin(0, 0)
                    .setStrokeStyle(
                        CELL.borderThickness,
                        CELL.borderColor,
                    );

            const label =
                this.scene.add
                    .bitmapText(
                        x +
                            CELL.textPaddingX,

                        CELL.textY,

                        FONT_FAMILY.VGA_8X14,
                        cell.label,
                        FONT_SIZE.PX_16,
                    )
                    .setOrigin(0, 0)
                    .setTint(
                        FONT_COLOR.PRIMARY,
                    );

            this.root.add([
                background,
                label,
            ]);
        }
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
        this.root.destroy(true);
    }
}
`,

    'src/app/scenes/game/bridge/view/captain_dashboard/player_ship/systems/BridgePlayerShipSystemsView.ts':
`import type BridgeScene from '../../../../BridgeScene';
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

// Layout-only list player ship systems.
//
// Четыре строки уже являются реальным текущим content,
// поэтому повторяемый row component здесь не speculative.
export default class BridgePlayerShipSystemsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly rowViews:
        BridgePlayerShipSystemRowView[] = [];

    constructor(
        private readonly scene: BridgeScene,
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

            this.rowViews.push(
                rowView,
            );

            this.root.add(
                rowView.getRoot(),
            );
        }
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
        for (
            const rowView
            of this.rowViews
        ) {
            rowView.destroy();
        }

        this.rowViews.length = 0;
        this.root.destroy(false);
    }
}
`,

    'src/app/scenes/game/bridge/view/captain_dashboard/player_ship/systems/BridgePlayerShipSystemRowView.ts':
`import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

export type BridgePlayerShipSystemRowLayout = {
    iconLabel: string;
    label: string;
    roleLabel: string;
};

const ROW = {
    verticalGap: 1,

    backgroundColor: 0x0e1620,
    backgroundAlpha: 0.94,

    borderColor: 0x26394c,
    borderThickness: 1,

    iconX: 6,
    iconY: 4,
    iconSize: 28,

    iconBackgroundColor: 0x152332,
    iconBorderColor: 0x45627f,

    labelX: 44,
    labelY: 10,

    roleButtonWidth: 84,
    roleButtonHeight: 28,
    roleButtonMarginRight: 6,
    roleButtonY: 4,

    roleButtonBackgroundColor:
        0x152332,
    roleButtonBorderColor:
        0x586f88,
} as const;

// Один повторяемый визуальный row player system.
//
// Пока это только layout placeholder:
// - icon footprint;
// - system label/count footprint;
// - action-role button footprint.
//
// Availability, progress и input здесь ещё не живут.
export default class BridgePlayerShipSystemRowView {
    private readonly root:
        Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        width: number,
        height: number,
        layout:
            BridgePlayerShipSystemRowLayout,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        const visibleHeight =
            Math.max(
                1,
                height -
                    ROW.verticalGap,
            );

        const background =
            this.scene.add
                .rectangle(
                    0,
                    0,

                    width,
                    visibleHeight,

                    ROW.backgroundColor,
                    ROW.backgroundAlpha,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    ROW.borderThickness,
                    ROW.borderColor,
                );

        const iconBackground =
            this.scene.add
                .rectangle(
                    ROW.iconX,
                    ROW.iconY,

                    ROW.iconSize,
                    ROW.iconSize,

                    ROW.iconBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    ROW.iconBorderColor,
                );

        const iconLabel =
            this.scene.add
                .bitmapText(
                    ROW.iconX +
                        ROW.iconSize / 2,

                    ROW.iconY +
                        ROW.iconSize / 2,

                    FONT_FAMILY.VGA_8X14,
                    layout.iconLabel,
                    FONT_SIZE.PX_16,
                )
                .setOrigin(
                    0.5,
                    0.5,
                )
                .setTint(
                    FONT_COLOR.SECONDARY,
                );

        const systemLabel =
            this.scene.add
                .bitmapText(
                    ROW.labelX,
                    ROW.labelY,

                    FONT_FAMILY.VGA_8X14,
                    layout.label,
                    FONT_SIZE.PX_16,
                )
                .setOrigin(0, 0)
                .setTint(
                    FONT_COLOR.PRIMARY,
                );

        const roleButtonX =
            width -
            ROW.roleButtonMarginRight -
            ROW.roleButtonWidth;

        const roleButton =
            this.scene.add
                .rectangle(
                    roleButtonX,
                    ROW.roleButtonY,

                    ROW.roleButtonWidth,
                    ROW.roleButtonHeight,

                    ROW.roleButtonBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    ROW.roleButtonBorderColor,
                );

        const roleLabel =
            this.scene.add
                .bitmapText(
                    roleButtonX +
                        ROW.roleButtonWidth /
                            2,

                    ROW.roleButtonY +
                        ROW.roleButtonHeight /
                            2,

                    FONT_FAMILY.VGA_8X14,
                    layout.roleLabel,
                    FONT_SIZE.PX_16,
                )
                .setOrigin(
                    0.5,
                    0.5,
                )
                .setTint(
                    FONT_COLOR.SECONDARY,
                );

        this.root.add([
            background,
            iconBackground,
            iconLabel,
            systemLabel,
            roleButton,
            roleLabel,
        ]);
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
        this.root.destroy(true);
    }
}
`,
};

function fail(message) {
    throw new Error(message);
}

function getHead() {
    return execFileSync(
        'git',
        ['rev-parse', 'HEAD'],
        {
            encoding: 'utf8',
        },
    ).trim();
}

function replaceExactly(
    source,
    before,
    after,
    label,
) {
    const first =
        source.indexOf(before);

    if (first < 0) {
        fail(
            `Expected source block missing: ${label}`,
        );
    }

    const second =
        source.indexOf(
            before,
            first +
                before.length,
        );

    if (second >= 0) {
        fail(
            `Expected source block is not unique: ${label}`,
        );
    }

    return (
        source.slice(
            0,
            first,
        ) +
        after +
        source.slice(
            first +
                before.length,
        )
    );
}

// ----- Preflight: validate everything before writing -----

const head =
    getHead();

if (
    head !==
    EXPECTED_HEAD
) {
    fail(
        `HEAD mismatch.\n` +
        `Expected: ${EXPECTED_HEAD}\n` +
        `Actual:   ${head}\n` +
        `Read fresh master before applying this atom.`,
    );
}

for (
    const filePath
    of Object.keys(
        NEW_FILES,
    )
) {
    if (
        fs.existsSync(
            filePath,
        )
    ) {
        fail(
            `New dashboard file already exists: ${filePath}`,
        );
    }
}

const originalBridgeView =
    fs.readFileSync(
        BRIDGE_VIEW,
        'utf8',
    );

const bridgeEol =
    originalBridgeView.includes(
        '\r\n',
    )
        ? '\r\n'
        : '\n';

let bridgeView =
    originalBridgeView.replace(
        /\r\n/g,
        '\n',
    );

bridgeView =
    replaceExactly(
        bridgeView,

        "import BridgeOfficerBarksView from './barks/BridgeOfficerBarksView';\nimport BridgeCombatView from './combat/BridgeCombatView';\n",

        "import BridgeOfficerBarksView from './barks/BridgeOfficerBarksView';\nimport BridgeCaptainDashboardView from './captain_dashboard/BridgeCaptainDashboardView';\nimport BridgeCombatView from './combat/BridgeCombatView';\n",

        'captain dashboard import anchor',
    );

bridgeView =
    replaceExactly(
        bridgeView,

        "    private interiorView?: BridgeInteriorView;\n\n    private targetingWarningView?: BridgeTargetingWarningView;\n",

        "    private interiorView?: BridgeInteriorView;\n\n    private captainDashboardView?: BridgeCaptainDashboardView;\n\n    private targetingWarningView?: BridgeTargetingWarningView;\n",

        'captain dashboard field anchor',
    );

bridgeView =
    replaceExactly(
        bridgeView,

        "        this.officerStationsView = new BridgeOfficerStationsView(this.scene, this.eventBus);\n\n        this.officerBarksView = new BridgeOfficerBarksView(this.scene, this.eventBus);\n",

        "        this.officerStationsView = new BridgeOfficerStationsView(this.scene, this.eventBus);\n\n        this.captainDashboardView = new BridgeCaptainDashboardView(this.scene);\n\n        this.officerBarksView = new BridgeOfficerBarksView(this.scene, this.eventBus);\n",

        'captain dashboard construction anchor',
    );

bridgeView =
    replaceExactly(
        bridgeView,

        "        this.officerBarksView?.destroy();\n        this.officerStationsView?.destroy();\n",

        "        this.officerBarksView?.destroy();\n        this.captainDashboardView?.destroy();\n        this.officerStationsView?.destroy();\n",

        'captain dashboard destroy anchor',
    );

bridgeView =
    replaceExactly(
        bridgeView,

        "        this.officerBarksView = undefined;\n        this.officerStationsView = undefined;\n",

        "        this.officerBarksView = undefined;\n        this.captainDashboardView = undefined;\n        this.officerStationsView = undefined;\n",

        'captain dashboard cleanup anchor',
    );

const expectedDashboardSnippets = [
    "import BridgeCaptainDashboardView from './captain_dashboard/BridgeCaptainDashboardView';",
    'private captainDashboardView?: BridgeCaptainDashboardView;',
    'this.captainDashboardView = new BridgeCaptainDashboardView(this.scene);',
    'this.captainDashboardView?.destroy();',
    'this.captainDashboardView = undefined;',
];

for (const snippet of expectedDashboardSnippets) {
    if (!bridgeView.includes(snippet)) {
        fail(
            `Captain dashboard transformation incomplete: ${snippet}`,
        );
    }
}

// ----- Write only after complete preflight -----

for (
    const [
        filePath,
        content,
    ]
    of Object.entries(
        NEW_FILES,
    )
) {
    fs.mkdirSync(
        path.dirname(
            filePath,
        ),
        {
            recursive: true,
        },
    );

    fs.writeFileSync(
        filePath,
        content,
        'utf8',
    );
}

const bridgeOutput =
    bridgeEol === '\n'
        ? bridgeView
        : bridgeView.replace(
              /\n/g,
              bridgeEol,
          );

fs.writeFileSync(
    BRIDGE_VIEW,
    bridgeOutput,
    'utf8',
);

console.log(
    [
        'Applied: captain dashboard left-side visual foundation.',
        '',
        'Added:',
        ...Object.keys(NEW_FILES).map(
            (filePath) =>
                `  ${filePath}`,
        ),
        '',
        `Changed: ${BRIDGE_VIEW}`,
        '',
        'This atom is layout-only:',
        '  - no engine reads',
        '  - no command routing',
        '  - no runtime state mapping',
        '  - no right/context panel',
        '',
        'Run:',
        '  npm run typecheck',
        '  npm test',
        '  npm run dev',
    ].join('\n'),
);
