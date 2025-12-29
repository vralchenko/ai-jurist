const rateLimitMap = new Map();
const LIMIT = 5;
const WINDOW = 60 * 1000;

export function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const userStats = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - userStats.lastReset > WINDOW) {
        userStats.count = 1;
        userStats.lastReset = now;
        rateLimitMap.set(ip, userStats);
        return false;
    }

    if (userStats.count >= LIMIT) return true;

    userStats.count++;
    rateLimitMap.set(ip, userStats);
    return false;
}