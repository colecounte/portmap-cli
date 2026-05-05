import { Command } from 'commander';
import { registerEnvCommand } from '../env';
import * as storageModule from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerEnvCommand(program);
  return program;
}

const mockStorage = {
  ports: {
    3000: { port: 3000, label: 'frontend', tags: [] },
    4000: { port: 4000, label: 'api_server', tags: [] },
    5000: { port: 5000, label: null, tags: [] },
  },
};

describe('env command', () => {
  let getStorageSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    getStorageSpy = jest.spyOn(storageModule, 'getStorage').mockReturnValue(mockStorage as any);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('outputs dotenv format by default', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env']);
    expect(consoleSpy).toHaveBeenCalledWith(
      'PORT_FRONTEND=3000\nPORT_API_SERVER=4000'
    );
  });

  it('outputs shell export format', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env', '--format', 'shell']);
    expect(consoleSpy).toHaveBeenCalledWith(
      'export PORT_FRONTEND=3000\nexport PORT_API_SERVER=4000'
    );
  });

  it('outputs json format', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env', '--format', 'json']);
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({ PORT_FRONTEND: 3000, PORT_API_SERVER: 4000 });
  });

  it('skips unlabeled ports', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env']);
    const output = consoleSpy.mock.calls[0][0];
    expect(output).not.toContain('5000');
  });

  it('prints message when no labeled ports exist', async () => {
    getStorageSpy.mockReturnValue({ ports: { 9000: { port: 9000, label: null, tags: [] } } });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env']);
    expect(consoleSpy).toHaveBeenCalledWith('# No labeled ports found.');
  });

  it('sanitizes labels with special characters', async () => {
    getStorageSpy.mockReturnValue({
      ports: { 8080: { port: 8080, label: 'my-service.v2', tags: [] } },
    });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env']);
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toBe('PORT_MY_SERVICE_V2=8080');
  });
});
