// Simple smoke check for react-minimal example
const pkg = require('../../dist/index.js')
if (!pkg.createStore || !pkg.default && !pkg.useStore) {
  console.error('fortistate API missing from dist')
  process.exit(2)
}
console.log('react-minimal smoke: OK')
