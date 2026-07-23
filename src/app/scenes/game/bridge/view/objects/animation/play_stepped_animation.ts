// src/app/scenes/game/bridge/view/objects/animation/play_stepped_animation.ts

type SteppedAnimationOptions = {
    scene: Phaser.Scene;

    durationMs: number;
    framesPerSecond: number;

    ease?: (progress: number) => number;

    onStep: (progress: number) => void;
    onComplete: () => void;
};

const LINEAR_EASE = (progress: number): number => progress;

// Проигрывает формульную анимацию дискретными кадрами.
//
// Phaser продолжает рендерить сцену с обычной частотой,
// но animated state меняется только framesPerSecond раз в секунду.
//
// Первый кадр с progress = 0 применяется сразу.
// Последний callback всегда получает progress = 1.
export function playSteppedAnimation({
    scene,
    durationMs,
    framesPerSecond,
    ease = LINEAR_EASE,
    onStep,
    onComplete,
}: SteppedAnimationOptions): Phaser.Time.TimerEvent {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
        throw new Error(`Stepped animation duration must be positive: ${durationMs}`);
    }

    if (!Number.isFinite(framesPerSecond) || framesPerSecond <= 0) {
        throw new Error(`Stepped animation FPS must be positive: ${framesPerSecond}`);
    }

    const stepCount = Math.max(1, Math.round((durationMs / 1000) * framesPerSecond));
    const stepDelayMs = durationMs / stepCount;

    let stepIndex = 0;

    onStep(0);

    return scene.time.addEvent({
        delay: stepDelayMs,
        repeat: stepCount - 1,

        callback: () => {
            stepIndex += 1;

            const linearProgress = stepIndex / stepCount;
            const easedProgress = Phaser.Math.Clamp(ease(linearProgress), 0, 1);

            onStep(easedProgress);

            if (stepIndex < stepCount) {
                return;
            }

            onComplete();
        },
    });
}
