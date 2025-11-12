const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3002;

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    if (req.url === '/' || req.url === '/index.html') {
        // Serve the HTML stub
        fs.readFile(path.join(__dirname, 'server-stub.html'), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading page');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/health') {
        // Health check endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            port: PORT,
            uptime: process.uptime()
        }));
    } else if (req.url === '/api/status') {
        // API status endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            server: 'wDOI Test Server',
            port: PORT,
            status: 'running',
            timestamp: new Date().toISOString(),
            endpoints: {
                frontend: `http://45.83.141.11:3002`,
                backend: `http://45.83.141.11:3003`
            }
        }));
    } else {
        // 404 for other routes
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Simple server running on port ${PORT}`);
    console.log(`📱 Frontend stub: http://localhost:${PORT}`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Status API: http://localhost:${PORT}/api/status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});