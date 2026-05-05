import { Command } from 'commander';
import { registerGroupCommand } from '../group';
import { resetStorage, getStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerGroupCommand(program);
  return program;
}

beforeEach(async () => {
  await resetStorage();
});

describe('group command', () => {
  describe('group add', () => {
    it('adds ports to a new group', async () => {
      const program = buildProgram();
      const spy = jest.spyOn(console, 'log').mockImplementation();
      await program.parseAsync(['group', 'add', 'backend', '3000', '4000'], { from: 'user' });
      const storage = await getStorage();
      expect(storage.groups?.backend).toEqual([3000, 4000]);
      spy.mockRestore();
    });

    it('rejects invalid port numbers', async () => {
      const program = buildProgram();
      const errSpy = jest.spyOn(console, 'error').mockImplementation();
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      await expect(
        program.parseAsync(['group', 'add', 'bad', 'abc'], { from: 'user' })
      ).rejects.toThrow('exit');
      errSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('group remove', () => {
    it('removes a port from an existing group', async () => {
      const storage = await getStorage();
      storage.groups = { frontend: [3000, 3001] };
      await storage.save();
      const program = buildProgram();
      const spy = jest.spyOn(console, 'log').mockImplementation();
      await program.parseAsync(['group', 'remove', 'frontend', '3001'], { from: 'user' });
      const updated = await getStorage();
      expect(updated.groups?.frontend).toEqual([3000]);
      spy.mockRestore();
    });

    it('exits when group does not exist', async () => {
      const program = buildProgram();
      const errSpy = jest.spyOn(console, 'error').mockImplementation();
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      await expect(
        program.parseAsync(['group', 'remove', 'ghost', '3000'], { from: 'user' })
      ).rejects.toThrow('exit');
      errSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('group list', () => {
    it('prints all groups', async () => {
      const storage = await getStorage();
      storage.groups = { alpha: [3000], beta: [4000, 5000] };
      await storage.save();
      const program = buildProgram();
      const spy = jest.spyOn(console, 'log').mockImplementation();
      await program.parseAsync(['group', 'list'], { from: 'user' });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('alpha'));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('beta'));
      spy.mockRestore();
    });

    it('prints message when no groups exist', async () => {
      const program = buildProgram();
      const spy = jest.spyOn(console, 'log').mockImplementation();
      await program.parseAsync(['group', 'list'], { from: 'user' });
      expect(spy).toHaveBeenCalledWith('No groups defined.');
      spy.mockRestore();
    });
  });

  describe('group delete', () => {
    it('deletes an existing group', async () => {
      const storage = await getStorage();
      storage.groups = { temp: [9000] };
      await storage.save();
      const program = buildProgram();
      const spy = jest.spyOn(console, 'log').mockImplementation();
      await program.parseAsync(['group', 'delete', 'temp'], { from: 'user' });
      const updated = await getStorage();
      expect(updated.groups?.temp).toBeUndefined();
      spy.mockRestore();
    });
  });
});
