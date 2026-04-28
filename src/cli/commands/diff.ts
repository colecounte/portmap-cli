import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getStorage } from '../../storage';
import { PortMap } from '../../storage/portmap';

interface SnapshotFile {
  timestamp: string;
  ports: PortMap;
}

function diffSnapshots(snapshotA: PortMap, snapshotB: PortMap): void {
  const allPorts = new Set([
    ...Object.keys(snapshotA),
    ...Object.keys(snapshotB),
  ]);

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const port of allPorts) {
    const inA = port in snapshotA;
    const inB = port in snapshotB;

    if (!inA && inB) {
      added.push(`  + ${port}: ${snapshotB[port].label ?? '(no label)'}`);
    } else if (inA && !inB) {
      removed.push(`  - ${port}: ${snapshotA[port].label ?? '(no label)'}`);
    } else if (inA && inB) {
      const labelA = snapshotA[port].label;
      const labelB = snapshotB[port].label;
      if (labelA !== labelB) {
        changed.push(`  ~ ${port}: "${labelA ?? ''}" → "${labelB ?? ''}"`);
      } else {
        unchanged.push(`    ${port}: ${labelA ?? '(no label)'}`);
      }
    }
  }

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    console.log('No differences found between snapshots.');
    return;
  }

  if (added.length > 0) {
    console.log('Added:');
    added.forEach((l) => console.log(l));
  }
  if (removed.length > 0) {
    console.log('Removed:');
    removed.forEach((l) => console.log(l));
  }
  if (changed.length > 0) {
    console.log('Changed:');
    changed.forEach((l) => console.log(l));
  }
}

export function registerDiffCommand(program: Command): void {
  program
    .command('diff <snapshotA> <snapshotB>')
    .description('Compare two snapshots or a snapshot against the current port map')
    .option('--current', 'Compare snapshotA against the current live port map')
    .action(async (snapshotA: string, snapshotB: string, options: { current?: boolean }) => {
      const snapshotDir = path.resolve(process.cwd(), 'snapshots');

      const fileA = path.join(snapshotDir, `${snapshotA}.json`);
      if (!fs.existsSync(fileA)) {
        console.error(`Snapshot not found: ${snapshotA}`);
        process.exit(1);
      }

      const dataA: SnapshotFile = JSON.parse(fs.readFileSync(fileA, 'utf-8'));

      let portsB: PortMap;
      if (options.current) {
        const storage = getStorage();
        portsB = storage.load();
      } else {
        const fileB = path.join(snapshotDir, `${snapshotB}.json`);
        if (!fs.existsSync(fileB)) {
          console.error(`Snapshot not found: ${snapshotB}`);
          process.exit(1);
        }
        const dataB: SnapshotFile = JSON.parse(fs.readFileSync(fileB, 'utf-8'));
        portsB = dataB.ports;
      }

      diffSnapshots(dataA.ports, portsB);
    });
}
