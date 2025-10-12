import { randomBytes, createHash } from 'crypto';

const ALLOWED_PERMISSIONS = ['read', 'write', 'admin'] as const;
export type ApiKeyPermission = (typeof ALLOWED_PERMISSIONS)[number];

export function validatePermissions(permissions: ApiKeyPermission[]): ApiKeyPermission[] {
  const filtered = permissions.filter((permission) => ALLOWED_PERMISSIONS.includes(permission));
  if (filtered.length === 0) {
    return ['read'];
  }

  const unique = Array.from(new Set(filtered));
  if (unique.includes('admin')) {
    return ['admin'];
  }

  return unique;
}

export function buildApiKey({
  length = 32,
  environment = 'live',
}: {
  length?: number;
  environment?: 'live' | 'test';
} = {}) {
  const raw = randomBytes(length).toString('base64url');
  const token = `fs_${environment}_${raw}`;
  const prefix = token.slice(0, 12);
  return { token, prefix };
}

export function hashApiKey(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function serializePermissions(permissions: ApiKeyPermission[]): string {
  return JSON.stringify(validatePermissions(permissions));
}

export function parsePermissions(raw: string | null | undefined): ApiKeyPermission[] {
  if (!raw) {
    return ['read'];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) {
      return ['read'];
    }

    return validatePermissions(parsed.filter((value): value is ApiKeyPermission => ALLOWED_PERMISSIONS.includes(value as ApiKeyPermission)));
  } catch {
    return ['read'];
  }
}
