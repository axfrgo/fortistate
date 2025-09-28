<template>
  <button @click="inc">{{ state.value }}</button>
</template>

<script setup>
import { createStore, useStore } from 'fortistate'

const counter = createStore({ value: 0 })
const [state, setState] = useStore(counter)
const inc = () => setState(s => ({ value: s.value + 1 }))
</script>
