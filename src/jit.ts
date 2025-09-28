// JIT dev server skeleton (placeholder)
import { globalStoreFactory } from './storeFactory.js'

export type JitOptions = {
  port?: number
  root?: string
}

export function createJitServer(opts: JitOptions = {}) {
  let unsubCreate: (() => void) | null = null
  let unsubChange: (() => void) | null = null

  return {
    start: async () => {
      // subscribe to store lifecycle and changes
      unsubCreate = globalStoreFactory.subscribeCreate((key, initial) => {
        // placeholder: broadcast create event
        // eslint-disable-next-line no-console
        console.log('[fortistate][jit] store created', key, initial)
      })
      unsubChange = globalStoreFactory.subscribeChange((key, value) => {
        // placeholder: broadcast change event
        // eslint-disable-next-line no-console
        console.log('[fortistate][jit] store changed', key, value)
      })
      // eslint-disable-next-line no-console
      console.log('[fortistate][jit] started with', opts)
    },
    stop: async () => {
      if (unsubCreate) unsubCreate()
      if (unsubChange) unsubChange()
      // eslint-disable-next-line no-console
      console.log('[fortistate][jit] stopped')
    }
  }
}

export default createJitServer
