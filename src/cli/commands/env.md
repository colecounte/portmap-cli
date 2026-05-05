# `env` Command

Generate environment variable declarations from your labeled port assignments.

## Usage

```bash
portmap env [options]
```

## Options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--format <format>` | `-f` | Output format: `dotenv`, `shell`, or `json` | `dotenv` |

## Output Formats

### `dotenv` (default)

Outputs `KEY=VALUE` pairs suitable for `.env` files:

```
PORT_FRONTEND=3000
PORT_API_SERVER=4000
PORT_DATABASE=5432
```

### `shell`

Outputs `export KEY=VALUE` lines suitable for sourcing in a shell script:

```bash
export PORT_FRONTEND=3000
export PORT_API_SERVER=4000
export PORT_DATABASE=5432
```

### `json`

Outputs a JSON object:

```json
{
  "PORT_FRONTEND": 3000,
  "PORT_API_SERVER": 4000,
  "PORT_DATABASE": 5432
}
```

## Notes

- Only **labeled** ports are included in the output.
- Label names are uppercased and non-alphanumeric characters are replaced with `_`.
- Variable names are prefixed with `PORT_` to avoid collisions.

## Examples

```bash
# Write a .env file
portmap env > .env

# Source into current shell session
source <(portmap env --format shell)

# Use in a script that reads JSON
portmap env --format json | jq '.PORT_FRONTEND'
```
