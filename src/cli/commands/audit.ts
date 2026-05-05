import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { PortEntry } from '../../storage/portmap';

export interface AuditIssue {
  port: number;
  severity: 'warn' | 'error';
  message: string;
}

export function auditPortmap(entries: Record<string, PortEntry>): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const labelsSeen = new Map<string, number>();
  const aliasSeen = new Map<string, number>();

  for (const [portStr, entry] of Object.entries(entries)) {
    const port = Number(portStr);

    if (!entry.label || entry.label.trim() === '') {
      issues.push({ port, severity: 'warn', message: 'Port has no label assigned' });
    }

    if (entry.label) {
      const existing = labelsSeen.get(entry.label);
      if (existing !== undefined) {
        issues.push({ port, severity: 'error', message: `Duplicate label "${entry.label}" also used on port ${existing}` });
      } else {
        labelsSeen.set(entry.label, port);
      }
    }

    if (entry.alias) {
      const existingAlias = aliasSeen.get(entry.alias);
      if (existingAlias !== undefined) {
        issues.push({ port, severity: 'error', message: `Duplicate alias "${entry.alias}" also used on port ${existingAlias}` });
      } else {
        aliasSeen.set(entry.alias, port);
      }
    }

    if (port < 1024) {
      issues.push({ port, severity: 'warn', message: 'Port is in the privileged range (< 1024)' });
    }

    if (port > 65535) {
      issues.push({ port, severity: 'error', message: 'Port number exceeds valid range (> 65535)' });
    }
  }

  return issues;
}

export function registerAuditCommand(program: Command): void {
  program
    .command('audit')
    .description('Audit portmap entries for issues such as duplicates or missing labels')
    .option('--errors-only', 'Show only error-level issues')
    .option('--json', 'Output results as JSON')
    .action((opts) => {
      const storage = getStorage();
      const entries = storage.getAll();
      let issues = auditPortmap(entries);

      if (opts.errorsOnly) {
        issues = issues.filter((i) => i.severity === 'error');
      }

      if (opts.json) {
        console.log(JSON.stringify(issues, null, 2));
        return;
      }

      if (issues.length === 0) {
        console.log('✅ No issues found in portmap.');
        return;
      }

      for (const issue of issues) {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        console.log(`${icon} [${issue.severity.toUpperCase()}] Port ${issue.port}: ${issue.message}`);
      }

      const errors = issues.filter((i) => i.severity === 'error').length;
      const warns = issues.filter((i) => i.severity === 'warn').length;
      console.log(`\nSummary: ${errors} error(s), ${warns} warning(s)`);
    });
}
