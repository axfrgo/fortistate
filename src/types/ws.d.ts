declare module 'ws' {
  import { EventEmitter } from 'events'
  export class WebSocket extends EventEmitter {
    send(data: string | ArrayBuffer | Buffer): void
    readyState: number
  }
  export class WebSocketServer extends EventEmitter {
    clients: Set<WebSocket>
    constructor(opts?: { port?: number } | { server?: any })
    on(event: 'connection', cb: (ws: WebSocket) => void): this
    close(cb?: () => void): void
  }
  export default WebSocketServer
}
