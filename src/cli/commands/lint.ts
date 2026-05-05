import { Command } from 'commander';
import { getStorage } from '../../storage';
import chalk from 'chalk';

export interface LintIssue {
  port: number;
  severity: 'warn' | 'error';
  message: string;
}

export function lintPortmap(): LintIssue[] {
  const storage = getStorage();
  const entries = Object.entries(storage.ports || {});
  const issues: LintIssue[] = [];
  const labelsSeen = new Map<string, number>();

  for (const [portStr, entry] of entries) {
    const port = Number(portStr);

    if (!entry.label || entry.label.trim() === '') {
      issues.push({ port, severity: 'warn', message: 'Port has no label assigned' });
    }

    if (entry.label) {
      const normalized = entry.label.trim().toLowerCase();
      if (labelsSeen.has(normalized)) {
        issues.push({
          port,
          severity: 'error',
          message: `Duplicate label "${entry.label}" — also used by port ${labelsSeen.get(normalized)}`,
        });
      } else {
        labelsSeen.set(normalized, port);
      }
    }

    if (port < 1024) {
      issues.push({ port, severity: 'warn', message: 'Port is in the privileged range (<1024)' });
    }

    if (port > 65535) {
      issues.push({ port, severity: 'error', message: 'Port number exceeds valid range (>65535)' });
    }

    if (entry.note && entry.note.length > 200) {
      issues.push({ port, severity: 'warn', message: 'Note exceeds 200 characters — consider shortening' });
    }
  }

  return issues;
}

export function registerLintCommand(program: Command): void {
  program
    .command('lint')
    .description('Check portmap entries for common issues')
    .option('--errors-only', 'Show only errors, not warnings')
    .action((opts) => {
      const issues = lintPortmap();
      const filtered = opts.errorsOnly ? issues.filter((i) => i.severity === 'error') : issues;

      if (filtered.length === 0) {
        console.log(chalk.green('✔ No issues found in portmap.'));
        return;
      }

      console.log(chalk.bold(`Found ${filtered.length} issue(s):\n`));
      for (const issue of filtered) {
        const icon = issue.severity === 'error' ? chalk.red('✖') : chalk.yellow('⚠');
        console.log(`${icon} [Port ${issue.port}] ${issue.message}`);
      }

      const errorCount = filtered.filter((i) => i.severity === 'error').length;
      if (errorCount > 0) {
        process.exitCode = 1;
      }
    });
}
