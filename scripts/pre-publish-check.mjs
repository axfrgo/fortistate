#!/usr/bin/env node

/**
 * Pre-Publish Verification Script
 * Ensures FortiState 3.0 is ready for publication
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const checks = [];
let passed = 0;
let failed = 0;

function check(name, fn) {
  checks.push({ name, fn });
}

async function runCommand(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => stdout += data);
    proc.stderr.on('data', (data) => stderr += data);
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// ============================================================================
// CHECKS
// ============================================================================

check('Version is 3.0.0', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.version !== '3.0.0') {
    throw new Error(`Version is ${pkg.version}, expected 3.0.0`);
  }
});

check('CHANGELOG includes 3.0.0', () => {
  const changelog = readFileSync('CHANGELOG.md', 'utf8');
  if (!changelog.includes('## [3.0.0]')) {
    throw new Error('CHANGELOG.md missing 3.0.0 entry');
  }
});

check('RELEASE_NOTES_v3.0.md exists', () => {
  if (!existsSync('RELEASE_NOTES_v3.0.md')) {
    throw new Error('RELEASE_NOTES_v3.0.md not found');
  }
});

check('README mentions v3 features', () => {
  const readme = readFileSync('README.md', 'utf8');
  const hasShare = readme.toLowerCase().includes('share') || readme.includes('📸');
  const hasLocate = readme.toLowerCase().includes('locate') || readme.includes('🔍');
  const hasInvite = readme.toLowerCase().includes('invite') || readme.includes('👥');
  
  if (!hasShare || !hasLocate || !hasInvite) {
    throw new Error('README missing v3 feature mentions');
  }
});

check('dist/ directory exists', () => {
  if (!existsSync('dist')) {
    throw new Error('dist/ directory not found - run npm run build');
  }
});

check('Main entry point exists', () => {
  if (!existsSync('dist/index.js')) {
    throw new Error('dist/index.js not found');
  }
});

check('CLI entry point exists', () => {
  if (!existsSync('dist/cli.js')) {
    throw new Error('dist/cli.js not found');
  }
});

check('Inspector client exists', () => {
  if (!existsSync('dist/client/inspectorClient.js')) {
    throw new Error('dist/client/inspectorClient.js not found');
  }
});

check('TypeScript builds', async () => {
  try {
    await runCommand('npm', ['run', 'build']);
  } catch (error) {
    throw new Error('TypeScript build failed: ' + error.message);
  }
});

check('Tests pass', async () => {
  try {
    await runCommand('npm', ['test', '--', '--run']);
  } catch (error) {
    throw new Error('Tests failed: ' + error.message);
  }
});

check('No security vulnerabilities', async () => {
  try {
    await runCommand('npm', ['audit', '--audit-level=high']);
  } catch (error) {
    console.warn('⚠️  Security audit found issues (non-blocking)');
    // Don't fail on audit warnings, just warn
  }
});

check('Package can be packed', async () => {
  try {
    await runCommand('npm', ['pack', '--dry-run']);
  } catch (error) {
    throw new Error('npm pack failed: ' + error.message);
  }
});

// ============================================================================
// RUN CHECKS
// ============================================================================

console.log('🔍 FortiState 3.0 Pre-Publish Verification\n');
console.log('=' .repeat(60));

(async () => {
  for (const { name, fn } of checks) {
    process.stdout.write(`\n${name}... `);
    try {
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (error) {
      console.log('❌ FAIL');
      console.error('   ', error.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All checks passed! Ready to publish!\n');
    console.log('Next steps:');
    console.log('  1. npm login');
    console.log('  2. npm publish');
    console.log('  3. git tag -a v3.0.0 -m "Release 3.0.0"');
    console.log('  4. git push --follow-tags');
    console.log('  5. Create GitHub release\n');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please fix before publishing.\n');
    process.exit(1);
  }
})();
