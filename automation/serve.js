const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8140);
const host = '127.0.0.1';
const mime = {
  '.html': 'text/html;charset=utf-8',
  '.js': 'application/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.json': 'application/json;charset=utf-8',
};

const server = http.createServer((req, res) => {
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  const target = path.join(root, raw === '/' ? 'index.html' : raw);
  if (!target.startsWith(root)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root}`);
  console.log(`Play:  http://${host}:${port}/index.html`);
  console.log(`Tests: http://${host}:${port}/tests.html`);
});
