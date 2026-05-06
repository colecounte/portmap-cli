# `portmap merge`

Merge port entries from an external portmap JSON file into the current portmap.

## Usage

```bash
portmap merge <file> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `<file>` | Path to a JSON file containing portmap entries to merge |

## Options

| Flag | Description |
|------|-------------|
| `--overwrite` | Overwrite existing entries with values from the incoming file |
| `--dry-run` | Preview what would change without applying it |

## Examples

### Merge a shared team portmap

```bash
portmap merge ./team-portmap.json
```

Adds any ports from `team-portmap.json` that don't already exist locally. Existing entries are preserved.

### Overwrite conflicts

```bash
portmap merge ./team-portmap.json --overwrite
```

Any port that exists in both files will be replaced with the incoming value.

### Preview before merging

```bash
portmap merge ./team-portmap.json --dry-run
```

Outputs a summary of what would be added, overwritten, or skipped — without making any changes.

## Input File Format

The input file must be a valid JSON object matching the portmap schema:

```json
{
  "3000": { "label": "frontend", "tags": ["web"] },
  "4000": { "label": "api", "tags": ["backend"] }
}
```

## Notes

- The default strategy is `skip` — existing entries are never modified unless `--overwrite` is passed.
- Use `portmap snapshot` before merging to preserve your current state.
- Combine with `portmap export` to share your portmap with teammates.
