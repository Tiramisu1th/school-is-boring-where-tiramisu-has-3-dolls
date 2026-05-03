import { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import {print} from '../utils/print';
import {teapotRoll} from '../utils/teapot';
import { corsHeadersFor } from '../utils/cors';

/**
 * This file contains helper functions related to authentication and authorization
 * Current collection of functions include:
 * - getClientIP: Extracts the client's IP address from the request headers or connection info
 */

export function getClientIP(req: IncomingMessage): string | undefined {
    const xf = req.headers['x-forwarded-for'];
    let ip: string | undefined;
    if (typeof xf === 'string' && xf.length > 0) {
        ip = xf.split(',')[0].trim();
    } else if ((req as any).socket && (req as any).socket.remoteAddress) {
        ip = (req as any).socket.remoteAddress;
    }
    if (ip && ip.startsWith('::ffff:')) ip = ip.split('::ffff:').pop();
    return ip;
}

export function canonicalizeJSON(value: any): string {
    // Empty / malformed handling: return empty string per spec
    if (value === null || value === undefined || value === '') {
        print(`Detected falsy input: ${value}, parsed into empty string.`);
        print(`canonicalizeJSON returning empty string for value: ${JSON.stringify(value)}`);
        return '';
    }

    // For primitives and strings, use JSON.stringify to ensure proper escaping
    if (typeof value !== 'object') {
        print(`canonicalizeJSON returning JSON string for primitive value: ${JSON.stringify(value)}`);
        return JSON.stringify(value);
    }

    const sortKeys = (obj: any): any => {
        if (obj === null) {
            print(`canonicalizeJSON sorting null object`);
            return null;
        }
        if (Array.isArray(obj)) {
            print(`canonicalizeJSON sorting array`);
            return obj.map(sortKeys);
        }
        if (typeof obj === 'object') {
            const sorted: any = {};
            Object.keys(obj).sort().forEach(k => {
                sorted[k] = sortKeys(obj[k]);
            });
            print(`canonicalizeJSON returning sorted object: ${JSON.stringify(sorted)}`);
            return sorted;
        }
        print(`canonicalizeJSON returning non-object value: ${JSON.stringify(obj)}`);
        return obj;
    };

    try {
        return JSON.stringify(sortKeys(value));
    } catch {
        print(`canonicalizeJSON caught error while stringifying value: ${JSON.stringify(value)}`);
        return '';
    }
}

export function calculateTimestamp(d: Date): string {
    const tz8 = new Date(d.getTime() + 8 * 3600000);
    const YYYY = tz8.getUTCFullYear().toString().padStart(4, '0');
    const MM = (tz8.getUTCMonth() + 1).toString().padStart(2, '0');
    const DD = tz8.getUTCDate().toString().padStart(2, '0');
    const hh = tz8.getUTCHours().toString().padStart(2, '0');
    const mm = tz8.getUTCMinutes().toString().padStart(2, '0');
    return `${YYYY}${MM}${DD}${hh}${mm}`;
}


export function getCurrentTimestamp(): string {
    return calculateTimestamp(new Date());
}


/**
 * Calculate HMAC according to project spec.
 * - content: JSON-stringified request body (sorted keys, no spaces). If body is malformed/empty -> empty string
 * - timestamp: YYYYMMDDHHMM in UTC+8
 * - GLOBAL_PASSWORD: from `password` param or `process.env.GLOBAL_PASSWORD`
 * HMAC_unhashed = content + timestamp + GLOBAL_PASSWORD
 * HMAC = SHA256(HMAC_unhashed) (hex)
 */
export function calculateHMAC(body: any, now?: Date, password?: string): string {
    const content = canonicalizeJSON(body);
    const ts = calculateTimestamp(now || new Date());
    const key = password ?? process.env.GLOBAL_PASSWORD ?? '';
    const unhashed = `${content}${ts}${key}`;
    // Use plain SHA256 of the unhashed string (no HMAC keyed construction)
    const hmac = crypto.createHash('sha256').update(unhashed, 'utf8').digest('hex');
    return hmac;
}


/**
 * Check if the request is authorized by comparing the client's HMAC (from Authorization header)
 * with the server-calculated HMAC based on the request body and current timestamp.
 * This HMAC scheme checks the current minute, the previous minute and the next minute to allow for some clock skew.
 * @param req 
 * @param res
 * @param body 
 * @param password Optional password to use for HMAC calculation. If not provided, will use process.env.GLOBAL_PASSWORD
 * @returns true if authorized
 */
export async function isAuthorized(req: IncomingMessage, res: ServerResponse, password?: string): Promise<boolean> {
    // read body from request stream (if any)
    let body: any = undefined
    try {
        body = await new Promise((resolve, reject) => {
            const chunks: Buffer[] = []
            req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
            req.on('end', () => {
                if (chunks.length === 0) return resolve(undefined)
                const buf = Buffer.concat(chunks)
                const text = buf.toString('utf8')
                // try parse JSON, otherwise return string
                try { resolve(JSON.parse(text)) } catch { resolve(text) }
            })
            req.on('error', err => reject(err))
        })
    } catch (e) {
        print(`isAuthorized failed reading body: ${String(e)}`)
        body = undefined
    }

    // Content-Type checks
    const ct = (req.headers['content-type'] || '') as string;
    const isJsonContent = ct.includes('application/json');
    const isString = typeof body === 'string';

    // 415 Unsupported Media Type if body is present but not JSON or string
    if (!isJsonContent && !isString && body !== undefined && body !== null) {
        res.statusCode = 415;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Unsupported Media Type - expected JSON or string' }));
        print(`isAuthorized rejecting request due to 415 unsupported media type. Content-Type: ${ct}, body type: ${typeof body}`);
        return false;
    }

    // 400 Bad Request if Content-Type is JSON but body is empty or malformed (not valid JSON)
    if (isJsonContent && (body === '' || body === undefined)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Malformed JSON' }));
        print(`isAuthorized rejecting request due to 400 malformed JSON. Body: ${JSON.stringify(body)}`);
        return false;
    }

    // 400 Bad Request if Authorization header is missing
    const authHeader = (req.headers['authorization'] || '') as string;
    if (!authHeader) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing authorization header' }));
        print(`isAuthorized rejecting request due to 400 missing authorization header.`);
        return false;
    }

    // 400 Bad Request if Authorization header does not start with "Bearer "
    const prefix = 'Bearer ';
    if (!authHeader.startsWith(prefix)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Malformed authorization header. It should start with "Bearer "' }));
        print(`isAuthorized rejecting request due to 400 malformed authorization header. Received: ${authHeader}`);
        return false;
    }

    // 500 Internal Server Error if GLOBAL_PASSWORD is not set on server and not provided as parameter
    const loadGlobalPassword = process.env.GLOBAL_PASSWORD;
    if (!password && !loadGlobalPassword) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Server configuration error: GLOBAL_PASSWORD is not set' }));
        print(`isAuthorized rejecting request due to 500 server configuration error.`);
        return false;
    }

    // core HMAC logic
    const clientHMAC = authHeader.slice(prefix.length).trim();
    print(`Extracted client HMAC from header: ${clientHMAC}`);
    const now = new Date();
    // check current, previous and next minute for leniency
    const candidates = [0, -1, 1].map(delta => {
        const d = new Date(now.getTime() + delta * 60000);
        return calculateHMAC(body, d, password);
    });

    let valid = false;
    try {
        const clientBuf = Buffer.from(clientHMAC, 'hex');
        for (const cand of candidates) {
            const candBuf = Buffer.from(cand, 'hex');
            if (candBuf.length === clientBuf.length && crypto.timingSafeEqual(candBuf, clientBuf)) {
                valid = true;
                break;
            }
        }
    } catch {
        // invalid hex or other buffer error -> treat as invalid HMAC
        valid = false;
    }

    // 401 Unauthorized if no candidates matched
    if (!valid) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid HMAC' }));
        print(`isAuthorized rejecting request due to 401 invalid HMAC.`);
        return false;
    }

    print(`isAuthorized successfully authorized request.`);
    return true;
}


// If someone tries to GET BASE_URL/api/auth, return a helpful message about authorization details
function makeHTML(): string {
return `<html>
<head><title>Authorization Details</title></head>
<body>
<h1>HMAC Formula</h1>
<p>To access this API, you need to include a valid authorization header:</p>
<code>"authorization": "Bearer &lt;HMAC&gt;"</code>
<h2>HMAC Formula</h2>
<p>The HMAC is calculated as follows:</p>
<pre>
content = JSON.stringify(request body with sorted keys and no spaces, or empty string if body is empty/malformed)
timestamp = current time in UTC+8, formatted as YYYYMMDDHHMM
PASSWORD = a secret password. DM tiramisu_1th on discord for one if you don't have it.
HMAC_unhashed = content + timestamp + PASSWORD    # exact order
HMAC = SHA256(HMAC_unhashed)  # hex string
</pre>
<h2>Timestamp Leniency</h2>
<p>To allow for some clock skew, the server will accept HMACs calculated within ±1 minute.</p>
<h2>Example</h2>
<table border="1" cellpadding="5" cellspacing="0">
<tr><th>Parameters</th><th>Arguments</th></tr>
<tr><td>Request Body</td><td><pre>{"odour":"sudden fiercing smell"}</pre></td></tr>
<tr><td>Timestamp</td><td>2025 May 14 19:19 UTC+8</td></tr>
<tr><td>PASSWORD</td><td><code>00000000</code></td></tr>
</table>
<p>As a result, <code>HMAC_unhashed = {"odour":"sudden fiercing smell"}20250514191900000000</code></p>
<p><code>HMAC = SHA256(HMAC_unhashed) # e34b8d9f2a62dd87c337ce5c339096d9447ac1b896d59c61086feb28a562d3a1</code></p>
<table border="1" cellpadding="5" cellspacing="0">
<tr><th>Acceptable Timestamps (UTC+8)</th><th>Corresponding HMACs</th></tr>
<tr><td>2025 May 14 19:18</td><td><pre>5095247bb5829313d7ecc92a1fbb265c84e86a5c799c3cb211682708be19ca07</pre></td></tr>
<tr><td>2025 May 14 19:19</td><td><pre><strong>e34b8d9f2a62dd87c337ce5c339096d9447ac1b896d59c61086feb28a562d3a1</strong></pre></td></tr>
<tr><td>2025 May 14 19:20</td><td><pre>bca55ff9ff7d03ecd500d2e4dea64ca55f5706702ae5e220827ccac7172b1127</pre></td></tr>
</table>
<h2>SHA256 Online Tool</h2>
<p>You can use online tools like <a href="https://emn178.github.io/online-tools/sha256.html">=SHA256 Calculator</a> to compute the HMAC by inputting the HMAC_unhashed string.</p>
</body>
</html>
`;
}

export function get(req: IncomingMessage, res: ServerResponse) {
    teapotRoll(req, res);
    if (res.statusCode === 418) return; // teapot prank, do not show auth details
    res.writeHead(200, Object.assign({ 'Content-Type': 'text/html' }, corsHeadersFor('GET')));
    res.end(makeHTML());
}

export function options(req: IncomingMessage, res: ServerResponse) {
    // Reply to CORS preflight for /api/auth (GET allowed)
    res.writeHead(204, corsHeadersFor('OPTIONS'));
    res.end();
}