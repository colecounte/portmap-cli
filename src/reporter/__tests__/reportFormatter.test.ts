import { formatReport } from '../reportFormatter';
import { PortEntry } from '../../storage/portmap';

const mockEntries: PortEntry[] = [
  { port: 3000, label: 'frontend', active: true, lastSeen: '2024-01-15T10:00:00.000Z' },
  { port: 5432, label: 'postgres', active: false, lastSeen: '2024-01-14T08:30:00.000Z' },
  { port: 8080, label: '', active: true, lastSeen: '2024-01-15T09:00:00.000Z' },
];

describe('formatReport', () => {
  describe('json format', () => {
    it('should return valid JSON string', () => {
      const result = formatReport(mockEntries, { format: 'json', showInactive: true });
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(3);
    });

    it('should exclude inactive entries by default', () => {
      const result = formatReport(mockEntries, { format: 'json' });
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed.every((e: PortEntry) => e.active !== false)).toBe(true);
    });
  });

  describe('csv format', () => {
    it('should include header row', () => {
      const result = formatReport(mockEntries, { format: 'csv', showInactive: true });
      const lines = result.split('\n');
      expect(lines[0]).toBe('port,label,active,lastSeen');
    });

    it('should have correct number of data rows', () => {
      const result = formatReport(mockEntries, { format: 'csv', showInactive: true });
      const lines = result.split('\n');
      expect(lines).toHaveLength(4); // header + 3 entries
    });

    it('should wrap labels in quotes', () => {
      const result = formatReport(mockEntries, { format: 'csv', showInactive: true });
      expect(result).toContain('"frontend"');
    });
  });

  describe('table format', () => {
    it('should include PORT and LABEL headers', () => {
      const result = formatReport(mockEntries, { format: 'table', showInactive: true });
      expect(result).toContain('PORT');
      expect(result).toContain('LABEL');
      expect(result).toContain('STATUS');
    });

    it('should show empty message when no entries', () => {
      const result = formatReport([], { format: 'table' });
      expect(result).toBe('No port entries found.');
    });

    it('should display port numbers', () => {
      const result = formatReport(mockEntries, { format: 'table', showInactive: true });
      expect(result).toContain('3000');
      expect(result).toContain('5432');
    });
  });
});
