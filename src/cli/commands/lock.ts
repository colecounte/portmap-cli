import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { LockStore } from '../../storage/lockStore';

export function registerLockCommand(program: Command): void {
  const lock = program.command('lock');

  lock
    .command('add <port>')
    .description('Lock a port to prevent accidental clearing or modification')
    .option('--reason <reason>', 'Reason for locking this port')
    .action(async (portStr: string, opts: { reason?: string }) => {
      const port = parseInt(portStr, 10);
      if (isNaN(port)) {
        console.error(`Invalid port: ${portStr}`);
        process.exit(1);
      }
      const storage = await getStorage();
      if (!storage.ports[port]) {
        console.error(`Port ${port} is not registered in portmap.`);
        process.exit(1);
      }
      const lockStore = new LockStore();
      await lockStore.lockPort(port, opts.reason);
      console.log(`Port ${port} locked.${opts.reason ? ` Reason: ${opts.reason}` : ''}`);
    });

  lock
    .command('remove <port>')
    .description('Unlock a previously locked port')
    .action(async (portStr: string) => {
      const port = parseInt(portStr, 10);
      if (isNaN(port)) {
        console.error(`Invalid port: ${portStr}`);
        process.exit(1);
      }
      const lockStore = new LockStore();
      const unlocked = await lockStore.unlockPort(port);
      if (!unlocked) {
        console.error(`Port ${port} is not locked.`);
        process.exit(1);
      }
      console.log(`Port ${port} unlocked.`);
    });

  lock
    .command('list')
    .description('List all locked ports')
    .action(async () => {
      const lockStore = new LockStore();
      const locks = await lockStore.listLocks();
      if (locks.length === 0) {
        console.log('No ports are currently locked.');
        return;
      }
      console.log('Locked ports:');
      for (const entry of locks) {
        const reason = entry.reason ? ` — ${entry.reason}` : '';
        console.log(`  ${entry.port}${reason}`);
      }
    });
}
