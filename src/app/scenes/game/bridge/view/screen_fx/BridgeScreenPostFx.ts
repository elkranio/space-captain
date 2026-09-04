// src/app/scenes/game/bridge/view/screen_fx/BridgeScreenPostFx.ts

const PIPELINE_KEY = "bridge_screen_post_fx";

// Presentation-only kill switch. Nothing in encounter/gameplay depends on this effect.
export const BRIDGE_SCREEN_POST_FX_ENABLED = false;

const SCREEN_FX = {
    scanlineStrength: 0.055,
    noiseStrength: 0.016,
    sweepStrength: 0.04,
    sweepPeriodSeconds: 8,
    sweepDurationSeconds: 1.6,
    vignetteStrength: 0.035,
    flickerStrength: 0.04,
} as const;

const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uScanlineStrength;
uniform float uNoiseStrength;
uniform float uSweepStrength;
uniform float uSweepPeriod;
uniform float uSweepDuration;
uniform float uVignetteStrength;
uniform float uFlickerStrength;

varying vec2 outTexCoord;

float hash(vec2 value) {
    return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(void) {
    vec4 color = texture2D(uMainSampler, outTexCoord);

    // Darken every other output pixel row without blurring the pixel-art source.
    float scanline = 0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159265);
    color.rgb *= 1.0 - scanline * uScanlineStrength;

    // Tiny coarse phosphor noise. Quantizing it keeps it from reading as analog TV snow.
    float noise = hash(vec2(
        floor(gl_FragCoord.x / 4.0),
        floor(gl_FragCoord.y / 4.0) + floor(uTime * 12.0)
    )) - 0.5;
    color.rgb += noise * uNoiseStrength;

    // One soft sweep crosses the screen, then stays away for the rest of the cycle.
    float sweepTime = mod(uTime, uSweepPeriod);
    float sweepActive = 1.0 - step(uSweepDuration, sweepTime);
    float sweepY = sweepTime / uSweepDuration;
    float sweepDistance = abs(outTexCoord.y - sweepY);
    float sweep = 1.0 - smoothstep(0.0, 0.035, sweepDistance);
    color.rgb += vec3(0.70, 0.85, 1.0) * sweep * sweepActive * uSweepStrength;

    // Very small brightness breathing plus edge falloff: screen-like, not damaged-CRT-like.
    color.rgb *= 1.0 - uFlickerStrength * (0.5 + 0.5 * sin(uTime * 17.0));

    vec2 edgePosition = abs(outTexCoord - 0.5) * 2.0;
    float edge = smoothstep(0.68, 1.0, max(edgePosition.x, edgePosition.y));
    color.rgb *= 1.0 - edge * uVignetteStrength;

    gl_FragColor = color;
}
`;

class BridgeScreenPostFxPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game: Phaser.Game) {
        super({
            game,
            renderTarget: true,
            fragShader: FRAGMENT_SHADER,
        });
    }

    public onPreRender(): void {
        this.set1f("uTime", this.game.loop.time / 1000);
        this.set1f("uScanlineStrength", SCREEN_FX.scanlineStrength);
        this.set1f("uNoiseStrength", SCREEN_FX.noiseStrength);
        this.set1f("uSweepStrength", SCREEN_FX.sweepStrength);
        this.set1f("uSweepPeriod", SCREEN_FX.sweepPeriodSeconds);
        this.set1f("uSweepDuration", SCREEN_FX.sweepDurationSeconds);
        this.set1f("uVignetteStrength", SCREEN_FX.vignetteStrength);
        this.set1f("uFlickerStrength", SCREEN_FX.flickerStrength);
    }
}

export function installBridgeScreenPostFx(scene: Phaser.Scene): (() => void) | undefined {
    if (!BRIDGE_SCREEN_POST_FX_ENABLED || scene.game.renderer.type !== Phaser.WEBGL) {
        return undefined;
    }

    const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    const pipelines = renderer.pipelines;

    if (!pipelines.postPipelineClasses.has(PIPELINE_KEY)) {
        pipelines.addPostPipeline(PIPELINE_KEY, BridgeScreenPostFxPipeline);
    }

    scene.cameras.main.setPostPipeline(PIPELINE_KEY);

    return () => {
        scene.cameras.main.removePostPipeline(PIPELINE_KEY);
    };
}
