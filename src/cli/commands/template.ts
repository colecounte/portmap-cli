import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { listTemplates, applyTemplate, saveTemplate, deleteTemplate } from '../../storage/templateStore';

export function registerTemplateCommand(program: Command): void {
  const template = program
    .command('template')
    .description('Manage port assignment templates for quick setup');

  template
    .command('list')
    .description('List all saved templates')
    .action(() => {
      const templates = listTemplates();
      if (templates.length === 0) {
        console.log('No templates saved.');
        return;
      }
      templates.forEach(t => {
        console.log(`  ${t.name} (${Object.keys(t.ports).length} ports) — ${t.description || 'no description'}`);
      });
    });

  template
    .command('save <name>')
    .description('Save current portmap as a named template')
    .option('-d, --description <desc>', 'Optional description')
    .action((name: string, opts: { description?: string }) => {
      const storage = getStorage();
      const ports = storage.getAll();
      if (Object.keys(ports).length === 0) {
        console.error('No ports in current portmap to save.');
        process.exit(1);
      }
      saveTemplate(name, ports, opts.description);
      console.log(`Template "${name}" saved with ${Object.keys(ports).length} port(s).`);
    });

  template
    .command('apply <name>')
    .description('Apply a template to the current portmap')
    .option('--overwrite', 'Overwrite existing port entries', false)
    .action((name: string, opts: { overwrite: boolean }) => {
      const storage = getStorage();
      const result = applyTemplate(name, storage, opts.overwrite);
      if (!result.success) {
        console.error(`Failed to apply template: ${result.error}`);
        process.exit(1);
      }
      console.log(`Applied template "${name}": ${result.applied} port(s) added.`);
    });

  template
    .command('delete <name>')
    .description('Delete a saved template')
    .action((name: string) => {
      const deleted = deleteTemplate(name);
      if (!deleted) {
        console.error(`Template "${name}" not found.`);
        process.exit(1);
      }
      console.log(`Template "${name}" deleted.`);
    });
}
