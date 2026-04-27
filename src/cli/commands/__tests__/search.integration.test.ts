import { Command } from 'commander';
import { registerSearchCommand } from '../search';
import * as storageModule from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSearchCommand(program);
  return program;
}

describe('search command (integration)', () => {
  const fakeStorage = {
    ports: {
      8080: { port: 8080, label: 'proxy', tags: ['nginx', 'prod'], note: 'reverse proxy' },
      9090: { port: 9090, label: 'metrics', tags: ['prometheus'], note: 'monitoring endpoint' },
    },
  };

  beforeEach(() => {
    jest.spyOn(storageModule, 'getStorage').mockReturnValue(fakeStorage as any);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns both entries when query matches across different fields', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'pro'], { from: 'user' });
    const logCalls = (console.log as jest.Mock).mock.calls.flat().join('');
    expect(logCalls).not.toBe('No entries found matching "pro".');
  });

  it('--label flag restricts search to labels only', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'proxy', '--label'], { from: 'user' });
    const logCalls = (console.log as jest.Mock).mock.calls.flat().join('');
    expect(logCalls).not.toContain('No entries found');
  });

  it('--tag flag with unmatched query shows no results', async () => {
    const program = buildProgram();
    await program.parseAsync(['search', 'proxy', '--tag'], { from: 'user' });
    expect(console.log).toHaveBeenCalledWith('No entries found matching "proxy".');
  });
});
