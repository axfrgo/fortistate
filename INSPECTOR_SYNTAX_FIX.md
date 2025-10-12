# Inspector Syntax Error Fix

## Problem
The inspector was showing a JavaScript syntax error:
```
Uncaught SyntaxError: Invalid or unexpected token (at (index):1539:54)
```

The buttons were not functioning and the interface was unresponsive.

## Root Cause
The issue was in the `inspectorClient.ts` file, which contains HTML with embedded JavaScript inside a template literal (backticks).

When JavaScript code inside the template literal used escape sequences like `\n` for newlines in string literals (e.g., in `prompt()` calls), TypeScript was interpreting them as ACTUAL newlines in the template literal, breaking the JavaScript syntax.

### Example of the Problem:
```javascript
// In the source TypeScript file (inside template literal):
const selectedLaws = prompt(
  'Apply ontogenetic laws to "' + storeKey + '"\n\n' +  // \n\n becomes actual newlines!
  'Available laws: ' + lawIds + '\n\n' +
  'Enter law IDs (comma-separated) or "all":',
  'all'
)
```

This would render in the HTML as:
```javascript
const selectedLaws = prompt(
  'Apply ontogenetic laws to "' + storeKey + '"
// <- Broken! String literal split across lines
' +
  'Available laws: ' + lawIds + '
```

## Solution
Double-escape all backslashes in escape sequences (`\n`, `\t`, etc.) within JavaScript string literals that are inside the template literal:

```javascript
// Fixed version:
const selectedLaws = prompt(
  'Apply ontogenetic laws to "' + storeKey + '"\\n\\n' +  // \\n\\n renders as \n\n
  'Available laws: ' + lawIds + '\\n\\n' +
  'Enter law IDs (comma-separated) or "all":',
  'all'
)
```

## Files Modified
- `src/client/inspectorClient.ts`
  - Fixed `applyLawsToStore()` function prompt call
  - Fixed `configureLawsForStore()` function prompt calls
  - Fixed `.join('\n')` to `.join('\\n')`

## Changes Made
1. Replaced all `\n` with `\\n` in `prompt()` calls within the inspector client JavaScript
2. Replaced `\n` with `\\n` in array `.join()` calls
3. Rebuilt the project to generate corrected `dist/client/inspectorClient.js`

## Verification
- TypeScript compilation: ✅ Passes
- JavaScript syntax validation: ✅ Valid
- No syntax errors in compiled output

## Prevention
When writing JavaScript code inside template literals (backticks):
- Always double-escape backslashes in string escape sequences
- Use `\\n` instead of `\n` for newlines
- Use `\\t` instead of `\t` for tabs
- Use `\\` instead of `\` for literal backslashes
- Test the rendered HTML JavaScript for syntax errors after building
