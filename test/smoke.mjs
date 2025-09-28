import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'dist', 'index.js');
const pkg = await import(pathToFileURL(filePath).toString());

console.log('exports:', Object.keys(pkg));

if (typeof pkg.createStore !== 'function' || typeof pkg.getStore !== 'function' || typeof pkg.globalStoreFactory === 'undefined') {
  console.error('Expected store factory exports not found');
  process.exit(2);
}

// test creating a store and reading it
pkg.createStore('smoke', { value: 1 });
const st = pkg.getStore('smoke');
if (!st || st.get() !== 1) {
  console.error('Store creation failed');
  process.exit(3);
}

if (typeof pkg.useSelector !== 'function') {
  console.error('Expected useSelector helper not found');
  process.exit(4);
}

if (typeof pkg.wrapWithLogging !== 'function') {
  console.error('Expected wrapWithLogging helper not found');
  process.exit(5);
}

// test batchSet and resetAll
pkg.createStore('s1', { value: 10 });
pkg.createStore('s2', { value: 20 });
pkg.globalStoreFactory.batchSet({ s1: 11, s2: 22 });
if (pkg.getStore('s1').get() !== 11 || pkg.getStore('s2').get() !== 22) {
  console.error('batchSet failed');
  process.exit(6);
}

pkg.globalStoreFactory.resetAll();
if (pkg.getStore('s1').get() !== 10 || pkg.getStore('s2').get() !== 20) {
  console.error('resetAll failed');
  process.exit(7);
}

console.log('Smoke test passed');
process.exit(0);
