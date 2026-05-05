import { Command } from 'commander';
import { registerLintCommand } from '../lint';
import { getStorage, resetStorage } from '../../../storage';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLintCommand(program);
  return program;
}

describe('lint integration', () => {
  beforeEach(() => resetStorage());
  afterEach(() => resetStorage());

  it('reports no issues on a fresh storage', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['lint'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No issues'));
    spy.mockRestore();
  });

  it('detects missing labels after adding an unlabelled port', () => {
    const store = getStorage();
    (store.ports as Record<number, object>)[9999] = { label: '' };

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['lint'], { from: 'user' });
    const output = spy.mock.calls.flat().join('\n');
    expect(output).toContain('9999');
    expect(output).toContain('no label');
    spy.mockRestore();
  });

  it('sets exitCode=1 when errors are present', () => {
    const store = getStorage();
    (store.ports as Record<number, object>)[3000] = { label: 'dup' };
    (store.ports as Record<number, object>)[4000] = { label: 'dup' };

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    const prevCode = process.exitCode;
    process.exitCode = 0;
    program.parse(['lint'], { from: 'user' });
    expect(process.exitCode).toBe(1);
    process.exitCode = prevCode;
    spy.mockRestore();
  });
});
