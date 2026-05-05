# `portmap restore`

Restore port mappings from a previously exported or snapshotted JSON file.

## Usage

```bash
portmap restore <file> [options]
```

## Arguments

| Argument | Description                          |
|----------|--------------------------------------|
| `file`   | Path to the JSON snapshot/export file |

## Options

| Flag          | Description                                          | Default |
|---------------|------------------------------------------------------|---------|
| `--overwrite` | Overwrite existing port entries with snapshot values | `false` |
| `--dry-run`   | Preview what would be restored without applying      | `false` |

## Examples

### Restore from a snapshot

```bash
portmap restore ./snapshots/morning.json
```

### Restore and overwrite existing entries

```bash
portmap restore ./snapshots/morning.json --overwrite
```

### Preview changes before restoring

```bash
portmap restore ./snapshots/morning.json --dry-run
```

Example output:

```
Dry run — no changes applied.
  Would restore:   3
  Would overwrite: 1
  Would skip:      2
```

## Notes

- The input file must be valid JSON in the portmap format (as produced by `portmap snapshot` or `portmap export --format json`).
- Without `--overwrite`, any port already tracked in the current session is left unchanged.
- Use `--dry-run` to audit a snapshot before committing the restore.
