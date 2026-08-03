// src/engine/encounter/combat/CombatRuntimeIdentityFactory.ts

// Owns encounter-local identities for transient combat presentation objects.
// One shared instance preserves the mixed threat designation sequence:
// M1, L2, M3, L4.
export default class CombatRuntimeIdentityFactory {
    private nextProjectileId = 1;

    private nextLaserAttackId = 1;

    private nextSpamChannelId = 1;

    private nextStickyMineId = 1;

    private nextThreatDesignationNumber = 1;

    public createProjectileId(): string {
        const id = `projectile_${this.nextProjectileId}`;

        this.nextProjectileId += 1;

        return id;
    }

    public createLaserAttackId(): string {
        const id = `laser_attack_${this.nextLaserAttackId}`;

        this.nextLaserAttackId += 1;

        return id;
    }

    public createSpamChannelId(): string {
        const id = `spam_channel_${this.nextSpamChannelId}`;

        this.nextSpamChannelId += 1;

        return id;
    }

    public createStickyMineId(): string {
        const id = `sticky_mine_${this.nextStickyMineId}`;

        this.nextStickyMineId += 1;

        return id;
    }

    public createThreatDesignation(
        prefix: 'M' | 'L',
    ): string {
        const designation =
            `${prefix}${this.nextThreatDesignationNumber}`;

        this.nextThreatDesignationNumber += 1;

        return designation;
    }
}
