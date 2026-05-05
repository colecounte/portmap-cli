import { Command } from 'commander';
import { registerAuditCommand } from '../audit';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerAuditCommand(program);
  return program;
}

describe('audit integration', () => {
  beforeEach(() => resetStorage());

  it('detects duplicate labels across multiple ports', async () => {
    const storage = getStorage();
    storage.set(3000, { label: 'api', port: 3000 });
    storage.set(4000, { label: 'api', port: 4000 });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'audit']);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Duplicate label');
    expect(output).toContain('ERROR');
    spy.mockRestore();
  });

  it('shows summary line with counts', async () => {
    const storage = getStorage();
    storage.set(80, { label: 'http', port: 80 });
    storage.set(3000, { label: 'api', port: 3000 });
    storage.set(4000, { label: 'api', port: 4000 });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'audit']);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/\d+ error\(s\), \d+ warning\(s\)/);
    spy.mockRestore();
  });

  it('json output contains port and severity fields', async () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000 } as any);

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'audit', '--json']);
    const issues = JSON.parse(spy.mock.calls[0][0]);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues[0]).toHaveProperty('port');
    expect(issues[0]).toHaveProperty('severity');
    expect(issues[0]).toHaveProperty('message');
    spy.mockRestore();
  });
});
