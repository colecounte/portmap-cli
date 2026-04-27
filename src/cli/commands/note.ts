import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export function registerNoteCommand(program: Command): void {
  program
    .command('note <port> [text]')
    .description('Add or view a note for a specific port')
    .option('-d, --delete', 'Delete the note for this port')
    .action(async (portArg: string, text: string | undefined, options: { delete?: boolean }) => {
      const port = parseInt(portArg, 10);

      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Invalid port number: ${portArg}`);
        process.exit(1);
      }

      const storage = await getStorage();
      const entry = storage.ports[port];

      if (!entry) {
        console.error(`No entry found for port ${port}. Run 'scan' first.`);
        process.exit(1);
      }

      if (options.delete) {
        delete entry.note;
        await storage.save();
        console.log(`Note removed from port ${port}.`);
        return;
      }

      if (text !== undefined) {
        entry.note = text.trim();
        await storage.save();
        console.log(`Note saved for port ${port}: "${entry.note}"`);
        return;
      }

      // View mode
      if (entry.note) {
        console.log(`Port ${port} note: ${entry.note}`);
      } else {
        console.log(`No note set for port ${port}.`);
      }
    });
}
