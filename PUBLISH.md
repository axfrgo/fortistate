Release checklist

- Bump package.json version (semver).
- Update PUBLISH.md with brief changelog entry.
- Run `npm run build` and `npm test` locally.
- Create a signed git tag and push it.
- Create a GitHub release and attach the package tarball (optional).
- Publish to npm: `npm publish --access public`.

Keep releases small and document breaking changes in the changelog.
Publishing fortistate to npm — step by step

1) Confirm version

Open `package.json` and ensure the `version` field is the version you want to publish. If you need to bump it, use:

```powershell
npm version patch # or minor, major
```

This creates a commit and tag (if you're using git). If you don't want git tags, edit `package.json` manually.

2) Build the package locally

Run the prepare script (it runs the build):

```powershell
npm run prepare
```

This will run `tsc` and create `dist/` and declaration files.

3) Dry-run publish (recommended)

From the package root run:

```powershell
npm publish --dry-run
```

This will show what files would be published and perform validation without uploading.

4) Publish for real

If the dry-run looks good, publish:

```powershell
npm publish --access public
```

Note: You need to be logged into npm. If you're not, run `npm login` first.

5) Verify installation

Try installing the published package in a fresh temp project, or run in existing example:

```powershell
# from a different folder
npm init -y; npm install fortistate@<version>
node -e "console.log(require('fortistate'))" # or import in ESM
```

6) Troubleshooting

- If `npm publish` fails with permission or 401 errors: ensure you `npm login` with the account that owns the package name.
- If the package name is taken: change the `name` in `package.json` before publishing.
- If types are wrong for consumers: add or refine `.d.ts` files in `dist` or update `types` field in `package.json`.

7) Post-publish

- Tag release in your repository if you use git.
- Update changelog or README with the new version and changes.

That's it — if you'd like, I can run `npm publish --dry-run` now and show the output so you can confirm before publishing.
