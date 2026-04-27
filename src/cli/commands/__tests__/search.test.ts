import { Command } from 'commander';
import { registerSearchCommand } from '../search';
import * as storage from '../../../storage/index';
import * as formatter from '../../../reporter/reportFormatter';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSearchCommand(program);
  return program;
}

describe('search command', () => {
  const mockStorage = {
    ports: {
      3000: { port: 3000, label: 'frontend', tags: ['react', 'dev'], note: 'main app' },
      4000: { port: 4000, label: 'backend-api', tags: ['node'], note: 'rest api' },
      5000: { port: 5000, label: 'database', tags: ['postgres'], note: undefined },
    },
  };

  beforeEach(() => {
    jest.spyOn(storage, 'getStorage').mockReturnValue(mockStorage as any);
    jest.spyOn(formatter, 'formatTable').mockReturnValue('table output');
    jest.spyOn(formatter, 'formatJson').mockReturnValue('json output');
    jest.spyOn(formatter, 'formatCsv').mockReturnValue('csv output');
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('searches by label and prints table by default', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'frontend'], { from: 'user' });
    expect(formatter.formatTable).toHaveBeenCalledWith([mockStorage.ports[3000]]);
    expect(console.log).toHaveBeenCalledWith('table output');
  });

  it('searches by tag with --tag flag', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'react', '--tag'], { from: 'user' });
    expect(formatter.formatTable).toHaveBeenCalledWith([mockStorage.ports[3000]]);
  });

  it('searches by note with --note flag', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'rest api', '--note'], { from: 'user' });
    expect(formatter.formatTable).toHaveBeenCalledWith([mockStorage.ports[4000]]);
  });

  it('outputs json when --format json is passed', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'node', '--format', 'json'], { from: 'user' });
    expect(formatter.formatJson).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('json output');
  });

  it('outputs csv when --format csv is passed', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'node', '--format', 'csv'], { from: 'user' });
    expect(formatter.formatCsv).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('csv output');
  });

  it('prints no results message when nothing matches', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'nonexistent'], { from: 'user' });
    expect(console.log).toHaveBeenCalledWith('No entries found matching "nonexistent".');
  });

  it('searches across label, tags and note by default', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'api'], { from: 'user' });
    expect(formatter.formatTable).toHaveBeenCalledWith([mockStorage.ports[4000]]);
  });
});
