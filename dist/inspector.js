import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { spawn, spawnSync } from 'child_process';
import { globalStoreFactory } from './storeFactory.js';
import inspectorClientHtml from './client/inspectorClient.js';
import { applyPreset, listPresets, listPresetObjects, installPresetCss } from './presets.js';
import { duplicateStore, swapStores, moveStore } from './stateUtils.js';
export function createInspectorServer(opts = {}) {
    const port = opts.port || 4000;
    const quiet = Boolean(opts.quiet);
    const host = typeof opts.host === 'string' ? opts.host : undefined;
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
    // prefer embedded module HTML; if devClient option (or env) is enabled prefer the examples copy
    const devClientEnabled = Boolean(opts.devClient) || process.env.FORTISTATE_INSPECTOR_DEV_CLIENT === '1';
    let clientHtml = inspectorClientHtml;
    if (devClientEnabled) {
        try {
            const devCopy = path.resolve(base, '..', 'examples', 'inspector-client.html');
            if (fs.existsSync(devCopy))
                clientHtml = fs.readFileSync(devCopy, 'utf-8');
        }
        catch (e) { /* ignore */ }
    }
    return {
        start: async () => {
            server = http.createServer((req, res) => {
                // helper to attempt opening an editor at line + column
                const attemptOpenInEditor = (targetPath, lineNum, colNum) => {
                    try {
                        const target = path.resolve(process.cwd(), targetPath);
                        const pos = typeof colNum === 'number' ? `${lineNum}:${colNum}` : `${lineNum}`;
                        let codeAvailable = false;
                        try {
                            const s = spawnSync('code', ['--version'], { stdio: 'ignore', timeout: 1000 });
                            codeAvailable = !s.error;
                        }
                        catch (e) {
                            codeAvailable = false;
                        }
                        const vscodeUrl = `vscode://file/${target}:${lineNum}:${colNum || 1}`;
                        if (codeAvailable) {
                            try {
                                const child = spawn('code', ['--goto', `${target}:${pos}`], { stdio: 'ignore', detached: true });
                                child.on('error', () => { });
                                child.unref();
                                return { opened: true, method: 'code' };
                            }
                            catch (e) { /* ignore */ }
                        }
                        // try common windows exe or URL-scheme fallback
                        if (process.platform === 'win32') {
                            const candidates = [
                                path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
                                path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
                                path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft VS Code', 'Code.exe')
                            ];
                            for (const exe of candidates) {
                                try {
                                    if (exe && fs.existsSync(exe)) {
                                        const c = spawn(exe, ['--goto', `${target}:${pos}`], { stdio: 'ignore', detached: true });
                                        c.on('error', () => { });
                                        c.unref();
                                        return { opened: true, method: exe };
                                    }
                                }
                                catch (e) { }
                            }
                            try {
                                const c = spawn('cmd', ['/c', 'start', '', vscodeUrl], { stdio: 'ignore', detached: true });
                                c.on('error', () => { });
                                c.unref();
                                return { opened: true, method: 'vscode-url' };
                            }
                            catch (e) { }
                        }
                        else if (process.platform === 'darwin') {
                            try {
                                const c = spawn('open', [vscodeUrl], { stdio: 'ignore', detached: true });
                                c.on('error', () => { });
                                c.unref();
                                return { opened: true, method: 'open' };
                            }
                            catch (e) { }
                        }
                        else {
                            try {
                                const c = spawn('xdg-open', [vscodeUrl], { stdio: 'ignore', detached: true });
                                c.on('error', () => { });
                                c.unref();
                                return { opened: true, method: 'xdg-open' };
                            }
                            catch (e) { }
                        }
                    }
                    catch (e) { /* ignore */ }
                    return { opened: false };
                };
                if (req.url === '/' || req.url === '/index.html') {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(clientHtml);
                    return;
                }
                // serve favicon if present in project root or bundled client
                if (req.url === '/favicon.ico') {
                    try {
                        const favFromCwd = path.resolve(process.cwd(), 'favicon.ico');
                        if (fs.existsSync(favFromCwd)) {
                            const buf = fs.readFileSync(favFromCwd);
                            res.writeHead(200, { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' });
                            res.end(buf);
                            return;
                        }
                    }
                    catch (e) { /* ignore */ }
                    try {
                        const packaged = path.resolve(base, 'client', 'favicon.ico');
                        if (fs.existsSync(packaged)) {
                            const buf = fs.readFileSync(packaged);
                            res.writeHead(200, { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' });
                            res.end(buf);
                            return;
                        }
                    }
                    catch (e) { /* ignore */ }
                    res.writeHead(404);
                    res.end();
                    return;
                }
                // serve a small phone-friendly page to register a test store
                if (req.method === 'GET' && req.url === '/phone-register') {
                    try {
                        // prefer examples copy so it's editable during development
                        const phoneHtmlPath = path.resolve(base, '..', 'examples', 'phone-register.html');
                        if (fs.existsSync(phoneHtmlPath)) {
                            const html = fs.readFileSync(phoneHtmlPath, 'utf-8');
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(html);
                            return;
                        }
                    }
                    catch (e) { /* ignore */ }
                }
                // small helper to set CORS headers consistently
                const setCors = (allowedOrigin) => {
                    // allowOriginOption may be '*' to allow all origins
                    if (allowOriginOption === '*') {
                        res.setHeader('Access-Control-Allow-Origin', '*');
                    }
                    else {
                        const origin = allowedOrigin || req.headers.origin || allowOriginOption;
                        if (origin)
                            res.setHeader('Access-Control-Allow-Origin', origin);
                        // when a specific origin is used, allow credentials (useful for some clients)
                        if (origin)
                            res.setHeader('Access-Control-Allow-Credentials', 'true');
                    }
                    // allow common headers used by the inspector UI
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-fortistate-token');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                };
                // CORS preflight for register/change
                if (req.method === 'OPTIONS' && (req.url === '/register' || req.url === '/change')) {
                    setCors();
                    res.writeHead(204);
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
                            // debug log incoming registration attempts
                            try {
                                console.log('[fortistate][inspector] POST /register from', req.headers.origin || req.socket.remoteAddress);
                            }
                            catch (e) { }
                            const allowedOrigin = req.headers.origin;
                            // set CORS response header
                            setCors(allowedOrigin);
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
                                // also create or set the store in the shared runtime so
                                // clients using the global factory receive the update
                                try {
                                    const existing = globalStoreFactory.get(p.key);
                                    if (existing)
                                        existing.set(p.initial);
                                    else
                                        globalStoreFactory.create(p.key, { value: p.initial });
                                }
                                catch (e) { /* ignore */ }
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
                            try {
                                console.log('[fortistate][inspector] POST /change from', req.headers.origin || req.socket.remoteAddress);
                            }
                            catch (e) { }
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
                                // also apply the change to the shared runtime store so
                                // normalization and subscriptions run as expected
                                try {
                                    const existing = globalStoreFactory.get(p.key);
                                    if (existing)
                                        existing.set(p.value);
                                    else
                                        globalStoreFactory.create(p.key, { value: p.value });
                                }
                                catch (e) { /* ignore */ }
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
                    // allow cross-origin access so the embedded inspector client
                    // can fetch persisted stores when loaded from a different origin
                    const allowedOrigin = req.headers.origin;
                    setCors(allowedOrigin);
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(200);
                    res.end(JSON.stringify(remoteStores));
                    return;
                }
                // list available presets (name + description)
                if (req.method === 'GET' && req.url === '/presets') {
                    try {
                        setCors();
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(200);
                        // listPresetObjects returns {name, description}
                        res.end(JSON.stringify(listPresets === undefined ? [] : (listPresetObjects ? listPresetObjects() : listPresets())));
                        return;
                    }
                    catch (e) {
                        res.writeHead(500);
                        res.end('error');
                        return;
                    }
                }
                // debug helper to inspect runtime state (safe for local dev)
                if (req.method === 'GET' && req.url === '/debug') {
                    try {
                        setCors();
                        const clients = [];
                        if (wss) {
                            wss.clients.forEach((c) => {
                                try {
                                    const info = { readyState: c.readyState };
                                    if (c._socket && c._socket.remoteAddress)
                                        info.remoteAddress = c._socket.remoteAddress;
                                    clients.push(info);
                                }
                                catch (e) { /* ignore */ }
                            });
                        }
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(200);
                        res.end(JSON.stringify({ remoteStores, wsClients: clients.length, clients }));
                        return;
                    }
                    catch (e) { /* ignore */ }
                }
                // CORS preflight for preset/state endpoints
                if (req.method === 'OPTIONS' && (req.url === '/apply-preset' || req.url === '/duplicate-store' || req.url === '/swap-stores' || req.url === '/move-store')) {
                    setCors();
                    res.writeHead(204);
                    res.end();
                    return;
                }
                // apply a preset: POST /apply-preset { name, targetKey? }
                if (req.method === 'POST' && req.url === '/apply-preset') {
                    let body = '';
                    req.on('data', (c) => (body += c.toString()));
                    req.on('end', () => {
                        try {
                            const allowedOrigin = req.headers.origin;
                            setCors(allowedOrigin);
                            if (token && req.headers['x-fortistate-token'] !== token) {
                                res.writeHead(403);
                                res.end('forbidden');
                                return;
                            }
                            const p = JSON.parse(body || '{}');
                            if (!p || !p.name) {
                                res.writeHead(400);
                                res.end('bad');
                                return;
                            }
                            const result = applyPreset(p.name, p.targetKey);
                            // optionally install preset CSS into the current working directory
                            if (p.installCss) {
                                try {
                                    installPresetCss(p.name, process.cwd(), { overwrite: false });
                                }
                                catch (e) { /* ignore */ }
                            }
                            // notify WS clients
                            if (wss) {
                                wss.clients.forEach((c) => {
                                    var _a;
                                    try {
                                        if (c.readyState === 1)
                                            c.send(JSON.stringify({ type: 'store:create', key: result.key, initial: (_a = globalStoreFactory.get(result.key)) === null || _a === void 0 ? void 0 : _a.get() }));
                                    }
                                    catch (e) { }
                                });
                            }
                            res.setHeader('Content-Type', 'application/json');
                            res.writeHead(200);
                            res.end(JSON.stringify(result));
                            return;
                        }
                        catch (e) {
                            res.writeHead(500);
                            res.end('error');
                            return;
                        }
                    });
                    return;
                }
                // duplicate store: POST /duplicate-store { sourceKey, destKey }
                if (req.method === 'POST' && req.url === '/duplicate-store') {
                    let body = '';
                    req.on('data', (c) => (body += c.toString()));
                    req.on('end', () => {
                        try {
                            const allowedOrigin = req.headers.origin;
                            setCors(allowedOrigin);
                            if (token && req.headers['x-fortistate-token'] !== token) {
                                res.writeHead(403);
                                res.end('forbidden');
                                return;
                            }
                            const p = JSON.parse(body || '{}');
                            if (!p || !p.sourceKey || !p.destKey) {
                                res.writeHead(400);
                                res.end('bad');
                                return;
                            }
                            duplicateStore(p.sourceKey, p.destKey);
                            // notify WS clients
                            if (wss) {
                                wss.clients.forEach((c) => {
                                    var _a;
                                    try {
                                        if (c.readyState === 1)
                                            c.send(JSON.stringify({ type: 'store:create', key: p.destKey, initial: (_a = globalStoreFactory.get(p.destKey)) === null || _a === void 0 ? void 0 : _a.get() }));
                                    }
                                    catch (e) { }
                                });
                            }
                            res.writeHead(200);
                            res.end('ok');
                            return;
                        }
                        catch (e) {
                            res.writeHead(500);
                            res.end('error');
                            return;
                        }
                    });
                    return;
                }
                // swap stores: POST /swap-stores { keyA, keyB }
                if (req.method === 'POST' && req.url === '/swap-stores') {
                    let body = '';
                    req.on('data', (c) => (body += c.toString()));
                    req.on('end', () => {
                        try {
                            const allowedOrigin = req.headers.origin;
                            setCors(allowedOrigin);
                            if (token && req.headers['x-fortistate-token'] !== token) {
                                res.writeHead(403);
                                res.end('forbidden');
                                return;
                            }
                            const p = JSON.parse(body || '{}');
                            if (!p || !p.keyA || !p.keyB) {
                                res.writeHead(400);
                                res.end('bad');
                                return;
                            }
                            swapStores(p.keyA, p.keyB);
                            // notify WS clients
                            if (wss) {
                                wss.clients.forEach((c) => {
                                    var _a, _b;
                                    try {
                                        if (c.readyState === 1) {
                                            c.send(JSON.stringify({ type: 'store:change', key: p.keyA, value: (_a = globalStoreFactory.get(p.keyA)) === null || _a === void 0 ? void 0 : _a.get() }));
                                            c.send(JSON.stringify({ type: 'store:change', key: p.keyB, value: (_b = globalStoreFactory.get(p.keyB)) === null || _b === void 0 ? void 0 : _b.get() }));
                                        }
                                    }
                                    catch (e) { }
                                });
                            }
                            res.writeHead(200);
                            res.end('ok');
                            return;
                        }
                        catch (e) {
                            res.writeHead(500);
                            res.end('error');
                            return;
                        }
                    });
                    return;
                }
                // move store: POST /move-store { oldKey, newKey }
                if (req.method === 'POST' && req.url === '/move-store') {
                    let body = '';
                    req.on('data', (c) => (body += c.toString()));
                    req.on('end', () => {
                        try {
                            const allowedOrigin = req.headers.origin;
                            setCors(allowedOrigin);
                            if (token && req.headers['x-fortistate-token'] !== token) {
                                res.writeHead(403);
                                res.end('forbidden');
                                return;
                            }
                            const p = JSON.parse(body || '{}');
                            if (!p || !p.oldKey || !p.newKey) {
                                res.writeHead(400);
                                res.end('bad');
                                return;
                            }
                            moveStore(p.oldKey, p.newKey);
                            // notify WS clients
                            if (wss) {
                                wss.clients.forEach((c) => {
                                    var _a;
                                    try {
                                        if (c.readyState === 1) {
                                            c.send(JSON.stringify({ type: 'store:create', key: p.newKey, initial: (_a = globalStoreFactory.get(p.newKey)) === null || _a === void 0 ? void 0 : _a.get() }));
                                            // optionally notify old key removal, but since we don't have delete, just change to null
                                            c.send(JSON.stringify({ type: 'store:change', key: p.oldKey, value: null }));
                                        }
                                    }
                                    catch (e) { }
                                });
                            }
                            res.writeHead(200);
                            res.end('ok');
                            return;
                        }
                        catch (e) {
                            res.writeHead(500);
                            res.end('error');
                            return;
                        }
                    });
                    return;
                }
                // CORS preflight for open-source as well
                if (req.method === 'OPTIONS' && req.url === '/open-source') {
                    setCors();
                    res.writeHead(204);
                    res.end();
                    return;
                }
                // CORS preflight for locate-source (GET from browser clients)
                if (req.method === 'OPTIONS' && req.url === '/locate-source') {
                    setCors();
                    res.writeHead(204);
                    res.end();
                    return;
                }
                // open a file in an editor on the host machine (opt-in)
                if (req.method === 'POST' && req.url === '/open-source') {
                    let body = '';
                    req.on('data', (c) => (body += c.toString()));
                    req.on('end', () => {
                        try {
                            // allow CORS response
                            const allowedOrigin = req.headers.origin;
                            setCors(allowedOrigin);
                            if (token && req.headers['x-fortistate-token'] !== token) {
                                res.writeHead(403);
                                res.end('forbidden');
                                return;
                            }
                            const allowOpen = Boolean(opts && opts.allowOpen) || process.env.FORTISTATE_INSPECTOR_ALLOW_OPEN === '1';
                            if (!allowOpen) {
                                res.writeHead(403);
                                res.end('open-not-allowed');
                                return;
                            }
                            const p = JSON.parse(body || '{}');
                            if (!p || !p.path) {
                                res.writeHead(400);
                                res.end('bad');
                                return;
                            }
                            const target = path.resolve(process.cwd(), p.path);
                            const line = typeof p.line === 'number' ? p.line : 1;
                            try {
                                // prefer to run the `code` CLI if available
                                let codeAvailable = false;
                                try {
                                    const s = spawnSync('code', ['--version'], { stdio: 'ignore', timeout: 1000 });
                                    // spawnSync returns an error property if it failed to spawn
                                    codeAvailable = !s.error;
                                }
                                catch (e) {
                                    codeAvailable = false;
                                }
                                const vscodeUrl = `vscode://file/${target}:${line}`;
                                if (codeAvailable) {
                                    const cmd = 'code';
                                    const args = ['--goto', `${target}:${line}`];
                                    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
                                    // attach error handler so a missing binary doesn't crash the server
                                    child.on('error', (err) => {
                                        try {
                                            // fallback to URL-scheme open
                                            if (process.platform === 'win32') {
                                                const c = spawn('cmd', ['/c', 'start', '', vscodeUrl], { stdio: 'ignore', detached: true });
                                                c.on('error', () => { });
                                                c.unref();
                                            }
                                            else if (process.platform === 'darwin') {
                                                const c = spawn('open', [vscodeUrl], { stdio: 'ignore', detached: true });
                                                c.on('error', () => { });
                                                c.unref();
                                            }
                                            else {
                                                const c = spawn('xdg-open', [vscodeUrl], { stdio: 'ignore', detached: true });
                                                c.on('error', () => { });
                                                c.unref();
                                            }
                                        }
                                        catch (e) { /* ignore fallback errors */ }
                                    });
                                    child.unref();
                                    res.writeHead(200);
                                    res.end('ok');
                                    return;
                                }
                                // if `code` CLI isn't available, on Windows try common exe install paths
                                try {
                                    if (process.platform === 'win32') {
                                        const candidates = [
                                            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
                                            path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
                                            path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft VS Code', 'Code.exe'),
                                            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code Insiders', 'Code - Insiders.exe'),
                                        ];
                                        let launched = false;
                                        for (const exe of candidates) {
                                            try {
                                                if (!exe)
                                                    continue;
                                                if (fs.existsSync(exe)) {
                                                    const c = spawn(exe, ['--goto', `${target}:${line}`], { stdio: 'ignore', detached: true });
                                                    c.on('error', () => { });
                                                    c.unref();
                                                    launched = true;
                                                    break;
                                                }
                                            }
                                            catch (e) { /* ignore */ }
                                        }
                                        if (!launched) {
                                            const c = spawn('cmd', ['/c', 'start', '', vscodeUrl], { stdio: 'ignore', detached: true });
                                            c.on('error', () => { });
                                            c.unref();
                                        }
                                    }
                                    else if (process.platform === 'darwin') {
                                        const c = spawn('open', [vscodeUrl], { stdio: 'ignore', detached: true });
                                        c.on('error', () => { });
                                        c.unref();
                                    }
                                    else {
                                        const c = spawn('xdg-open', [vscodeUrl], { stdio: 'ignore', detached: true });
                                        c.on('error', () => { });
                                        c.unref();
                                    }
                                    res.writeHead(200);
                                    res.end(JSON.stringify({ path: target, line, opened: 'vscode-url-fallback' }));
                                    return;
                                }
                                catch (e) {
                                    // nothing worked — return helpful JSON so the UI can show instructions
                                    res.writeHead(200);
                                    res.end(JSON.stringify({ path: target, line, opened: false, message: "Could not spawn editor. Ensure VSCode is installed and the code CLI is on PATH (install the 'code' command in PATH) or your system supports the vscode:// URL scheme." }));
                                    return;
                                }
                            }
                            catch (e) {
                                res.writeHead(500);
                                res.end('error');
                                return;
                            }
                        }
                        catch (e) {
                            res.writeHead(500);
                            res.end('error');
                            return;
                        }
                    });
                    return;
                }
                // locate source files that reference a store key (help IDE links)
                if (req.method === 'GET' && req.url && req.url.startsWith('/locate-source')) {
                    try {
                        const u = new URL(req.url, 'http://localhost');
                        const key = String(u.searchParams.get('key') || '');
                        const results = [];
                        const shouldAutoOpen = String(u.searchParams.get('open') || '') === '1';
                        if (key) {
                            // set CORS response header for browser callers
                            const origin = req.headers.origin;
                            setCors(origin);
                            const searchRoot = process.cwd();
                            const exts = ['.ts', '.tsx', '.js', '.jsx', '.vue'];
                            // skip build and vendor folders
                            const skipDirs = ['node_modules', '.git', 'dist', '.next', 'build', 'out', 'public'];
                            const maxResults = 10;
                            const ctx = 2; // lines of context around the matched line
                            const walk = (dir) => {
                                let entries = [];
                                try {
                                    entries = fs.readdirSync(dir);
                                }
                                catch (e) {
                                    return;
                                }
                                for (const name of entries) {
                                    try {
                                        const full = path.join(dir, name);
                                        const stat = fs.statSync(full);
                                        if (stat.isDirectory()) {
                                            if (skipDirs.includes(name))
                                                continue;
                                            walk(full);
                                            if (results.length >= maxResults)
                                                return;
                                            continue;
                                        }
                                        const ext = path.extname(name);
                                        if (!exts.includes(ext))
                                            continue;
                                        const raw = fs.readFileSync(full, 'utf-8');
                                        const lines = raw.split(/\r?\n/);
                                        for (let i = 0; i < lines.length; i++) {
                                            const l = lines[i];
                                            if (l.includes(`createStore('${key}'`) || l.includes(`createStore("${key}"`) || l.includes(`useStore.${key}`) || l.includes(`getStore('${key}'`) || l.includes(`getStore("${key}"`) || new RegExp(`\\b${key}\\b`).test(l)) {
                                                // compute column (first occurrence index +1)
                                                const col = (l.indexOf(key) >= 0) ? l.indexOf(key) + 1 : undefined;
                                                // build a small preview: matched line +/- ctx lines
                                                const start = Math.max(0, i - ctx);
                                                const end = Math.min(lines.length - 1, i + ctx);
                                                const previewLines = [];
                                                for (let j = start; j <= end; j++) {
                                                    const prefix = (j === i) ? '>' : ' ';
                                                    previewLines.push(`${prefix} ${String(lines[j]).trim()}`);
                                                }
                                                results.push({ path: path.relative(searchRoot, full), line: i + 1, preview: previewLines.join('\n'), column: col });
                                                if (results.length >= maxResults)
                                                    return;
                                                break;
                                            }
                                        }
                                        // removed nested open-source handler (handled at top-level)
                                    }
                                    catch (e) { /* ignore file errors */ }
                                }
                            };
                            walk(searchRoot);
                        }
                        // if auto-open requested and allowed, attempt to open the first result in editor
                        if (shouldAutoOpen && results.length > 0) {
                            const first = results[0];
                            const allowOpen = Boolean(opts && opts.allowOpen) || process.env.FORTISTATE_INSPECTOR_ALLOW_OPEN === '1';
                            if (allowOpen) {
                                try {
                                    const openAttempt = attemptOpenInEditor(first.path, first.line, first.column);
                                    // annotate the response with open attempt
                                    first.openAttempt = openAttempt;
                                }
                                catch (e) { /* ignore */ }
                            }
                        }
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(200);
                        res.end(JSON.stringify(results));
                        return;
                    }
                    catch (e) {
                        // ignore and fallthrough
                    }
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
            await new Promise((resolve) => {
                if (host)
                    server.listen(port, host, () => resolve());
                else
                    server.listen(port, () => resolve());
            });
            if (!quiet) {
                // eslint-disable-next-line no-console
                const bindHost = host || 'localhost';
                console.log('[fortistate][inspector] listening http://' + bindHost + ':' + port);
                // print LAN IPs for phone testing
                try {
                    const os = await import('os');
                    const nets = os.networkInterfaces();
                    const ips = [];
                    for (const name of Object.keys(nets || {})) {
                        for (const ni of nets[name] || []) {
                            if (ni.family === 'IPv4' && !ni.internal)
                                ips.push(ni.address);
                        }
                    }
                    if (ips.length) {
                        console.log('[fortistate][inspector] Local IPs:');
                        for (const ip of ips)
                            console.log('  http://' + ip + ':' + port);
                        console.log("[fortistate][inspector] Tip: to connect from a phone use one of the above URLs and start the inspector with '--host 0.0.0.0' and '--allow-origin <origin>' or '--allow-origin *' to permit cross-origin calls.");
                    }
                }
                catch (e) { /* ignore network info errors */ }
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
