import { scanCommand, ScanOptions } from '../scan';
import * as portScanner from '../../../scanner/portScanner';
import * as storageModule from '../../../storage';

jest.mock('../../../scanner/portScanner');
jest.mock('../../../storage');
jest.mock('../../../reporter/reportFormatter', () => ({
  formatReport: jest.fn(() => 'mocked report'),
}));

const mockCheckPort = portScanner.checkPort as jest.MockedFunction<typeof portScanner.checkPort>;
const mockGetStorage = storageModule.getStorage as jest.MockedFunction<typeof storageModule.getStorage>;

describe('scanCommand', () => {
  const mockStorage = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStorage.mockReturnValue(mockStorage as any);
    mockStorage.get.mockReturnValue(undefined);
    mockCheckPort.mockResolvedValue(false);
  });

  it('throws on invalid port range', async () => {
    await expect(scanCommand({ start: 9000, end: 8000 })).rejects.toThrow('Invalid port range');
  });

  it('throws when start port is below 1', async () => {
    await expect(scanCommand({ start: 0, end: 100 })).rejects.toThrow('Invalid port range');
  });

  it('returns results for scanned ports', async () => {
    mockCheckPort.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const results = await scanCommand({ start: 3000, end: 3001 });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ port: 3000, open: true, label: undefined });
    expect(results[1]).toEqual({ port: 3001, open: false, label: undefined });
  });

  it('includes label from storage if present', async () => {
    mockCheckPort.mockResolvedValue(true);
    mockStorage.get.mockReturnValue({ port: 3000, label: 'dev-server', lastSeen: '2024-01-01' });

    const results = await scanCommand({ start: 3000, end: 3000 });

    expect(results[0].label).toBe('dev-server');
  });

  it('saves open ports to storage when save=true', async () => {
    mockCheckPort.mockResolvedValue(true);

    await scanCommand({ start: 3000, end: 3000, save: true });

    expect(mockStorage.set).toHaveBeenCalledWith(3000, expect.objectContaining({ port: 3000 }));
  });

  it('does not save ports when save=false', async () => {
    mockCheckPort.mockResolvedValue(true);

    await scanCommand({ start: 3000, end: 3000, save: false });

    expect(mockStorage.set).not.toHaveBeenCalled();
  });
});
