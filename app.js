/**
 * This app.js file is the entry point for the Node.js server provided by cPanel's Node.js hosting.
 * It is expected to serve both the frontend static files and the backend API routes.
 */

var http = require('http');
var fs = require('fs');
var path = require('path');
const print = require('./src/utils/print.js').print;

print('Start running app.js ... ');

// Attempt to load the timestamp function from time.js or time.ts, with fallback
var contentTypes = {
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

function sendFile(res, filePath, statusCode) {
    fs.readFile(filePath, function(err, data) {
        if (err) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
            return;
        }
        var ext = path.extname(filePath).toLowerCase();
        var ct = contentTypes[ext] || 'application/octet-stream';
        res.writeHead(statusCode || 200, {'Content-Type': ct});
        res.end(data);
    });
}

var server = http.createServer(function(req, res) {
    // `req.url` may be a path-only string; provide a base so `new URL` can parse it.
    var base = 'http://localhost';
    var parsed = new URL(req.url || '/', base);
    var pathname = decodeURIComponent(parsed.pathname || '/');

    // Normalize and prevent directory traversal
    pathname = pathname.replace(/\/+$/, ''); // remove trailing slash
    if (pathname === '') pathname = '/';

    // base directory is the directory where this script lives
    var baseDir = __dirname;

    // Helper to resolve within baseDir
    function resolveInBase(p) {
        return path.normalize(path.join(baseDir, p));
    }

    // If root or empty, serve index.html
    if (pathname === '/' ) {
        var indexPath = resolveInBase('index.html');
        if (fs.existsSync(indexPath)) {
            sendFile(res, indexPath, 200);
            return;
        }
    }

    // Strip leading slash for file resolution
    var requestPath = pathname.replace(/^\//, '');

    // 1) If exact file (including extension) exists, serve it
    var exactPath = resolveInBase(requestPath);
    if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
        sendFile(res, exactPath, 200);
        return;
    }

    // 2) If requested path has no extension, try with .html appended
    if (!path.extname(requestPath)) {
        var htmlPath = resolveInBase(requestPath + '.html');
        if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
            sendFile(res, htmlPath, 200);
            return;
        }
    }

    // 3) Not found — serve 404.html if present, otherwise plain 404
    var notFoundPath = resolveInBase('404.html');
    if (fs.existsSync(notFoundPath) && fs.statSync(notFoundPath).isFile()) {
        sendFile(res, notFoundPath, 404);
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('404 Not Found');
    }
});

var port = process.env.PORT;

print('Server setup complete, starting to listen on port ' + String(port) + ' ...');

server.listen(port, function() {
    print('Server started successfully! ', end='');
    print('Listening on Port ' + String(port));
    print('If you see this in your own console, feel free to Ctrl+C to stop the server!');
});