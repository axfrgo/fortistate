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

6) Examples

See `examples/react-minimal` and `examples/vue-minimal` for tiny copy-paste examples, and `examples/my-nextjs-app` for a fully working Next.js demo.
