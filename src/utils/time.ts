/**
 * Time helper utilities
 */

/**
 * Return a formatted timestamp string in HKT (UTC+8) as:
 * [YYYY-MM-DD HH:MM:SS HKT]
 */
export function timestamp(digits: number | any = 2): string {
    const d = new Date();
    // Normalize digits: accept numeric strings, floats; default to 2 on invalid input
    const raw = digits;
    const n = Number(digits);
    let used: number;
    if (!Number.isFinite(n)) {
        used = 2;
        console.warn(`timestamp(): invalid digits=${JSON.stringify(raw)}; defaulting to ${used}`);
    } else {
        const rounded = Math.round(n);
        const clamped = Math.max(0, Math.min(3, rounded));
        if (rounded !== n) {
            console.warn(`timestamp(): digits=${n} rounded to ${rounded}`);
        }
        if (clamped !== rounded) {
            console.warn(`timestamp(): digits=${rounded} clamped to ${clamped}`);
        }
        used = clamped;
    }
    // Convert to HKT (UTC+8)
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const hkt = new Date(utc + 8 * 3600000);

    const pad = (n: number, width = 2) => String(n).padStart(width, '0');
    const year = hkt.getFullYear();
    const month = pad(hkt.getMonth() + 1);
    const day = pad(hkt.getDate());
    const hours = pad(hkt.getHours());
    const mins = pad(hkt.getMinutes());
    const secs = pad(hkt.getSeconds());
    // compute fractional seconds with requested digits (0-3)
    const dps = used;
    let frac = '';
    if (dps > 0) {
        // milliseconds -> fractional seconds
        const factor = Math.pow(10, 3 - dps);
        const rounded = Math.floor(hkt.getMilliseconds() / factor);
        frac = '.' + String(rounded).padStart(dps, '0');
    }

    return `[${year}-${month}-${day} ${hours}:${mins}:${secs}${frac} HKT]`;
}

export default timestamp;
