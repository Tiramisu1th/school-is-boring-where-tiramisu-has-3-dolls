/**
 * Python-like print: only accepts (text, end='\n', timestamp=true)
 * - `text` will be converted to string if necessary
 * - `end` is appended to the output
 * - if `timestamp` is true, an ISO timestamp is prepended
 */
import { timestamp } from './time';
let __newlineFlag = true;

/**
 * Python-like print function with prepend timestamp
 * @param text -- the text to print (will be converted to string if not already)
 * @param end -- the string to append at the end of the output (default: newline)
 */
export function print(text: any, end: string = '\n'): void {
    const shouldTimestamp = __newlineFlag;

    const str = typeof text === 'string' ? text : String(text);
    const out = (shouldTimestamp ? `${timestamp()} ` : '') + str + end;

    // In Node prefer writing to stdout to preserve exact end string
    if (typeof process !== 'undefined' && (process as any).stdout) {
        try { (process as any).stdout.write(out); }
        catch { console.log(out); }
    } else {
        // Fallback to console.log in browsers
        console.log(out);
    }

    // Update newline flag: active if the output ended with a newline character
    __newlineFlag = end.includes('\n');
}

export default print;
