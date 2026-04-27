import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { checkPort } from '../../scanner/portScanner';
import { PortEntry } from '../../storage/portmap';

const DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_PORTS = [3000, 4000, 5000, 8080, 8443, 9000];

let watchInterval: ReturnType<typeof setInterval> | null = null;

export async function runWatch(
  ports: number[],
  intervalMs: number,
  verbose: boolean
): Promise<void> {
  const storage = getStorage();
  const previous = new Map<number, boolean>();

  console.log(`Watching ${ports.length} port(s) every ${intervalMs / 1000}s. Press Ctrl+C to stop.\n`);

  const tick = async () => {
    const entries: PortEntry[] = storage.load();
    const labelMap = new Map(entries.map((e) => [e.port, e.label]));

    for (const port of ports) {
      const isOpen = await checkPort(port);
      const wasOpen = previous.get(port);
      const label = labelMap.get(port) ?? '';
      const portDisplay = label ? `${port} (${label})` : `${port}`;

      if (wasOpen === undefined) {
        if (verbose) {
          console.log(`[init]  port ${portDisplay} is ${isOpen ? 'OPEN' : 'CLOSED'}`);
        }
      } else if (isOpen && !wasOpen) {
        console.log(`[+] port ${portDisplay} is now OPEN`);
      } else if (!isOpen && wasOpen) {
        console.log(`[-] port ${portDisplay} is now CLOSED`);
      }

      previous.set(port, isOpen);
    }
  };

  await tick();
  watchInterval = setInterval(tick, intervalMs);

  process.on('SIGINT', () => {
    if (watchInterval) clearInterval(watchInterval);
    console.log('\nWatch stopped.');
    process.exit(0);
  });
}

export function registerWatchCommand(program: Command): void {
  program
    .command('watch')
    .description('Watch ports for open/close state changes')
    .option('-p, --ports <ports>', 'Comma-separated list of ports to watch', (val) =>
      val.split(',').map(Number)
    )
    .option('-i, --interval <seconds>', 'Poll interval in seconds', (val) => parseInt(val, 10) * 1000)
    .option('-v, --verbose', 'Show initial state of each port')
    .action(async (opts) => {
      const ports: number[] = opts.ports ?? DEFAULT_PORTS;
      const intervalMs: number = opts.interval ?? DEFAULT_INTERVAL_MS;
      const verbose: boolean = opts.verbose ?? false;
      await runWatch(ports, intervalMs, verbose);
    });
}
