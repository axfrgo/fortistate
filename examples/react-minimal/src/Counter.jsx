import React from 'react'
import { createStore, useStore } from 'fortistate'

const counter = createStore({ value: 0 })

export default function Counter(){
  const [state, setState] = useStore(counter)
  return <button onClick={() => setState(s => ({ value: s.value + 1 }))}>{state.value}</button>
}
