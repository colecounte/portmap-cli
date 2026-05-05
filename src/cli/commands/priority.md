# `priority` Command

Manage priority levels for tracked port entries. Useful for distinguishing critical services from lower-importance processes during development sessions.

## Subcommands

### `priority set <port> <level>`

Assign a priority level to a port.

**Valid levels:** `low`, `medium`, `high`, `critical`

```bash
portmap priority set 3000 high
portmap priority set 5432 critical
```

### `priority get <port>`

Retrieve the current priority level of a port.

```bash
portmap priority get 3000
# Port 3000 priority: high
```

If no priority has been assigned, the output shows `none`.

### `priority list`

List all tracked ports sorted by priority (critical → high → medium → low → none).

```bash
portmap priority list
# [CRITICAL ] 5432 — postgres
# [HIGH     ] 3000 — api
# [MEDIUM   ] 8080 — proxy
# [LOW      ] 9229 — debugger
```

## Notes

- Priority metadata is stored alongside the existing port entry in portmap storage.
- Ports without an assigned priority are treated as `none` and appear last in `list` output.
- Priority does not affect scanning behaviour — it is a labelling aid only.
