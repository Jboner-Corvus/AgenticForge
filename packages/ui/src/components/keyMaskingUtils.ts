// Key masking utilities
export function maskApiKey(key: string, visibleStart: number = 3, visibleEnd: number = 4): string {
  if (!key || key.length <= visibleStart + visibleEnd) {
    return key ? `${key.charAt(0)}...${key.charAt(key.length - 1)}` : "";
  }
  const start = key.substring(0, visibleStart);
  const end = key.substring(key.length - visibleEnd);
  return `${start}...${end}`;
}

export function maskKeyByType(key: string, keyType: string = 'unknown'): string {
  if (!key) return "";
  
  const keyTypeSettings: Record<string, { visibleStart: number; visibleEnd: number }> = {
    'openai': { visibleStart: 7, visibleEnd: 6 }, // sk-proj-xxxxx
    'anthropic': { visibleStart: 8, visibleEnd: 6 }, // sk-ant-xxxxx
    'google': { visibleStart: 6, visibleEnd: 6 },
    'gemini': { visibleStart: 6, visibleEnd: 6 },
    'openrouter': { visibleStart: 8, visibleEnd: 6 },
    'default': { visibleStart: 4, visibleEnd: 4 }
  };
  
  const settings = keyTypeSettings[keyType] || keyTypeSettings['default'];
  return maskApiKey(key, settings.visibleStart, settings.visibleEnd);
}