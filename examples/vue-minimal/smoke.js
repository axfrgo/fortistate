// Simple smoke check for vue-minimal example
const pkg = require('../../dist/index.js')
if (!pkg.createStore || !pkg.useStore) {
  console.error('fortistate API missing from dist')
  process.exit(2)
}
console.log('vue-minimal smoke: OK')
