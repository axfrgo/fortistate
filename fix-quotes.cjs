const fs = require('fs');

const filePath = 'src/client/inspectorClient.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace smart/curly quotes with straight quotes
const before = content.length;

// Count occurrences first
const leftDouble = (content.match(/\u201C/g) || []).length;
const rightDouble = (content.match(/\u201D/g) || []).length;
const leftSingle = (content.match(/\u2018/g) || []).length;
const rightSingle = (content.match(/\u2019/g) || []).length;

console.log('Found smart quotes:');
console.log('  Left double ("):', leftDouble);
console.log('  Right double ("):', rightDouble);
console.log('  Left single (\'):', leftSingle);
console.log('  Right single (\'):', rightSingle);

content = content.replace(/\u201C/g, '"'); // Left double quote
content = content.replace(/\u201D/g, '"'); // Right double quote
content = content.replace(/\u2018/g, "'"); // Left single quote
content = content.replace(/\u2019/g, "'"); // Right single quote

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed smart quotes. File size:', before, '->', content.length);
