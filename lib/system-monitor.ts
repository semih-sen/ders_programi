import os from 'node:os';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

export interface SystemStats {
  cpu: {
    loadAverage: {
      oneMin: number;
      fiveMin: number;
      fifteenMin: number;
    };
    coreCount: number;
    loadPercentage: number;
  };
  ram: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usedPercentage: number;
  };
  swap: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usedPercentage: number;
  };
  disk: {
    totalGB: string;
    usedGB: string;
    availableGB: string;
    usedPercentage: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
}

/**
 * Format uptime from seconds to "X Days, Y Hours, Z Minutes"
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Gün`);
  if (hours > 0) parts.push(`${hours} Saat`);
  if (minutes > 0) parts.push(`${minutes} Dakika`);

  return parts.length > 0 ? parts.join(', ') : '0 Dakika';
}

/**
 * Get swap information from /proc/meminfo (Linux only)
 */
function getSwapInfo(): { totalGB: number; freeGB: number; usedGB: number; usedPercentage: number } {
  try {
    const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
    const lines = meminfo.split('\n');

    let swapTotal = 0;
    let swapFree = 0;

    for (const line of lines) {
      if (line.startsWith('SwapTotal:')) {
        swapTotal = parseInt(line.split(/\s+/)[1], 10); // in kB
      } else if (line.startsWith('SwapFree:')) {
        swapFree = parseInt(line.split(/\s+/)[1], 10); // in kB
      }
    }

    const swapTotalGB = swapTotal / 1024 / 1024; // Convert kB to GB
    const swapFreeGB = swapFree / 1024 / 1024;
    const swapUsedGB = swapTotalGB - swapFreeGB;
    const swapUsedPercentage = swapTotalGB > 0 ? (swapUsedGB / swapTotalGB) * 100 : 0;

    return {
      totalGB: parseFloat(swapTotalGB.toFixed(2)),
      freeGB: parseFloat(swapFreeGB.toFixed(2)),
      usedGB: parseFloat(swapUsedGB.toFixed(2)),
      usedPercentage: parseFloat(swapUsedPercentage.toFixed(2)),
    };
  } catch (error) {
    console.error('Error reading swap info:', error);
    return {
      totalGB: 0,
      freeGB: 0,
      usedGB: 0,
      usedPercentage: 0,
    };
  }
}

/**
 * Get disk usage for root partition using df command
 */
function getDiskInfo(): { totalGB: string; usedGB: string; availableGB: string; usedPercentage: number } {
  try {
    // Execute df -h / command and parse output
    const output = execSync('df -h /', { encoding: 'utf8' });
    const lines = output.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('Unexpected df output format');
    }

    // Parse the second line (actual data)
    const parts = lines[1].split(/\s+/);
    
    // Format: Filesystem Size Used Avail Use% Mounted
    const totalGB = parts[1];
    const usedGB = parts[2];
    const availableGB = parts[3];
    const usedPercentageStr = parts[4];

    // Extract percentage number
    const usedPercentage = parseInt(usedPercentageStr.replace('%', ''), 10);

    return {
      totalGB,
      usedGB,
      availableGB,
      usedPercentage,
    };
  } catch (error) {
    console.error('Error getting disk info:', error);
    return {
      totalGB: 'N/A',
      usedGB: 'N/A',
      availableGB: 'N/A',
      usedPercentage: 0,
    };
  }
}

/**
 * Get comprehensive system statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  // CPU Information
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  
  // Load average is for 1 minute, normalized by CPU count
  // A load of 1.0 means one CPU is fully utilized
  const loadPercentage = (loadAvg[0] / cpuCount) * 100;

  // RAM Information
  const totalRam = os.totalmem();
  const freeRam = os.freemem();
  const usedRam = totalRam - freeRam;

  const totalRamGB = totalRam / 1024 / 1024 / 1024;
  const freeRamGB = freeRam / 1024 / 1024 / 1024;
  const usedRamGB = usedRam / 1024 / 1024 / 1024;
  const usedRamPercentage = (usedRam / totalRam) * 100;

  // Swap Information (Linux only)
  const swapInfo = getSwapInfo();

  // Disk Information
  const diskInfo = getDiskInfo();

  // Uptime
  const uptimeSeconds = os.uptime();
  const formattedUptime = formatUptime(uptimeSeconds);

  return {
    cpu: {
      loadAverage: {
        oneMin: parseFloat(loadAvg[0].toFixed(2)),
        fiveMin: parseFloat(loadAvg[1].toFixed(2)),
        fifteenMin: parseFloat(loadAvg[2].toFixed(2)),
      },
      coreCount: cpuCount,
      loadPercentage: parseFloat(loadPercentage.toFixed(2)),
    },
    ram: {
      totalGB: parseFloat(totalRamGB.toFixed(2)),
      usedGB: parseFloat(usedRamGB.toFixed(2)),
      freeGB: parseFloat(freeRamGB.toFixed(2)),
      usedPercentage: parseFloat(usedRamPercentage.toFixed(2)),
    },
    swap: swapInfo,
    disk: diskInfo,
    uptime: {
      seconds: uptimeSeconds,
      formatted: formattedUptime,
    },
  };
}
