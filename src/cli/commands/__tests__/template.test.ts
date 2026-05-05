import { Command } from 'commander';
import { registerTemplateCommand } from '../template';
import * as templateStore from '../../../storage/templateStore';
import * as storage from '../../../storage/index';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTemplateCommand(program);
  return program;
}

const mockEntry = { label: 'api', tags: [], note: '', pinned: false, priority: 'medium' as const };

beforeEach(() => jest.restoreAllMocks());

describe('template list', () => {
  it('prints message when no templates exist', async () => {
    jest.spyOn(templateStore, 'listTemplates').mockReturnValue([]);
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'template', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No templates'));
  });

  it('lists available templates', async () => {
    jest.spyOn(templateStore, 'listTemplates').mockReturnValue([
      { name: 'webstack', ports: { 3000: mockEntry }, createdAt: '', description: 'Web' },
    ]);
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'template', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('webstack'));
  });
});

describe('template save', () => {
  it('saves current portmap as a template', async () => {
    jest.spyOn(storage, 'getStorage').mockReturnValue({ getAll: () => ({ 3000: mockEntry }) } as any);
    const saveSpy = jest.spyOn(templateStore, 'saveTemplate').mockImplementation();
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'template', 'save', 'mytemplate']);
    expect(saveSpy).toHaveBeenCalledWith('mytemplate', { 3000: mockEntry }, undefined);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('mytemplate'));
  });

  it('exits if portmap is empty', async () => {
    jest.spyOn(storage, 'getStorage').mockReturnValue({ getAll: () => ({}) } as any);
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(buildProgram().parseAsync(['node', 'test', 'template', 'save', 'empty'])).rejects.toThrow();
    expect(errSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});

describe('template apply', () => {
  it('applies a template successfully', async () => {
    jest.spyOn(storage, 'getStorage').mockReturnValue({ get: () => undefined, set: jest.fn() } as any);
    jest.spyOn(templateStore, 'applyTemplate').mockReturnValue({ success: true, applied: 2 });
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'template', 'apply', 'webstack']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('2 port(s)'));
  });

  it('exits on apply failure', async () => {
    jest.spyOn(storage, 'getStorage').mockReturnValue({} as any);
    jest.spyOn(templateStore, 'applyTemplate').mockReturnValue({ success: false, applied: 0, error: 'not found' });
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(buildProgram().parseAsync(['node', 'test', 'template', 'apply', 'ghost'])).rejects.toThrow();
    expect(errSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});

describe('template delete', () => {
  it('deletes a template', async () => {
    jest.spyOn(templateStore, 'deleteTemplate').mockReturnValue(true);
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'template', 'delete', 'old']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('deleted'));
  });

  it('exits if template not found', async () => {
    jest.spyOn(templateStore, 'deleteTemplate').mockReturnValue(false);
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(buildProgram().parseAsync(['node', 'test', 'template', 'delete', 'ghost'])).rejects.toThrow();
    expect(errSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
