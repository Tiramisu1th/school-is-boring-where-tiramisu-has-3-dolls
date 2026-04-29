/**
 * Python-like print: only accepts (text, end='\n', timestamp=true)
 * - `text` will be converted to string if necessary
 * - `end` is appended to the output
 * - if `timestamp` is true, an ISO timestamp is prepended
 */
import { timestamp } from './time';
import * as fs from 'fs';
import * as path from 'path';

let __newlineFlag = true;

export function print(text: any, end: string = '\n'): void {
    const shouldTimestamp = __newlineFlag;
    const str = typeof text === 'string' ? text : String(text);
    const out = (shouldTimestamp ? `${timestamp()} ` : '') + str + end;

    // --- LOG TO FILE ---
    try {
        // This path goes up two levels from src/utils to the root MINIGAMES folder
        const logPath = path.join(__dirname, '..', '..', 'stderr.log');
        fs.appendFileSync(logPath, out);
    } catch (e) {
        // On some local environments, this might fail if the folder is restricted
    }

    // --- LOG TO CONSOLE (Localhost behavior) ---
    if (typeof process !== 'undefined' && (process as any).stdout) {
        try {
            (process as any).stdout.write(out);
        } catch {
            console.log(out);
        }
    } else {
        console.log(out);
    }

    __newlineFlag = end.includes('\n');
}

export default print;