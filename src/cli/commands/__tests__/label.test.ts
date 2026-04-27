import { Command } from 'commander';
import { registerLabelCommand } from '../label';
import * as storageModule from '../../../storage/index';
import { LabelManager } from '../../../labels/labelManager';

jest.mock('../../../storage/index');
jest.mock('../../../labels/labelManager');

const mockSave = jest.fn().mockResolvedValue(undefined);
const mockSetLabel = jest.fn();
const mockRemoveLabel = jest.fn();
const mockListLabels = jest.fn();

const mockStorage = { save: mockSave };

(storageModule.getStorage as jest.Mock).mockResolvedValue(mockStorage);
(LabelManager as jest.Mock).mockImplementation(() => ({
  setLabel: mockSetLabel,
  removeLabel: mockRemoveLabel,
  listLabels: mockListLabels,
}));

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLabelCommand(program);
  return program;
}

describe('label command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storageModule.getStorage as jest.Mock).mockResolvedValue(mockStorage);
    (LabelManager as jest.Mock).mockImplementation(() => ({
      setLabel: mockSetLabel,
      removeLabel: mockRemoveLabel,
      listLabels: mockListLabels,
    }));
  });

  it('set: assigns a label to a valid port', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'label', 'set', '3000', 'api-server']);
    expect(mockSetLabel).toHaveBeenCalledWith(3000, 'api-server');
    expect(mockSave).toHaveBeenCalled();
  });

  it('remove: removes a label from a port', async () => {
    mockRemoveLabel.mockReturnValue(true);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'label', 'remove', '3000']);
    expect(mockRemoveLabel).toHaveBeenCalledWith(3000);
    expect(mockSave).toHaveBeenCalled();
  });

  it('remove: warns when no label found', async () => {
    mockRemoveLabel.mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'label', 'remove', '9999']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No label found'));
    consoleSpy.mockRestore();
  });

  it('list: prints all labels', async () => {
    mockListLabels.mockReturnValue([{ port: 3000, label: 'api' }, { port: 5432, label: 'db' }]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'label', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('3000'));
    consoleSpy.mockRestore();
  });

  it('list: shows message when no labels defined', async () => {
    mockListLabels.mockReturnValue([]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'label', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith('No labels defined.');
    consoleSpy.mockRestore();
  });
});
