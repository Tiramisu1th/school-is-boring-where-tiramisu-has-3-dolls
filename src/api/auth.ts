import { IncomingMessage } from 'http';

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
