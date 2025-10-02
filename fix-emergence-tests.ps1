$file = "test/emergence.test.ts"
$content = Get-Content $file -Raw

# Fix createStore calls - pattern: universe.createStore({ id: 'name', initialState: value })
# Replace with: universe.createStore('name', value)
$content = $content -replace "universe\.createStore\(\{ id: '([^']+)',\s+initialState: ([^}]+) \}\)", "universe.createStore('`$1', `$2)"

Set-Content $file $content -NoNewline

Write-Host "Fixed emergence test file"
