import * as net from 'net';

/**
 * Result of a port scan check.
 */
export interface PortScanResult {
  port: number;
  inUse: boolean;
  pid?: number;
}

/**
 * Options for scanning a range of ports.
 */
export interface ScanOptions {
  /** Starting port (inclusive). Defaults to 3000. */
  startPort?: number;
  /** Ending port (inclusive). Defaults to 9999. */
  endPort?: number;
  /** Connection timeout in milliseconds. Defaults to 200. */
  timeout?: number;
  /** Host to scan. Defaults to '127.0.0.1'. */
  host?: string;
}

/**
 * Checks whether a single port is currently in use by attempting
 * a TCP connection. Resolves with a PortScanResult.
 */
export function checkPort(
  port: number,
  host = '127.0.0.1',
  timeout = 200
): Promise<PortScanResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const cleanup = (inUse: boolean) => {
      socket.destroy();
      resolve({ port, inUse });
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => cleanup(true));
    socket.on('timeout', () => cleanup(false));
    socket.on('error', (err: NodeJS.ErrnoException) => {
      // ECONNREFUSED means nothing is listening — port is free
      if (err.code === 'ECONNREFUSED') {
        cleanup(false);
      } else {
        // Any other error (e.g. EHOSTUNREACH) — treat as not in use
        cleanup(false);
      }
    });

    socket.connect(port, host);
  });
}

/**
 * Scans a range of ports concurrently and returns only those
 * that are currently in use.
 *
 * @param options - Scan configuration options.
 * @returns Array of PortScanResult for ports that are in use.
 */
export async function scanPorts(
  options: ScanOptions = {}
): Promise<PortScanResult[]> {
  const {
    startPort = 3000,
    endPort = 9999,
    timeout = 200,
    host = '127.0.0.1',
  } = options;

  if (startPort < 1 || endPort > 65535 || startPort > endPort) {
    throw new RangeError(
      `Invalid port range: ${startPort}–${endPort}. Must be within 1–65535.`
    );
  }

  const ports: number[] = [];
  for (let p = startPort; p <= endPort; p++) {
    ports.push(p);
  }

  // Scan in batches to avoid exhausting file descriptors
  const BATCH_SIZE = 100;
  const results: PortScanResult[] = [];

  for (let i = 0; i < ports.length; i += BATCH_SIZE) {
    const batch = ports.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((port) => checkPort(port, host, timeout))
    );
    results.push(...batchResults.filter((r) => r.inUse));
  }

  return results;
}

/**
 * Finds the next available (unused) port starting from the given port.
 *
 * @param startPort - Port to begin searching from.
 * @param host - Host to check against.
 * @returns The first available port number.
 */
export async function findAvailablePort(
  startPort = 3000,
  host = '127.0.0.1'
): Promise<number> {
  let port = startPort;
  while (port <= 65535) {
    const result = await checkPort(port, host);
    if (!result.inUse) {
      return port;
    }
    port++;
  }
  throw new Error('No available ports found in the valid range.');
}
