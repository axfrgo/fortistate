import { WebSocketServer } from 'ws';
import { globalStoreFactory } from './storeFactory.js';
export function createJitServer(opts = {}) {
    const port = opts.port || 3333;
    const quiet = Boolean(opts.quiet);
    let wss = null;
    function broadcast(obj) {
        const msg = JSON.stringify(obj);
        if (!wss)
            return;
        wss.clients.forEach((c) => {
            if (c.readyState === 1)
                c.send(msg);
        });
    }
    return {
        start: async () => {
            wss = new WebSocketServer({ port });
            // notify new connections
            wss.on('connection', (ws) => {
                ws.send(JSON.stringify({ type: 'hello', version: 1 }));
            });
            // subscribe to factory events
            const unsubCreate = globalStoreFactory.subscribeCreate((key, initial) => {
                broadcast({ type: 'store:create', key, initial });
            });
            const unsubChange = globalStoreFactory.subscribeChange((key, value) => {
                broadcast({ type: 'store:change', key, value });
            });
            wss._unsubCreate = unsubCreate;
            wss._unsubChange = unsubChange;
            if (!quiet) {
                // eslint-disable-next-line no-console
                console.log('[fortistate][jit-server] listening on ws://localhost:' + port);
            }
        },
        stop: async () => {
            if (!wss)
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
            // terminate clients first to avoid close hang
            try {
                wss.clients.forEach((c) => {
                    try {
                        if (typeof c.terminate === 'function')
                            c.terminate();
                        else if (typeof c.close === 'function')
                            c.close();
                    }
                    catch (e) { }
                });
            }
            catch (e) { }
            await new Promise((r) => wss.close(() => r(undefined)));
            wss = null;
        }
    };
}
export default createJitServer;
