# `group` Command

The `group` command lets you organize ports into named logical groups for easier management across dev sessions.

## Usage

```bash
portmap group <subcommand> [options]
```

## Subcommands

### `group add <groupName> <ports...>`

Add one or more ports to a named group. Creates the group if it doesn't exist.

```bash
portmap group add backend 3000 4000 5000
# Group "backend" now contains ports: 3000, 4000, 5000
```

### `group remove <groupName> <ports...>`

Remove specific ports from an existing group.

```bash
portmap group remove backend 5000
# Updated group "backend": 3000, 4000
```

### `group list`

List all defined groups and their associated ports.

```bash
portmap group list
# backend: 3000, 4000
# frontend: 8080, 8081
```

### `group delete <groupName>`

Permanently delete an entire group (ports themselves are unaffected).

```bash
portmap group delete backend
# Group "backend" deleted.
```

## Notes

- Port numbers must be valid integers between 1 and 65535.
- Groups are stored in the portmap data file alongside labels, tags, and pins.
- A port can belong to multiple groups simultaneously.
- Use `portmap search` or `portmap report` to filter output by group in future releases.
