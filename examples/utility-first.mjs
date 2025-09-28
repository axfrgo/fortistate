import { atom, derived, persist, action } from '../dist/index.js'

// create a counter atom
const counter = atom('example:counter', 0)

// derived value
derived('example:double', ['example:counter'], (n) => n * 2)

// persist counter
persist('example:counter')

// action to increment
const inc = action(() => {
  const st = counter
  if (st) st.set(st.get() + 1)
})

console.log('initial', counter.get())
inc()
console.log('after', counter.get())
