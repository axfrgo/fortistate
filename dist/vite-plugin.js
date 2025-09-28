// Minimal Vite plugin skeleton to integrate fortistate JIT features
import { createJitServer } from './jit.js';
// Keep the plugin shape minimal and avoid hard dependency on `vite` types
export default function fortistateVitePlugin() {
    const server = createJitServer();
    return {
        name: 'vite:fortistate',
        configureServer(viteServer) {
            // wire up HMR hooks to broadcast state changes
            server.start();
            viteServer.watcher.on('change', (p) => {
                // placeholder
            });
        }
    };
}
