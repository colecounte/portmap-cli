# `portmap audit`

Audit all portmap entries for common issues such as missing labels, duplicate labels or aliases, and out-of-range port numbers.

## Usage

```bash
portmap audit [options]
```

## Options

| Flag            | Description                            |
|-----------------|----------------------------------------|
| `--errors-only` | Show only `error`-severity issues      |
| `--json`        | Output the issue list as JSON          |

## Severity Levels

| Level   | Meaning                                      |
|---------|----------------------------------------------|
| `warn`  | Non-critical, but worth reviewing            |
| `error` | Definite problem that should be resolved     |

## Checks Performed

- **Missing label** — port has no label assigned (`warn`)
- **Duplicate label** — two ports share the same label (`error`)
- **Duplicate alias** — two ports share the same alias (`error`)
- **Privileged port** — port number is below 1024 (`warn`)
- **Out-of-range port** — port number exceeds 65535 (`error`)

## Examples

```bash
# Run full audit
portmap audit

# Show only errors
portmap audit --errors-only

# Machine-readable output
portmap audit --json
```

## Exit Behaviour

The command always exits with code `0`. Use `--json` output and parse the results if you need to gate on issues in CI.
