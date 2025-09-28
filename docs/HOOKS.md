## React hooks

Fortistate exposes a small `useAtom` hook that maps to named atoms created via `atom()`.

Usage example (React):

```tsx
import React from 'react'
import { atom, useAtom } from 'fortistate'

// create an atom at app init
atom('ui:count', 0)

function Counter() {
  const [count, { set }] = useAtom<number>('ui:count')
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => set((count ?? 0) + 1)}>+1</button>
    </div>
  )
}
```

This hook is intentionally small and matches the utility-first philosophy: create many small atoms and use them where you need them.
