import { IncomingMessage, ServerResponse } from 'http';
import { print } from '../utils/print';
import { getClientIP, isAuthorized } from './auth';
import { teapotRoll } from '../utils/teapot';
import { corsHeadersFor } from '../utils/cors';

// Simple health check handler returning JSON with IP
export function get(req: IncomingMessage, res: ServerResponse) {
    teapotRoll(req, res);
    if (res.statusCode === 418) return; // teapot prank, do not show health details
    const ip = getClientIP(req) || 'IP Not Found';
    const body = { 'IP Address': ip, 'Response': 'OK' };
    const json = JSON.stringify(body);
    print(`Received health check from ${ip}`);
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, corsHeadersFor('GET')));
    res.end(json);
}

// other methods
export async function post(req: IncomingMessage, res: ServerResponse) {
    const ip = getClientIP(req) || 'IP Not Found';
    print(`Received POST request on health endpoint from a bozo using this IP: ${ip}`);
    const authorized = await isAuthorized(req, res, process.env.GLOBAL_PASSWORD);
    if (!authorized) return; // isAuthorized already sent the response
    const body = { 'IP Address': ip, 'Message': 'Congratulations! Your played yourself XD' };
    const json = JSON.stringify(body);
    res.writeHead(405, Object.assign({ 'Content-Type': 'application/json' }, corsHeadersFor('POST')));
    res.end(json);
    return;
}

export function options(req: IncomingMessage, res: ServerResponse) {
    // Reply to CORS preflight for /api/health
    res.writeHead(204, corsHeadersFor('OPTIONS'));
    res.end();
}
