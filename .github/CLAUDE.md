# GitHub Actions

## SHA Pinning Policy

All actions pinned to **full 40-character commit SHAs**. Tags are mutable and can be hijacked — SHAs are immutable.

Format: `uses: owner/action@<full-sha>  # v1.2.3`

Find SHA for a version:
```bash
git ls-remote --tags https://github.com/<owner>/<repo>.git 'v4*' | sort -t/ -k3 -V | tail -1
```

Always verify the SHA matches the expected release tag before updating.

## Current Pins

| Action | SHA | Version |
|--------|-----|---------|
| actions/checkout | `de0fac2e4500dabe0009e67214ff5f5447ce83dd` | v6.0.2 |
| oven-sh/setup-bun | `ecf28ddc73e819eb6fa29df6b34ef8921c743461` | v2.1.3 |
| actions/cache | `cdf6c1fa76f9f475f3d7449005a359c84ca0f306` | v5.0.3 |
| actions/upload-artifact | `bbbca2ddaa5d8feaa63e36b76fdaad77386f024f` | v7.0.0 |
| actions/download-artifact | `3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c` | v8.0.1 |
| softprops/action-gh-release | `a06a81a03ee405af7f2048a818ed3f03bbf83c7b` | v2.5.0 |

## CI Workflow (`workflows/ci.yml`)

- Triggers: push to any branch, PRs to main
- Steps: format check, lint, typecheck, then build
- Permissions: `contents: read` only

## Release Workflow (`workflows/release.yml`)

- Triggers: push of `v*` tags
- Waits for CI to pass on same commit
- Builds 4 platform binaries (linux-x64, linux-arm64, darwin-x64, darwin-arm64)
- Creates GitHub release with all binaries attached
