import re

# Read the file
with open('test/emergence.test.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match: universe.createStore({ id: 'name', initialState: value })
# Replace with: universe.createStore('name', value)
pattern = r"universe\.createStore\(\{\s*id:\s*'([^']+)',\s*initialState:\s*(\{[^}]+\})\s*\}\)"
replacement = r"universe.createStore('\1', \2)"

content = re.sub(pattern, replacement, content)

# Write back
with open('test/emergence.test.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all createStore calls")
