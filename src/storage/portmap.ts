import fs from 'fs';
import path from 'path';

export interface PortEntry {
  port: number;
  label: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortMap {
  version: number;
  entries: Record<number, PortEntry>;
}

const DEFAULT_PORTMAP: PortMap = {
  version: 1,
  entries: {},
};

export class PortMapStorage {
  private filePath: string;

  constructor(filePath: string = path.join(process.cwd(), '.portmap.json')) {
    this.filePath = filePath;
  }

  load(): PortMap {
    if (!fs.existsSync(this.filePath)) {
      return { ...DEFAULT_PORTMAP, entries: {} };
    }
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as PortMap;
    } catch {
      throw new Error(`Failed to parse portmap file at ${this.filePath}`);
    }
  }

  save(portMap: PortMap): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(portMap, null, 2), 'utf-8');
  }

  addOrUpdate(port: number, label: string, description?: string): PortEntry {
    const portMap = this.load();
    const now = new Date().toISOString();
    const existing = portMap.entries[port];
    const entry: PortEntry = {
      port,
      label,
      description: description ?? existing?.description,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    portMap.entries[port] = entry;
    this.save(portMap);
    return entry;
  }

  remove(port: number): boolean {
    const portMap = this.load();
    if (!portMap.entries[port]) return false;
    delete portMap.entries[port];
    this.save(portMap);
    return true;
  }

  list(): PortEntry[] {
    const portMap = this.load();
    return Object.values(portMap.entries).sort((a, b) => a.port - b.port);
  }
}
