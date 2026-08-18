export function formatCaptainDashboardCountdown(remainingMs: number): string {
    return (Math.max(0, remainingMs) / 1000).toFixed(1) + "s";
}
