import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const INSPECTOR_TARGET =
  process.env.FORTISTATE_INSPECTOR_TARGET ??
  process.env.NEXT_PUBLIC_INSPECTOR_URL ??
  'http://localhost:4000';

const INSPECTOR_TOKEN = (() => {
  if (typeof process.env.FORTISTATE_INSPECTOR_TOKEN === 'string' && process.env.FORTISTATE_INSPECTOR_TOKEN.trim()) {
    return process.env.FORTISTATE_INSPECTOR_TOKEN.trim();
  }
  try {
    const tokenPath = path.resolve(process.cwd(), '.fortistate-inspector-token');
    if (fs.existsSync(tokenPath)) {
      const raw = fs.readFileSync(tokenPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.token === 'string') {
        return parsed.token.trim();
      }
    }
  } catch (error) {
    console.warn('[Inspector proxy] Unable to read .fortistate-inspector-token:', error);
  }
  return undefined;
})();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');

const buildTargetUrl = (segments: string[] = [], search: string) => {
  const base = stripTrailingSlash(INSPECTOR_TARGET);
  const path = segments.join('/');
  const target = new URL(path, `${base}/`);
  target.search = search;
  return target;
};

type HandlerContext = { params: Promise<{ path?: string[] }> };

const corsResponse = (req: NextRequest, status = 204) => {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    req.headers.get('access-control-request-headers') ?? '*'
  );
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(null, { status, headers });
};

const forward = async (req: NextRequest, context: HandlerContext) => {
  if (req.method === 'OPTIONS') {
    return corsResponse(req);
  }

  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, req.nextUrl.search);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'content-length' || lower === 'connection' || lower === 'expect') {
      return;
    }
    headers.set(key, value);
  });

  // Only add legacy token if client didn't provide any auth
  const hasClientAuth = headers.has('authorization') || headers.has('x-fortistate-token');
  if (INSPECTOR_TOKEN && !hasClientAuth) {
    headers.set('x-fortistate-token', INSPECTOR_TOKEN);
    headers.set('authorization', `Bearer ${INSPECTOR_TOKEN}`);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const bodyText = await req.text();
    init.body = bodyText;
    (init as { duplex?: 'half' }).duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (err) {
    console.error('[Inspector proxy] Failed to reach target', targetUrl.toString(), err);
    return new Response(
      JSON.stringify({
        error: 'Inspector unavailable',
        message: `Could not reach ${targetUrl.origin}. Is the inspector running?`,
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('content-encoding');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const HEAD = forward;
export const OPTIONS = forward;
