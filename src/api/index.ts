import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';

// simple router: map subpath to module in this folder
export function route(req: IncomingMessage, res: ServerResponse, subpath?: string) {
    // normalize subpath: '' or '/' -> 'health'
    let p = (subpath || '/').replace(/^\//, '');
    if (p === '') p = 'health';

    // only allow single-segment handlers for now
    const parts = p.split('/');
    const handlerName = parts[0];

    try {
        // require the handler module (compiled .js will be adjacent)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const handler = require(path.join(__dirname, handlerName));
        const method = (req.method || 'GET').toLowerCase();
        if (typeof handler[method] === 'function') {
            return handler[method](req, res);
        } else {
            res.writeHead(405, {'Content-Type': 'text/plain'});
            res.end('Method Not Allowed');
        }
    } catch (e) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found');
    }
}
