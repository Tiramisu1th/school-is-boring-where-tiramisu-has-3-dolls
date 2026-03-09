// app.js (alias of server.js for cPanel Node startup)
const express = require('express');
const { join } = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || process.env.NODE_PORT || 3000;
const OUT_DIR = join(__dirname, 'out');

app.use('/api', createProxyMiddleware({
    target: process.env.INTERNAL_API_BASE || 'http://127.0.0.1:3120',
    changeOrigin: true,
    logLevel: 'warn'
}));

app.use(express.static(OUT_DIR));

const fs = require('fs');

app.get('*', (req, res) => {
    try {
        let reqPath = req.path || '/';
        if (reqPath.endsWith('/') && reqPath !== '/') reqPath = reqPath.slice(0, -1);

        if (reqPath === '/') {
            return res.sendFile(join(OUT_DIR, 'index.html'));
        }

        const htmlFile = join(OUT_DIR, reqPath + '.html');
        if (fs.existsSync(htmlFile)) {
            return res.sendFile(htmlFile);
        }

        const notFound = join(OUT_DIR, '404.html');
        if (fs.existsSync(notFound)) {
            return res.status(404).sendFile(notFound);
        }

        return res.status(404).send('404 Not Found');
    } catch (err) {
        console.error('Routing error:', err);
        return res.status(500).send('Server error');
    }
});

app.listen(PORT, () => {
    console.log(`Static server listening on ${PORT}`);
});
