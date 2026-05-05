import fs from 'fs';
import path from 'path';
import os from 'os';
import { PortEntry } from './portmap';

const TEMPLATE_DIR = path.join(os.homedir(), '.portmap', 'templates');

export interface PortTemplate {
  name: string;
  description?: string;
  createdAt: string;
  ports: Record<number, PortEntry>;
}

export interface ApplyResult {
  success: boolean;
  applied: number;
  error?: string;
}

function ensureDir(): void {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  }
}

function templatePath(name: string): string {
  return path.join(TEMPLATE_DIR, `${name}.json`);
}

export function listTemplates(): PortTemplate[] {
  ensureDir();
  return fs
    .readdirSync(TEMPLATE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const raw = fs.readFileSync(path.join(TEMPLATE_DIR, f), 'utf-8');
      return JSON.parse(raw) as PortTemplate;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function saveTemplate(
  name: string,
  ports: Record<number, PortEntry>,
  description?: string
): void {
  ensureDir();
  const tpl: PortTemplate = { name, description, createdAt: new Date().toISOString(), ports };
  fs.writeFileSync(templatePath(name), JSON.stringify(tpl, null, 2), 'utf-8');
}

export function getTemplate(name: string): PortTemplate | null {
  const p = templatePath(name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as PortTemplate;
}

export function applyTemplate(
  name: string,
  storage: { set: (port: number, entry: PortEntry) => void; get: (port: number) => PortEntry | undefined },
  overwrite: boolean
): ApplyResult {
  const tpl = getTemplate(name);
  if (!tpl) return { success: false, applied: 0, error: `Template "${name}" not found` };
  let applied = 0;
  for (const [portStr, entry] of Object.entries(tpl.ports)) {
    const port = Number(portStr);
    if (!overwrite && storage.get(port)) continue;
    storage.set(port, entry);
    applied++;
  }
  return { success: true, applied };
}

export function deleteTemplate(name: string): boolean {
  const p = templatePath(name);
  if (!fs.existsSync(p)) return false;
  fs.unlinkSync(p);
  return true;
}
