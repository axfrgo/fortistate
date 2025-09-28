Release workflow

1. Ensure master branch is green on CI.
2. Update `PUBLISH.md` with a short changelog entry.
3. Bump `package.json` version.
4. Run `npm run build` and `npm test`.
5. Create an annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
6. Push tag and create a GitHub release.
7. Publish to npm.
