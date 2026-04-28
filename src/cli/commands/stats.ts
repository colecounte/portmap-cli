import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { getHistoryForPort } from '../../storage/historyStore';

export interface PortStats {
  totalPorts: number;
  labeledPorts: number;
  taggedPorts: number;
  notedPorts: number;
  topTags: Array<{ tag: string; count: number }>;
  mostActive: Array<{ port: number; events: number }>;
}

export async function computeStats(): Promise<PortStats> {
  const storage = await getStorage();
  const entries = Object.entries(storage);

  const tagCounts: Record<string, number> = {};
  let taggedPorts = 0;
  let notedPorts = 0;

  const activityList: Array<{ port: number; events: number }> = [];

  for (const [portStr, entry] of entries) {
    const port = parseInt(portStr, 10);

    if (entry.tags && entry.tags.length > 0) {
      taggedPorts++;
      for (const tag of entry.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    if (entry.note && entry.note.trim().length > 0) {
      notedPorts++;
    }

    const history = await getHistoryForPort(port);
    activityList.push({ port, events: history.length });
  }

  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const mostActive = activityList
    .filter((a) => a.events > 0)
    .sort((a, b) => b.events - a.events)
    .slice(0, 5);

  return {
    totalPorts: entries.length,
    labeledPorts: entries.filter(([, e]) => e.label).length,
    taggedPorts,
    notedPorts,
    topTags,
    mostActive,
  };
}

export function registerStatsCommand(program: Command): void {
  program
    .command('stats')
    .description('Display aggregate statistics about tracked ports')
    .action(async () => {
      const stats = await computeStats();
      console.log('\n📊 Port Map Statistics');
      console.log('─────────────────────────');
      console.log(`Total tracked ports : ${stats.totalPorts}`);
      console.log(`Labeled ports       : ${stats.labeledPorts}`);
      console.log(`Tagged ports        : ${stats.taggedPorts}`);
      console.log(`Ports with notes    : ${stats.notedPorts}`);

      if (stats.topTags.length > 0) {
        console.log('\nTop tags:');
        for (const { tag, count } of stats.topTags) {
          console.log(`  #${tag} (${count})`);
        }
      }

      if (stats.mostActive.length > 0) {
        console.log('\nMost active ports (by history events):');
        for (const { port, events } of stats.mostActive) {
          console.log(`  :${port} — ${events} event(s)`);
        }
      }

      console.log();
    });
}
