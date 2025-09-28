React minimal example

1. npm install
2. Create a small app that imports `fortistate` and uses the `Counter` component.

Counter component:

```jsx
import React from 'react'
import { createStore, useStore } from 'fortistate'

const counter = createStore({ value: 0 })

export default function Counter(){
  const [state, setState] = useStore(counter)
  return <button onClick={() => setState(s => ({ value: s.value + 1 }))}>{state.value}</button>
}
```

This minimal example shows how to import and use the hooks-based API.
