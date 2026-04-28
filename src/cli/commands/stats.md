# `stats` Command

Display aggregate statistics about all ports currently tracked in your portmap.

## Usage

```bash
portmap stats
```

## Output

The command prints a summary including:

| Field | Description |
|---|---|
| Total tracked ports | All ports stored in the portmap file |
| Labeled ports | Ports that have a non-empty label assigned |
| Tagged ports | Ports with at least one tag |
| Ports with notes | Ports that have a non-empty note |
| Top tags | Up to 5 most frequently used tags across all ports |
| Most active ports | Up to 5 ports with the highest number of history events |

## Example

```
📊 Port Map Statistics
─────────────────────────
Total tracked ports : 8
Labeled ports       : 6
Tagged ports        : 4
Ports with notes    : 2

Top tags:
  #api (3)
  #web (2)
  #db (1)

Most active ports (by history events):
  :3000 — 12 event(s)
  :5432 — 7 event(s)
  :8080 — 3 event(s)
```

## Notes

- History event counts are read from the history store and reflect all recorded open/close/label change events.
- Ports with zero history events are excluded from the "Most active" list.
- This command is read-only and does not modify any stored data.
