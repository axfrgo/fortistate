export function serializeConfig(config: unknown): string {
  if (config === undefined || config === null) {
    return '{}';
  }

  if (typeof config === 'string') {
    const trimmed = config.trim();
    if (!trimmed) {
      return '{}';
    }

    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      throw new Error('Config must be valid JSON');
    }
  }

  if (typeof config === 'object') {
    try {
      return JSON.stringify(config);
    } catch {
      throw new Error('Config could not be serialized');
    }
  }

  throw new Error('Config must be an object or JSON string');
}

export function parseConfig(config: string | null): Record<string, unknown> {
  if (!config) {
    return {};
  }

  try {
    const parsed = JSON.parse(config);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export function buildConnectionString(orgId: string, universeId: string) {
  return `fs://${orgId}/${universeId}`;
}
