# `portmap lint`

Validates portmap entries and reports common configuration issues.

## Usage

```bash
portmap lint [options]
```

## Options

| Flag            | Description                         |
|-----------------|-------------------------------------|
| `--errors-only` | Show only errors, suppress warnings |

## Checks Performed

| Severity | Rule                                                    |
|----------|---------------------------------------------------------|
| `warn`   | Port has no label assigned                              |
| `error`  | Duplicate label used across multiple ports              |
| `warn`   | Port is in the privileged range (< 1024)                |
| `error`  | Port number exceeds valid range (> 65535)               |
| `warn`   | Note field exceeds 200 characters                       |

## Examples

```bash
# Run full lint
portmap lint

# Show only errors (useful in CI)
portmap lint --errors-only
```

## Exit Codes

- `0` — No issues found, or only warnings present
- `1` — One or more errors detected

## Notes

- Duplicate label detection is **case-insensitive**.
- Privileged port warnings are informational; they do not block usage.
