import { Command } from 'commander';
import { registerPriorityCommand } from '../priority';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerPriorityCommand(program);
  return program;
}

beforeEach(() => {
  resetStorage();
});

describe('priority set', () => {
  it('sets a valid priority on an existing port', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'api' });
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['priority', 'set', '3000', 'high'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('Priority for port 3000 set to "high"');
    const entry = storage.get(3000) as any;
    expect(entry.priority).toBe('high');
    spy.mockRestore();
  });

  it('exits with error for invalid priority level', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'api' });
    const program = buildProgram();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
    expect(() => program.parse(['priority', 'set', '3000', 'extreme'], { from: 'user' })).toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid priority level'));
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with error if port not found', () => {
    const program = buildProgram();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
    expect(() => program.parse(['priority', 'set', '9999', 'low'], { from: 'user' })).toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('No entry found'));
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('priority get', () => {
  it('returns the priority of a port', () => {
    const storage = getStorage();
    storage.set(4000, { port: 4000, label: 'worker', priority: 'critical' } as any);
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['priority', 'get', '4000'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('Port 4000 priority: critical');
    spy.mockRestore();
  });

  it('returns none when no priority is set', () => {
    const storage = getStorage();
    storage.set(5000, { port: 5000, label: 'ui' });
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['priority', 'get', '5000'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('Port 5000 priority: none');
    spy.mockRestore();
  });
});

describe('priority list', () => {
  it('lists ports sorted by priority', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'api', priority: 'low' } as any);
    storage.set(4000, { port: 4000, label: 'db', priority: 'critical' } as any);
    storage.set(5000, { port: 5000, label: 'ui', priority: 'medium' } as any);
    const program = buildProgram();
    const lines: string[] = [];
    const spy = jest.spyOn(console, 'log').mockImplementation((msg) => lines.push(msg));
    program.parse(['priority', 'list'], { from: 'user' });
    expect(lines[0]).toContain('CRITICAL');
    expect(lines[1]).toContain('MEDIUM');
    expect(lines[2]).toContain('LOW');
    spy.mockRestore();
  });

  it('prints message when no entries exist', () => {
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['priority', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('No port entries found.');
    spy.mockRestore();
  });
});
