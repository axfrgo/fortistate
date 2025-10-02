const fs = require('fs');
const s = fs.readFileSync('src/inspector.ts','utf8');
const pairs = {'(':')','{':'}','[':']'};
let stack = [];
let line = 1, col = 0;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '\n') { line++; col = 0; continue; }
  col++;
  if (ch === '"' || ch === "'" || ch === '`') {
    const quote = ch; i++; col++;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') { i += 2; col += 2; continue; }
      if (c === quote) break;
      if (c === '\n') { line++; col = 0; }
      i++; col++;
    }
    continue;
  }
  if (ch === '/' && s[i+1] === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
  if (ch === '/' && s[i+1] === '*') { i += 2; col += 2; while (i < s.length && !(s[i] === '*' && s[i+1] === '/')) { if (s[i] === '\n') { line++; col = 0; } i++; col++; } i += 1; continue; }
  if (['(','{','['].includes(ch)) { stack.push({ch,line,col,i}); }
  else if ([')',']','}'].includes(ch)) {
    const top = stack[stack.length-1];
    if (!top) { console.log('Unmatched closing', ch, 'at', line, col); break; }
    const expected = pairs[top.ch];
    if (expected !== ch) { console.log('Mismatch at', line, col, 'got', ch, 'expected', expected, 'top was', top); console.log('Context around i:\n', s.slice(Math.max(0,i-80), i+40)); break; }
    stack.pop();
  }
}
console.log('Remaining stack size', stack.length);
stack.forEach((it, idx) => console.log('#'+idx, it));
