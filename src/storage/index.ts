export { PortMapStorage } from './portmap';
export type { PortEntry, PortMap } from './portmap';

/**
 * Returns a singleton PortMapStorage instance using the default
 * .portmap.json file in the current working directory.
 */
import { PortMapStorage } from './portmap';
import path from 'path';

let _instance: PortMapStorage | null = null;

export function getStorage(filePath?: string): PortMapStorage {
  if (filePath) {
    return new PortMapStorage(filePath);
  }
  if (!_instance) {
    _instance = new PortMapStorage(path.join(process.cwd(), '.portmap.json'));
  }
  return _instance;
}

/** Reset the singleton — useful for testing. */
export function resetStorage(): void {
  _instance = null;
}
