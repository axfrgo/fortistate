Getting started with Fortistate
=================================

1) Install

```bash
npm install fortistate
# or
pnpm add fortistate
```

2) React quickstart

Copy this component into a React app (TypeScript/JSX) to get started:

```tsx
import React from 'react'
import { createStore, useStore } from 'fortistate'

const counter = createStore({ value: 0 })

export default function Counter(){
  const [state, setState] = useStore(counter)
  return <button onClick={() => setState(s => ({ value: s.value + 1 }))}>{state.value}</button>
}
```

3) Vue quickstart

Use this `Counter.vue` snippet in a Vue 3 app:

```vue
<template>
  <button @click="inc">{{ state.value }}</button>
</template>

<script setup>
import { createStore, useStore } from 'fortistate'

const counter = createStore({ value: 0 })
const [state, setState] = useStore(counter)
const inc = () => setState(s => ({ value: s.value + 1 }))
</script>
```

4) Next.js (client) quickstart

Put this in a client component to auto-register and use the inspector example:

```tsx
'use client'
import Counter from './Counter'

export default function Page(){
  return <main><Counter /></main>
}
```

5) Inspector quick walk

Start the inspector locally:

```bash
npm run inspect
# or
npx fortistate inspect --port 3333 --token hunter2
```

Open http://localhost:3333 to view the inspector UI (or open the simple `examples/inspector-client.html`).

Quick inspector walkthrough
--------------------------

1. Start the inspector: `npm run inspect` (or `npx fortistate inspect`). By default it listens on port 3333.
2. Open the inspector UI at `http://localhost:3333`.
3. Open your app (for example the Next.js example) in a separate tab. The example auto-registers a `counter` store on page load.
4. In the inspector you should see the `counter` store appear in the stores list. Click it to view the current value.
5. Interact with the app (click the counter). The inspector will show live updates (change events arrive over WebSocket).
6. You can edit store values directly in the inspector UI and the change will be posted back to the example client (useful for debugging or testing state transitions).

Recording a demo GIF
--------------------

To replace the placeholder GIF with a real recording:

1. Use your preferred screen capture tool (e.g., OBS, Peek, ShareX, or QuickTime).
2. Record a 10–20s clip showing: start inspector, auto-registering store, clicking the counter, and the inspector receiving the change.
3. Export a small GIF (try 480x270, 10–15 FPS) and save it as `docs/inspector-demo.gif`.
4. Commit and push the file; the README will display it automatically.

6) Examples

See `examples/react-minimal` and `examples/vue-minimal` for tiny copy-paste examples, and `examples/my-nextjs-app` for a fully working Next.js demo.
