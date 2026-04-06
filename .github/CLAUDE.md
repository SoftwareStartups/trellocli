# GitHub Actions

## SHA Pinning Policy

All actions pinned to **full 40-character commit SHAs**. Tags are mutable and can be hijacked — SHAs are immutable.

Format: `uses: owner/action@<full-sha>  # v1.2.3`

Find SHA for a version:
```bash
git ls-remote --tags https://github.com/<owner>/<repo>.git 'v4*' | sort -t/ -k3 -V | tail -1
```

Always verify the SHA matches the expected release tag before updating.

## CI Workflow (`workflows/ci.yml`)

- Triggers: push to any branch, PRs to main
- Steps: format check, lint, typecheck, then build
- Permissions: `contents: read` only

## Release Workflow (`workflows/release.yml`)

- Triggers: push of `v*` tags
- Waits for CI to pass on same commit
- Builds 4 platform binaries (linux-x64, linux-arm64, darwin-x64, darwin-arm64)
- Creates GitHub release with all binaries via `gh release create`
