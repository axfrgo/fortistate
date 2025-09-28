# Fortistate — Quick usage examples

This file shows basic ways to use the fortistate package (programmatic API and React hook API).

1) Programmatic store factory (Node / server-side)

```js
import { createStore, getStore, globalStoreFactory } from 'fortistate'

// create a store with initial state
createStore('counter', { value: 0 })

const counter = getStore('counter')
console.log(counter.get()) // { value: 0 }

counter.set({ value: counter.get().value + 1 })
console.log(counter.get()) // { value: 1 }

// batch set
globalStoreFactory.batchSet({ counter: { value: 10 }, user: { name: 'Alice' } })

// subscribe all
const unsubscribe = globalStoreFactory.subscribeAll((key, value) => {
  console.log('store updated', key, value)
})

// reset all back to default
globalStoreFactory.resetAll()

unsubscribe()
```

2) React hook API

```tsx
import React from 'react'
import { useStore } from 'fortistate'

export default function Counter() {
  // useStore.counter returns [state, utils]
  const [state, { set }] = useStore.counter()

  return (
    <div>
      <div>Counter: {state.value ?? 0}</div>
      <button onClick={() => set({ value: (state.value ?? 0) + 1 })}>+1</button>
    </div>
  )
}
```

3) Using useSelector for derived values

```tsx
import { useSelector } from 'fortistate'

function UserName() {
  const name = useSelector('user', s => s?.name ?? '—')
  return <div>{name}</div>
}
```

4) Wrap with logging helper (debug)

```js
import { wrapWithLogging } from 'fortistate'

const loggedCounter = wrapWithLogging('counter')
loggedCounter.set({ value: 1 })
```

Notes:
- The package exports both the programmatic API (`createStore`, `getStore`, `globalStoreFactory`) and React hooks (`useStore`, `useSelector`).
- The examples assume `state.config.ts` provides sensible defaults for stores you call `reset` on.
