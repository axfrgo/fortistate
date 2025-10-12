#!/usr/bin/env node
// Minimal CLI scaffold for fortistate
import { fileURLToPath } from 'url';
import path from 'path';
import loadPlugins from './loader.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function main(argv = process.argv.slice(2)) {
    const cmd = argv[0] || 'help';
    if (cmd === 'help') {
        console.log('fortistate — CLI\n');
        console.log('Usage: fortistate <command> [options]\n');
        console.log('Commands:');
        console.log('  init                      Create an example fortistate.config.js');
        console.log('  dev [port] [--quiet]      Start experimental JIT dev server (WIP)');
        console.log('  inspect [port] [options]  Start inspector server');
        console.log('  session <action>          Manage inspector sessions');
        console.log('  load [cwd]                Load config/presets once for debugging\n');
        console.log('Inspect options:');
        console.log('  --token <token>           Provide a legacy shared token (for backward compat)');
        console.log('  --allow-origin <origin>   Allow CORS for an additional origin');
        console.log('  --allow-origin-strict     Only allow configured origins (no wildcard)');
        console.log('  --host <host>             Override host bind address (default 0.0.0.0)');
        console.log('  --dev-client              Load inspector UI from examples/inspector-client.html');
        console.log('  --quiet                   Reduce startup logging\n');
        console.log('Session commands:');
        console.log('  session create [--role <role>] [--label <label>] [--ttl <duration>]');
        console.log('                            Create a new session token');
        console.log('  session list              List all active sessions (requires admin token)');
        console.log('  session revoke <id|token> Revoke a session by ID or token (requires admin)\n');
        console.log('Environment variables:');
        console.log('  FORTISTATE_REQUIRE_SESSIONS=1   Require session tokens for write operations');
        console.log('  FORTISTATE_ALLOW_ANON_SESSIONS=1 Allow anonymous read-only access');
        console.log('  FORTISTATE_SESSION_SECRET=<key>  JWT signing key (persists tokens across restarts)');
        console.log('  FORTISTATE_SESSION_TTL=<duration> Default session lifespan (e.g., 1h, 7d)');
        console.log('  FORTISTATE_SESSION_MAX=<n>       Maximum concurrent sessions');
        console.log('  FORTISTATE_DEBUG=1               Log detailed auth/session events\n');
        console.log('Auth notes:');
        console.log('  Session-based auth is recommended for production or multi-user environments.');
        console.log('  Legacy --token flag exists for backward compat but is discouraged.');
        console.log('  See docs/AUTHENTICATION.md for comprehensive security guidance.\n');
        console.log('Examples:');
        console.log('  fortistate inspect --port 4000');
        console.log('  FORTISTATE_REQUIRE_SESSIONS=1 fortistate inspect');
        console.log('  fortistate session create --role editor --ttl 24h');
        console.log('  fortistate session list --port 4000 --token <admin-token>');
        return;
    }
    if (cmd === 'init') {
        // create a sample config in CWD
        const dest = path.resolve(process.cwd(), 'fortistate.config.js');
        const sample = `module.exports = { presets: [], plugins: [] }`;
        try {
            await import('fs/promises').then(fs => fs.writeFile(dest, sample, { flag: 'wx' }));
            console.log('Created', dest);
        }
        catch (err) {
            // err is unknown in TS; stringify safely
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            console.error('Could not create config:', (err && typeof err === 'object' && 'message' in err) ? err.message : String(err));
            process.exit(1);
        }
        return;
    }
    if (cmd === 'load') {
        const dir = argv[1] ? path.resolve(process.cwd(), argv[1]) : process.cwd();
        console.log('Loading plugins from', dir);
        try {
            const res = await loadPlugins(dir);
            console.log('plugins loaded:', res);
            process.exit(0);
        }
        catch (err) {
            console.error('Error loading plugins:', (err && typeof err === 'object' && 'message' in err) ? err.message : String(err));
            process.exit(1);
        }
    }
    if (cmd === 'dev') {
        // start jit dev server
        const { default: createJitServer } = await import('./jit-server.js');
        // parse optional flags: [port] and --quiet
        const port = argv[1] && !argv[1].startsWith('--') ? Number(argv[1]) : undefined;
        const quiet = argv.includes('--quiet');
        const jit = createJitServer({ port, quiet });
        await jit.start();
        console.log('Press Ctrl+C to stop');
        process.on('SIGINT', async () => {
            console.log('Stopping...');
            await jit.stop();
            process.exit(0);
        });
        return;
    }
    if (cmd === 'inspect') {
        const { default: createInspector } = await import('./inspector.js');
        const port = argv[1] && !argv[1].startsWith('--') ? Number(argv[1]) : undefined;
        const quiet = argv.includes('--quiet');
        const cwdFlagIndex = argv.indexOf('--cwd');
        const cwd = cwdFlagIndex >= 0 ? path.resolve(process.cwd(), argv[cwdFlagIndex + 1] || '.') : process.cwd();
        if (cwdFlagIndex >= 0) {
            // prevent downstream flag parsing from treating the cwd value as another flag
            argv.splice(cwdFlagIndex, 2);
        }
        // parse --token <token> and --allow-origin <origin> (can be repeated comma-separated)
        const tokenFlagIndex = argv.indexOf('--token');
        const token = tokenFlagIndex >= 0 ? argv[tokenFlagIndex + 1] : undefined;
        const allowOriginFlagIndex = argv.indexOf('--allow-origin');
        const allowOrigin = allowOriginFlagIndex >= 0 ? argv[allowOriginFlagIndex + 1] : undefined;
        const allowOriginStrict = argv.includes('--allow-origin-strict');
        const devClientFlagIndex = argv.indexOf('--dev-client');
        const devClient = devClientFlagIndex >= 0 || process.env.FORTISTATE_INSPECTOR_DEV_CLIENT === '1';
        const hostFlagIndex = argv.indexOf('--host');
        const host = hostFlagIndex >= 0 ? argv[hostFlagIndex + 1] : undefined;
        const requireSessions = process.env.FORTISTATE_REQUIRE_SESSIONS === '1';
        const allowAnonSessions = process.env.FORTISTATE_ALLOW_ANON_SESSIONS === '1';
        const srv = createInspector({ port, quiet, token, allowOrigin, allowOriginStrict, devClient, host, cwd });
        await srv.start();
        if (!quiet) {
            console.log('Inspector running - open http://localhost:' + (port || 4000));
            const authModes = [];
            if (requireSessions) {
                authModes.push(allowAnonSessions ? 'sessions optional (FORTISTATE_ALLOW_ANON_SESSIONS=1)' : 'sessions required');
            }
            else {
                authModes.push('sessions optional (FORTISTATE_REQUIRE_SESSIONS!=1)');
            }
            if (token)
                authModes.push('legacy token enabled');
            console.log('[fortistate][inspect] Auth mode:', authModes.join(' · '));
            if (!requireSessions && !token) {
                console.log('[fortistate][inspect] ⚠️  Open access mode — set FORTISTATE_REQUIRE_SESSIONS=1 for production.');
            }
            console.log('[fortistate][inspect] Tip: POST /session/create {"role":"editor"} to mint a session token.');
            console.log('[fortistate][inspect] Docs: docs/AUTHENTICATION.md for security best practices.');
        }
        process.on('SIGINT', async () => {
            await srv.stop();
            process.exit(0);
        });
        return;
    }
    if (cmd === 'session') {
        const action = argv[1];
        if (!action || !['create', 'list', 'revoke'].includes(action)) {
            console.error('Invalid session action. Use: create, list, or revoke');
            console.error('Run `fortistate help` for usage details.');
            process.exit(1);
        }
        const portFlagIndex = argv.indexOf('--port');
        const port = portFlagIndex >= 0 ? Number(argv[portFlagIndex + 1]) : 4000;
        const tokenFlagIndex = argv.indexOf('--token');
        const authToken = tokenFlagIndex >= 0 ? argv[tokenFlagIndex + 1] : undefined;
        const http = await import('http');
        const httpRequest = (opts) => {
            return new Promise((resolve, reject) => {
                const bodyStr = opts.body ? JSON.stringify(opts.body) : undefined;
                const headers = { 'Content-Type': 'application/json' };
                if (opts.token)
                    headers['x-fortistate-token'] = opts.token;
                const req = http.request({
                    hostname: '127.0.0.1',
                    port,
                    method: opts.method,
                    path: opts.path,
                    headers,
                }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk.toString(); });
                    res.on('end', () => { var _a; return resolve({ status: (_a = res.statusCode) !== null && _a !== void 0 ? _a : 0, body: data }); });
                });
                req.on('error', reject);
                req.setTimeout(5000, () => req.destroy(new Error('timeout')));
                if (bodyStr)
                    req.write(bodyStr);
                req.end();
            });
        };
        if (action === 'create') {
            const roleFlagIndex = argv.indexOf('--role');
            const role = roleFlagIndex >= 0 ? argv[roleFlagIndex + 1] : 'observer';
            const labelFlagIndex = argv.indexOf('--label');
            const label = labelFlagIndex >= 0 ? argv[labelFlagIndex + 1] : undefined;
            const ttlFlagIndex = argv.indexOf('--ttl');
            const expiresIn = ttlFlagIndex >= 0 ? argv[ttlFlagIndex + 1] : undefined;
            try {
                const res = await httpRequest({
                    method: 'POST',
                    path: '/session/create',
                    body: { role, label, expiresIn },
                    token: authToken,
                });
                if (res.status === 200) {
                    const payload = JSON.parse(res.body);
                    console.log('✅ Session created:');
                    console.log('  Role:', payload.session.role);
                    console.log('  ID:', payload.session.id);
                    console.log('  Token:', payload.token);
                    console.log('\nUse this token in requests:');
                    console.log(`  curl -H "x-fortistate-token: ${payload.token}" http://localhost:${port}/session/current`);
                }
                else {
                    console.error('❌ Failed to create session:', res.status, res.body);
                    process.exit(1);
                }
            }
            catch (err) {
                console.error('❌ Error creating session:', err);
                process.exit(1);
            }
            return;
        }
        if (action === 'list') {
            if (!authToken) {
                console.error('❌ --token <admin-token> is required to list sessions');
                process.exit(1);
            }
            try {
                const res = await httpRequest({
                    method: 'GET',
                    path: '/session/list',
                    token: authToken,
                });
                if (res.status === 200) {
                    const payload = JSON.parse(res.body);
                    console.log('Active sessions:', payload.sessions.length);
                    for (const session of payload.sessions) {
                        console.log(`  • ${session.id} — ${session.role} — expires ${new Date(session.expiresAt).toLocaleString()}`);
                    }
                }
                else {
                    console.error('❌ Failed to list sessions:', res.status, res.body);
                    process.exit(1);
                }
            }
            catch (err) {
                console.error('❌ Error listing sessions:', err);
                process.exit(1);
            }
            return;
        }
        if (action === 'revoke') {
            const target = argv[2];
            if (!target) {
                console.error('❌ Provide session ID or token to revoke');
                console.error('Usage: fortistate session revoke <id|token> --token <admin-token>');
                process.exit(1);
            }
            if (!authToken) {
                console.error('❌ --token <admin-token> is required to revoke sessions');
                process.exit(1);
            }
            const isToken = target.includes('.');
            const body = isToken ? { token: target } : { sessionId: target };
            try {
                const res = await httpRequest({
                    method: 'POST',
                    path: '/session/revoke',
                    body,
                    token: authToken,
                });
                if (res.status === 200) {
                    const payload = JSON.parse(res.body);
                    console.log('✅ Session revoked:', payload.sessionId);
                }
                else {
                    console.error('❌ Failed to revoke session:', res.status, res.body);
                    process.exit(1);
                }
            }
            catch (err) {
                console.error('❌ Error revoking session:', err);
                process.exit(1);
            }
            return;
        }
    }
    console.log('Command not implemented:', cmd);
    process.exit(2);
}
// If invoked directly (ts or compiled js), run main
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.js'))) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
export default main;
