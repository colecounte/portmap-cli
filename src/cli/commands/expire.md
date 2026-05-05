# `expire` Command

Identify and optionally remove port entries that haven't been seen within a configurable time window.

## Usage

```bash
portmap expire [options]
```

## Options

| Flag | Description | Default |
|------|-------------|----------|
| `-d, --days <number>` | Expiry threshold in days | `7` |
| `-H, --hours <number>` | Expiry threshold in hours (overrides `--days`) | — |
| `-r, --remove` | Delete expired entries from storage | `false` |

## Examples

### List ports not seen in the last 7 days (default)

```bash
portmap expire
```

```
Expired ports (2):
  3000 — frontend (last seen: 6/10/2025)
  6000 — cache (last seen: 6/8/2025)

Run with --remove to delete these entries.
```

### Use a custom threshold

```bash
portmap expire --days 14
portmap expire --hours 48
```

### Remove expired entries

```bash
portmap expire --remove
# Removed 2 expired port(s): 3000, 6000
```

## Notes

- **Pinned ports** are never considered expired, regardless of `lastSeen`.
- Ports without a `lastSeen` timestamp are also excluded (they may be manually added).
- The `lastSeen` field is updated automatically by the `scan` command.
