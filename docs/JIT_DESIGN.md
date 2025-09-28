Fortistate JIT design — sketch

Goal: provide a dev-time JIT server that broadcasts store changes to a browser inspector and integrates with Vite/Next.js for HMR-like behavior.

Components:
- JIT server: WebSocket server that exposes current stores and pushes updates on change
- Vite plugin: hooks into Vite dev server, listens for module HMR events and can notify the JIT server
- Inspector: small UI served by JIT server to inspect stores and dispatch actions

Flow:
1) Developer runs their app with the Vite plugin enabled
2) Plugin starts JIT server and wires HMR events
3) When stores change (plugin `registerStore` or runtime store updates), the server broadcasts updates to inspector clients

Security:
- Only run in dev mode; require opt-in in config
- Provide tokens for remote connections if exposed externally

Next steps:
- Prototype WebSocket server in `src/jit.ts`
- Add Vite plugin skeleton (done)
- Implement inspector UI in a separate package or inside `fortistate` `dev/` folder
