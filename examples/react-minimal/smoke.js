// Simple smoke check for react-minimal example (ESM)
const pkg = await import('../../dist/index.js')
if (!pkg.createStore || !pkg.useStore) {
  console.error('fortistate API missing from dist')
  process.exit(2)
}
console.log('react-minimal smoke: OK')
