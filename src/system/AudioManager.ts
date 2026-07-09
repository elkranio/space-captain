import P34TOptions from '../config/p34t.options';
import StoreManager from './StorageManager';

export class AudioManager {
    private static sfxInstances: Phaser.Sound.BaseSound[] = [];
    private static musicInstance: Phaser.Sound.BaseSound | null = null;

    private static volume: Record<AudioType, number> = {
        sfx: StoreManager.initItem<number>('_volume_sfx', P34TOptions.audio.sfxMaxVolume),
        music: StoreManager.initItem<number>('_volume_music', P34TOptions.audio.musicMaxVolume),
    };

    /**
     * Plays a sound effect from the audio sprite.
     * Automatically destroys the sound after it finishes.
     *
     * @param scene - The Phaser scene to use for sound playback.
     * @param key - The key of the sound inside the audio sprite.
     * @param config - Optional sound configuration.
     * @returns A Phaser sound instance.
     */
    public static playSFX(
        scene: Phaser.Scene,
        key: string,
        config: Phaser.Types.Sound.SoundConfig = {}
    ): Phaser.Sound.BaseSound {
        const sound = scene.sound.addAudioSprite('sfx', {
            volume: this.volume.sfx,
            ...config,
        });

        sound.play(key);
        sound.once('complete', () => this._removeSFX(sound));
        this.sfxInstances.push(sound);
        return sound;
    }

    /**
     * Plays background music. Stops any existing music.
     *
     * @param scene - The Phaser scene to use for music playback.
     * @param key - The key of the music track to play.
     * @param config - Optional sound configuration.
     * @returns A Phaser sound instance.
     */
    public static playMusic(
        scene: Phaser.Scene,
        key: string,
        config: Phaser.Types.Sound.SoundConfig = {}
    ): Phaser.Sound.BaseSound {
        this.stopMusic();

        this.musicInstance = scene.sound.add(key, {
            loop: true,
            volume: this.volume.music,
            ...config,
        });

        this.musicInstance.play();
        return this.musicInstance;
    }

    /**
     * Stops and destroys the currently playing music, if any.
     */
    public static stopMusic(): void {
        if (this.musicInstance) {
            this.musicInstance.stop();
            this.musicInstance.destroy();
            this.musicInstance = null;
        }
    }

    /**
     * Sets the volume for a given audio type (sfx or music).
     * Also updates all currently playing instances of that type.
     *
     * @param type - 'sfx' or 'music'
     * @param value - Volume value (0.0 to 1.0)
     */
    public static setVolume(type: AudioType, value: number): void {
        this.volume[type] = value;

        StoreManager.setItem(`_volume_${type}`, value);

        if (type === 'sfx') {
            this.sfxInstances.forEach((instance) => {
                if ('setVolume' in instance && typeof instance.setVolume === 'function') {
                    instance.setVolume(value);
                }
            });
        }

        if (
            type === 'music' &&
            this.musicInstance &&
            'setVolume' in this.musicInstance &&
            typeof this.musicInstance.setVolume === 'function'
        ) {
            this.musicInstance.setVolume(value);
        }
    }

    /**
     * Gets the current volume for a given audio type.
     *
     * @param type - 'sfx' or 'music'
     * @returns The volume (0.0 to 1.0)
     */
    public static getVolume(type: AudioType): number {
        return this.volume[type];
    }

    /**
     * Toggles mute/unmute for the given audio type.
     * If volume is currently zero, restores max volume from options.
     * If not, sets it to zero.
     *
     * @param type - 'sfx' or 'music'
     * @returns New volume value after the flip.
     */
    public static flipMute(type: AudioType): number {
        const max = P34TOptions.audio[`${type}MaxVolume` as keyof typeof P34TOptions.audio] as number;
        const newVolume = this.volume[type] === 0 ? max : 0;
        this.setVolume(type, newVolume);
        return newVolume;
    }

    /**
     * Stops and destroys all currently playing sound effects.
     */
    public static stopAllSFX(): void {
        this.sfxInstances.forEach((sfx) => {
            sfx.stop();
            sfx.destroy();
        });
        this.sfxInstances = [];
    }

    /**
     * Internally removes a sound effect instance from the active list and destroys it.
     *
     * @param instance - The sound effect instance to remove.
     */
    private static _removeSFX(instance: Phaser.Sound.BaseSound): void {
        const index = this.sfxInstances.indexOf(instance);
        if (index !== -1) {
            this.sfxInstances.splice(index, 1);
        }

        if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }
    }
}
