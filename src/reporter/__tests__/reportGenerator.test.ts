import { generateReport, generatePortSummary } from '../reportGenerator';
import * as storageModule from '../../storage';

const mockStorage = {
  ports: {
    3000: { port: 3000, label: 'frontend', active: true, lastSeen: '2024-01-15T10:00:00.000Z' },
    5432: { port: 5432, label: 'postgres', active: false, lastSeen: '2024-01-14T08:00:00.000Z' },
    8080: { port: 8080, label: 'api', active: true, lastSeen: '2024-01-15T09:00:00.000Z' },
  },
};

const emptyStorage = { ports: {} };

describe('generateReport', () => {
  beforeEach(() => {
    jest.spyOn(storageModule, 'getStorage').mockResolvedValue(mockStorage as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a non-empty string for table format', async () => {
    const result = await generateReport({ format: 'table', showInactive: true });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return valid JSON for json format', async () => {
    const result = await generateReport({ format: 'json', showInactive: true });
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should include only active ports when showInactive is false', async () => {
    const result = await generateReport({ format: 'json', showInactive: false });
    const parsed = JSON.parse(result);
    const ports = Array.isArray(parsed) ? parsed : parsed.ports ?? [];
    expect(ports.every((p: { active: boolean }) => p.active)).toBe(true);
  });

  it('should return guidance message when no ports registered', async () => {
    jest.spyOn(storageModule, 'getStorage').mockResolvedValue(emptyStorage as any);
    const result = await generateReport({ format: 'table' });
    expect(result).toContain('portmap scan');
  });
});

describe('generatePortSummary', () => {
  beforeEach(() => {
    jest.spyOn(storageModule, 'getStorage').mockResolvedValue(mockStorage as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return correct totals', async () => {
    const summary = await generatePortSummary();
    expect(summary.total).toBe(3);
    expect(summary.active).toBe(2);
    expect(summary.inactive).toBe(1);
    expect(summary.labeled).toBe(3);
  });

  it('should return zero totals for empty storage', async () => {
    jest.spyOn(storageModule, 'getStorage').mockResolvedValue(emptyStorage as any);
    const summary = await generatePortSummary();
    expect(summary.total).toBe(0);
    expect(summary.active).toBe(0);
    expect(summary.inactive).toBe(0);
    expect(summary.labeled).toBe(0);
  });
});
