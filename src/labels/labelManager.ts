import { getStorage } from '../storage';

export interface PortLabel {
  port: number;
  label: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export async function setLabel(
  port: number,
  label: string,
  description?: string
): Promise<PortLabel> {
  const storage = await getStorage();
  const now = new Date().toISOString();

  const existing = storage.labels?.[port];
  const entry: PortLabel = {
    port,
    label,
    description: description ?? existing?.description,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (!storage.labels) {
    storage.labels = {};
  }

  storage.labels[port] = entry;
  await storage.save();

  return entry;
}

export async function getLabel(port: number): Promise<PortLabel | null> {
  const storage = await getStorage();
  return storage.labels?.[port] ?? null;
}

export async function removeLabel(port: number): Promise<boolean> {
  const storage = await getStorage();

  if (!storage.labels?.[port]) {
    return false;
  }

  delete storage.labels[port];
  await storage.save();
  return true;
}

export async function listLabels(): Promise<PortLabel[]> {
  const storage = await getStorage();
  return Object.values(storage.labels ?? {}).sort((a, b) => a.port - b.port);
}

export async function findByLabel(label: string): Promise<PortLabel | null> {
  const labels = await listLabels();
  return labels.find((l) => l.label.toLowerCase() === label.toLowerCase()) ?? null;
}
