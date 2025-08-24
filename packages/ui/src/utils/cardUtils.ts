/**
 * Utility functions for card display and formatting
 */

/**
 * Formats a timestamp to a human-readable relative time
 * @param timestamp - ISO timestamp string
 * @returns Human-readable relative time
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

/**
 * Formats usage count with appropriate units
 * @param count - The usage count
 * @returns Formatted count string
 */
export function formatUsageCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  }
  
  if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  
  if (count < 1000000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  
  return `${(count / 1000000000).toFixed(1)}B`;
}

/**
 * Gets the priority level description
 * @param priority - Priority number (1-10)
 * @returns Priority description
 */
export function getPriorityDescription(priority: number): string {
  if (priority <= 2) return 'Critical';
  if (priority <= 4) return 'High';
  if (priority <= 6) return 'Medium';
  if (priority <= 8) return 'Low';
  return 'Very Low';
}

/**
 * Gets the priority color class
 * @param priority - Priority number (1-10)
 * @returns CSS color class
 */
export function getPriorityColor(priority: number): string {
  if (priority <= 2) return 'text-red-400';
  if (priority <= 4) return 'text-orange-400';
  if (priority <= 6) return 'text-yellow-400';
  if (priority <= 8) return 'text-blue-400';
  return 'text-gray-400';
}

/**
 * Calculates success rate percentage
 * @param successful - Number of successful requests
 * @param total - Total number of requests
 * @returns Success rate percentage
 */
export function calculateSuccessRate(successful: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((successful / total) * 100);
}

/**
 * Gets status color based on success rate
 * @param successRate - Success rate percentage
 * @returns CSS color class
 */
export function getStatusColor(successRate: number): string {
  if (successRate >= 95) return 'text-green-400';
  if (successRate >= 85) return 'text-yellow-400';
  if (successRate >= 70) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Truncates text to a specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generates a random color for tags
 * @param seed - Optional seed for consistent colors
 * @returns CSS color class
 */
export function generateTagColor(seed?: string): string {
  const colors = [
    'text-blue-400',
    'text-green-400',
    'text-purple-400',
    'text-pink-400',
    'text-indigo-400',
    'text-teal-400',
    'text-orange-400',
    'text-cyan-400'
  ];
  
  if (seed) {
    // Generate consistent color based on seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  }
  
  return colors[Math.floor(Math.random() * colors.length)];
}