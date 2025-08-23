
// 🤖 OUTIL GÉNÉRÉ AUTOMATIQUEMENT par l'agent AgenticForge
// 🎯 Outil: system-info
// 📁 Localisation: dist/tools/generated/ (outils runtime générés)
// 🔄 Distinction: outils natifs dans src/ vs outils générés dans dist/
import { z } from 'zod';



const systemInfoParams = z.object(z.object({}).describe('No parameters required'));

export const systemInfoTool = {
  name: 'system-info',
  description: '🤖 [OUTIL GÉNÉRÉ] Gathers system information including CPU usage, memory usage, and disk space',
  parameters: systemInfoParams,
  execute: async (args, ctx: Ctx) => {
    import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Get CPU usage on Unix-like systems
async function getCPUUsage() {
  try {
    const { stdout } = await execPromise('top -bn1 | grep "Cpu(s)" | awk \'{print $2}\' | sed "s/%us,//"');
    return parseFloat(stdout.trim()) || 0;
  } catch (error) {
    console.error('Error getting CPU usage:', error);
    return 0;
  }
}

// Get memory usage on Unix-like systems
async function getMemoryUsage() {
  try {
    const { stdout } = await execPromise('free | grep Mem | awk \'{printf("%.2f", $3/$2 * 100.0)}\'');
    return parseFloat(stdout.trim()) || 0;
  } catch (error) {
    console.error('Error getting memory usage:', error);
    return 0;
  }
}

// Get disk usage on Unix-like systems
async function getDiskUsage() {
  try {
    const { stdout } = await execPromise('df -h / | awk \'NR==2 {print $5}\' | sed "s/%//"');
    return parseFloat(stdout.trim()) || 0;
  } catch (error) {
    console.error('Error getting disk usage:', error);
    return 0;
  }
}

// For Windows systems
async function getCPUUsageWindows() {
  try {
    const { stdout } = await execPromise('wmic cpu get loadpercentage | findstr /R "[0-9]"');
    return parseFloat(stdout.trim()) || 0;
  } catch (error) {
    console.error('Error getting CPU usage (Windows):', error);
    return 0;
  }
}

async function getMemoryUsageWindows() {
  try {
    const { stdout: totalMem } = await execPromise('wmic ComputerSystem get TotalPhysicalMemory | findstr /R "[0-9]"');
    const { stdout: freeMem } = await execPromise('wmic OS get FreePhysicalMemory | findstr /R "[0-9]"');
    
    const total = parseFloat(totalMem.trim());
    const free = parseFloat(freeMem.trim());
    
    if (total && free) {
      return ((total - free * 1024) / total) * 100;
    }
    return 0;
  } catch (error) {
    console.error('Error getting memory usage (Windows):', error);
    return 0;
  }
}

async function getDiskUsageWindows() {
  try {
    const { stdout } = await execPromise('wmic LogicalDisk where "DeviceID=\'C:\'" get Size,FreeSpace | findstr /R "[0-9]"');
    const parts = stdout.trim().split(/\s+/);
    
    if (parts.length >= 2) {
      const size = parseFloat(parts[0]);
      const free = parseFloat(parts[1]);
      
      if (size && free) {
        return ((size - free) / size) * 100;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error getting disk usage (Windows):', error);
    return 0;
  }
}

// Cross-platform detection
async function getSystemInfo() {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    return {
      cpuUsage: await getCPUUsageWindows(),
      memoryUsage: await getMemoryUsageWindows(),
      diskUsage: await getDiskUsageWindows()
    };
  } else {
    return {
      cpuUsage: await getCPUUsage(),
      memoryUsage: await getMemoryUsage(),
      diskUsage: await getDiskUsage()
    };
  }
}

return await getSystemInfo();
  },
};

export { systemInfoTool };