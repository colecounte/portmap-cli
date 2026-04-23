# portmap-cli

> Lightweight utility to scan, label, and persist local port assignments across dev sessions.

---

## Installation

```bash
npm install -g portmap-cli
```

Or with pnpm:

```bash
pnpm add -g portmap-cli
```

---

## Usage

Scan active ports and label them for your current project:

```bash
# Scan all active local ports
portmap scan

# Assign a label to a port
portmap label 3000 "Next.js Dev Server"

# List all saved port assignments
portmap list

# Remove a saved assignment
portmap remove 3000
```

Port assignments are persisted to `~/.portmap/assignments.json` and survive across terminal sessions and reboots.

---

## Example Output

```
PORT    LABEL                  STATUS
3000    Next.js Dev Server     active
5432    PostgreSQL             active
6379    Redis                  inactive
8080    API Gateway            active
```

---

## Configuration

By default, `portmap-cli` stores assignments in `~/.portmap/`. You can override this with an environment variable:

```bash
export PORTMAP_DIR=/path/to/custom/dir
```

---

## License

MIT © 2024