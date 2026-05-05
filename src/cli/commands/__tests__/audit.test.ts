import { Command } from 'commander';
import { auditPortmap, AuditIssue } from '../audit';
import { registerAuditCommand } from '../audit';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerAuditCommand(program);
  return program;
}

describe('auditPortmap()', () => {
  it('returns no issues for a clean entry', () => {
    const entries = {
      '3000': { label: 'frontend', port: 3000 },
    };
    expect(auditPortmap(entries as any)).toHaveLength(0);
  });

  it('warns when label is missing', () => {
    const entries = { '3000': { port: 3000 } };
    const issues = auditPortmap(entries as any);
    expect(issues).toContainEqual(expect.objectContaining({ severity: 'warn', port: 3000 }));
  });

  it('errors on duplicate labels', () => {
    const entries = {
      '3000': { label: 'api', port: 3000 },
      '4000': { label: 'api', port: 4000 },
    };
    const issues = auditPortmap(entries as any);
    const errors = issues.filter((i: AuditIssue) => i.severity === 'error');
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('errors on duplicate aliases', () => {
    const entries = {
      '3000': { label: 'svc-a', alias: 'main', port: 3000 },
      '4000': { label: 'svc-b', alias: 'main', port: 4000 },
    };
    const issues = auditPortmap(entries as any);
    const aliasErrors = issues.filter(
      (i: AuditIssue) => i.severity === 'error' && i.message.includes('alias')
    );
    expect(aliasErrors.length).toBeGreaterThanOrEqual(1);
  });

  it('warns for privileged ports', () => {
    const entries = { '80': { label: 'http', port: 80 } };
    const issues = auditPortmap(entries as any);
    expect(issues).toContainEqual(expect.objectContaining({ severity: 'warn', port: 80 }));
  });

  it('errors for out-of-range ports', () => {
    const entries = { '99999': { label: 'bad', port: 99999 } };
    const issues = auditPortmap(entries as any);
    expect(issues).toContainEqual(expect.objectContaining({ severity: 'error', port: 99999 }));
  });
});

describe('audit command (CLI)', () => {
  beforeEach(() => resetStorage());

  it('prints no-issues message when portmap is clean', async () => {
    const storage = getStorage();
    storage.set(3000, { label: 'web', port: 3000 });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'audit']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No issues'));
    spy.mockRestore();
  });

  it('outputs JSON when --json flag is used', async () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000 } as any);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'audit', '--json']);
    const raw = spy.mock.calls[0][0];
    expect(() => JSON.parse(raw)).not.toThrow();
    spy.mockRestore();
  });

  it('filters to errors only with --errors-only', async () => {
    const storage = getStorage();
    storage.set(80, { label: 'http', port: 80 });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'audit', '--errors-only']);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).not.toContain('WARN');
    spy.mockRestore();
  });
});
