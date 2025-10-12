# 📦 FortiState 3.0 Publishing Guide

Complete checklist and instructions for publishing FortiState 3.0 to NPM, GitHub, and VS Code Marketplace.

---

## 🎯 Pre-Publishing Checklist

### ✅ Code Quality
- [x] All tests passing (218/218 tests)
- [x] Build successful (`npm run build`)
- [x] No TypeScript errors
- [x] No linting errors
- [x] All examples working

### ✅ Documentation
- [x] CHANGELOG.md updated with v3.0
- [x] RELEASE_NOTES_v3.0.md created
- [x] README.md updated with new features
- [x] API documentation current
- [x] Migration guide included

### ✅ Version Updates
- [x] package.json version → 3.0.0
- [x] All package.json metadata updated
- [x] Keywords enhanced
- [x] Description improved

### ✅ Testing
- [ ] Manual testing of new features
  - [ ] Share snapshot button works
  - [ ] Locate store button opens VS Code
  - [ ] Invite button shows correct URL
  - [ ] All modals display properly
  - [ ] Toast notifications work
- [ ] Test on clean install
- [ ] Test with React example
- [ ] Test with Vue example
- [ ] Test inspector in different browsers

### ✅ Privacy Guardrails
- [x] `packages/visual-studio` remains `"private": true`
- [x] Root `vitest.config.ts` excludes VS extension tests from release run
- [x] `npm pack --dry-run` shows no `packages/visual-studio/**` entries
- [ ] VS extension tested and packaged separately before marketplace upload

---

## 📦 Part 1: Publish to NPM

### Step 1: Login to NPM
```bash
npm login
```

Enter your NPM credentials when prompted.

### Step 2: Verify Package Contents
```bash
npm pack --dry-run
```

This shows what files will be included. Check that:
- ✅ `dist/` folder is included
- ✅ `bin/` folder is included  
- ✅ `docs/` folder is included
- ✅ `examples/` folder is included
- ✅ `README.md`, `LICENSE`, `CHANGELOG.md` included
- ❌ `node_modules/` excluded
- ❌ `test/` excluded (if you don't want it published)
- ❌ `packages/visual-studio/` excluded

### Step 3: Build for Production
```bash
npm run build
```

### Step 4: Run Final Tests
```bash
npm test
```

Ensure all 218 tests pass.

### Step 5: Publish to NPM
**Assets:** (automatically generated from git tag) — optionally attach the `npm pack` tarball for convenience. **Do not** attach any artifacts from `packages/visual-studio`.
npm publish
```

This will:
1. Run `prepare` script (builds the project)
2. Upload to NPM registry
3. Make available at `https://www.npmjs.com/package/fortistate`

### Step 6: Verify Publication
```bash
npm info fortistate
```

Should show version 3.0.0 and all metadata.

### Step 7: Test Installation
```bash
# In a temp directory
mkdir test-install
cd test-install
npm init -y
npm install fortistate@3.0.0

# Verify it works
npx fortistate inspect
```

---

## 🐙 Part 2: Publish to GitHub

### Step 1: Commit All Changes
```bash
git add .
git commit -m "🎉 Release FortiState 3.0.0 - Collaborative Inspector Edition

Major Features:
- Share store snapshots with team
- Locate stores in code with VS Code integration  
- Invite team members to inspector sessions
- Aurora White theme redesign
- Enhanced collaboration tools

Breaking Changes: None (100% backward compatible)
"
```

### Step 2: Create Git Tag
```bash
git tag -a v3.0.0 -m "FortiState 3.0.0 - Collaborative Inspector Edition

🌟 Major Features:
- 📸 Share Store Snapshots
- 🔍 Locate Store in Code
- 👥 Invite Team to Inspector
- 🎨 Aurora White Theme
- 🚀 VS Code Integration

✨ Fully backward compatible with v2.x

See RELEASE_NOTES_v3.0.md for full details.
"
```

### Step 3: Push to GitHub
```bash
git push origin master
git push origin v3.0.0
```

### Step 4: Create GitHub Release
Go to: https://github.com/axfrgo/fortistate/releases/new

**Tag:** v3.0.0  
**Title:** FortiState 3.0.0 - Collaborative Inspector Edition 👥

**Description:** Copy from `RELEASE_NOTES_v3.0.md`

**Assets:** (automatically generated from git tag)

Click **"Publish release"**

### Step 5: Update GitHub Pages (if applicable)
If you have GitHub Pages documentation:
```bash
npm run docs:build
git checkout gh-pages
# Copy built docs
git add .
git commit -m "Update docs for v3.0.0"
git push origin gh-pages
git checkout master
```

---

## 🔌 Part 3: Create VS Code Extension

Since the VS Code extension doesn't exist yet, here's how to create it:

### Step 1: Create Extension Structure
```bash
mkdir vscode-extension
cd vscode-extension
npm init -y
```

### Step 2: Install VS Code Extension Tools
```bash
npm install -g @vscode/vsce
npm install --save-dev @types/vscode
```

### Step 3: Create Extension Files
See detailed guide in `VSCODE_EXTENSION_GUIDE.md` (will be created next).

### Step 4: Package Extension
Before packaging, confirm `package.json` includes an `engines.vscode` field (for example, `"^1.80.0"`) and add a `.vscodeignore` entry that excludes `.env*`, audit logs, docs, and tests.

```bash
npx @vscode/vsce package --no-dependencies
```

This creates a `.vsix` file.

### Step 5: Test Extension Locally
```bash
code --install-extension fortistate-3.0.0.vsix
```

### Step 6: Publish to VS Code Marketplace
```bash
npx @vscode/vsce login axfrgo
npx @vscode/vsce publish
```

Or manually upload the `.vsix` file to:
https://marketplace.visualstudio.com/manage/publishers/axfrgo

---

## 🎊 Post-Publishing Tasks

### Announcements
- [ ] Tweet about the release
- [ ] Post on Reddit (r/javascript, r/reactjs)
- [ ] Post on Dev.to
- [ ] Update LinkedIn
- [ ] Post in Discord/Slack communities
- [ ] Email newsletter (if applicable)

### Update Documentation Sites
- [ ] Update getting started guide
- [ ] Update API documentation
- [ ] Add v3.0 tutorial videos (if planned)
- [ ] Update comparison tables
- [ ] Add new screenshots

### Monitor
- [ ] Watch for npm download stats
- [ ] Monitor GitHub issues for bugs
- [ ] Check Twitter/Reddit for feedback
- [ ] Review any security alerts
- [ ] Track adoption metrics

### Community Support
- [ ] Respond to GitHub issues quickly
- [ ] Help users with migration
- [ ] Create FAQ for common questions
- [ ] Update Stack Overflow answers

---

## 🚨 Rollback Plan (If Needed)

If critical bugs are found after release:

### Option 1: Quick Fix
```bash
# Fix the bug
git commit -m "🐛 Fix critical bug in v3.0.0"
npm version patch  # Creates 3.0.1
npm publish
git push --follow-tags
```

### Option 2: Deprecate Version
```bash
npm deprecate fortistate@3.0.0 "Critical bug found, please use 3.0.1"
```

### Option 3: Unpublish (within 72 hours)
```bash
npm unpublish fortistate@3.0.0
```
⚠️ **Only use as last resort!**

---

## 📊 Success Metrics

Track these after publishing:

- **NPM Downloads:** Check weekly/monthly trends
- **GitHub Stars:** Monitor growth
- **VS Code Installs:** Extension download count
- **Issues Reported:** Quality indicator
- **Community Engagement:** PR contributions
- **Social Media:** Mentions and shares

---

## 🎯 Quick Publish Commands

For copy-paste convenience:

```bash
# Build and test
npm run build
npm test

# NPM publish
npm login
npm publish

# Git publish  
git add .
git commit -m "🎉 Release FortiState 3.0.0"
git tag -a v3.0.0 -m "FortiState 3.0.0 Release"
git push origin master
git push origin v3.0.0

# Create GitHub release at:
# https://github.com/axfrgo/fortistate/releases/new
```

---

## 🔗 Important Links

- **NPM Package:** https://www.npmjs.com/package/fortistate
- **GitHub Repo:** https://github.com/axfrgo/fortistate
- **GitHub Releases:** https://github.com/axfrgo/fortistate/releases
- **VS Code Marketplace:** https://marketplace.visualstudio.com/publishers/axfrgo
- **Documentation:** https://github.com/axfrgo/fortistate#readme

---

## ✅ Final Checklist

Before clicking "Publish":

- [ ] Version number is correct (3.0.0)
- [ ] All tests pass
- [ ] Build is successful
- [ ] CHANGELOG is updated
- [ ] README has new features
- [ ] Examples work
- [ ] Documentation is current
- [ ] Git tag created
- [ ] Ready to announce
- [ ] Rollback plan understood

---

**Ready to publish FortiState 3.0? Let's go! 🚀**
