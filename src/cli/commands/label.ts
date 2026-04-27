import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { LabelManager } from '../../labels/labelManager';

export function registerLabelCommand(program: Command): void {
  const labelCmd = program
    .command('label')
    .description('Manage labels for port assignments');

  labelCmd
    .command('set <port> <label>')
    .description('Assign a label to a port')
    .action(async (port: string, label: string) => {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        console.error(`Error: Invalid port number "${port}"`);
        process.exit(1);
      }
      const storage = await getStorage();
      const manager = new LabelManager(storage);
      manager.setLabel(portNum, label);
      await storage.save();
      console.log(`Label "${label}" assigned to port ${portNum}`);
    });

  labelCmd
    .command('remove <port>')
    .description('Remove the label from a port')
    .action(async (port: string) => {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum)) {
        console.error(`Error: Invalid port number "${port}"`);
        process.exit(1);
      }
      const storage = await getStorage();
      const manager = new LabelManager(storage);
      const removed = manager.removeLabel(portNum);
      if (removed) {
        await storage.save();
        console.log(`Label removed from port ${portNum}`);
      } else {
        console.warn(`No label found for port ${portNum}`);
      }
    });

  labelCmd
    .command('list')
    .description('List all labeled ports')
    .action(async () => {
      const storage = await getStorage();
      const manager = new LabelManager(storage);
      const labels = manager.listLabels();
      if (labels.length === 0) {
        console.log('No labels defined.');
        return;
      }
      console.log('Port\tLabel');
      console.log('----\t-----');
      labels.forEach(({ port, label }) => {
        console.log(`${port}\t${label}`);
      });
    });
}
