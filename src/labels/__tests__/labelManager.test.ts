import { resetStorage } from '../../storage';
import {
  setLabel,
  getLabel,
  removeLabel,
  listLabels,
  findByLabel,
} from '../labelManager';

beforeEach(async () => {
  await resetStorage();
});

describe('labelManager', () => {
  describe('setLabel', () => {
    it('should create a new label entry', async () => {
      const entry = await setLabel(3000, 'frontend', 'React dev server');
      expect(entry.port).toBe(3000);
      expect(entry.label).toBe('frontend');
      expect(entry.description).toBe('React dev server');
      expect(entry.createdAt).toBeDefined();
      expect(entry.updatedAt).toBeDefined();
    });

    it('should preserve createdAt when updating an existing label', async () => {
      const first = await setLabel(3000, 'frontend');
      const second = await setLabel(3000, 'frontend-v2');
      expect(second.createdAt).toBe(first.createdAt);
      expect(second.label).toBe('frontend-v2');
    });
  });

  describe('getLabel', () => {
    it('should return null for an unlabeled port', async () => {
      const result = await getLabel(9999);
      expect(result).toBeNull();
    });

    it('should return the label for a labeled port', async () => {
      await setLabel(4000, 'api');
      const result = await getLabel(4000);
      expect(result?.label).toBe('api');
    });
  });

  describe('removeLabel', () => {
    it('should return false when port has no label', async () => {
      const result = await removeLabel(8080);
      expect(result).toBe(false);
    });

    it('should remove an existing label and return true', async () => {
      await setLabel(5000, 'backend');
      const removed = await removeLabel(5000);
      expect(removed).toBe(true);
      const result = await getLabel(5000);
      expect(result).toBeNull();
    });
  });

  describe('listLabels', () => {
    it('should return all labels sorted by port', async () => {
      await setLabel(8000, 'service-b');
      await setLabel(3000, 'service-a');
      await setLabel(5000, 'service-c');
      const labels = await listLabels();
      expect(labels.map((l) => l.port)).toEqual([3000, 5000, 8000]);
    });
  });

  describe('findByLabel', () => {
    it('should find a port entry by label (case-insensitive)', async () => {
      await setLabel(3000, 'Frontend');
      const result = await findByLabel('frontend');
      expect(result?.port).toBe(3000);
    });

    it('should return null when label does not exist', async () => {
      const result = await findByLabel('nonexistent');
      expect(result).toBeNull();
    });
  });
});
