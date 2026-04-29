import { IncomingMessage, ServerResponse } from 'http';
import { print } from '../utils/print';
import { getClientIP } from './auth';

// Simple health check handler returning JSON with IP
export function get(req: IncomingMessage, res: ServerResponse) {
    const ip = getClientIP(req) || 'IP Not Found';
    const body = { 'IP Address': ip, 'Response': 'OK' };
    const json = JSON.stringify(body);
    print(`Received health check from ${ip}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(json);
}

// other methods
export function post(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
}
