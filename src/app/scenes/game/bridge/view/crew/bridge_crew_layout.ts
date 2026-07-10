// src\app\scenes\game\bridge\view\crew\bridge_crew_layout.ts

export const BRIDGE_CREW_POSITIONS = [
    // Left column: top / middle / bottom
    new Phaser.Math.Vector2(125, 135),
    new Phaser.Math.Vector2(125, 350),
    new Phaser.Math.Vector2(125, 565),

    // Right column: top / middle / bottom
    new Phaser.Math.Vector2(1155, 135),
    new Phaser.Math.Vector2(1155, 350),
    new Phaser.Math.Vector2(1155, 565),
] as const;
