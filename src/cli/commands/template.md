# `portmap template` — Port Assignment Templates

Save and reuse named port assignment configurations across projects.

## Usage

```bash
portmap template list
portmap template save <name> [--description <desc>]
portmap template apply <name> [--overwrite]
portmap template delete <name>
```

## Subcommands

### `list`

Lists all saved templates with their port count and description.

```
  webstack (3 ports) — Full web dev stack
  microservices (6 ports) — no description
```

### `save <name>`

Saves the current portmap state as a reusable template.

```bash
portmap template save webstack --description "React + API + DB"
```

Options:
- `-d, --description <desc>` — Optional human-readable description

### `apply <name>`

Applies a saved template to the current portmap session.

```bash
portmap template apply webstack
portmap template apply webstack --overwrite
```

Options:
- `--overwrite` — Replace existing port entries (default: skip conflicts)

### `delete <name>`

Permanently removes a saved template.

```bash
portmap template delete webstack
```

## Storage

Templates are stored as JSON files in `~/.portmap/templates/<name>.json`.

## Example Workflow

```bash
# Set up your dev ports
portmap label 3000 frontend
portmap label 4000 api
portmap label 5432 postgres

# Save as a reusable template
portmap template save fullstack --description "Next.js + Express + Postgres"

# In a new project, apply the template
portmap template apply fullstack
```
