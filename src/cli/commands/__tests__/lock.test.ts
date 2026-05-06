import { Command } from 'commander';
import { registerLockCommand } from '../lock';
import { LockStore } from '../../../storage/lockStore';
import { getStorage } from '../../../storage/index';

jest.mock('../../../storage/lockStore');
jest.mock('../../../storage/index');

const MockLockStore = LockStore as jest.MockedClass<typeof LockStore>;
const mockGetStorage = getStorage as jest.MockedFunction<typeof getStorage>;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLockCommand(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  MockLockStore.prototype.lockPort = jest.fn().mockResolvedValue(undefined);
  MockLockStore.prototype.unlockPort = jest.fn().mockResolvedValue(true);
  MockLockStore.prototype.listLocks = jest.fn().mockResolvedValue([]);
  mockGetStorage.mockResolvedValue({ ports: { 3000: { label: 'api' } } } as any);
});

describe('lock add', () => {
  it('locks a registered port', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'lock', 'add', '3000']);
    expect(MockLockStore.prototype.lockPort).toHaveBeenCalledWith(3000, undefined);
  });

  it('locks with a reason', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'lock', 'add', '3000', '--reason', 'production']);
    expect(MockLockStore.prototype.lockPort).toHaveBeenCalledWith(3000, 'production');
  });

  it('exits if port not in storage', async () => {
    mockGetStorage.mockResolvedValue({ ports: {} } as any);
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'test', 'lock', 'add', '9999'])).rejects.toThrow();
    exitSpy.mockRestore();
  });
});

describe('lock remove', () => {
  it('unlocks a port', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'lock', 'remove', '3000']);
    expect(MockLockStore.prototype.unlockPort).toHaveBeenCalledWith(3000);
  });

  it('exits if port not locked', async () => {
    MockLockStore.prototype.unlockPort = jest.fn().mockResolvedValue(false);
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'test', 'lock', 'remove', '3000'])).rejects.toThrow();
    exitSpy.mockRestore();
  });
});

describe('lock list', () => {
  it('shows message when no locks', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'lock', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No ports'));
    spy.mockRestore();
  });

  it('lists locked ports', async () => {
    MockLockStore.prototype.listLocks = jest.fn().mockResolvedValue([
      { port: 3000, reason: 'api', lockedAt: '2024-01-01T00:00:00.000Z' },
    ]);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'lock', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('3000'));
    spy.mockRestore();
  });
});
