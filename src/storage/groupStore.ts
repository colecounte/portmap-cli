import { getStorage } from './index';

export type GroupMap = Record<string, number[]>;

export async function getGroups(): Promise<GroupMap> {
  const storage = await getStorage();
  return storage.groups || {};
}

export async function getGroupsForPort(port: number): Promise<string[]> {
  const groups = await getGroups();
  return Object.entries(groups)
    .filter(([, ports]) => ports.includes(port))
    .map(([name]) => name);
}

export async function addPortsToGroup(groupName: string, ports: number[]): Promise<void> {
  const storage = await getStorage();
  if (!storage.groups) storage.groups = {};
  if (!storage.groups[groupName]) storage.groups[groupName] = [];
  const existing = new Set<number>(storage.groups[groupName]);
  ports.forEach((p) => existing.add(p));
  storage.groups[groupName] = Array.from(existing).sort((a, b) => a - b);
  await storage.save();
}

export async function removePortsFromGroup(groupName: string, ports: number[]): Promise<void> {
  const storage = await getStorage();
  if (!storage.groups || !storage.groups[groupName]) return;
  const toRemove = new Set(ports);
  storage.groups[groupName] = storage.groups[groupName].filter((p: number) => !toRemove.has(p));
  await storage.save();
}

export async function deleteGroup(groupName: string): Promise<boolean> {
  const storage = await getStorage();
  if (!storage.groups || !storage.groups[groupName]) return false;
  delete storage.groups[groupName];
  await storage.save();
  return true;
}

export async function groupExists(groupName: string): Promise<boolean> {
  const groups = await getGroups();
  return groupName in groups;
}
