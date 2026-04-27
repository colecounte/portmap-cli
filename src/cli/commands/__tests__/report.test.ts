import { Command } from 'commander';
import { registerReportCommand } from '../report';
import * as storageModule from '../../../storage/index';
import * as reportGenerator from '../../../reporter/reportGenerator';
import * as reportFormatter from '../../../reporter/reportFormatter';

jest.mock('../../../storage/index');
jest.mock('../../../reporter/reportGenerator');
jest.mock('../../../reporter/reportFormatter');

const mockStorage = {};
const mockReport = [{ port: 3000, label: 'api', status: 'open' }];
const mockOutput = 'formatted output';

(storageModule.getStorage as jest.Mock).mockResolvedValue(mockStorage);
(reportGenerator.generateReport as jest.Mock).mockReturnValue(mockReport);
(reportFormatter.formatReport as jest.Mock).mockReturnValue(mockOutput);

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerReportCommand(program);
  return program;
}

describe('report command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storageModule.getStorage as jest.Mock).mockResolvedValue(mockStorage);
    (reportGenerator.generateReport as jest.Mock).mockReturnValue(mockReport);
    (reportFormatter.formatReport as jest.Mock).mockReturnValue(mockOutput);
  });

  it('generates a table report by default', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'report']);
    expect(reportFormatter.formatReport).toHaveBeenCalledWith(mockReport, 'table');
    expect(consoleSpy).toHaveBeenCalledWith(mockOutput);
    consoleSpy.mockRestore();
  });

  it('generates a json report when --format json is passed', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'report', '--format', 'json']);
    expect(reportFormatter.formatReport).toHaveBeenCalledWith(mockReport, 'json');
    consoleSpy.mockRestore();
  });

  it('passes openOnly flag to generateReport', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'report', '--open-only']);
    expect(reportGenerator.generateReport).toHaveBeenCalledWith(mockStorage, { openOnly: true });
    consoleSpy.mockRestore();
  });

  it('writes output to file when --output is specified', async () => {
    const fsMock = { writeFile: jest.fn().mockResolvedValue(undefined) };
    jest.doMock('fs/promises', () => fsMock);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'report', '--output', '/tmp/report.txt']);
    consoleSpy.mockRestore();
  });
});
