# ✅ Manual Pre-Publish Checklist for FortiState 3.0

Run through this checklist before publishing:

## 📦 Package Configuration
- [x] Version is 3.0.0 in package.json
- [x] Keywords updated with collaboration terms
- [x] Description mentions new features
- [x] Repository URLs correct
- [x] License is ISC

## 📝 Documentation
- [x] CHANGELOG.md has [3.0.0] entry
- [x] RELEASE_NOTES_v3.0.md created
- [x] README.md mentions v3 features (📸 🔍 👥)
- [x] PUBLISHING_GUIDE.md created
- [x] VSCODE_EXTENSION_GUIDE.md created

## 🏗️ Build
- [ ] Run `npm run build` - ✅ Should complete without errors
- [ ] Check `dist/` directory exists
- [ ] Check `dist/index.js` exists
- [ ] Check `dist/cli.js` exists
- [ ] Check `dist/client/inspectorClient.js` exists

## 🧪 Testing
- [ ] Run `npm test` - All tests should pass
- [ ] Manual test: Start inspector (`npm run inspect`)
- [ ] Manual test: Click 📸 Share button - modal opens
- [ ] Manual test: Click 🔍 Locate button - modal opens  
- [ ] Manual test: Click 👥 Invite button - modal opens
- [ ] Manual test: All buttons have proper styling
- [ ] Manual test: Toasts appear on actions

## 🔍 Pre-Publish Verification
- [ ] Run `npm pack --dry-run` - Check files list
- [ ] Verify no sensitive files included
- [ ] Verify dist/ is included
- [ ] Verify examples/ is included

## 🔐 NPM Setup
- [ ] Logged into NPM (`npm whoami`)
- [ ] Have publish rights to `fortistate` package
- [ ] 2FA is set up (if required)

## 📤 Git Preparation
- [ ] All changes committed
- [ ] Working directory clean (`git status`)
- [ ] On correct branch (master)
- [ ] Ready to create tag v3.0.0

---

## 🚀 When All Checked, Run:

```bash
# Final build
npm run build

# Publish to NPM
npm publish

# Git tag and push
git add .
git commit -m "🎉 Release FortiState 3.0.0"
git tag -a v3.0.0 -m "FortiState 3.0.0 - Collaborative Inspector Edition"
git push origin master
git push origin v3.0.0

# Create GitHub Release
# Go to: https://github.com/axfrgo/fortistate/releases/new
```

---

## 📊 After Publishing

- [ ] Verify on NPM: `npm info fortistate`
- [ ] Test install: Create new directory, `npm install fortistate@3.0.0`
- [ ] Create GitHub Release with RELEASE_NOTES_v3.0.md
- [ ] Announce on social media
- [ ] Post on Reddit
- [ ] Consider creating VS Code extension

---

**Good luck with the publish! 🎉**
