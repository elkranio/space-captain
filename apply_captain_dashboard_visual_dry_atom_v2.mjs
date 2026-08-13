import {
    execSync,
} from 'node:child_process';
import {
    existsSync,
    readFileSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import {
    fileURLToPath,
} from 'node:url';

const EXPECTED_HEAD =
    'ee812517ffc1e0f4e31ccb5a0ecaa1c6d7299769';

const SELF =
    fileURLToPath(
        import.meta.url,
    );

const planned =
    new Map();

const eols =
    new Map();

function fail(message) {
    throw new Error(message);
}

function shell(
    command,
    {
        capture = false,
    } = {},
) {
    return execSync(
        command,
        {
            cwd:
                process.cwd(),

            encoding:
                'utf8',

            stdio:
                capture
                    ? [
                          'ignore',
                          'pipe',
                          'pipe',
                      ]
                    : 'inherit',
        },
    );
}

function read(path) {
    if (planned.has(path)) {
        return planned.get(path);
    }

    if (!existsSync(path)) {
        fail(
            'Missing expected file: ' +
                path,
        );
    }

    const raw =
        readFileSync(
            path,
            'utf8',
        );

    eols.set(
        path,
        raw.includes('\r\n')
            ? '\r\n'
            : '\n',
    );

    const text =
        raw.replace(
            /\r\n/g,
            '\n',
        );

    planned.set(
        path,
        text,
    );

    return text;
}

function plan(
    path,
    text,
) {
    planned.set(
        path,
        text.replace(
            /\r\n/g,
            '\n',
        ),
    );
}

function create(
    path,
    text,
) {
    if (existsSync(path)) {
        fail(
            'Refusing to overwrite existing file: ' +
                path,
        );
    }

    eols.set(
        path,
        '\n',
    );

    plan(
        path,
        text,
    );
}

function replaceOnce(
    path,
    before,
    after,
    label,
) {
    const text =
        read(path);

    const first =
        text.indexOf(
            before,
        );

    if (first < 0) {
        fail(
            'Missing anchor in ' +
                path +
                ': ' +
                label,
        );
    }

    const second =
        text.indexOf(
            before,
            first + before.length,
        );

    if (second >= 0) {
        fail(
            'Non-unique anchor in ' +
                path +
                ': ' +
                label,
        );
    }

    plan(
        path,
        text.slice(
            0,
            first,
        ) +
            after +
            text.slice(
                first + before.length,
            ),
    );
}

function replaceAll(
    path,
    before,
    after,
    expectedMinimum,
    label,
) {
    const text =
        read(path);

    const count =
        text.split(before)
            .length - 1;

    if (count < expectedMinimum) {
        fail(
            'Expected at least ' +
                expectedMinimum +
                ' replacements in ' +
                path +
                ' for ' +
                label +
                ', found ' +
                count,
        );
    }

    plan(
        path,
        text.split(before)
            .join(after),
    );
}

function removeTrailingFormatter(
    path,
) {
    const text =
        read(path);

    const marker =
        '\nfunction formatTimer(';

    const index =
        text.lastIndexOf(
            marker,
        );

    if (index < 0) {
        fail(
            'Missing trailing formatTimer in ' +
                path,
        );
    }

    const tail =
        text.slice(
            index,
        );

    if (
        !tail.includes(
            '.toFixed(1)'
        ) ||
        !tail.trimEnd()
            .endsWith('}')
    ) {
        fail(
            'Unexpected trailing formatter shape in ' +
                path,
        );
    }

    plan(
        path,
        text.slice(
            0,
            index,
        ) +
            '\n',
    );
}

function writePlannedFiles() {
    for (
        const [path, text]
        of planned
    ) {
        const eol =
            eols.get(path) ??
            '\n';

        writeFileSync(
            path,
            text.replace(
                /\n/g,
                eol,
            ),
            'utf8',
        );
    }
}

const head =
    shell(
        'git rev-parse HEAD',
        {
            capture: true,
        },
    ).trim();

if (head !== EXPECTED_HEAD) {
    fail(
        'Unexpected HEAD. Expected ' +
            EXPECTED_HEAD +
            ', received ' +
            head,
    );
}

const trackedStatus =
    shell(
        'git status --porcelain --untracked-files=no',
        {
            capture: true,
        },
    ).trim();

if (trackedStatus) {
    fail(
        'Tracked working tree must be clean before dashboard visual DRY cleanup:\n' +
            trackedStatus,
    );
}

const DASHBOARD_ROOT =
    'src/app/scenes/game/bridge/view/captain_dashboard';

const STYLE =
    DASHBOARD_ROOT +
    '/captain_dashboard_style.ts';

const FORMAT =
    DASHBOARD_ROOT +
    '/captain_dashboard_format.ts';

create(
    STYLE,
`// Shared visual tokens for the captain dashboard.
//
// This is intentionally not a geometry/layout system.
// Coordinates and sizes stay beside each concrete view while they are
// still evolving. Only repeated visual semantics live here.
export const CAPTAIN_DASHBOARD_STYLE = {
    row: {
        backgroundColor: 0x0e1620,
        backgroundAlpha: 0.94,

        borderColor: 0x26394c,
        borderThickness: 1,

        iconBackgroundColor: 0x152332,
        iconBorderColor: 0x45627f,
    },

    action: {
        activeBackgroundColor: 0x193147,
        activeBorderColor: 0x7aa0c4,

        disabledBackgroundColor: 0x101923,
        disabledBorderColor: 0x26394c,
        disabledTextColor: 0x536778,
    },

    statusCell: {
        backgroundColor: 0x101923,
        backgroundAlpha: 0.96,

        borderColor: 0x31465b,
        borderThickness: 1,
    },

    defenseRechargeBar: {
        trackColor: 0x26384a,
        fillColor: 0xb69a45,
    },
} as const;
`,
);

create(
    FORMAT,
`export function formatCaptainDashboardCountdown(
    remainingMs: number,
): string {
    return (
        Math.max(
            0,
            remainingMs,
        ) /
        1000
    ).toFixed(1) + 's';
}
`,
);

const THREAT_DIR =
    DASHBOARD_ROOT +
    '/combat_context/threats';

const threatRows = [
    THREAT_DIR +
        '/BridgeCaptainMissileThreatRowView.ts',

    THREAT_DIR +
        '/BridgeCaptainLaserThreatRowView.ts',

    THREAT_DIR +
        '/BridgeCaptainStickyMineThreatRowView.ts',

    THREAT_DIR +
        '/BridgeCaptainSpamThreatRowView.ts',
];

const ROW_COLOR_BLOCK =
`    backgroundColor: 0x0e1620,
    backgroundAlpha: 0.94,

    borderColor: 0x26394c,
    borderThickness: 1,

`;

const ICON_COLOR_BLOCK =
`    iconBackgroundColor: 0x152332,
    iconBorderColor: 0x45627f,

`;

const ACTION_COLOR_BLOCK =
`    disabledBackgroundColor: 0x101923,
    disabledBorderColor: 0x26394c,
    disabledTextColor: 0x536778,

    actionActiveBackgroundColor:
        0x193147,
    actionActiveBorderColor:
        0x7aa0c4,
`;

for (
    const path of
    threatRows
) {
    replaceOnce(
        path,

`import type BridgeScene from '../../../../BridgeScene';
`,

`import type BridgeScene from '../../../../BridgeScene';
import {
    CAPTAIN_DASHBOARD_STYLE,
} from '../../captain_dashboard_style';
import {
    formatCaptainDashboardCountdown,
} from '../../captain_dashboard_format';
`,

        'dashboard shared imports',
    );

    replaceOnce(
        path,
        ROW_COLOR_BLOCK,
        '',
        'remove repeated row surface colors',
    );

    replaceOnce(
        path,
        ICON_COLOR_BLOCK,
        '',
        'remove repeated icon surface colors',
    );

    replaceOnce(
        path,
        ACTION_COLOR_BLOCK,
        '',
        'remove repeated action colors',
    );

    const replacements = [
        [
            'ROW.backgroundColor',
            'CAPTAIN_DASHBOARD_STYLE.row.backgroundColor',
        ],
        [
            'ROW.backgroundAlpha',
            'CAPTAIN_DASHBOARD_STYLE.row.backgroundAlpha',
        ],
        [
            'ROW.borderThickness',
            'CAPTAIN_DASHBOARD_STYLE.row.borderThickness',
        ],
        [
            'ROW.borderColor',
            'CAPTAIN_DASHBOARD_STYLE.row.borderColor',
        ],
        [
            'ROW.iconBackgroundColor',
            'CAPTAIN_DASHBOARD_STYLE.row.iconBackgroundColor',
        ],
        [
            'ROW.iconBorderColor',
            'CAPTAIN_DASHBOARD_STYLE.row.iconBorderColor',
        ],
        [
            'ROW.disabledBackgroundColor',
            'CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor',
        ],
        [
            'ROW.disabledBorderColor',
            'CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor',
        ],
        [
            'ROW.disabledTextColor',
            'CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor',
        ],
        [
            'ROW.actionActiveBackgroundColor',
            'CAPTAIN_DASHBOARD_STYLE.action.activeBackgroundColor',
        ],
        [
            'ROW.actionActiveBorderColor',
            'CAPTAIN_DASHBOARD_STYLE.action.activeBorderColor',
        ],
    ];

    for (
        const [
            before,
            after,
        ] of replacements
    ) {
        replaceAll(
            path,
            before,
            after,
            1,
            before,
        );
    }

    removeTrailingFormatter(
        path,
    );

    replaceAll(
        path,
        'formatTimer(',
        'formatCaptainDashboardCountdown(',
        1,
        'shared countdown formatter',
    );
}

// -----------------------------------------------------------------------------
// Beam selector: only share disabled action semantics + countdown.
// RED/BLUE beam colors and selector geometry remain local.
// -----------------------------------------------------------------------------

const THREATS_VIEW =
    THREAT_DIR +
    '/BridgeCaptainThreatsView.ts';

replaceOnce(
    THREATS_VIEW,

`import type BridgeScene from '../../../../BridgeScene';
`,

`import type BridgeScene from '../../../../BridgeScene';
import {
    CAPTAIN_DASHBOARD_STYLE,
} from '../../captain_dashboard_style';
import {
    formatCaptainDashboardCountdown,
} from '../../captain_dashboard_format';
`,

    'threat selector shared imports',
);

replaceOnce(
    THREATS_VIEW,

`    disabledBackgroundColor: 0x101923,
    disabledBorderColor: 0x26394c,
    disabledTextColor: 0x536778,

`,

'',
    'remove selector duplicate disabled colors',
);

replaceAll(
    THREATS_VIEW,
    'SELECTOR.disabledBackgroundColor',
    'CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor',
    1,
    'selector disabled background',
);

replaceAll(
    THREATS_VIEW,
    'SELECTOR.disabledBorderColor',
    'CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor',
    1,
    'selector disabled border',
);

replaceAll(
    THREATS_VIEW,
    'SELECTOR.disabledTextColor',
    'CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor',
    1,
    'selector disabled text',
);

removeTrailingFormatter(
    THREATS_VIEW,
);

replaceAll(
    THREATS_VIEW,
    'formatTimer(',
    'formatCaptainDashboardCountdown(',
    1,
    'selector countdown formatter',
);

// The close button intentionally uses the same neutral inset surface
// as dashboard row icons.
replaceAll(
    THREATS_VIEW,
    '            0x152332,\n',
    '            CAPTAIN_DASHBOARD_STYLE.row.iconBackgroundColor,\n',
    1,
    'selector close neutral surface',
);

// -----------------------------------------------------------------------------
// Shared status-cell + DEF recharge visuals.
// -----------------------------------------------------------------------------

const STATUS =
    DASHBOARD_ROOT +
    '/player_ship/status/BridgePlayerShipStatusStripView.ts';

replaceOnce(
    STATUS,

`import type BridgeScene from '../../../../BridgeScene';
`,

`import type BridgeScene from '../../../../BridgeScene';
import {
    CAPTAIN_DASHBOARD_STYLE,
} from '../../captain_dashboard_style';
`,

    'player status shared style import',
);

replaceOnce(
    STATUS,

`const CELL = {
    backgroundColor: 0x101923,
    backgroundAlpha: 0.96,

    borderColor: 0x31465b,
    borderThickness: 1,

    textPaddingX: 10,
    textY: 8,
} as const;
`,

`const CELL = {
    textPaddingX: 10,
    textY: 8,
} as const;
`,

    'player status local geometry only',
);

replaceOnce(
    STATUS,

`const BAR = {
    sidePadding: 10,
    bottomPadding: 6,
    height: 4,

    trackColor: 0x26384a,
    fillColor: 0xb69a45,
} as const;
`,

`const BAR = {
    sidePadding: 10,
    bottomPadding: 6,
    height: 4,
} as const;
`,

    'player DEF bar local geometry only',
);

const statusReplacements = [
    [
        'CELL.backgroundColor',
        'CAPTAIN_DASHBOARD_STYLE.statusCell.backgroundColor',
    ],
    [
        'CELL.backgroundAlpha',
        'CAPTAIN_DASHBOARD_STYLE.statusCell.backgroundAlpha',
    ],
    [
        'CELL.borderThickness',
        'CAPTAIN_DASHBOARD_STYLE.statusCell.borderThickness',
    ],
    [
        'CELL.borderColor',
        'CAPTAIN_DASHBOARD_STYLE.statusCell.borderColor',
    ],
    [
        'BAR.trackColor',
        'CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.trackColor',
    ],
    [
        'BAR.fillColor',
        'CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.fillColor',
    ],
];

for (
    const [
        before,
        after,
    ] of statusReplacements
) {
    replaceAll(
        STATUS,
        before,
        after,
        1,
        before,
    );
}

const CONTEXT =
    DASHBOARD_ROOT +
    '/combat_context/BridgeCaptainCombatContextView.ts';

replaceOnce(
    CONTEXT,

`import type BridgeScene from '../../../BridgeScene';
`,

`import type BridgeScene from '../../../BridgeScene';
import {
    CAPTAIN_DASHBOARD_STYLE,
} from '../captain_dashboard_style';
`,

    'enemy context shared style import',
);

replaceOnce(
    CONTEXT,

`const STATUS_CELL = {
    backgroundColor: 0x101923,
    backgroundAlpha: 0.96,

    borderColor: 0x31465b,
    borderThickness: 1,

    textPaddingX: 10,
    textY: 8,
} as const;
`,

`const STATUS_CELL = {
    textPaddingX: 10,
    textY: 8,
} as const;
`,

    'enemy status cell local geometry only',
);

replaceOnce(
    CONTEXT,

`const DEF_BAR = {
    sidePadding: 10,
    bottomPadding: 6,
    height: 4,

    trackColor: 0x26384a,
    fillColor: 0xb69a45,
} as const;
`,

`const DEF_BAR = {
    sidePadding: 10,
    bottomPadding: 6,
    height: 4,
} as const;
`,

    'enemy DEF bar local geometry only',
);

const contextReplacements = [
    [
        'STATUS_CELL.backgroundColor',
        'CAPTAIN_DASHBOARD_STYLE.statusCell.backgroundColor',
    ],
    [
        'STATUS_CELL.backgroundAlpha',
        'CAPTAIN_DASHBOARD_STYLE.statusCell.backgroundAlpha',
    ],
    [
        'STATUS_CELL.borderThickness',
        'CAPTAIN_DASHBOARD_STYLE.statusCell.borderThickness',
    ],
    [
        'STATUS_CELL.borderColor',
        'CAPTAIN_DASHBOARD_STYLE.statusCell.borderColor',
    ],
    [
        'DEF_BAR.trackColor',
        'CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.trackColor',
    ],
    [
        'DEF_BAR.fillColor',
        'CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.fillColor',
    ],
];

for (
    const [
        before,
        after,
    ] of contextReplacements
) {
    replaceAll(
        CONTEXT,
        before,
        after,
        1,
        before,
    );
}

// -----------------------------------------------------------------------------
// Player system rows use the same repeated row/icon/action semantics.
// Progress colors remain local because they mean system progress, not action UI.
// -----------------------------------------------------------------------------

const SYSTEM_ROW =
    DASHBOARD_ROOT +
    '/player_ship/systems/BridgePlayerShipSystemRowView.ts';

replaceOnce(
    SYSTEM_ROW,

`import type BridgeScene from '../../../../BridgeScene';
`,

`import type BridgeScene from '../../../../BridgeScene';
import {
    CAPTAIN_DASHBOARD_STYLE,
} from '../../captain_dashboard_style';
`,

    'player system shared style import',
);

replaceOnce(
    SYSTEM_ROW,
    ROW_COLOR_BLOCK,
    '',
    'remove player row surface colors',
);

replaceOnce(
    SYSTEM_ROW,
    ICON_COLOR_BLOCK,
    '',
    'remove player icon surface colors',
);

replaceOnce(
    SYSTEM_ROW,

`    actionActiveBackgroundColor:
        0x193147,
    actionActiveBorderColor:
        0x7aa0c4,

    actionDisabledBackgroundColor:
        0x101923,
    actionDisabledBorderColor:
        0x26394c,
    actionDisabledTextColor:
        0x536778,

`,

'',
    'remove player action colors',
);

const systemReplacements = [
    [
        'ROW.backgroundColor',
        'CAPTAIN_DASHBOARD_STYLE.row.backgroundColor',
    ],
    [
        'ROW.backgroundAlpha',
        'CAPTAIN_DASHBOARD_STYLE.row.backgroundAlpha',
    ],
    [
        'ROW.borderThickness',
        'CAPTAIN_DASHBOARD_STYLE.row.borderThickness',
    ],
    [
        'ROW.borderColor',
        'CAPTAIN_DASHBOARD_STYLE.row.borderColor',
    ],
    [
        'ROW.iconBackgroundColor',
        'CAPTAIN_DASHBOARD_STYLE.row.iconBackgroundColor',
    ],
    [
        'ROW.iconBorderColor',
        'CAPTAIN_DASHBOARD_STYLE.row.iconBorderColor',
    ],
    [
        'ROW.actionActiveBackgroundColor',
        'CAPTAIN_DASHBOARD_STYLE.action.activeBackgroundColor',
    ],
    [
        'ROW.actionActiveBorderColor',
        'CAPTAIN_DASHBOARD_STYLE.action.activeBorderColor',
    ],
    [
        'ROW.actionDisabledBackgroundColor',
        'CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor',
    ],
    [
        'ROW.actionDisabledBorderColor',
        'CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor',
    ],
    [
        'ROW.actionDisabledTextColor',
        'CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor',
    ],
];

for (
    const [
        before,
        after,
    ] of systemReplacements
) {
    replaceAll(
        SYSTEM_ROW,
        before,
        after,
        1,
        before,
    );
}

// -----------------------------------------------------------------------------
// Focused behavior test for the extracted countdown formatter.
// -----------------------------------------------------------------------------

const FORMAT_TEST =
    'tests/app/captain_dashboard_format.test.ts';

create(
    FORMAT_TEST,
`import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    formatCaptainDashboardCountdown,
} from '../../src/app/scenes/game/bridge/view/captain_dashboard/captain_dashboard_format';

describe(
    'captain dashboard countdown formatting',
    () => {
        it(
            'formats milliseconds as clamped one-decimal seconds',
            () => {
                expect(
                    formatCaptainDashboardCountdown(
                        1250,
                    ),
                ).toBe(
                    '1.3s',
                );

                expect(
                    formatCaptainDashboardCountdown(
                        0,
                    ),
                ).toBe(
                    '0.0s',
                );

                expect(
                    formatCaptainDashboardCountdown(
                        -250,
                    ),
                ).toBe(
                    '0.0s',
                );
            },
        );
    },
);
`,
);

// -----------------------------------------------------------------------------
// In-memory guard: duplicated visual literals / local timer formatters should
// disappear from the views intentionally migrated by this atom.
// -----------------------------------------------------------------------------

const migratedViews = [
    ...threatRows,
    THREATS_VIEW,
    STATUS,
    CONTEXT,
    SYSTEM_ROW,
];

for (
    const path of
    migratedViews
) {
    const text =
        read(path);

    if (
        text.includes(
            'function formatTimer('
        )
    ) {
        fail(
            'Local formatTimer remains in ' +
                path,
        );
    }
}

for (
    const path of
    threatRows
) {
    const text =
        read(path);

    for (
        const forbidden of [
            'backgroundColor: 0x0e1620',
            'iconBackgroundColor: 0x152332',
            'disabledBackgroundColor: 0x101923',
            'actionActiveBackgroundColor:',
        ]
    ) {
        if (
            text.includes(
                forbidden,
            )
        ) {
            fail(
                'Repeated dashboard style remains in ' +
                    path +
                    ': ' +
                    forbidden,
            );
        }
    }
}

const systemText =
    read(SYSTEM_ROW);

for (
    const forbidden of [
        'backgroundColor: 0x0e1620',
        'iconBackgroundColor: 0x152332',
        'actionDisabledBackgroundColor:',
        'actionActiveBackgroundColor:',
    ]
) {
    if (
        systemText.includes(
            forbidden,
        )
    ) {
        fail(
            'Repeated player-system style remains: ' +
                forbidden,
        );
    }
}

writePlannedFiles();

console.log(
    '\nCaptain dashboard visual DRY cleanup applied. Running validation...\n',
);

shell(
    'npm run typecheck',
);

shell(
    'npm test',
);

shell(
    'git -c core.safecrlf=false diff --check',
);

console.log(
    '\nDashboard visual DRY cleanup is green. Patch script will self-delete.\n',
);

for (
    const patcher of [
        SELF,
        'apply_captain_dashboard_visual_dry_atom.mjs',
    ]
) {
    if (existsSync(patcher)) {
        unlinkSync(
            patcher,
        );
    }
}
