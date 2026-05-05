import { getGroups, getGroupsForPort, addPortsToGroup, removePortsFromGroup, deleteGroup, groupExists } from '../groupStore';
import { resetStorage } from '../index';

beforeEach(async () => {
  await resetStorage();
});

describe('groupStore', () => {
  describe('getGroups', () => {
    it('returns empty object when no groups exist', async () => {
      const groups = await getGroups();
      expect(groups).toEqual({});
    });
  });

  describe('addPortsToGroup', () => {
    it('creates a new group with ports', async () => {
      await addPortsToGroup('backend', [3000, 4000]);
      const groups = await getGroups();
      expect(groups['backend']).toEqual([3000, 4000]);
    });

    it('merges ports into existing group without duplicates', async () => {
      await addPortsToGroup('backend', [3000, 4000]);
      await addPortsToGroup('backend', [4000, 5000]);
      const groups = await getGroups();
      expect(groups['backend']).toEqual([3000, 4000, 5000]);
    });

    it('sorts ports numerically', async () => {
      await addPortsToGroup('mixed', [8080, 3000, 5000]);
      const groups = await getGroups();
      expect(groups['mixed']).toEqual([3000, 5000, 8080]);
    });
  });

  describe('removePortsFromGroup', () => {
    it('removes specified ports from group', async () => {
      await addPortsToGroup('frontend', [3000, 3001, 3002]);
      await removePortsFromGroup('frontend', [3001]);
      const groups = await getGroups();
      expect(groups['frontend']).toEqual([3000, 3002]);
    });

    it('does nothing if group does not exist', async () => {
      await expect(removePortsFromGroup('nonexistent', [3000])).resolves.not.toThrow();
    });
  });

  describe('deleteGroup', () => {
    it('deletes an existing group and returns true', async () => {
      await addPortsToGroup('temp', [9000]);
      const result = await deleteGroup('temp');
      expect(result).toBe(true);
      const groups = await getGroups();
      expect(groups['temp']).toBeUndefined();
    });

    it('returns false when group does not exist', async () => {
      const result = await deleteGroup('ghost');
      expect(result).toBe(false);
    });
  });

  describe('getGroupsForPort', () => {
    it('returns all groups containing the port', async () => {
      await addPortsToGroup('alpha', [3000, 4000]);
      await addPortsToGroup('beta', [3000, 5000]);
      const result = await getGroupsForPort(3000);
      expect(result).toContain('alpha');
      expect(result).toContain('beta');
      expect(result).toHaveLength(2);
    });

    it('returns empty array when port is in no groups', async () => {
      const result = await getGroupsForPort(9999);
      expect(result).toEqual([]);
    });
  });

  describe('groupExists', () => {
    it('returns true for existing group', async () => {
      await addPortsToGroup('exists', [1234]);
      expect(await groupExists('exists')).toBe(true);
    });

    it('returns false for non-existing group', async () => {
      expect(await groupExists('nope')).toBe(false);
    });
  });
});
