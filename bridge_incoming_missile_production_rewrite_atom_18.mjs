import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPECTED_HEAD =
    'dcc710451cc1f7c495a21d136e6b0211effbbb4b';

const SELF_PATH = fileURLToPath(import.meta.url);
const ROOT = process.cwd();

const MANAGER_PATH =
    'src/app/scenes/game/bridge/view/combat/incoming_missiles/BridgeIncomingMissilesView.ts';

const LEAF_PATH =
    'src/app/scenes/game/bridge/view/combat/incoming_missiles/missile/BridgeIncomingMissileView.ts';

const PRESENTATION_PATH =
    'src/app/scenes/game/bridge/view/combat/incoming_missiles/missile/bridge_incoming_missile_presentation.ts';

const PRESENTATION_SOURCE = `export type BridgeIncomingMissilePoint = {
    x: number;
    y: number;
};

export const BRIDGE_INCOMING_MISSILE_PRESENTATION = {
    trajectories: [
        {
            points: [
                { x: 720, y: 145 },
                { x: 640, y: 130 },
                { x: 550, y: 120 },
                { x: 450, y: 118 },
                { x: 340, y: 105 },
            ],

            end: {
                x: 205,
                y: 70,
            },
        },

        {
            points: [
                { x: 720, y: 158 },
                { x: 640, y: 175 },
                { x: 550, y: 205 },
                { x: 455, y: 245 },
                { x: 355, y: 290 },
                { x: 265, y: 330 },
            ],

            end: {
                x: 190,
                y: 350,
            },
        },

        {
            points: [
                { x: 720, y: 153 },
                { x: 650, y: 175 },
                { x: 590, y: 225 },
                { x: 550, y: 300 },
                { x: 525, y: 380 },
            ],

            end: {
                x: 515,
                y: 455,
            },
        },

        {
            points: [
                { x: 720, y: 150 },
                { x: 690, y: 205 },
                { x: 745, y: 245 },
                { x: 830, y: 270 },
                { x: 925, y: 300 },
                { x: 1015, y: 335 },
            ],

            end: {
                x: 1090,
                y: 365,
            },
        },

        {
            points: [
                { x: 720, y: 150 },
                { x: 690, y: 205 },
                { x: 750, y: 235 },
                { x: 835, y: 215 },
                { x: 920, y: 175 },
                { x: 1005, y: 120 },
            ],

            end: {
                x: 1085,
                y: 70,
            },
        },
    ],

    jitter: {
        firstWaypointPx: 4,
        waypointPx: 10,
        endPx: 5,
    },

    motion: {
        terminalStartTimeProgress: 0.90,
        terminalStartPathProgress: 0.62,

        cruiseLinearWeight: 0.42,
        terminalLinearWeight: 0.392,
    },

    missile: {
        coreColor: 0xf7fbff,
        hotColor: 0xffcf63,
        hotAlpha: 0.58,
        hotPaddingPx: 2,

        minPixelSize: 2,
        maxPixelSize: 10,
    },

    trail: {
        hotColor: 0xffd36a,
        coolColor: 0xff5b33,

        minParticleCount: 5,
        maxParticleCount: 34,

        minParticleSpacingPx: 2,

        minParticleSize: 1,
        maxParticleSize: 5,

        minAlpha: 0.32,
        maxAlpha: 0.78,
    },
} as const;
`;

const LEAF_SOURCE = `// src/app/scenes/game/bridge/view/combat/incoming_missiles/missile/BridgeIncomingMissileView.ts

import type BridgeScene from '../../../../BridgeScene';
import {
    BRIDGE_INCOMING_MISSILE_PRESENTATION,
    type BridgeIncomingMissilePoint,
} from './bridge_incoming_missile_presentation';

type BridgeIncomingMissileViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    projectileId: string;

    startPosition: Phaser.Math.Vector2;

    initialTimeToImpactMs: number;
};

// Leaf-view одной входящей ракеты.
//
// Engine остаётся единственным источником времени.
// View при создании один раз выбирает visual trajectory
// и небольшой immutable waypoint jitter.
//
// Каждый update переводит engine time в normalized progress,
// затем в visual path progress. Поэтому одинаковая траектория
// сохраняет тот же speed profile при любой длительности полёта.
export default class BridgeIncomingMissileView {
    private readonly graphics:
        Phaser.GameObjects.Graphics;

    private readonly initialTimeToImpactMs:
        number;

    private readonly trajectoryPoints:
        BridgeIncomingMissilePoint[];

    private readonly trailPoints:
        BridgeIncomingMissilePoint[] = [];

    private readonly currentPosition =
        new Phaser.Math.Vector2();

    constructor({
        scene,
        parent,

        projectileId,

        startPosition,

        initialTimeToImpactMs,
    }: BridgeIncomingMissileViewOptions) {
        if (initialTimeToImpactMs <= 0) {
            throw new Error(
                'Incoming missile initial time must be positive: ' +
                    projectileId,
            );
        }

        this.initialTimeToImpactMs =
            initialTimeToImpactMs;

        this.trajectoryPoints =
            this.createTrajectoryPoints(
                startPosition,
            );

        this.currentPosition.copy(
            startPosition,
        );

        this.graphics =
            scene.add.graphics();

        parent.add(this.graphics);

        this.update(
            initialTimeToImpactMs,
        );
    }

    public update(
        timeToImpactMs: number,
    ): void {
        const timeProgress =
            this.getTimeProgress(
                timeToImpactMs,
            );

        const pathProgress =
            this.mapTimeToPathProgress(
                timeProgress,
            );

        const point =
            this.getTrajectoryPoint(
                pathProgress,
            );

        this.currentPosition.set(
            point.x,
            point.y,
        );

        this.pushTrailPoint(
            point,
        );

        this.render(
            point,
            pathProgress,
        );
    }

    public getPosition():
        Phaser.Math.Vector2 {
        return this.currentPosition.clone();
    }

    public destroy(): void {
        this.trailPoints.length = 0;
        this.graphics.destroy();
    }

    private getTimeProgress(
        timeToImpactMs: number,
    ): number {
        const clampedRemainingMs =
            Phaser.Math.Clamp(
                timeToImpactMs,
                0,
                this.initialTimeToImpactMs,
            );

        return (
            1 -
            clampedRemainingMs /
                this.initialTimeToImpactMs
        );
    }

    private mapTimeToPathProgress(
        timeProgress: number,
    ): number {
        const motion =
            BRIDGE_INCOMING_MISSILE_PRESENTATION
                .motion;

        if (
            timeProgress <
            motion.terminalStartTimeProgress
        ) {
            const local =
                timeProgress /
                motion.terminalStartTimeProgress;

            const acceleratedCruise =
                motion.cruiseLinearWeight *
                    local +
                (1 -
                    motion.cruiseLinearWeight) *
                    local *
                    local *
                    local;

            return (
                motion.terminalStartPathProgress *
                acceleratedCruise
            );
        }

        const local =
            (
                timeProgress -
                motion.terminalStartTimeProgress
            ) /
            (
                1 -
                motion.terminalStartTimeProgress
            );

        const terminalRush =
            motion.terminalLinearWeight *
                local +
            (1 -
                motion.terminalLinearWeight) *
                local *
                local *
                local;

        return Phaser.Math.Linear(
            motion.terminalStartPathProgress,
            1,
            terminalRush,
        );
    }

    private createTrajectoryPoints(
        startPosition:
            Phaser.Math.Vector2,
    ): BridgeIncomingMissilePoint[] {
        const presentation =
            BRIDGE_INCOMING_MISSILE_PRESENTATION;

        const preset =
            presentation.trajectories[
                Phaser.Math.Between(
                    0,
                    presentation
                        .trajectories
                        .length - 1,
                )
            ];

        const points:
            BridgeIncomingMissilePoint[] = [
                {
                    x: startPosition.x,
                    y: startPosition.y,
                },
            ];

        for (
            let index = 0;
            index < preset.points.length;
            index += 1
        ) {
            const point =
                preset.points[index];

            const jitterPx =
                index === 0
                    ? presentation.jitter
                        .firstWaypointPx
                    : presentation.jitter
                        .waypointPx;

            points.push(
                this.createJitteredPoint(
                    point,
                    jitterPx,
                ),
            );
        }

        points.push(
            this.createJitteredPoint(
                preset.end,
                presentation.jitter.endPx,
            ),
        );

        return points;
    }

    private createJitteredPoint(
        point: BridgeIncomingMissilePoint,
        jitterPx: number,
    ): BridgeIncomingMissilePoint {
        return {
            x:
                point.x +
                Phaser.Math.Between(
                    -jitterPx,
                    jitterPx,
                ),

            y:
                point.y +
                Phaser.Math.Between(
                    -jitterPx,
                    jitterPx,
                ),
        };
    }

    private pushTrailPoint(
        point: BridgeIncomingMissilePoint,
    ): void {
        const trailConfig =
            BRIDGE_INCOMING_MISSILE_PRESENTATION
                .trail;

        const previousPoint =
            this.trailPoints[
                this.trailPoints.length - 1
            ];

        if (previousPoint) {
            const distance =
                Phaser.Math.Distance.Between(
                    previousPoint.x,
                    previousPoint.y,
                    point.x,
                    point.y,
                );

            if (
                distance <
                trailConfig
                    .minParticleSpacingPx
            ) {
                return;
            }
        }

        this.trailPoints.push({
            x: point.x,
            y: point.y,
        });

        while (
            this.trailPoints.length >
            trailConfig.maxParticleCount
        ) {
            this.trailPoints.shift();
        }
    }

    private render(
        missilePoint:
            BridgeIncomingMissilePoint,

        pathProgress: number,
    ): void {
        const graphics =
            this.graphics;

        const presentation =
            BRIDGE_INCOMING_MISSILE_PRESENTATION;

        const trailConfig =
            presentation.trail;

        const missileConfig =
            presentation.missile;

        graphics.clear();

        const depth =
            pathProgress *
            pathProgress;

        const particleCount =
            Math.round(
                Phaser.Math.Linear(
                    trailConfig
                        .minParticleCount,
                    trailConfig
                        .maxParticleCount,
                    depth,
                ),
            );

        const visibleStartIndex =
            Math.max(
                0,
                this.trailPoints.length -
                    particleCount,
            );

        const visiblePoints =
            this.trailPoints.slice(
                visibleStartIndex,
            );

        for (
            let index = 0;
            index < visiblePoints.length;
            index += 1
        ) {
            const point =
                visiblePoints[index];

            const ageProgress =
                visiblePoints.length <= 1
                    ? 1
                    : index /
                        (
                            visiblePoints.length -
                            1
                        );

            const particleSize =
                Phaser.Math.Linear(
                    trailConfig
                        .minParticleSize,
                    trailConfig
                        .maxParticleSize,
                    depth *
                        ageProgress,
                );

            const alpha =
                Phaser.Math.Linear(
                    trailConfig.minAlpha,
                    trailConfig.maxAlpha,
                    depth *
                        ageProgress,
                );

            const color =
                ageProgress > 0.66
                    ? trailConfig.hotColor
                    : trailConfig.coolColor;

            const roundedSize =
                Math.max(
                    1,
                    Math.round(
                        particleSize,
                    ),
                );

            graphics.fillStyle(
                color,
                alpha,
            );

            graphics.fillRect(
                Math.round(
                    point.x -
                        particleSize / 2,
                ),
                Math.round(
                    point.y -
                        particleSize / 2,
                ),
                roundedSize,
                roundedSize,
            );
        }

        const missileSize =
            Math.max(
                1,
                Math.round(
                    Phaser.Math.Linear(
                        missileConfig
                            .minPixelSize,
                        missileConfig
                            .maxPixelSize,
                        depth,
                    ),
                ),
            );

        const hotSize =
            missileSize +
            missileConfig.hotPaddingPx;

        graphics.fillStyle(
            missileConfig.hotColor,
            missileConfig.hotAlpha,
        );

        graphics.fillRect(
            Math.round(
                missilePoint.x -
                    hotSize / 2,
            ),
            Math.round(
                missilePoint.y -
                    hotSize / 2,
            ),
            hotSize,
            hotSize,
        );

        graphics.fillStyle(
            missileConfig.coreColor,
            1,
        );

        graphics.fillRect(
            Math.round(
                missilePoint.x -
                    missileSize / 2,
            ),
            Math.round(
                missilePoint.y -
                    missileSize / 2,
            ),
            missileSize,
            missileSize,
        );
    }

    private getTrajectoryPoint(
        progress: number,
    ): BridgeIncomingMissilePoint {
        const points =
            this.trajectoryPoints;

        const segmentCount =
            points.length - 1;

        const scaledProgress =
            Phaser.Math.Clamp(
                progress,
                0,
                1,
            ) *
            segmentCount;

        const segmentIndex =
            Math.min(
                segmentCount - 1,
                Math.floor(
                    scaledProgress,
                ),
            );

        const localProgress =
            scaledProgress -
            segmentIndex;

        const point0 =
            points[
                Math.max(
                    0,
                    segmentIndex - 1,
                )
            ];

        const point1 =
            points[segmentIndex];

        const point2 =
            points[
                Math.min(
                    points.length - 1,
                    segmentIndex + 1,
                )
            ];

        const point3 =
            points[
                Math.min(
                    points.length - 1,
                    segmentIndex + 2,
                )
            ];

        return {
            x: this.catmullRom(
                point0.x,
                point1.x,
                point2.x,
                point3.x,
                localProgress,
            ),

            y: this.catmullRom(
                point0.y,
                point1.y,
                point2.y,
                point3.y,
                localProgress,
            ),
        };
    }

    private catmullRom(
        point0: number,
        point1: number,
        point2: number,
        point3: number,
        progress: number,
    ): number {
        const progressSquared =
            progress * progress;

        const progressCubed =
            progressSquared *
            progress;

        return (
            0.5 *
            (
                2 * point1 +
                (
                    -point0 +
                    point2
                ) *
                    progress +
                (
                    2 * point0 -
                    5 * point1 +
                    4 * point2 -
                    point3
                ) *
                    progressSquared +
                (
                    -point0 +
                    3 * point1 -
                    3 * point2 +
                    point3
                ) *
                    progressCubed
            )
        );
    }
}
`;

function fail(message) {
    throw new Error(message);
}

function absolute(relativePath) {
    return path.join(ROOT, relativePath);
}

function runCapture(command, args) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        shell: false,
    });

    if (result.error) {
        fail(`${command} failed to start: ${result.error.message}`);
    }

    if (result.status !== 0) {
        fail(
            `${command} ${args.join(' ')} failed with exit code ${result.status}\n` +
            `${result.stderr ?? ''}`,
        );
    }

    return (result.stdout ?? '').trim();
}

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        stdio: 'inherit',
        shell: false,
    });

    if (result.error) {
        fail(`${command} failed to start: ${result.error.message}`);
    }

    if (result.status !== 0) {
        fail(
            `${command} ${args.join(' ')} failed with exit code ${result.status}`,
        );
    }
}

function runNpm(args) {
    if (process.platform === 'win32') {
        run(
            'cmd.exe',
            ['/d', '/s', '/c', `npm ${args.join(' ')}`],
        );

        return;
    }

    run('npm', args);
}

function readText(relativePath) {
    const filePath =
        absolute(relativePath);

    if (!fs.existsSync(filePath)) {
        fail(
            `Expected file missing: ${relativePath}`,
        );
    }

    return fs.readFileSync(
        filePath,
        'utf8',
    );
}

function normalizeLf(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n*$/, '\n');
}

function writePreservingEol(
    relativePath,
    lfText,
    originalText,
) {
    const eol =
        originalText.includes('\r\n')
            ? '\r\n'
            : '\n';

    fs.writeFileSync(
        absolute(relativePath),
        normalizeLf(lfText)
            .replace(/\n/g, eol),
        'utf8',
    );
}

function replaceExactlyOnce(
    text,
    before,
    after,
    label,
) {
    const first =
        text.indexOf(before);

    if (first === -1) {
        fail(
            `Expected source fragment missing: ${label}`,
        );
    }

    if (
        text.indexOf(
            before,
            first + before.length,
        ) !== -1
    ) {
        fail(
            `Expected source fragment is not unique: ${label}`,
        );
    }

    return (
        text.slice(0, first) +
        after +
        text.slice(
            first + before.length,
        )
    );
}

function assertPreconditions() {
    const head =
        runCapture(
            'git',
            ['rev-parse', 'HEAD'],
        );

    if (head !== EXPECTED_HEAD) {
        fail(
            `Unexpected HEAD.\nExpected: ${EXPECTED_HEAD}\nActual:   ${head}`,
        );
    }

    const status =
        runCapture(
            'git',
            [
                'status',
                '--porcelain',
                '--untracked-files=no',
            ],
        );

    if (status) {
        fail(
            'Tracked worktree must be clean before applying this atom:\n' +
            status,
        );
    }

    if (
        fs.existsSync(
            absolute(
                PRESENTATION_PATH,
            ),
        )
    ) {
        fail(
            `Presentation file already exists: ${PRESENTATION_PATH}`,
        );
    }

    const manager =
        normalizeLf(
            readText(MANAGER_PATH),
        );

    for (const token of [
        `import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';`,
        `const INCOMING_MISSILE_IMPACT_AREA = {`,
        `designation: payload.designation,`,
        `targetPosition: this.createImpactPosition(),`,
        `update.identificationStatus,`,
        `private createImpactPosition(): Phaser.Math.Vector2`,
    ]) {
        if (!manager.includes(token)) {
            fail(
                `Expected legacy manager token missing: ${token}`,
            );
        }
    }

    const leaf =
        normalizeLf(
            readText(LEAF_PATH),
        );

    for (const token of [
        `MISSILE_SPRITE_ID`,
        `TARGETING_FRAME`,
        `getQuantizedProgress`,
        `getQuadraticBezierPosition`,
        `framesPerSecond: 12`,
        `statusLabel`,
    ]) {
        if (!leaf.includes(token)) {
            fail(
                `Expected legacy missile-view token missing: ${token}`,
            );
        }
    }

    console.log(
        'Incoming missile production rewrite preflight OK',
    );
}

function patchManager() {
    const original =
        readText(MANAGER_PATH);

    let text =
        normalizeLf(original);

    text = replaceExactlyOnce(
        text,
        `import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';\n`,
        '',
        'remove legacy impact-area import',
    );

    const impactAreaStart =
        text.indexOf(
            'const INCOMING_MISSILE_IMPACT_AREA = {',
        );

    const managerCommentStart =
        text.indexOf(
            '// Manager-view летящих в игрока ракет.',
        );

    if (
        impactAreaStart === -1 ||
        managerCommentStart === -1 ||
        managerCommentStart <=
            impactAreaStart
    ) {
        fail(
            'Could not locate legacy incoming missile impact-area block',
        );
    }

    text =
        text.slice(
            0,
            impactAreaStart,
        ) +
        text.slice(
            managerCommentStart,
        );

    text = replaceExactlyOnce(
        text,
        `        const missile = new BridgeIncomingMissileView({
            scene: this.scene,
            parent: this.root,

            designation: payload.designation,

            startPosition,

            targetPosition: this.createImpactPosition(),

            initialTimeToImpactMs: payload.initialTimeToImpactMs,
        });`,
        `        const missile = new BridgeIncomingMissileView({
            scene: this.scene,
            parent: this.root,

            projectileId:
                payload.projectileId,

            startPosition,

            initialTimeToImpactMs:
                payload.initialTimeToImpactMs,
        });`,
        'new incoming missile options',
    );

    text = replaceExactlyOnce(
        text,
        `            missile.update(
                update.timeToImpactMs,
                update.identificationStatus,
            );`,
        `            missile.update(
                update.timeToImpactMs,
            );`,
        'engine-time-only missile update',
    );

    const createImpactStart =
        text.indexOf(
            '    private createImpactPosition(): Phaser.Math.Vector2 {',
        );

    const assertNeverStart =
        text.indexOf(
            '    private assertNever(value: never): never {',
        );

    if (
        createImpactStart === -1 ||
        assertNeverStart === -1 ||
        assertNeverStart <=
            createImpactStart
    ) {
        fail(
            'Could not locate legacy createImpactPosition method',
        );
    }

    text =
        text.slice(
            0,
            createImpactStart,
        ) +
        text.slice(
            assertNeverStart,
        );

    writePreservingEol(
        MANAGER_PATH,
        text,
        original,
    );
}

function rewriteLeaf() {
    const original =
        readText(LEAF_PATH);

    writePreservingEol(
        LEAF_PATH,
        LEAF_SOURCE,
        original,
    );
}

function createPresentation() {
    const filePath =
        absolute(PRESENTATION_PATH);

    fs.mkdirSync(
        path.dirname(filePath),
        {
            recursive: true,
        },
    );

    fs.writeFileSync(
        filePath,
        normalizeLf(
            PRESENTATION_SOURCE,
        ),
        'utf8',
    );
}

function postGuards() {
    const manager =
        normalizeLf(
            readText(MANAGER_PATH),
        );

    for (const stale of [
        'BRIDGE_VIEWSCREEN_RECT',
        'INCOMING_MISSILE_IMPACT_AREA',
        'payload.designation',
        'targetPosition:',
        'createImpactPosition',
        'update.identificationStatus',
    ]) {
        if (manager.includes(stale)) {
            fail(
                `Post-guard failed: legacy manager token remains: ${stale}`,
            );
        }
    }

    for (const required of [
        `projectileId:
                payload.projectileId,`,
        `missile.update(
                update.timeToImpactMs,
            );`,
    ]) {
        if (!manager.includes(required)) {
            fail(
                `Post-guard failed: manager token missing: ${required}`,
            );
        }
    }

    const leaf =
        normalizeLf(
            readText(LEAF_PATH),
        );

    for (const stale of [
        'MISSILE_SPRITE_ID',
        'MISSILE_SPRITES',
        'TARGETING_FRAME',
        'BitmapText',
        'statusLabel',
        'designation',
        'getQuantizedProgress',
        'getQuadraticBezierPosition',
        'framesPerSecond',
        'controlPosition',
    ]) {
        if (leaf.includes(stale)) {
            fail(
                `Post-guard failed: legacy leaf token remains: ${stale}`,
            );
        }
    }

    for (const required of [
        'projectileId: string;',
        'private readonly trajectoryPoints:',
        'private readonly trailPoints:',
        'private getTimeProgress(',
        'private mapTimeToPathProgress(',
        'private createTrajectoryPoints(',
        'private createJitteredPoint(',
        'private getTrajectoryPoint(',
        'private catmullRom(',
        'this.initialTimeToImpactMs',
    ]) {
        if (!leaf.includes(required)) {
            fail(
                `Post-guard failed: new leaf token missing: ${required}`,
            );
        }
    }

    const presentation =
        normalizeLf(
            readText(PRESENTATION_PATH),
        );

    for (const required of [
        'trajectories: [',
        'firstWaypointPx: 4,',
        'waypointPx: 10,',
        'endPx: 5,',
        'terminalStartTimeProgress: 0.90,',
        'terminalStartPathProgress: 0.62,',
        'cruiseLinearWeight: 0.42,',
        'terminalLinearWeight: 0.392,',
        'coreColor: 0xf7fbff,',
        'minParticleSpacingPx: 2,',
    ]) {
        if (!presentation.includes(required)) {
            fail(
                `Post-guard failed: presentation token missing: ${required}`,
            );
        }
    }
}

function validate() {
    run(
        'git',
        [
            '-c',
            'core.safecrlf=false',
            'diff',
            '--check',
        ],
    );

    runNpm([
        'run',
        'typecheck',
    ]);

    runNpm([
        'test',
    ]);
}

try {
    assertPreconditions();
    patchManager();
    rewriteLeaf();
    createPresentation();
    postGuards();
    validate();

    fs.unlinkSync(SELF_PATH);

    console.log(
        '\nBRIDGE INCOMING MISSILE PRODUCTION REWRITE ATOM 18 OK',
    );

    console.log(
        'Runtime: test one missile first, then simultaneous missiles. Geometry is driven only by engine time; each missile gets one immutable preset/jitter at creation.',
    );
} catch (error) {
    console.error(
        '\nBRIDGE INCOMING MISSILE PRODUCTION REWRITE ATOM 18 FAILED',
    );

    console.error(error);

    console.error(
        '\nThe patcher was intentionally left on disk for diagnosis.',
    );

    process.exitCode = 1;
}
