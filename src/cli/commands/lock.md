# `lock` Command

The `lock` command allows you to protect specific ports from accidental modification or removal.

## Subcommands

### `lock add <port>`

Locks a port entry. The port must already be registered in the portmap.

```bash
portmap lock add 3000
portmap lock add 3000 --reason "production API"
```

**Options:**

| Flag | Description |
|------|-------------|
| `--reason <reason>` | Optional human-readable reason for the lock |

---

### `lock remove <port>`

Removes the lock from a previously locked port.

```bash
portmap lock remove 3000
```

Returns an error if the port is not currently locked.

---

### `lock list`

Lists all currently locked ports along with their reasons (if any).

```bash
portmap lock list
```

**Example output:**

```
Locked ports:
  3000 — production API
  5432 — postgres
```

---

## Storage

Lock data is persisted to `~/.portmap/locks.json` independently of the main portmap store.
This ensures locks survive `clear` and `restore` operations.

## Use Cases

- Prevent `portmap clear` from removing critical service ports
- Mark ports that should never be reassigned across environments
- Document why a port is reserved with a reason string
