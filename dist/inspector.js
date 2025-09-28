import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { globalStoreFactory } from './storeFactory.js';
export function createInspectorServer(opts = {}) {
    const port = opts.port || 4000;
    const quiet = Boolean(opts.quiet);
    // mutable token value (can be updated via /set-token)
    let token = typeof opts.token === 'string' ? opts.token : undefined;
    const tokenFile = path.resolve(process.cwd(), '.fortistate-inspector-token');
    try {
        if (!token && fs.existsSync(tokenFile)) {
            const raw = fs.readFileSync(tokenFile, 'utf-8');
            try {
                token = JSON.parse(raw).token;
            }
            catch (e) { /* ignore */ }
        }
    }
    catch (e) { /* ignore */ }
    const allowOriginOption = typeof opts.allowOrigin === 'string' ? opts.allowOrigin : process.env.FORTISTATE_INSPECTOR_ALLOW_ORIGIN;
    const allowOriginStrict = Boolean(opts.allowOriginStrict || process.env.FORTISTATE_INSPECTOR_ALLOW_ORIGIN_STRICT === '1');
    let server = null;
    let wss = null;
    // stores registered remotely (from other processes / browser)
    const remoteStores = {};
    const persistFile = path.resolve(process.cwd(), '.fortistate-remote-stores.json');
    const base = path.dirname(fileURLToPath(import.meta.url));
    const clientHtml = fs.readFileSync(path.resolve(base, '..', 'examples', 'inspector-client.html'), 'utf-8');
    return {
        start: async () => {
            server = http.createServer((req, res) => {
                if (req.url === '/' || req.url === '/index.html') {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(clientHtml);
                    return;
                }
                // CORS preflight for register/change
                if (req.method === 'OPTIONS' && (req.url === '/register' || req.url === '/change')) {
                    const origin = req.headers.origin;
                    const headers = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, x-fortistate-token' };
                    if (allowOriginOption)
                        headers['Access-Control-Allow-Origin'] = allowOriginOption;
                    else if (origin)
                        headers['Access-Control-Allow-Origin'] = origin;
                    res.writeHead(204, headers);
                    res.end();
                    return;
                }
                // accept remote registrations and changes: POST /register { key, initial }
                if (req.method === 'POST' && req.url === '/register') {
                    let body = '';
                    req.on('data', (c) => (body += c.toString()));
                    req.on('end', () => {
                        // basic token/origin check
                        try {
                            const allowedOrigin = req.headers.origin;
                            // set CORS response header
                            if (allowOriginOption)
                                res.setHeader('Access-Control-Allow-Origin', allowOriginOption);
                            else if (allowedOrigin)
                                res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
                            if (token && req.headers['x-fortistate-token'] !== token) {
                                res.writeHead(403);
                                res.end('forbidden');
                                return;
                            }
                            // allow same-origin or no-origin (non-browser) only
                            if (allowedOrigin && allowedOrigin !== 'null' && typeof allowedOrigin === 'string') {
                                try {
                                    const url = new URL(allowedOrigin);
                                    // only accept http(s) origins
                                    if (!['http:', 'https:'].includes(url.protocol)) {
                                        res.writeHead(403);
                                        res.end('forbidden');
                                        return;
                                    }
                                }
                                catch (e) {
                                    res.writeHead(403);
                                    res.end('forbidden');
                                    return;
                                }
                            }
                            const p = JSON.parse(body || '{}');
                            if (p && p.key) {
                                remoteStores[p.key] = p.initial;
                                // persist
                                try {
                                    fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2));
                                }
                                catch (e) { /* ignore */ }
                                // notify connected clients
                                if (wss) {
                                    wss.clients.forEach((c) => {
                                        try {
                                            if (c.readyState === 1)
                                                c.send(JSON.stringify({ type: 'store:create', key: p.key, initial: p.initial }));
                                        }
                                        catch (e) { }
                                    });
                                }
                            }
                        }
                        catch (e) { /* ignore */ }
                        res.writeHead(200);
                        res.end('ok');
                    });
                    return;
                }
                // POST /change { key, value }
                if (req.method === 'POST' && req.url === '/change') {
                    let body = '';
                    req.on('data', (c) => (body += c.toString()));
                    req.on('end', () => {
                        try {
                            const allowedOrigin = req.headers.origin;
                            if (allowOriginOption)
                                res.setHeader('Access-Control-Allow-Origin', allowOriginOption);
                            else if (allowedOrigin)
                                res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
                            if (token && req.headers['x-fortistate-token'] !== token) {
                                res.writeHead(403);
                                res.end('forbidden');
                                return;
                            }
                            const p = JSON.parse(body || '{}');
                            if (p && p.key) {
                                remoteStores[p.key] = p.value;
                                try {
                                    fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2));
                                }
                                catch (e) { /* ignore */ }
                                if (wss) {
                                    wss.clients.forEach((c) => {
                                        try {
                                            if (c.readyState === 1)
                                                c.send(JSON.stringify({ type: 'store:change', key: p.key, value: p.value }));
                                        }
                                        catch (e) { }
                                    });
                                }
                            }
                        }
                        catch (e) { /* ignore */ }
                        res.writeHead(200);
                        res.end('ok');
                    });
                    return;
                }
                // dev helper: small UI + POST to set token (stored to .fortistate-inspector-token) if no token configured
                if (req.method === 'GET' && req.url === '/set-token') {
                    const html = `<!doctype html><html><body><h3>Set Fortistate Inspector Token (dev)</h3><form method="post" action="/set-token"><input name="token" placeholder="token"/><button type="submit">Set</button></form></body></html>`;
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(html);
                    return;
                }
                if (req.method === 'POST' && req.url === '/set-token') {
                    // allow setting token even if one exists — update in memory
                    let body = '';
                    req.on('data', (c) => (body += c.toString()));
                    req.on('end', () => {
                        try {
                            // support form-encoded or JSON body
                            let p = {};
                            try {
                                p = JSON.parse(body || '{}');
                            }
                            catch (e) {
                                // naive parse for form body like token=abc
                                const m = String(body).match(/token=([^&]+)/);
                                if (m)
                                    p = { token: decodeURIComponent(m[1]) };
                            }
                            if (p && p.token && typeof p.token === 'string') {
                                // update in-memory token and persist
                                token = p.token;
                                try {
                                    fs.writeFileSync(tokenFile, JSON.stringify({ token }));
                                }
                                catch (e) { /* ignore */ }
                                res.writeHead(200);
                                res.end('ok');
                                return;
                            }
                        }
                        catch (e) { /* ignore */ }
                        res.writeHead(400);
                        res.end('bad');
                    });
                    return;
                }
                // expose current remote stores (for client to fetch and render)
                if (req.method === 'GET' && req.url === '/remote-stores') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(remoteStores));
                    return;
                }
                res.writeHead(404);
                res.end('Not found');
            });
            // attempt to load persisted remote stores
            try {
                if (fs.existsSync(persistFile)) {
                    const raw = fs.readFileSync(persistFile, 'utf-8');
                    try {
                        Object.assign(remoteStores, JSON.parse(raw || '{}'));
                    }
                    catch (e) { /* ignore */ }
                }
            }
            catch (e) { /* ignore */ }
            wss = new WebSocketServer({ server });
            wss.on('connection', (ws) => {
                try {
                    ws.send(JSON.stringify({ type: 'hello', version: 1 }));
                }
                catch (e) { /* ignore */ }
                // send snapshot of current stores
                try {
                    const keys = globalStoreFactory.keys();
                    const snapshot = {};
                    for (const k of keys) {
                        const st = globalStoreFactory.get(k);
                        if (st)
                            snapshot[k] = st.get();
                    }
                    // include any remote-registered stores
                    for (const rk of Object.keys(remoteStores)) {
                        snapshot[rk] = remoteStores[rk];
                    }
                    ws.send(JSON.stringify({ type: 'snapshot', stores: snapshot }));
                }
                catch (e) { /* ignore */ }
                // respond to explicit snapshot requests to help test determinism
                ws.on('message', (msg) => {
                    // minimal debug log
                    // (silent in CI)
                    try {
                        if (String(msg) === 'req:snapshot') {
                            const keys = globalStoreFactory.keys();
                            const snapshot = {};
                            for (const k of keys) {
                                const st = globalStoreFactory.get(k);
                                if (st)
                                    snapshot[k] = st.get();
                            }
                            // include remote stores in explicit snapshot responses
                            for (const rk of Object.keys(remoteStores)) {
                                snapshot[rk] = remoteStores[rk];
                            }
                            try {
                                // (silent in CI)
                                ws.send(JSON.stringify({ type: 'snapshot', stores: snapshot }));
                            }
                            catch (e) { }
                        }
                    }
                    catch (e) { /* ignore */ }
                });
                // (silent in CI)
            });
            const unsubCreate = globalStoreFactory.subscribeCreate((key, initial) => {
                if (!wss)
                    return;
                wss.clients.forEach((c) => {
                    try {
                        if (c.readyState === 1)
                            c.send(JSON.stringify({ type: 'store:create', key, initial }));
                    }
                    catch (e) { /* ignore */ }
                });
            });
            const unsubChange = globalStoreFactory.subscribeChange((key, value) => {
                if (!wss)
                    return;
                wss.clients.forEach((c) => {
                    try {
                        if (c.readyState === 1)
                            c.send(JSON.stringify({ type: 'store:change', key, value }));
                    }
                    catch (e) { /* ignore */ }
                });
            });
            wss._unsubCreate = unsubCreate;
            wss._unsubChange = unsubChange;
            await new Promise((resolve) => server.listen(port, () => resolve()));
            if (!quiet) {
                // eslint-disable-next-line no-console
                console.log('[fortistate][inspector] listening http://localhost:' + port);
            }
        },
        stop: async () => {
            if (!server || !wss)
                return;
            try {
                const unsubCreate = wss._unsubCreate;
                const unsubChange = wss._unsubChange;
                if (typeof unsubCreate === 'function')
                    unsubCreate();
                if (typeof unsubChange === 'function')
                    unsubChange();
            }
            catch (e) { /* ignore */ }
            // terminate active client sockets first to avoid server close hang
            try {
                wss.clients.forEach((c) => {
                    try {
                        // terminate is more forceful than close; ensure socket is closed
                        if (typeof c.terminate === 'function')
                            c.terminate();
                        else if (typeof c.close === 'function')
                            c.close();
                    }
                    catch (e) { /* ignore */ }
                });
            }
            catch (e) { /* ignore */ }
            await new Promise((r) => wss.close(() => r(undefined)));
            await new Promise((r) => server.close(() => r(undefined)));
            server = null;
            wss = null;
        }
    };
}
export default createInspectorServer;
