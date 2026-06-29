const globalForScan = globalThis as unknown as { scanQueue: string[] }

export const scanQueue = globalForScan.scanQueue || (globalForScan.scanQueue = [])
