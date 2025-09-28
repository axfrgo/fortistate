// CommonJS preset for test example
module.exports = function examplePreset() {
  return {
    plugins: [
      function registerExample(api) {
        api.registerStore('example', { hello: 'world' })
      }
    ]
  }
}
