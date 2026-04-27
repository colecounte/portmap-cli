# `search` Command

Search through saved port entries by **label**, **tag**, or **note**.

## Usage

```bash
portmap search <query> [options]
```

## Arguments

| Argument | Description                    |
|----------|--------------------------------|
| `query`  | Text to search for in entries  |

## Options

| Flag              | Description                                   | Default   |
|-------------------|-----------------------------------------------|-----------|
| `-f, --format`    | Output format: `table`, `json`, `csv`         | `table`   |
| `--tag`           | Restrict search to tags only                  | false     |
| `--label`         | Restrict search to labels only                | false     |
| `--note`          | Restrict search to notes only                 | false     |

## Examples

```bash
# Search across all fields
portmap search api

# Search only in tags
portmap search react --tag

# Search only in labels, output as JSON
portmap search backend --label --format json

# Search only in notes, output as CSV
portmap search "main app" --note --format csv
```

## Notes

- Without `--tag`, `--label`, or `--note`, the search covers **all fields**.
- Matching is **case-insensitive** and uses substring matching.
- If no results are found, a friendly message is displayed.
