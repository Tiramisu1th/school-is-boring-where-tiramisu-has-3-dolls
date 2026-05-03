import http from 'http';
import fs from 'fs';
import path from 'path';
import print from './src/utils/print';
import 'dotenv/config';

print('Start running app.js ... ');

const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.cpp': 'text/plain',
    '.py': 'text/plain',
    '.txt': 'text/plain'
};

function sendFile(res: http.ServerResponse, filePath: string, statusCode?: number) {
    fs.readFile(filePath, function (err, data) {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const ct = contentTypes[ext] || 'application/octet-stream';
        res.writeHead(statusCode || 200, { 'Content-Type': ct });
        res.end(data);
    });
}

const server = http.createServer(function (req: http.IncomingMessage, res: http.ServerResponse) {
    const base = 'http://localhost';
    const parsed = new URL(req.url || '/', base);
    let pathname = decodeURIComponent(parsed.pathname || '/');

    pathname = pathname.replace(/\/\/+$/, '');
    if (pathname === '') pathname = '/';
    // remove a single trailing slash for non-root paths so "/index/" and
    // "/index.html/" normalize to "/index" and "/index.html"
    if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }

    const baseDir = __dirname;

    if (pathname === '/api' || pathname.startsWith('/api/')) {
        try {
            const api = require('./src/api/router');
            const sub = pathname === '/api' ? '/' : pathname.replace(/^\/api/, '');
            api.route(req, res, sub);
            return;
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('API Error');
            return;
        }
    }

    function resolveInBase(p: string) {
        return path.normalize(path.join(baseDir, p));
    }

    if (pathname === '/') {
        const indexPath = resolveInBase('index.html');
        if (fs.existsSync(indexPath)) {
            sendFile(res, indexPath, 200);
            return;
        }
    }

    const requestPath = pathname.replace(/^\//, '');

    const exactPath = resolveInBase(requestPath);
    if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
        sendFile(res, exactPath, 200);
        return;
    }

    if (!path.extname(requestPath)) {
        const htmlPath = resolveInBase(requestPath + '.html');
        if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
            sendFile(res, htmlPath, 200);
            return;
        }
    }

    const notFoundPath = resolveInBase('404.html');
    if (fs.existsSync(notFoundPath) && fs.statSync(notFoundPath).isFile()) {
        sendFile(res, notFoundPath, 404);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

const port = process.env.PORT;

print('Server setup complete, starting to listen on port ' + String(port) + ' ...');

server.listen(Number(port), function () {
    print('Server started successfully! ', '');
    print(`Listening on port ${port}`);
    print(`To access the server, open http://localhost:${port} in your browser.`);
    print('If you see this in your own console, feel free to Ctrl+C to stop the server!');
});
