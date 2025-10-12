const html = require('./dist/client/inspectorClient.js').default;
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  try {
    new Function(scriptMatch[1]);
    console.log('✓ JavaScript is syntactically valid!');
  } catch (e) {
    console.error('✗ JavaScript error:', e.message);
    const lines = scriptMatch[1].split('\n');
    const errorLine = e.stack.match(/:(\d+):/);
    if (errorLine) {
      const lineNum = parseInt(errorLine[1]) - 1;
      console.error('Error around line:', lineNum);
      console.error(lines.slice(Math.max(0, lineNum - 2), lineNum + 3).join('\n'));
    }
  }
} else {
  console.error('No script tag found!');
}
